# Real-Time Anomaly Detection System

A comprehensive full-stack application that simulates real-time data streams, applies advanced Machine Learning algorithms to detect anomalies, and provides an interactive dashboard for visualization and control.

## 🚀 Features

### Core Functionality
- **Real-Time Data Streaming**: Continuous WebSocket-based data simulation with configurable speed and anomaly injection rates.
- **Advanced Anomaly Detection**: Multiple ML algorithms including Z-Score, Isolation Forest, One-Class SVM, and Ensemble methods.
- **Interactive Dashboard**: Modern React-based UI with real-time charts, controls, and metrics display.
- **WebSocket Connectivity**: Robust connection handling with auto-reconnect and error recovery.

### Advanced Features
- **Multiple Anomaly Types**: Spike, drift, collective, and contextual anomalies.
- **Seasonal Data Patterns**: Realistic data generation with daily cycles and trends.
- **Explainable AI**: Detection reasons and confidence scores for each anomaly.
- **Alerting System**: Console-based alerts for high anomaly rates.
- **Online Learning**: Models adapt to new data patterns in real-time.
- **Export Functionality**: CSV export of anomaly history and data points.

## 📁 Project Structure

```
.
├── backend/                          # FastAPI backend
│   ├── main.py                       # Main API server with WebSocket endpoints
│   ├── models/
│   │   └── anomaly_detector.py       # ML detection algorithms
│   ├── utils/
│   │   └── simulator.py              # Data stream simulator
│   ├── requirements.txt              # Python dependencies
│   └── Dockerfile                    # Backend containerization
├── frontend/                         # React frontend
│   ├── src/
│   │   ├── App.tsx                   # Main dashboard component
│   │   ├── main.tsx                  # React entry point
│   │   └── index.css                 # Tailwind CSS styles
│   ├── package.json                  # Node dependencies
│   ├── tailwind.config.js            # Tailwind configuration
│   └── Dockerfile                    # Frontend containerization
├── docker-compose.yml                # Multi-container orchestration
└── README.md                         # This documentation
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### Manual Setup

#### 1. Clone and Navigate
```bash
git clone <repository-url>
cd Foundations_of_ds_project
```

#### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
# source venv/bin/activate

pip install -r requirements.txt
```

#### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

## 🚀 Running the Application

### Option 1: Manual Execution

#### Start Backend
```bash
cd backend
# Activate virtual environment if not already
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
Backend will be available at: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/`

#### Start Frontend
```bash
cd frontend
npm run dev
```
Frontend will be available at: `http://localhost:5173`

### Option 2: Docker (Recommended)
```bash
docker-compose up --build
```
Access the application at: `http://localhost:5173`

## 🎯 Using the Application

### Dashboard Overview
The main dashboard consists of:
1. **Header**: Control buttons (Start/Stop/Reset/Export)
2. **Metrics Panel**: Live statistics (total points, anomalies, rate)
3. **Statistics Panel**: Data distribution metrics
4. **Detection Settings**: Algorithm selection and parameter tuning
5. **Visualization**: Real-time line chart with anomaly highlighting
6. **Anomaly History**: Detailed table of detected anomalies

### Step-by-Step Operation

#### 1. Initial Setup
- Ensure both backend and frontend are running
- The dashboard should show "WebSocket status: CONNECTED"
- If disconnected, click "Retry" button

#### 2. Configure Detection Parameters
- **Algorithm Model**: Choose from:
  - Z-Score Method: Statistical outlier detection
  - Isolation Forest: Tree-based structural anomalies
  - One-Class SVM: Density-based detection
  - Ensemble: Majority vote of all algorithms
- **Sensitivity Threshold**: 1-10 scale (higher = stricter detection)
- **Data Speed**: 0.05-2 seconds between points
- **Injected Anomaly Freq**: 0-30% of data points

#### 3. Start Data Stream
- Click **"Start Stream"** button
- Observe real-time data points on the chart
- Normal points: Blue dots
- Anomalies: Red pulsing dots

#### 4. Monitor and Analyze
- **Live Metrics**: Track total points and anomaly counts
- **Statistics**: View min/max/mean/median/std dev
- **Anomaly History**: Click "Show Anomaly History" to view details
- **Export Data**: Click "Export" to download CSV of anomalies

#### 5. Experiment with Settings
- Change algorithms and observe different detection patterns
- Adjust threshold to see sensitivity changes
- Modify speed and frequency for different scenarios

### Understanding Anomalies

#### Anomaly Types Generated
- **Spike**: Sudden high/low value deviations
- **Drift**: Gradual value changes over time
- **Collective**: Groups of anomalous points
- **Contextual**: Anomalies only in specific conditions (e.g., seasonal lows)

#### Detection Explanations
Each anomaly includes:
- Detection reason (e.g., "Z-score 4.2 > 3.0")
- Algorithm used
- Confidence scores
- Timestamp and value

## 🔧 API Reference

### WebSocket Endpoints
- `ws://localhost:8000/ws`: Real-time data stream

### REST API Endpoints

#### Core Endpoints
- `GET /`: Health check
- `GET /docs`: Interactive API documentation
- `GET /metrics`: Current metrics (total, anomalies, rate)
- `GET /stats`: Statistical summary
- `GET /anomalies`: Anomaly history

#### Control Endpoints
- `POST /config`: Update detection parameters
  ```json
  {
    "model_type": "ensemble",
    "threshold": 5.0,
    "frequency": 0.05,
    "speed": 0.5
  }
  ```
- `POST /stream/start`: Start data generation
- `POST /stream/stop`: Stop data generation
- `POST /stream/reset`: Reset all data and counters

#### Data Export
- `GET /export/csv`: Download anomaly data as CSV

## 🐛 Troubleshooting

### Common Issues

#### WebSocket Connection Errors
- **Symptom**: "WebSocket connection error" banner
- **Solution**:
  1. Ensure backend is running on port 8000
  2. Check firewall settings
  3. Click "Retry" button in UI
  4. Verify `http://localhost:8000/` responds

#### No Data Appearing
- **Symptom**: Chart remains empty after starting stream
- **Solution**:
  1. Confirm "Start Stream" is clicked
  2. Check browser console for errors
  3. Verify WebSocket connection status

#### Build Errors
- **Backend**: Ensure virtual environment is activated and dependencies installed
- **Frontend**: Run `npm install` and check Node.js version

#### Port Conflicts
- **Solution**: Change ports in docker-compose.yml or uvicorn command

### Performance Tips
- For high-frequency data, increase speed slider
- Use Ensemble algorithm for robust detection
- Monitor browser memory usage for long sessions

## 🔬 Advanced Usage

### Custom Anomaly Scenarios
Modify `simulator.py` to create specific test cases:
```python
# Example: Add custom anomaly pattern
def generate_custom_anomaly(self, base_value: float) -> float:
    # Your custom logic here
    return base_value * 1.5  # 50% increase
```

### Algorithm Comparison
Use different algorithms on the same data stream to compare:
1. Run with Z-Score, note detection rate
2. Switch to Isolation Forest, compare results
3. Try Ensemble for combined approach

### Data Analysis
Export CSV data for offline analysis:
```python
import pandas as pd
df = pd.read_csv('anomalies_export.csv')
# Perform custom analysis
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review API documentation at `/docs`
- Open an issue on GitHub

---

**Happy anomaly hunting!** 🎯

## 📚 Documentation

- **[Quick Start](QUICK_START.md)** - 5-minute setup guide
- **[User Guide](USER_GUIDE.md)** - Step-by-step tutorial
- **[API Documentation](API_DOCUMENTATION.md)** - Technical API reference
- **[Documentation Index](DOCUMENTATION_INDEX.md)** - All docs overview
lo