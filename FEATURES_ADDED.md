# New Features Added

## Overview
Three major features have been added to the Real-Time Anomaly Detection System:

### 1. Advanced Statistical Analysis
**Location:** Frontend - Left sidebar, Statistics Panel

**Features:**
- Real-time Min/Max/Mean/Median/Standard Deviation calculations
- Updates every second as new data arrives
- Color-coded display for easy visualization:
  - **Min Value** (Cyan)
  - **Max Value** (Yellow)
  - **Mean** (White)
  - **Median** (Green)
  - **Std Dev** (Purple)

**Backend Support:**
- New endpoint: `GET /stats`
- Tracks last 1000 data points for statistics calculation
- Uses Python's `statistics` module for accurate calculations

### 2. Anomaly History & Details Panel
**Location:** Frontend - Toggleable panel below the chart

**Features:**
- Shows list of detected anomalies with detailed information
- Table displays:
  - **Timestamp**: When the anomaly was detected
  - **Value**: The actual anomaly value
  - **Algorithm**: Which detection method found it (Z-Score or Isolation Forest)
  - **Threshold**: The threshold used for detection
  - **Type**: Whether it was injected or naturally detected
- Color-coded rows for quick identification:
  - Blue badge for Z-Score algorithm
  - Purple badge for Isolation Forest algorithm
  - Yellow badge for Injected anomalies
  - Red badge for Detected anomalies
- Shows last 20 anomalies (most recent first)
- Toggle button shows anomaly count

**Backend Support:**
- New endpoint: `GET /anomalies`
- Stores up to 500 anomaly records with full details
- Each record includes: timestamp, value, algorithm, threshold, injection status

### 3. Data Export to CSV
**Location:** Frontend - Header, Blue "Export" button

**Features:**
- One-click CSV export of all detected anomalies
- Exported data includes:
  - Timestamp
  - Value
  - Is_Anomaly status
  - Algorithm used
  - Threshold applied
  - Injection status
- File downloads as `anomalies_export.csv`
- Works in all modern browsers

**Backend Support:**
- New endpoint: `GET /export/csv`
- Uses Python's `csv` module for proper formatting
- Streams response for efficient file delivery

## Backend Changes (main.py)

### New Imports
```python
import csv
from io import StringIO
from statistics import mean, median, stdev
from fastapi.responses import StreamingResponse
```

### New State Variables
```python
app.state.data_points = []        # Tracks last 1000 points
app.state.anomaly_history = []    # Stores up to 500 anomalies
```

### New Endpoints
1. **GET /stats** - Returns min, max, mean, median, stddev
2. **GET /anomalies** - Returns list of detected anomalies
3. **GET /export/csv** - Downloads CSV file with anomaly data

### Updated WebSocket Handler
- Collects all data points for statistics
- Stores anomaly details when detected
- Maintains sliding window of recent data (1000 points, 500 anomalies)

### Updated Reset Handler
- Clears data points and anomaly history on reset

## Frontend Changes (App.tsx)

### New State Variables
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

// In App component:
const [statistics, setStatistics] = useState<Statistics>(...);
const [anomalyHistory, setAnomalyHistory] = useState<Anomaly[]>([]);
const [showAnomalyPanel, setShowAnomalyPanel] = useState(false);
```

### New UI Components
1. **Statistics Panel** (6 new cards with real-time values)
2. **Anomaly History Toggle Button** (with anomaly count badge)
3. **Anomaly History Table** (detailed view of all anomalies)
4. **Export Button** (in header, blue color)

### Updated Functions
- `resetStream()` - Now clears statistics and anomaly history
- `exportCSV()` - New function to download CSV file
- `useEffect()` - Now polls `/stats` and `/anomalies` endpoints

## Testing the Features

1. **Start the backend:** `uvicorn main:app --reload`
2. **Start the frontend:** `npm run dev`
3. **Start the stream:** Click "Start Stream" button
4. **View statistics:** Real-time stats appear in the left panel
5. **View anomalies:** Click "Show Anomaly History" button
6. **Export data:** Click "Export" button to download CSV

## Performance Considerations

- Data points limited to last 1000 to prevent memory bloat
- Anomalies limited to last 500 to keep storage efficient
- Statistics calculated in O(n) time using Python's statistics module
- CSV export streams response for memory efficiency
- Polling interval: 1 second (can be adjusted if needed)

## Future Enhancement Possibilities

- Filter anomalies by date range
- Sort anomaly table by any column
- Export multiple formats (JSON, Parquet, etc.)
- Anomaly confidence scores
- Alert thresholds and notifications
- Data persistence to database
- Historical trend analysis
