# User Guide: Real-Time Anomaly Detection Dashboard

## Welcome
This guide will walk you through using the Real-Time Anomaly Detection System, from initial setup to advanced experimentation.

## Quick Start Checklist

### Prerequisites
- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] Git installed
- [ ] Web browser (Chrome/Firefox recommended)

### Installation Steps
1. [ ] Clone the repository
2. [ ] Set up backend virtual environment
3. [ ] Install Python dependencies
4. [ ] Install Node.js dependencies
5. [ ] Start backend server
6. [ ] Start frontend development server

## Detailed Setup Instructions

### 1. Get the Code
```bash
git clone <repository-url>
cd Foundations_of_ds_project
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

### 4. Launch Application
**Terminal 1 - Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access Application
- Open browser to: `http://localhost:5173`
- Verify backend at: `http://localhost:8000`

## Dashboard Tour

### Interface Layout
```
┌─────────────────────────────────────────────────┐
│ Header: Control Buttons (Start/Stop/Reset/Export) │
├─────────────────┬───────────────────────────────┤
│ Metrics Panel   │ Visualization Chart            │
│ - Total Points  │ - Real-time line chart         │
│ - Anomalies     │ - Blue dots: normal           │
│ - Anomaly Rate  │ - Red dots: anomalies         │
├─────────────────┼───────────────────────────────┤
│ Statistics      │ Anomaly History Panel          │
│ - Min/Max       │ - Detailed anomaly table       │
│ - Mean/Median   │ - Timestamps & reasons        │
│ - Std Dev       │                               │
├─────────────────┴───────────────────────────────┤
│ Detection Settings Panel                        │
│ - Algorithm dropdown                            │
│ - Threshold slider                              │
│ - Speed slider                                  │
│ - Anomaly frequency slider                      │
└─────────────────────────────────────────────────┘
```

## Step-by-Step Usage Guide

### Scenario 1: Basic Anomaly Detection

#### Step 1: Verify Connection
- Look for "WebSocket status: CONNECTED" (green)
- If red/error, click "Retry" button

#### Step 2: Configure Basic Settings
- Algorithm: Select "Z-Score Method"
- Threshold: Set to 5 (middle sensitivity)
- Speed: Set to 0.5 seconds
- Anomaly Frequency: Set to 5%

#### Step 3: Start Monitoring
- Click "Start Stream"
- Watch data points appear on chart
- Observe metrics updating in real-time

#### Step 4: Observe Anomalies
- Red pulsing dots indicate detected anomalies
- Check "Anomaly Rate" percentage
- Click "Show Anomaly History" for details

### Scenario 2: Algorithm Comparison

#### Step 1: Z-Score Detection
- Select "Z-Score Method"
- Start stream, note anomaly detection rate
- Stop stream after 100+ points

#### Step 2: Isolation Forest
- Change to "Isolation Forest"
- Reset stream, start again
- Compare anomaly rates between algorithms

#### Step 3: One-Class SVM
- Change to "One-Class SVM"
- Reset and restart
- Note different detection patterns

#### Step 4: Ensemble Method
- Select "Ensemble (Majority Vote)"
- Reset and restart
- Observe most robust detection

### Scenario 3: Parameter Tuning

#### Sensitivity Testing
- Start with threshold = 1 (very sensitive)
- Gradually increase to 10 (strict)
- Observe how anomaly rate changes

#### Speed Testing
- Set speed to 2.0 (fast)
- Watch for real-time performance
- Set to 0.05 (slow) for detailed analysis

#### Anomaly Injection
- Set frequency to 30% (high)
- Observe system handling high anomaly rates
- Check for alert messages in console

### Scenario 4: Data Export and Analysis

#### Export Anomalies
- Run stream for several minutes
- Click "Export" button
- Save `anomalies_export.csv`

#### Analyze Exported Data
```python
import pandas as pd
df = pd.read_csv('anomalies_export.csv')
print(df.head())
print(f"Total anomalies: {len(df)}")
```

## Advanced Features Guide

### Understanding Anomaly Types

#### Spike Anomalies
- Sudden, brief deviations from normal
- Example: Credit card fraud spike
- Detection: All algorithms catch these well

#### Drift Anomalies
- Gradual changes over time
- Example: Sensor degradation
- Detection: Z-Score and Ensemble work best

#### Collective Anomalies
- Groups of points that are anomalous together
- Example: Network traffic bursts
- Detection: Isolation Forest excels here

#### Contextual Anomalies
- Normal in some contexts, abnormal in others
- Example: High sales only on holidays
- Detection: Requires domain knowledge

### Seasonal Data Patterns

The simulator includes realistic patterns:
- **Daily Cycles**: Values vary throughout the day
- **Trends**: Slow upward/downward movements
- **Noise**: Random variations around base value
- **Seasonal Factor**: -1 to +1 indicating cycle position

### Alert System

#### Console Alerts
- Triggered when >10 anomalies per minute
- Check browser/terminal console for messages
- Format: "ALERT: High anomaly rate detected (X in 60s)"

#### WebSocket Status
- Green: Connected and receiving data
- Yellow: Connecting/reconnecting
- Red: Connection error

### Explainable AI Features

#### Detection Reasons
Each anomaly includes explanation:
- "Z-score 4.2 > 3.0"
- "IF score -0.45 < -0.1"
- "SVM prediction -1"
- "Ensemble vote 3/3: [detailed reasons]"

#### Confidence Scores
- Z-Score: Distance from mean
- Isolation Forest: Decision function score
- SVM: Distance from decision boundary

## Troubleshooting Guide

### Connection Issues

#### WebSocket Won't Connect
**Symptoms:** Red status banner, no data flow
**Solutions:**
1. Verify backend is running: `http://localhost:8000`
2. Check port 8000 not blocked by firewall
3. Click "Retry" in UI
4. Restart backend server

#### Data Not Appearing
**Symptoms:** Chart stays empty after start
**Solutions:**
1. Confirm "Start Stream" clicked
2. Check browser developer console (F12)
3. Verify WebSocket messages in Network tab
4. Reset stream and try again

### Performance Issues

#### Slow Response Times
**Solutions:**
- Increase speed slider
- Reduce anomaly frequency
- Close other browser tabs
- Check system resources

#### Memory Usage High
**Solutions:**
- Reset stream periodically
- Close browser and restart
- Monitor with browser dev tools

### Algorithm Issues

#### Too Many/Few Anomalies
**Solutions:**
- Adjust threshold slider
- Try different algorithm
- Modify anomaly injection frequency
- Check seasonal factors

#### Inconsistent Detection
**Solutions:**
- Use Ensemble method for stability
- Reset stream to clear history
- Check for concept drift in data

## Best Practices

### For Learning
1. Start with Z-Score algorithm
2. Use default settings initially
3. Experiment with one parameter at a time
4. Compare algorithms on same data
5. Export and analyze results

### For Production Use
1. Use Ensemble algorithm
2. Set appropriate thresholds
3. Monitor alert console
4. Export data regularly
5. Understand anomaly reasons

### Data Analysis Tips
1. Look for patterns in anomaly history
2. Correlate with seasonal factors
3. Compare injected vs detected anomalies
4. Use statistical summary for baseline

## Common Questions

### Q: Why do different algorithms detect different anomalies?
**A:** Each algorithm has different strengths:
- Z-Score: Good for statistical outliers
- Isolation Forest: Good for structural anomalies
- SVM: Good for density-based detection
- Ensemble: Combines all approaches

### Q: How do I know if detection is working?
**A:** Check these indicators:
- Red dots on chart for anomalies
- Increasing anomaly count in metrics
- Entries in anomaly history table
- Detection reasons in exported data

### Q: What do the sliders control?
**A:**
- **Threshold**: How strict anomaly detection is
- **Speed**: How fast data points arrive
- **Frequency**: How often artificial anomalies are injected

### Q: Can I use real data instead of simulation?
**A:** Yes! Modify `simulator.py` to read from:
- CSV files
- Database connections
- API endpoints
- IoT sensors

## Next Steps

### Further Learning
- Read about each ML algorithm
- Study anomaly detection literature
- Experiment with custom anomaly patterns
- Integrate with real data sources

### Advanced Customization
- Add new algorithms to `anomaly_detector.py`
- Create custom data patterns in `simulator.py`
- Add email/Slack notifications
- Implement batch processing

### Production Deployment
- Use Docker Compose for deployment
- Add authentication and security
- Implement monitoring and logging
- Scale with load balancers

---

**Happy exploring!** If you have questions, check the API documentation or open an issue.