import asyncio
import json
import csv
from io import StringIO
from statistics import mean, median, stdev
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from models.anomaly_detector import detector_instance
from utils.simulator import simulator_instance
from utils.agent import agent_instance

app = FastAPI(title="Real-Time Anomaly Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConfigModel(BaseModel):
    model_type: str        # 'zscore', 'isolation_forest', 'one_class_svm', 'ensemble'
    threshold: float       # slider value usually 1 to 10
    frequency: float       # 0.0 to 1.0
    speed: float           # 0.1 to 2.0 (seconds)

# Keep track of metrics, statistics, and anomaly history
app.state.metrics = {
    "total_points": 0,
    "anomalies": 0,
}
app.state.model_config = {
    "model_type": "zscore",
    "threshold": 3.0,
}
app.state.data_points = []  # Track all data points for statistics
app.state.anomaly_history = []  # Track all anomalies with details

@app.on_event("startup")
async def startup_event():
    # We can kick off the simulator, but it starts in stopped mode.
    pass

@app.get("/")
async def root():
    return {"message": "Real-Time Anomaly Detection backend is running at /docs."}

@app.get("/metrics")
async def get_metrics():
    total = app.state.metrics["total_points"]
    anomalies = app.state.metrics["anomalies"]
    percent = (anomalies / total * 100) if total > 0 else 0
    return {
        "total": total,
        "anomalies": anomalies,
        "percent": round(percent, 2)
    }

@app.post("/config")
async def update_config(config: ConfigModel):
    app.state.model_config["model_type"] = config.model_type
    app.state.model_config["threshold"] = config.threshold
    simulator_instance.set_config(config.frequency, config.speed)
    return {"status": "ok", "config": config}

@app.post("/stream/start")
async def start_stream():
    simulator_instance.start()
    return {"status": "started"}

@app.post("/stream/stop")
async def stop_stream():
    simulator_instance.stop()
    return {"status": "stopped"}

@app.post("/stream/reset")
async def reset_stream():
    app.state.metrics["total_points"] = 0
    app.state.metrics["anomalies"] = 0
    app.state.data_points = []
    app.state.anomaly_history = []
    simulator_instance.reset()
    return {"status": "reset"}

@app.get("/stats")
async def get_statistics():
    """Get real-time statistics about the data stream."""
    if not app.state.data_points:
        return {
            "total": 0,
            "min": None,
            "max": None,
            "mean": None,
            "median": None,
            "stddev": None,
        }
    
    values = app.state.data_points
    return {
        "total": len(values),
        "min": min(values),
        "max": max(values),
        "mean": round(mean(values), 2),
        "median": round(median(values), 2),
        "stddev": round(stdev(values), 2) if len(values) > 1 else 0,
    }

@app.get("/anomalies")
async def get_anomaly_history():
    """Get history of detected anomalies with details."""
    return {"anomalies": app.state.anomaly_history}

class AnomalyPayload(BaseModel):
    timestamp: float
    value: float
    model_type: str
    threshold: float
    is_injected_anomaly: bool

@app.post("/analyze-anomaly")
async def analyze_anomaly(anomaly: AnomalyPayload):
    values = app.state.data_points
    if not values:
        return {"explanation": "No data stream available to provide context."}
    stats = {
        "mean": round(mean(values), 2),
        "median": round(median(values), 2),
        "min": min(values),
        "max": max(values),
        "stddev": round(stdev(values), 2) if len(values) > 1 else 0,
    }
    explanation = await agent_instance.analyze_anomaly(anomaly.dict(), stats)
    return {"explanation": explanation}

@app.get("/stream-summary")
async def stream_summary():
    values = app.state.data_points
    if not values:
        return {"summary": "Stream is empty. Start the simulation first."}
    stats = {
        "mean": round(mean(values), 2),
        "median": round(median(values), 2),
        "min": min(values),
        "max": max(values),
        "stddev": round(stdev(values), 2) if len(values) > 1 else 0,
    }
    metrics = {
        "total": app.state.metrics["total_points"],
        "anomalies": app.state.metrics["anomalies"],
        "percent": round((app.state.metrics["anomalies"] / app.state.metrics["total_points"] * 100) if app.state.metrics["total_points"] > 0 else 0, 2)
    }
    summary = await agent_instance.summarize_stream(stats, metrics)
    return {"summary": summary}

@app.get("/export/csv")
async def export_csv():
    """Export all data points and anomalies as CSV."""
    output = StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow(["Timestamp", "Value", "Is_Anomaly", "Algorithm", "Threshold", "Is_Injected"])
    
    # Group data and anomalies for export
    for anomaly in app.state.anomaly_history:
        writer.writerow([
            anomaly["timestamp"],
            anomaly["value"],
            "True",
            anomaly["model_type"],
            anomaly["threshold"],
            anomaly.get("is_injected_anomaly", ""),
        ])
    
    # Prepare CSV response
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=anomalies_export.csv"}
    )

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected via WebSocket.")
    
    # We'll stream data to the client continuously
    try:
        async for data_point in simulator_instance.generate_stream():
            value = data_point["value"]
            
            # Detect anomaly based on current config
            model_type = app.state.model_config["model_type"]
            threshold = app.state.model_config["threshold"]
            
            detection_result = {}
            if model_type == "zscore":
                z_thresh = 5.0 - (threshold - 1) * (4.0 / 9.0)
                detection_result = detector_instance.detect_zscore(value, z_thresh)
            elif model_type == "isolation_forest":
                detection_result = detector_instance.detect_isolation_forest(value, threshold)
            elif model_type == "one_class_svm":
                detection_result = detector_instance.detect_one_class_svm(value, threshold)
            elif model_type == "ensemble":
                detection_result = detector_instance.detect_ensemble(value, threshold)
            else:
                detection_result = {"is_anomaly": False, "reason": "Unknown model"}
            
            is_anomaly = bool(detection_result["is_anomaly"])
            
            # Track data point (keep last 1000)
            app.state.data_points.append(value)
            if len(app.state.data_points) > 1000:
                app.state.data_points.pop(0)
                
            # Update metrics
            app.state.metrics["total_points"] += 1
            if is_anomaly:
                app.state.metrics["anomalies"] += 1
                
                # Check for alerts
                detector_instance.check_alert(app.state.metrics["anomalies"])
                
                # Store anomaly details
                anomaly_record = {
                    "timestamp": data_point["timestamp"],
                    "value": value,
                    "model_type": model_type,
                    "threshold": threshold,
                    "is_injected_anomaly": data_point.get("is_injected_anomaly", False),
                    "anomaly_type": data_point.get("anomaly_type"),
                    "reason": detection_result.get("reason", ""),
                }
                app.state.anomaly_history.append(anomaly_record)
                # Keep last 500 anomalies
                if len(app.state.anomaly_history) > 500:
                    app.state.anomaly_history.pop(0)
                
            data_point["is_anomaly"] = is_anomaly
            data_point["detection_reason"] = detection_result.get("reason", "")
            
            await websocket.send_text(json.dumps(data_point))
            
    except WebSocketDisconnect:
        print("Client disconnected.")
    except Exception as e:
        print(f"Error in websocket loop: {e}")
