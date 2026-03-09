# 🚀 Quick Start Guide

## In 5 Minutes: From Zero to Anomaly Detection

### Step 1: Prerequisites (1 minute)
- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] Git installed

### Step 2: Get the Code (30 seconds)
```bash
git clone <repository-url>
cd Foundations_of_ds_project
```

### Step 3: Setup Backend (1 minute)
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Step 4: Setup Frontend (1 minute)
```bash
cd ../frontend
npm install
```

### Step 5: Launch (1 minute)
**Terminal 1:**
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2:**
```bash
cd frontend
npm run dev
```

### Step 6: Use the App (1 minute)
1. Open `http://localhost:5173`
2. Click "Start Stream"
3. Watch anomalies appear (red dots)
4. Try different algorithms
5. Export your results

---

## 🎯 What You'll See

- **Real-time chart** with blue (normal) and red (anomaly) dots
- **Live metrics** updating every second
- **Algorithm dropdown** with 4 detection methods
- **Control sliders** for sensitivity and speed
- **Anomaly history** with detailed explanations

## 🆘 Stuck? Quick Fixes

| Problem | Solution |
|---------|----------|
| "WebSocket error" | Check backend at `http://localhost:8000` |
| No data appearing | Click "Start Stream" |
| Build fails | Run `npm install` or `pip install -r requirements.txt` |
| Port conflict | Use different port: `uvicorn main:app --port 8001` |

## 📚 Learn More

- **Full tutorial**: [USER_GUIDE.md](USER_GUIDE.md)
- **API details**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Complete setup**: [README.md](README.md)

---

**🎉 You're done!** Explore the advanced features and enjoy anomaly detection!**