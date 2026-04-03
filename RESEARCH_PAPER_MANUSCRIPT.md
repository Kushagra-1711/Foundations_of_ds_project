# Research Paper Manuscript

**Title:** Ensemble Machine Learning Approaches for Real-Time Transactional Anomaly Detection
**Author:** [Your Name / Kusha]
**Course:** Foundation of Data Science

## Abstract
The detection of anomalies in high-velocity data streams is a critical problem in various domains, ranging from financial fraud detection to network security. Traditional batch-processing models fail to capture context-dependent and rapidly evolving anomalous behaviors. In this paper, we propose a real-time transactional anomaly detection system utilizing an ensemble of Machine Learning algorithms: Z-Score, Isolation Forest, and One-Class Support Vector Machines (SVM). We evaluated our system using a custom WebSocket-based data simulator that injects seasonal trends, stochastic noise, and multiple anomaly types (spike, drift, collective, and contextual). Our findings demonstrate that while Z-Score provides rapid baseline detection, the Ensemble method significantly reduces false positives in complex, contextual datasets.

## 1. Introduction
With the exponential growth of transactional data in digital environments, the need for robust, low-latency anomaly detection systems has become paramount. Anomalies—data points that deviate significantly from expected behavioral patterns—often signify critical, actionable events such as fraudulent transactions or system failures. 

This paper outlines the architecture and implementation of a real-time detection engine. The primary contribution of this work is a scalable, full-stack application that not only performs anomaly detection in real-time but also provides explainable AI (XAI) metrics via a dynamic React-based dashboard, satisfying core requirements of the Foundation of Data Science coursework.

## 2. Methodology

### 2.1 Data Simulation
A vital component of this research is the continuous generation of realistic data. Our `DataSimulator` synthesizes a baseline transactional volume utilizing trigonometric daily seasonality coupled with a slow upward trend and stochastic Gaussian noise ($N(0, 5)$). 

### 2.2 Anomaly Types
We model four distinct types of anomalies:
1. **Spike Anomalies:** Sudden, massive deviations from the mean.
2. **Drift Anomalies:** Gradual, compounding deviations simulating persistent slow attacks or systemic degradation.
3. **Collective Anomalies:** Clusters of slightly abnormal data points that, independently, might not trigger thresholds.
4. **Contextual Anomalies:** Data points that appear normal globally but are anomalous within their specific temporal context (e.g., high volume during documented low-season hours).

### 2.3 Detection Algorithms
To provide comprehensive coverage, we implemented the following algorithms operating in an online (streaming) capacity:
- **Z-Score Method:** Computes the standard score of a point based on an incrementally updated rolling mean and standard deviation.
- **Isolation Forest:** An unsupervised tree-based anomaly detection algorithm that isolates anomalies rather than profiling normal data points.
- **One-Class SVM:** A max-margin approach that learns a decision boundary encompassing the "normal" data cluster in a high-dimensional feature space.

## 3. System Architecture
The platform is designed using a microservices architecture:
1. **Backend (FastAPI Engine):** Handles the data simulation, maintains the state of the ML models, and pushes live data via WebSockets to the frontend.
2. **Frontend (React & Tailwind CSS):** A high-performance dashboard utilizing Recharts for real-time visualization. It features interactive parameter tuning, allowing dynamic shifts in model sensitivity and type without interrupting the data stream.

## 4. Results & Discussion
Preliminary results indicate that the Ensemble approach (utilizing a majority vote from the constituent algorithms) provides the highest F1-Score when evaluating streams containing highly contextual anomalies. The Z-Score method excels at capturing Spike anomalies with zero latency but is prone to high false-positive rates during periods of sudden, legitimate seasonal variance. 

The Isolation Forest demonstrated superior performance in identifying Drift anomalies by correctly modeling the sub-space structure of the temporal windows.

## 5. Conclusion
This project successfully demonstrates the application of Foundational Data Science principles to a complex, real-time streaming problem. By combining sophisticated ML models with a robust, interactive visualization suite, the system serves as both a powerful analytical tool and a foundation for further research into online learning algorithms. Future work will investigate the integration of Deep Learning models such as Autoencoders or LSTMs to replace the traditional SVM components.

## References
1. Liu, F. T., Ting, K. M., & Zhou, Z. H. (2008). Isolation forest. In _Eighth IEEE International Conference on Data Mining (ICDM)_.
2. Schölkopf, B., Platt, J. C., Shawe-Taylor, J., Smola, A. J., & Williamson, R. C. (2001). Estimating the support of a high-dimensional distribution. _Neural Computation_, 13(7), 1443-1471.
