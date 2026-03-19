import os
import json
from groq import Groq
from dotenv import load_dotenv

# Load env variables from a .env file if present
load_dotenv()

class AnomalyExplainerAgent:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if self.api_key:
            self.client = Groq(api_key=self.api_key)
        else:
            self.client = None
            print("WARNING: GROQ_API_KEY not found in environment variables. Agent will return mock responses.")

        self.model = "llama-3.3-70b-versatile"

    async def analyze_anomaly(self, anomaly_data: dict, stream_stats: dict) -> str:
        if not self.client:
            return "Groq API key is missing. Please add GROQ_API_KEY to your .env file in the backend directory."

        prompt = f"""You are an expert Data Science AI assistant monitoring a real-time data stream for anomalies.
An anomaly has just been detected! Analyze it and provide a brief, insightful explanation.

Anomaly Details:
- Value: {anomaly_data.get('value')}
- Algorithm: {anomaly_data.get('model_type')}
- Sensitivity Threshold: {anomaly_data.get('threshold')}
- Injected Test Anomaly: {anomaly_data.get('is_injected_anomaly')}

Recent Stream Statistics:
- Mean: {stream_stats.get('mean')}
- Median: {stream_stats.get('median')}
- Min: {stream_stats.get('min')}
- Max: {stream_stats.get('max')}
- Standard Deviation: {stream_stats.get('stddev')}

Keep your explanation to 2-3 short paragraphs.
First, explain mathematically why this value ({anomaly_data.get('value')}) was flagged as anomalous compared to the stream statistics.
Second, suggest 1 or 2 real-world scenarios that could cause such a spike or drop (e.g. server overload, sensor malfunction, fraudulent transaction).
End with a brief recommendation on whether to ignore it, monitor closely, or take immediate action.
"""

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are a helpful, expert data analytics assistant."},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.5,
                max_tokens=300,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            return f"Error contacting Groq API: {str(e)}"

    async def summarize_stream(self, stream_stats: dict, metrics: dict) -> str:
        if not self.client:
            return "Groq API key is missing. Please add GROQ_API_KEY to your .env file in the backend directory."

        prompt = f"""You are a Principal Data Scientist evaluating a live anomaly detection system. Based on the metrics below, write a Comprehensive System Health Report.

Metrics:
- Total Data Points Analyzed: {metrics.get('total')}
- Total Anomalies Detected: {metrics.get('anomalies')}
- Current Anomaly Rate: {metrics.get('percent')}%

Statistics:
- Mean: {stream_stats.get('mean')}
- Median: {stream_stats.get('median')}
- Standard Deviation: {stream_stats.get('stddev')}
- Data Range: {stream_stats.get('min')} to {stream_stats.get('max')}

Please output your report in professional Markdown format with the following structure:
1. **Executive Summary**: A high-level overview of the stream's current health and stability based on the anomaly rate and statistical distribution.
2. **Statistical Analysis**: Delve into the data range, mean, median, and variance. What does this indicate about the system's baseline behavior?
3. **Algorithm Efficacy Evaluation**: Assess if the algorithms might be over-sensitive or under-sensitive given the anomaly rate. Is there a high rate of False Positives?
4. **Actionable Recommendations**: Bullet points detailing exactly what the engineering team should do next (e.g., monitor, adjust threshold, investigate specific algorithms, ignore, etc.).
"""
        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": "You are an expert Data Science System health monitoring assistant."},
                    {"role": "user", "content": prompt}
                ],
                model=self.model,
                temperature=0.3,
                max_tokens=1500,
            )
            return chat_completion.choices[0].message.content
        except Exception as e:
            return f"Error contacting Groq API: {str(e)}"

agent_instance = AnomalyExplainerAgent()
