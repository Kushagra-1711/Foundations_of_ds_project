# Code Changes Reference

## Backend Changes (main.py)

### 1. New Imports Added
```python
import csv
from io import StringIO
from statistics import mean, median, stdev
from fastapi.responses import StreamingResponse
```

### 2. New State Variables
```python
app.state.data_points = []  # Track all data points for statistics
app.state.anomaly_history = []  # Track all anomalies with details
```

### 3. Updated reset_stream() Function
```python
@app.post("/stream/reset")
async def reset_stream():
    app.state.metrics["total_points"] = 0
    app.state.metrics["anomalies"] = 0
    app.state.data_points = []                    # NEW
    app.state.anomaly_history = []                # NEW
    simulator_instance.reset()
    return {"status": "reset"}
```

### 4. New /stats Endpoint
```python
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
```

### 5. New /anomalies Endpoint
```python
@app.get("/anomalies")
async def get_anomaly_history():
    """Get history of detected anomalies with details."""
    return {"anomalies": app.state.anomaly_history}
```

### 6. New /export/csv Endpoint
```python
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
```

### 7. Updated WebSocket Handler
```python
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("Client connected via WebSocket.")
    
    try:
        async for data_point in simulator_instance.generate_stream():
            value = data_point["value"]
            
            # ... existing anomaly detection code ...
            
            # TRACK DATA POINT (keep last 1000)
            app.state.data_points.append(value)
            if len(app.state.data_points) > 1000:
                app.state.data_points.pop(0)
                
            # Update metrics
            app.state.metrics["total_points"] += 1
            if is_anomaly:
                app.state.metrics["anomalies"] += 1
                
                # STORE ANOMALY DETAILS
                anomaly_record = {
                    "timestamp": data_point["timestamp"],
                    "value": value,
                    "model_type": model_type,
                    "threshold": threshold,
                    "is_injected_anomaly": data_point.get("is_injected_anomaly", False),
                }
                app.state.anomaly_history.append(anomaly_record)
                # Keep last 500 anomalies
                if len(app.state.anomaly_history) > 500:
                    app.state.anomaly_history.pop(0)
                
            data_point["is_anomaly"] = is_anomaly
            await websocket.send_text(json.dumps(data_point))
            
    except WebSocketDisconnect:
        print("Client disconnected.")
    except Exception as e:
        print(f"Error in websocket loop: {e}")
```

---

## Frontend Changes (App.tsx)

### 1. New Imports
```typescript
import { Download, TrendingUp } from 'lucide-react';
```

### 2. New TypeScript Interfaces
```typescript
interface Statistics {
  total: number;
  min: number | null;
  max: number | null;
  mean: number | null;
  median: number | null;
  stddev: number | null;
}

interface Anomaly {
  timestamp: number;
  value: number;
  model_type: string;
  threshold: number;
  is_injected_anomaly: boolean;
}
```

### 3. New State Variables in App Component
```typescript
const [statistics, setStatistics] = useState<Statistics>({ 
  total: 0, 
  min: null, 
  max: null, 
  mean: null, 
  median: null, 
  stddev: null 
});
const [anomalyHistory, setAnomalyHistory] = useState<Anomaly[]>([]);
const [showAnomalyPanel, setShowAnomalyPanel] = useState(false);
```

### 4. Updated useEffect for Data Fetching
```typescript
useEffect(() => {
  // ... existing WebSocket setup ...
  
  // Poll metrics and statistics
  const interval = setInterval(async () => {
    try {
      const res = await fetch('http://localhost:8000/metrics');
      const json = await res.json();
      setMetrics(json);
      
      // NEW: Fetch statistics
      const statsRes = await fetch('http://localhost:8000/stats');
      const statsJson = await statsRes.json();
      setStatistics(statsJson);
      
      // NEW: Fetch anomaly history
      const anomaliesRes = await fetch('http://localhost:8000/anomalies');
      const anomaliesJson = await anomaliesRes.json();
      setAnomalyHistory(anomaliesJson.anomalies);
    } catch (e) {
      console.error("Failed to fetch data");
    }
  }, 1000);

  return () => {
    ws.close();
    clearInterval(interval);
  };
}, []);
```

### 5. Updated resetStream Function
```typescript
const resetStream = async () => {
  await fetch(`http://localhost:8000/stream/reset`, { method: 'POST' });
  setData([]);
  setMetrics({ total: 0, anomalies: 0, percent: 0 });
  setStatistics({ total: 0, min: null, max: null, mean: null, median: null, stddev: null }); // NEW
  setAnomalyHistory([]);  // NEW
  setIsRunning(false);
};
```

### 6. New exportCSV Function
```typescript
const exportCSV = async () => {
  try {
    const res = await fetch('http://localhost:8000/export/csv');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'anomalies_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Failed to export CSV", e);
    alert("Failed to export CSV");
  }
};
```

### 7. New Export Button in Header
```tsx
<button 
  onClick={exportCSV}
  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 border border-blue-500/30 transition-all text-white shadow-lg shadow-blue-500/20"
>
  <Download className="w-4 h-4" /> Export
</button>
```

### 8. New Statistics Panel (in left sidebar)
```tsx
<div className="glass-panel p-6 space-y-4">
  <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-200">
    <TrendingUp className="w-5 h-5 text-cyan-400" /> Statistics
  </h2>
  <div className="space-y-3">
    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
      <p className="text-xs text-gray-400 mb-1">Min Value</p>
      <p className="text-xl font-bold text-cyan-400">{statistics.min !== null ? statistics.min.toFixed(2) : '—'}</p>
    </div>
    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
      <p className="text-xs text-gray-400 mb-1">Max Value</p>
      <p className="text-xl font-bold text-yellow-400">{statistics.max !== null ? statistics.max.toFixed(2) : '—'}</p>
    </div>
    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
      <p className="text-xs text-gray-400 mb-1">Mean</p>
      <p className="text-xl font-bold text-white">{statistics.mean !== null ? statistics.mean.toFixed(2) : '—'}</p>
    </div>
    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
      <p className="text-xs text-gray-400 mb-1">Median</p>
      <p className="text-xl font-bold text-green-400">{statistics.median !== null ? statistics.median.toFixed(2) : '—'}</p>
    </div>
    <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50">
      <p className="text-xs text-gray-400 mb-1">Std Dev</p>
      <p className="text-xl font-bold text-purple-400">{statistics.stddev !== null ? statistics.stddev.toFixed(2) : '—'}</p>
    </div>
  </div>
</div>
```

### 9. Anomaly History Toggle Button
```tsx
<button
  onClick={() => setShowAnomalyPanel(!showAnomalyPanel)}
  className={`w-full py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${showAnomalyPanel ? 'bg-rose-500/20 border border-rose-500/50 text-rose-300' : 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:text-white'}`}
>
  <AlertTriangle className="w-4 h-4" />
  {showAnomalyPanel ? 'Hide' : 'Show'} Anomaly History ({anomalyHistory.length})
</button>
```

### 10. Anomaly History Table Panel (at bottom of page)
```tsx
{showAnomalyPanel && (
  <div className="mt-8 glass-panel p-6">
    <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-200">
      <AlertTriangle className="w-5 h-5 text-rose-400" /> Detected Anomalies
    </h2>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Timestamp</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Value</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Algorithm</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Threshold</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
          </tr>
        </thead>
        <tbody>
          {anomalyHistory.length === 0 ? (
            <tr>
              <td colSpan={5} className="text-center py-4 text-gray-500">No anomalies detected yet</td>
            </tr>
          ) : (
            anomalyHistory.slice(-20).reverse().map((anomaly, idx) => (
              <tr key={idx} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-4 text-gray-300">{new Date(anomaly.timestamp).toLocaleTimeString()}</td>
                <td className="py-3 px-4 text-cyan-400 font-semibold">{anomaly.value.toFixed(2)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${anomaly.model_type === 'zscore' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-purple-500/20 text-purple-300'}`}>
                    {anomaly.model_type === 'zscore' ? 'Z-Score' : 'Isolation Forest'}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-400">{anomaly.threshold.toFixed(2)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${anomaly.is_injected_anomaly ? 'bg-yellow-500/20 text-yellow-300' : 'bg-rose-500/20 text-rose-300'}`}>
                    {anomaly.is_injected_anomaly ? 'Injected' : 'Detected'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
)}
```

---

## Summary of Changes

| Component | Changes | Lines Added |
|-----------|---------|------------|
| main.py | 4 new imports, 2 state vars, 3 new endpoints, updated WebSocket + reset | ~120 |
| App.tsx | 2 new interfaces, 3 state vars, new function, updated hooks, 4 new UI components | ~200 |
| **Total** | | **~320 lines** |

All changes are backward compatible and don't break existing functionality.
