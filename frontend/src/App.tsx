import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Activity, AlertTriangle, Database, Settings2, Play, Square, RotateCcw, Download, TrendingUp, BrainCircuit, X, Info, List } from 'lucide-react';

interface DataPoint {
  timestamp: number;
  value: number;
  is_injected_anomaly: boolean;
  is_anomaly: boolean;
}

interface Metrics {
  total: number;
  anomalies: number;
  percent: number;
}

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

function App() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ total: 0, anomalies: 0, percent: 0 });
  const [statistics, setStatistics] = useState<Statistics>({ total: 0, min: null, max: null, mean: null, median: null, stddev: null });
  const [anomalyHistory, setAnomalyHistory] = useState<Anomaly[]>([]);
  const [wsError, setWsError] = useState<string | null>(null);
  const [modelType, setModelType] = useState('zscore');
  const [threshold, setThreshold] = useState(5.0);
  const [frequency, setFrequency] = useState(0.05);
  const [speed, setSpeed] = useState(0.5);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'history'>('dashboard');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiModalTitle, setAiModalTitle] = useState('AI Insights');

  const wsRef = useRef<WebSocket | null>(null);

  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  const connectWebSocket = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://localhost:8000/ws`;
    setWsError(null);
    setWsStatus('connecting');

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsStatus('connected');
      setWsError(null);
      console.info('WebSocket connected to', wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as DataPoint;
        setData(prev => {
          const newData = [...prev, parsed];
          if (newData.length > 50) newData.shift(); // keep last 50 points
          return newData;
        });
      } catch (parseError) {
        console.error('WebSocket message parse error:', parseError, event.data);
      }
    };

    ws.onerror = (event) => {
      const msg = 'WebSocket connection error. Check backend at http://localhost:8000.';
      console.error(msg, event);
      setWsError(msg);
      setWsStatus('error');
    };

    ws.onclose = (event) => {
      console.warn('WebSocket closed:', event.code, event.reason);
      setWsStatus('disconnected');
      setIsRunning(false);
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      reconnectTimer.current = setTimeout(() => {
        connectWebSocket();
      }, 2000);
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    connectWebSocket();

    // Poll metrics and statistics
    const interval = setInterval(async () => {
      try {
        const res = await fetch('http://localhost:8000/metrics');
        const json = await res.json();
        setMetrics(json);

        const statsRes = await fetch('http://localhost:8000/stats');
        const statsJson = await statsRes.json();
        setStatistics(statsJson);

        const anomaliesRes = await fetch('http://localhost:8000/anomalies');
        const anomaliesJson = await anomaliesRes.json();
        setAnomalyHistory(anomaliesJson.anomalies);
      } catch (e) {
        console.error("Failed to fetch data");
      }
    }, 1000);

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      clearInterval(interval);
    };
  }, []);

  const updateConfig = async () => {
    await fetch('http://localhost:8000/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_type: modelType,
        threshold,
        frequency,
        speed
      })
    });
  };

  useEffect(() => {
    updateConfig();
  }, [modelType, threshold, frequency, speed]);

  const toggleStream = async () => {
    if (showResults) {
      setShowResults(false);
    }

    const endpoint = isRunning ? 'stop' : 'start';
    await fetch(`http://localhost:8000/stream/${endpoint}`, { method: 'POST' });
    setIsRunning(!isRunning);
    if (endpoint === 'start') {
      setIsPaused(false);
    }
  };

  const pauseStream = async () => {
    if (!isRunning) return;
    await fetch(`http://localhost:8000/stream/stop`, { method: 'POST' });
    setIsPaused(true);
    setIsRunning(false);
  };

  const resumeStream = async () => {
    await fetch(`http://localhost:8000/stream/start`, { method: 'POST' });
    setIsPaused(false);
    setIsRunning(true);
    setShowResults(false);
  };

  const showResultMode = async () => {
    await fetch(`http://localhost:8000/stream/stop`, { method: 'POST' });
    setIsRunning(false);
    setIsPaused(false);
    setShowResults(true);
  };

  const resetStream = async () => {
    await fetch(`http://localhost:8000/stream/reset`, { method: 'POST' });
    setData([]);
    setMetrics({ total: 0, anomalies: 0, percent: 0 });
    setStatistics({ total: 0, min: null, max: null, mean: null, median: null, stddev: null });
    setAnomalyHistory([]);
    setIsRunning(false);
    setIsPaused(false);
    setShowResults(false);
    setCurrentView('history');
  };

  const exportCSV = async () => {
    try {
      const res = await fetch('http://localhost:8000/export/csv');
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Export CSV failed (${res.status}): ${res.statusText} ${text}`);
      }
      const blob = await res.blob();
      if (!blob || blob.size === 0) {
        throw new Error('Empty export payload');
      }
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'anomalies_export.csv';
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export CSV", e);
      alert(`Failed to export CSV: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleAnalyzeAnomaly = async (anomaly: Anomaly) => {
    setShowAiModal(true);
    setAiModalTitle(`Anomaly Investigation: ${new Date(anomaly.timestamp).toLocaleTimeString()}`);
    setIsAiLoading(true);
    setAiExplanation(null);
    try {
      const res = await fetch('http://localhost:8000/analyze-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(anomaly)
      });
      const data = await res.json();
      setAiExplanation(data.explanation);
    } catch (e) {
      setAiExplanation("Failed to fetch AI insights. Is the backend running with GROQ_API_KEY?");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setShowAiModal(true);
    setAiModalTitle('System Health Report');
    setIsAiLoading(true);
    setAiExplanation(null);
    try {
      const res = await fetch('http://localhost:8000/stream-summary');
      const data = await res.json();
      setAiExplanation(data.summary);
    } catch (e) {
      setAiExplanation("Failed to fetch AI report. Is the backend running with GROQ_API_KEY?");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleShowProjectInfo = () => {
    setShowAiModal(true);
    setAiModalTitle('Project Documentation: Anomaly Detection');
    setIsAiLoading(false);
    setAiExplanation(`
# Real-Time Anomaly Detection System

Welcome to the Foundations of Data Science coursework project! This application simulates a live data stream and utilizes statistical and Machine Learning algorithms to instantly detect erratic or unusual patterns (anomalies) in real-time.

## How it Works?

1. The Live Data Stream: A localized simulator continuously generates data points that normally follow a stable statistical distribution, mimicking server loads, financial transactions, or IoT sensor readings.
2. Injected Anomalies: Random anomalies (spikes, drops, and persistent noise) are intentionally injected into the stream at a frequency determined by the control panel.
3. Machine Learning Evaluators: Every single incoming data point is evaluated instantly by a selected mathematical model against your sensitivity thresholds to determine if it is "normal".

## Algorithm Selection!

### 1. Z-Score Method
A robust statistical method for normally distributed data. It calculates exactly how many standard deviations a newly arrived data point is from the stream's rolling mean. If a point is too far away, it's flagged as an anomaly.

### 2. Isolation Forest
An unsupervised machine learning algorithm that explicitly *isolates* anomalies instead of profiling normal data points. It builds random decision trees; because anomalies are few and different, they are isolated closer to the root of the tree, allowing for incredibly fast, multi-dimensional detection.

### 3. One-Class SVM
A Support Vector Machine initialized to learn the boundaries of "normal" data. It maps data into a high-dimensional space and draws a boundary encompassing the normal state. Anything landing outside this strict boundary is flagged.

### 4. Ensemble (Majority Vote)
A complex consensus model that passes the data point through all available models simultaneously. If the majority of the models flag the point as dangerous, it is definitively classified as an anomaly.

---
*Tip: Use the 'Generate AI Report' feature to get an Agentic LLM (Groq) explanation of how your system is performing based on these models!*
    `);
  };

  const downloadComprehensiveReport = () => {
    if (!aiExplanation) return;

    const markdownContent = `# System Health Report
Generated at: ${new Date().toLocaleString()}

## Current Configuration
- Algorithm: ${modelType}
- Sensitivity Threshold: ${threshold}
- Data Speed: ${speed}s
- Injected Anomaly Frequency: ${(frequency * 100).toFixed(0)}%

## Live Metrics
- Total Data Points Analyzed: ${metrics.total}
- Total Anomalies Detected: ${metrics.anomalies}
- Anomaly Rate: ${metrics.percent}%

## Statistical Snapshot
- Minimum Value: ${statistics.min !== null ? statistics.min.toFixed(2) : 'N/A'}
- Maximum Value: ${statistics.max !== null ? statistics.max.toFixed(2) : 'N/A'}
- Mean: ${statistics.mean !== null ? statistics.mean.toFixed(2) : 'N/A'}
- Median: ${statistics.median !== null ? statistics.median.toFixed(2) : 'N/A'}
- Standard Deviation: ${statistics.stddev !== null ? statistics.stddev.toFixed(2) : 'N/A'}

---

${aiExplanation}
`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system_health_report_${new Date().getTime()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 p-6 text-white overflow-hidden">
      {wsStatus !== 'connected' && (
        <div className={`mb-4 p-4 rounded-lg border ${wsStatus === 'error' || wsStatus === 'disconnected' ? 'border-rose-400 bg-rose-500/10 text-rose-200' : 'border-yellow-400 bg-yellow-500/10 text-yellow-200'}`}>
          <strong>WebSocket status:</strong> {wsStatus.toUpperCase()}.
          {wsError ? ` ${wsError}` : ' Waiting for backend connection...'}
          <button
            className="ml-4 px-3 py-1 border rounded-lg text-sm bg-indigo-700/20 hover:bg-indigo-700/40"
            onClick={connectWebSocket}
          >
            Retry
          </button>
        </div>
      )}
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
            <Activity className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-cyan-300 drop-shadow-[0_0_15px_rgba(129,140,248,0.5)]">
                Real-Time Anomaly Detection
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                Live
              </span>
            </div>
            <p className="text-sm text-indigo-200/60 font-medium tracking-wide mt-1">Advanced ML-Driven Transaction Monitoring System</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={toggleStream}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg ${isRunning ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'}`}
          >
            {isRunning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isRunning ? 'Stop Stream' : 'Start Stream'}
          </button>
          <button
            onClick={pauseStream}
            disabled={!isRunning}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${isRunning ? 'bg-yellow-500 hover:bg-yellow-600 text-black border border-yellow-400' : 'bg-gray-700 text-gray-300 cursor-not-allowed'}`}
          >
            Pause
          </button>
          <button
            onClick={resumeStream}
            disabled={!isPaused}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${isPaused ? 'bg-cyan-500 hover:bg-cyan-600 text-black border border-cyan-400' : 'bg-gray-700 text-gray-300 cursor-not-allowed'}`}
          >
            Resume
          </button>
          <button
            onClick={() => setCurrentView(currentView === 'dashboard' ? 'history' : 'dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${currentView === 'history' ? 'bg-indigo-500 hover:bg-indigo-600 border-indigo-400 text-white' : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300 hover:text-white'}`}
          >
            <List className="w-4 h-4" />
            {currentView === 'history' ? 'Back to Dashboard' : 'Live History'}
          </button>
          <button
            onClick={showResultMode}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 border border-indigo-400 text-white"
          >
            Result
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 border border-blue-500/30 transition-all text-white shadow-lg shadow-blue-500/20"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={resetStream}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-all text-gray-300 hover:text-white"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </header>

      {showResults ? (
        <div className="p-10 rounded-lg border border-indigo-400 bg-indigo-900/40 text-white">
          <h2 className="text-2xl font-bold mb-2">Results Mode</h2>
          <p className="text-gray-300 mb-4">Stream stopped and graph is hidden. Click Resume/Start to restart simulation.</p>
          <p className="text-gray-100">Total Points: {metrics.total}</p>
          <p className="text-gray-100">Anomalies: {metrics.anomalies}</p>
          <p className="text-gray-100">Anomaly Rate: {metrics.percent}%</p>
        </div>
      ) : currentView === 'dashboard' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Left Column: Controls & Metrics */}
          <div className="lg:col-span-1 space-y-6">

            {/* Metrics Panel */}
            <div className="glass-panel p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4 text-gray-200">
                <Database className="w-5 h-5 text-indigo-400" /> Live Metrics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                  <p className="text-xs text-gray-400 mb-1">Total Points</p>
                  <p className="text-2xl font-bold text-white">{metrics.total}</p>
                </div>
                <div className="bg-rose-500/10 p-4 rounded-lg border border-rose-500/20">
                  <p className="text-xs text-rose-300/80 mb-1">Anomalies</p>
                  <p className="text-2xl font-bold text-rose-400">{metrics.anomalies}</p>
                </div>
                <div className="col-span-2 bg-gradient-to-r from-gray-800/50 to-indigo-900/20 p-4 rounded-lg border border-gray-700/50 flex justify-between items-center">
                  <span className="text-sm text-gray-400">Anomaly Rate</span>
                  <span className="text-xl font-bold text-indigo-300">{metrics.percent}%</span>
                </div>
              </div>
              <button
                onClick={handleGenerateReport}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-medium transition-all shadow-[0_0_10px_rgba(99,102,241,0.1)]"
              >
                <BrainCircuit className="w-4 h-4" /> Generate AI Report
              </button>
              <button
                onClick={handleShowProjectInfo}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-medium transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)]"
              >
                <Info className="w-4 h-4" /> How It Works
              </button>
            </div>


            {/* Statistics Panel */}
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


          </div>

          {/* Right Column: Visualization */}
          <div className="lg:col-span-3 glass-panel p-6 flex flex-col">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" /> Live Data Stream
              </h2>
              <div className="flex gap-4 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-gray-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Normal Data
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> Detected Anomaly
                </span>
              </div>
            </div>

            <div className="w-full relative h-[300px]">
              {data.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                  <Activity className="w-12 h-12 mb-3 opacity-20" />
                  <p>Waiting for data stream...</p>
                  <p className="text-xs mt-1">Press "Start Stream" to begin simulation</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      tickFormatter={(tick) => new Date(tick).toLocaleTimeString()}
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      stroke="#9CA3AF"
                      tick={{ fill: '#9CA3AF', fontSize: 12 }}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                      labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                    />

                    {/* Highlight anomalies with Recharts ReferenceArea trick depending on specific data logic, 
                      or customized Dot rendering in Line. Alternatively, just color the line points. */}

                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#818CF8" // indigo-400
                      strokeWidth={3}
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        if (!payload) return <g></g>;
                        if (payload.is_anomaly) {
                          return (
                            <circle cx={cx} cy={cy} r={6} fill="#F43F5E" stroke="#fff" strokeWidth={2} className="animate-pulse" />
                          );
                        }
                        return <circle cx={cx} cy={cy} r={3} fill="#818CF8" stroke="none" />;
                      }}
                      isAnimationActive={false} // Disable smooth animation for immediate blocky real-time feel, or true for smooth slide.
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bottom Row under Graph: Detection Settings */}
            <div className="mt-6">
              {/* Controls Panel */}
              <div className="glass-panel p-6 space-y-6">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-200">
                  <Settings2 className="w-5 h-5 text-indigo-400" /> Detection Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Algorithm Model</label>
                    <select
                      className="w-full bg-gray-900/80 border border-gray-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={modelType}
                      onChange={e => setModelType(e.target.value)}
                    >
                      <option value="zscore">Z-Score Method</option>
                      <option value="isolation_forest">Isolation Forest</option>
                      <option value="one_class_svm">One-Class SVM</option>
                      <option value="ensemble">Ensemble (Majority Vote)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-gray-400">Sensitivity Threshold</label>
                      <span className="text-xs text-indigo-400 font-medium">{threshold}</span>
                    </div>
                    <input
                      type="range" min="1" max="10" step="0.5"
                      value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      style={{ '--webkit-slider-thumb': 'bg-red-500' } as any}
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower = Find More, Higher = Stricter</p>
                  </div>

                  <div className="pt-4 border-t border-gray-800">
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-gray-400">Data Speed (s)</label>
                      <span className="text-xs text-indigo-400">{speed}s</span>
                    </div>
                    <input
                      type="range" min="0.05" max="2" step="0.05"
                      value={speed} onChange={e => setSpeed(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none accent-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-gray-400">Injected Anomaly Freq</label>
                      <span className="text-xs text-indigo-400">{(frequency * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range" min="0" max="0.3" step="0.01"
                      value={frequency} onChange={e => setFrequency(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none accent-indigo-500"
                    />
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      ) : currentView === 'history' ? (
        <div className="glass-panel p-6 min-h-[600px] flex flex-col">
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
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
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
                        <span className={`px-2 py-1 rounded text-xs font-medium ${anomaly.model_type === 'zscore' ? 'bg-indigo-500/20 text-indigo-300' : anomaly.model_type === 'ensemble' ? 'bg-orange-500/20 text-orange-300' : 'bg-purple-500/20 text-purple-300'}`}>
                          {anomaly.model_type === 'zscore' ? 'Z-Score' : anomaly.model_type === 'isolation_forest' ? 'Isolation Forest' : anomaly.model_type === 'one_class_svm' ? 'One-Class SVM' : 'Ensemble'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{anomaly.threshold.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span title={anomaly.is_injected_anomaly ? "Correctly detected an injected anomaly (True Positive)" : "Falsely flagged a normal data point (False Positive)"} className={`px-2 py-1 rounded text-xs font-medium ${anomaly.is_injected_anomaly ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300 cursor-help'}`}>
                          {anomaly.is_injected_anomaly ? 'True Positive' : 'False Positive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleAnalyzeAnomaly(anomaly)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium transition-all float-right"
                        >
                          <BrainCircuit className="w-3.5 h-3.5" /> AI Analyze
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-gray-900 border border-indigo-500/40 rounded-xl shadow-[0_0_40px_rgba(99,102,241,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
              <h3 className="text-xl font-bold flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
                <BrainCircuit className="w-6 h-6 text-indigo-400" /> {aiModalTitle}
              </h3>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 whitespace-pre-wrap text-gray-300 leading-relaxed text-sm">
              {isAiLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-indigo-400">
                  <BrainCircuit className="w-12 h-12 mb-4 animate-pulse opacity-50" />
                  <p className="text-lg font-medium animate-pulse pb-2">Agentic Reasoning in progress...</p>
                  <p className="text-xs text-gray-500">Querying Groq Fast Inference Model</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  {aiExplanation}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-800 bg-gray-900/80 flex justify-end gap-3">
              {aiModalTitle === 'System Health Report' && !isAiLoading && aiExplanation && (
                <button
                  onClick={downloadComprehensiveReport}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Download className="w-4 h-4" /> Download Report
                </button>
              )}
              <button
                onClick={() => setShowAiModal(false)}
                className="px-6 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors border border-gray-700 hover:border-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
