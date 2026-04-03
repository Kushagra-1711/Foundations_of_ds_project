# API Documentation

## Overview
The Real-Time Anomaly Detection API provides REST and WebSocket endpoints for anomaly detection operations.

## Base URL
```
http://localhost:8000
```

## Authentication
No authentication required for this demonstration system.

## Endpoints

### Health Check
**GET /**

Returns basic health information.

**Response:**
```json
{
  "message": "Real-Time Anomaly Detection backend is running at /docs."
}
```

### Metrics
**GET /metrics**

Get current live metrics.

**Response:**
```json
{
  "total": 1250,
  "anomalies": 45,
  "percent": 3.6
}
```

### Statistics
**GET /stats**

Get statistical summary of data points.

**Response:**
```json
{
  "total": 1250,
  "min": 85.23,
  "max": 145.67,
  "mean": 99.85,
  "median": 100.12,
  "stddev": 9.87
}
```

### Anomaly History
**GET /anomalies**

Get history of detected anomalies.

**Response:**
```json
{
  "anomalies": [
    {
      "timestamp": 1640995200000,
      "value": 156.78,
      "model_type": "ensemble",
      "threshold": 5.0,
      "is_injected_anomaly": false,
      "anomaly_type": "spike",
      "reason": "Ensemble vote 3/3: Z-score 4.2 > 3.0, IF score -0.45 < -0.1, SVM prediction -1"
    }
  ]
}
```

### Configuration Update
**POST /config**

Update detection parameters.

**Request Body:**
```json
{
  "model_type": "ensemble",
  "threshold": 5.0,
  "frequency": 0.05,
  "speed": 0.5
}
```

**Response:**
```json
{
  "status": "ok",
  "config": {
    "model_type": "ensemble",
    "threshold": 5.0,
    "frequency": 0.05,
    "speed": 0.5
  }
}
```

### Stream Control
**POST /stream/start**

Start data stream generation.

**Response:**
```json
{
  "status": "started"
}
```

**POST /stream/stop**

Stop data stream generation.

**Response:**
```json
{
  "status": "stopped"
}
```

**POST /stream/reset**

Reset all data and counters.

**Response:**
```json
{
  "status": "reset"
}
```

### Data Export
**GET /export/csv**

Export anomaly data as CSV file.

**Response:** CSV file download with headers:
```
Timestamp,Value,Is_Anomaly,Algorithm,Threshold,Is_Injected
1640995200000,156.78,True,ensemble,5.0,False
```

## WebSocket

### Real-Time Data Stream
**WebSocket: /ws**

Provides real-time data points with anomaly detection.

**Message Format:**
```json
{
  "timestamp": 1640995200000,
  "value": 102.34,
  "is_injected_anomaly": false,
  "anomaly_type": null,
  "seasonal_factor": 0.85,
  "is_anomaly": false,
  "detection_reason": ""
}
```

### Connection Handling
- Auto-reconnect on disconnection
- Error handling with retry logic
- Connection status monitoring

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid configuration parameters"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Anomaly detection failed"
}
```

## Rate Limits
No rate limits implemented for this demonstration.

## Data Types

### Model Types
- `zscore`: Z-Score statistical method
- `isolation_forest`: Isolation Forest algorithm
- `one_class_svm`: One-Class SVM algorithm
- `ensemble`: Majority vote of all algorithms

### Anomaly Types
- `spike`: Sudden value spike
- `drift`: Gradual value change
- `collective`: Group of anomalous points
- `contextual`: Context-dependent anomaly

## Examples

### Python Client
```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"Value: {data['value']}, Anomaly: {data['is_anomaly']}")

ws = websocket.WebSocketApp("ws://localhost:8000/ws", on_message=on_message)
ws.run_forever()
```

### JavaScript Client
```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(`Value: ${data.value}, Anomaly: ${data.is_anomaly}`);
};
```

---

### 2. Get Anomaly History
**Endpoint**: `GET /anomalies`

**Description**: Returns list of all detected anomalies with details.

**Response**: JSON object with anomalies array
```json
{
  "anomalies": [
    {
      "timestamp": 1711619025000,
      "value": 145.67,
      "model_type": "zscore",
      "threshold": 5.0,
      "is_injected_anomaly": false
    },
    {
      "timestamp": 1711619022500,
      "value": 42.12,
      "model_type": "isolation_forest",
      "threshold": 6.0,
      "is_injected_anomaly": true
    }
  ]
}
```

**Anomaly Fields**:
- `timestamp` (int): Unix timestamp in milliseconds
- `value` (float): The anomalous data point value
- `model_type` (str): Algorithm used ("zscore" or "isolation_forest")
- `threshold` (float): Threshold value used for detection
- `is_injected_anomaly` (bool): Whether anomaly was artificially injected

**Maximum Records**: Last 500 anomalies (older ones are removed)

**Status Code**: 200 OK

**Example Request**:
```bash
curl -X GET http://localhost:8000/anomalies
```

**Example Response** (pretty-printed):
```json
{
  "anomalies": [
    {
      "timestamp": 1711619025000,
      "value": 145.67,
      "model_type": "zscore",
      "threshold": 5.0,
      "is_injected_anomaly": false
    }
  ]
}
```

---

### 3. Export Anomalies to CSV
**Endpoint**: `GET /export/csv`

**Description**: Streams a CSV file containing all detected anomalies.

**Response Type**: CSV file (text/csv)

**Headers**:
```
Content-Type: text/csv
Content-Disposition: attachment; filename=anomalies_export.csv
```

**CSV Format**:
```
Timestamp,Value,Is_Anomaly,Algorithm,Threshold,Is_Injected
1711619025000,145.67,True,zscore,5.0,False
1711619022500,42.12,True,isolation_forest,6.0,True
1711619020000,156.89,True,zscore,5.0,False
```

**CSV Columns**:
- `Timestamp`: Unix timestamp in milliseconds
- `Value`: Anomaly data point value
- `Is_Anomaly`: Always "True" (only anomalies are exported)
- `Algorithm`: Detection algorithm ("zscore" or "isolation_forest")
- `Threshold`: Detection threshold used
- `Is_Injected`: Injection status ("True"/"False")

**Status Code**: 200 OK

**Example Request**:
```bash
curl -X GET http://localhost:8000/export/csv --output anomalies.csv
```

**File Download**: Browser automatically downloads as `anomalies_export.csv`

---

## Usage in Frontend

### Statistics Panel Update (Every 1 second)
```typescript
const statsRes = await fetch('http://localhost:8000/stats');
const statsJson = await statsRes.json();
setStatistics(statsJson);
```

### Anomaly History Update (Every 1 second)
```typescript
const anomaliesRes = await fetch('http://localhost:8000/anomalies');
const anomaliesJson = await anomaliesRes.json();
setAnomalyHistory(anomaliesJson.anomalies);
```

### CSV Export (On button click)
```typescript
const res = await fetch('http://localhost:8000/export/csv');
const blob = await res.blob();
// Trigger browser download
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = 'anomalies_export.csv';
link.click();
```

---

## Backend Implementation Details

### Statistics Calculation
```python
@app.get("/stats")
async def get_statistics():
    if not app.state.data_points:
        return {empty response}
    
    values = app.state.data_points  # List of last 1000 values
    return {
        "total": len(values),
        "min": min(values),
        "max": max(values),
        "mean": round(mean(values), 2),
        "median": round(median(values), 2),
        "stddev": round(stdev(values), 2) if len(values) > 1 else 0,
    }
```

### Data Point Tracking (in WebSocket handler)
```python
app.state.data_points.append(value)
if len(app.state.data_points) > 1000:
    app.state.data_points.pop(0)  # Keep sliding window of 1000
```

### Anomaly Storage (in WebSocket handler)
```python
if is_anomaly:
    anomaly_record = {
        "timestamp": data_point["timestamp"],
        "value": value,
        "model_type": model_type,
        "threshold": threshold,
        "is_injected_anomaly": data_point.get("is_injected_anomaly", False),
    }
    app.state.anomaly_history.append(anomaly_record)
    if len(app.state.anomaly_history) > 500:
        app.state.anomaly_history.pop(0)  # Keep last 500
```

### CSV Generation
```python
@app.get("/export/csv")
async def export_csv():
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["Timestamp", "Value", "Is_Anomaly", ...])
    
    for anomaly in app.state.anomaly_history:
        writer.writerow([...])
    
    return StreamingResponse(iter([output.getvalue()]), ...)
```

---

## Performance Characteristics

| Endpoint | Response Time | Data Size | Frequency |
|----------|--------------|-----------|-----------|
| `/stats` | < 1ms | ~200 bytes | 1/sec |
| `/anomalies` | < 5ms | Variable (1-50KB) | 1/sec |
| `/export/csv` | < 10ms | Variable (1-500KB) | On-demand |

---

## Error Handling

All endpoints are robust:
- `/stats` returns null values if no data available
- `/anomalies` returns empty array if no anomalies detected
- `/export/csv` returns empty CSV with headers if no anomalies

No error responses expected under normal operation.

---

## Data Retention Policy

- **Data Points**: Last 1,000 kept in memory
- **Anomalies**: Last 500 kept in memory
- **Reset Behavior**: Both cleared when `/stream/reset` is called
- **Memory Impact**: ~8KB for 1000 data points + ~100KB for 500 anomalies

---

## Integration Notes

1. **Polling**: Frontend polls every 1 second - adjust interval in App.tsx if needed
2. **CORS**: All endpoints accessible from frontend (CORS enabled)
3. **Real-time**: WebSocket provides live data, these endpoints provide aggregated stats
4. **Scalability**: Current in-memory storage suitable for real-time demo, production would use database
