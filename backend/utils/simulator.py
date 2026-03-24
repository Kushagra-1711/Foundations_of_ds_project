import asyncio
import random
import time
import math
from typing import AsyncGenerator

class DataSimulator:
    def __init__(self):
        self.running: bool = False
        self.frequency: float = 0.05  # 5% chance of anomaly
        self.speed: float = 0.5       # seconds between data points
        self.start_time = time.time()
        self.anomaly_types = ['spike', 'drift', 'collective', 'contextual']
        
    def set_config(self, frequency: float, speed: float):
        self.frequency = max(0.0, min(1.0, frequency))
        self.speed = max(0.05, speed)
        
    def start(self):
        self.running = True
        
    def stop(self):
        self.running = False
        
    def reset(self):
        self.start_time = time.time()
        pass

    def generate_seasonal_value(self, t: float) -> float:
        """Generate value with seasonality (daily pattern)."""
        base = 100
        seasonal = 10 * math.sin(2 * math.pi * t / 86400)  # Daily cycle
        trend = 0.01 * t  # Slow upward trend
        noise = random.normalvariate(0, 5)
        return base + seasonal + trend + noise

    def generate_anomaly(self, anomaly_type: str, base_value: float) -> float:
        """Generate different types of anomalies."""
        if anomaly_type == 'spike':
            direction = random.choice([1, -1])
            return base_value + direction * random.uniform(40, 100)
        elif anomaly_type == 'drift':
            # Gradual drift
            return base_value + random.uniform(-20, 20)
        elif anomaly_type == 'collective':
            # Part of a group anomaly
            return base_value + random.uniform(20, 50)
        elif anomaly_type == 'contextual':
            # Anomaly only in certain context (e.g., low season)
            seasonal_factor = math.sin(2 * math.pi * (time.time() - self.start_time) / 86400)
            if seasonal_factor < -0.5:  # Low season
                return base_value + random.uniform(30, 60)
            else:
                return base_value
        return base_value

    async def generate_stream(self) -> AsyncGenerator[dict, None]:
        """
        Generator that continuously produces data points while running.
        """
        while True:
            if not self.running:
                await asyncio.sleep(0.5)
                continue
                
            t = time.time() - self.start_time
            base_value = self.generate_seasonal_value(t)
            
            is_injected_anomaly = random.random() < self.frequency
            anomaly_type = random.choice(self.anomaly_types) if is_injected_anomaly else None
            
            if is_injected_anomaly:
                value = self.generate_anomaly(anomaly_type, base_value)
            else:
                value = base_value
                
            data_point = {
                "timestamp": time.time() * 1000,  # JS milliseconds
                "value": round(value, 2),
                "is_injected_anomaly": is_injected_anomaly,
                "anomaly_type": anomaly_type,
                "seasonal_factor": round(math.sin(2 * math.pi * t / 86400), 2)
            }
            
            yield data_point
            
            await asyncio.sleep(self.speed)

simulator_instance = DataSimulator()
