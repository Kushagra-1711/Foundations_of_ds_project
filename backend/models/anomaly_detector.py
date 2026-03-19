import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import StandardScaler
import time

class AnomalyDetector:
    def __init__(self):
        # Isolation Forest with online capability (partial_fit)
        self.iso_forest = IsolationForest(contamination=0.05, random_state=42, warm_start=True)
        dummy_data = np.random.normal(100, 10, (1000, 1))
        self.iso_forest.fit(dummy_data)
        
        # One-Class SVM for comparison
        self.oc_svm = OneClassSVM(nu=0.05, kernel='rbf', gamma='auto')
        self.oc_svm.fit(dummy_data)
        
        # Z-Score baseline metrics with online updates
        self.mean = 100.0
        self.std = 10.0
        self.count = 1000
        
        # Scaler for multi-variate
        self.scaler = StandardScaler()
        self.scaler.fit(dummy_data)
        
        # History for explainability
        self.history = []
        
        # Alert thresholds
        self.alert_threshold = 10  # anomalies per minute
        self.alert_window = 60  # seconds
        self.recent_alerts = []

    def detect_zscore(self, value: float, threshold: float = 3.0) -> dict:
        """
        Detect anomaly using Z-score method with explainability.
        """
        if self.std == 0:
            return {"is_anomaly": False, "reason": "No variance in data", "z_score": 0}
        
        z_score = abs(value - self.mean) / self.std
        is_anomaly = z_score > threshold
        
        # Online update
        learning_rate = 0.001
        self.mean = (1 - learning_rate) * self.mean + learning_rate * value
        self.std = (1 - learning_rate) * self.std + learning_rate * abs(value - self.mean)
        
        self.history.append({"value": value, "z_score": z_score, "timestamp": time.time()})
        if len(self.history) > 1000:
            self.history.pop(0)
        
        return {
            "is_anomaly": is_anomaly,
            "reason": f"Z-score {z_score:.2f} > {threshold}" if is_anomaly else f"Z-score {z_score:.2f} <= {threshold}",
            "z_score": z_score
        }

    def detect_isolation_forest(self, value: float, threshold: float = 0.0) -> dict:
        """
        Detect anomaly using Isolation Forest with online updates.
        """
        score = self.iso_forest.decision_function([[value]])[0]
        mapped_threshold = (threshold - 5.0) / 20.0
        is_anomaly = score < mapped_threshold
        
        # Online update (partial_fit if available, else refit periodically)
        if hasattr(self.iso_forest, 'partial_fit'):
            self.iso_forest.partial_fit([[value]])
        
        return {
            "is_anomaly": is_anomaly,
            "reason": f"IF score {score:.3f} < {mapped_threshold:.3f}" if is_anomaly else f"IF score {score:.3f} >= {mapped_threshold:.3f}",
            "score": score
        }

    def detect_one_class_svm(self, value: float, threshold: float = 0.0) -> dict:
        """
        Detect anomaly using One-Class SVM.
        """
        prediction = self.oc_svm.predict([[value]])[0]  # 1 for inlier, -1 for outlier
        score = self.oc_svm.decision_function([[value]])[0]
        mapped_threshold = (threshold - 5.0) / 20.0
        is_anomaly = prediction == -1 or score < mapped_threshold
        
        return {
            "is_anomaly": is_anomaly,
            "reason": f"SVM prediction {prediction}, score {score:.3f}" if is_anomaly else f"SVM prediction {prediction}, score {score:.3f}",
            "score": score
        }

    def detect_ensemble(self, value: float, threshold: float = 3.0) -> dict:
        """
        Ensemble detection: majority vote from Z-Score, IF, SVM.
        """
        z_result = self.detect_zscore(value, threshold)
        if_result = self.detect_isolation_forest(value, threshold)
        svm_result = self.detect_one_class_svm(value, threshold)
        
        votes = [z_result["is_anomaly"], if_result["is_anomaly"], svm_result["is_anomaly"]]
        is_anomaly = sum(votes) >= 2  # Majority
        
        reasons = [z_result["reason"], if_result["reason"], svm_result["reason"]]
        
        return {
            "is_anomaly": is_anomaly,
            "reason": f"Ensemble vote {sum(votes)}/3: {', '.join(reasons)}"
        }

    def check_alert(self, anomaly_count: int) -> bool:
        """
        Check if anomaly rate exceeds alert threshold.
        """
        now = time.time()
        self.recent_alerts = [t for t in self.recent_alerts if now - t < self.alert_window]
        if anomaly_count > self.alert_threshold:
            self.recent_alerts.append(now)
            print(f"ALERT: High anomaly rate detected ({anomaly_count} in {self.alert_window}s)")
            return True
        return False

detector_instance = AnomalyDetector()
