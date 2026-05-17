from datetime import datetime
from shared.logging.logger import get_logger

logger = get_logger(__name__)

class AnomalyEngine:
    def __init__(self):
        # Deterministic engine for stable demos
        self.cpu_threshold_warning = 0.3  # 300m
        self.cpu_threshold_critical = 0.7 # 700m
        
        self.mem_threshold_percent = 90.0
        self.restart_threshold = 5
        self.storage_threshold_percent = 85.0

    def detect_anomalies(self, df):
        """
        Analyzes a DataFrame of metrics and returns a list of detected anomalies.
        Expects columns: ['timestamp', 'pod', 'cpu_usage', 'memory_usage', 'restarts', 'storage_usage']
        """
        if df.empty:
            return []

        anomalies = []
        
        # We group by pod to evaluate the latest value
        for pod_name, group in df.groupby('pod'):
            latest = group.iloc[-1]
            cpu_val = float(latest.get('cpu_usage', 0))
            mem_val = float(latest.get('memory_usage', 0))
            restart_val = int(latest.get('restarts', 0))
            storage_val = float(latest.get('storage_usage', 0))
            
            # 1. CPU Spike Detection
            if cpu_val > self.cpu_threshold_warning:
                severity = "critical" if cpu_val > self.cpu_threshold_critical else "high"
                anomalies.append(self._create_anomaly(pod_name, "cpu_spike", severity, 
                    f"CPU spike: {round(cpu_val * 1000, 1)}m exceeds threshold."))

            # 2. Memory Leak / High Usage Detection
            # Note: For real leak detection we'd check group['memory_usage'] trend
            if mem_val > 500: # Assuming 500MB as a warning for these small services
                anomalies.append(self._create_anomaly(pod_name, "memory_leak", "high", 
                    f"Memory Leak candidate: High RAM usage ({round(mem_val, 1)} MB)."))

            # 3. Restart Storm Detection
            if restart_val > self.restart_threshold:
                anomalies.append(self._create_anomaly(pod_name, "restart_storm", "critical", 
                    f"Restart Storm: Pod has restarted {restart_val} times."))

            # 4. Storage Pressure Detection
            if storage_val > self.storage_threshold_percent:
                anomalies.append(self._create_anomaly(pod_name, "storage_pressure", "critical", 
                    f"Storage Pressure: PVC is {round(storage_val, 1)}% full."))
                
        return anomalies

    def _create_anomaly(self, pod, a_type, severity, desc):
        return {
            "service": pod,
            "type": a_type,
            "severity": severity,
            "description": desc,
            "timestamp": datetime.now().isoformat()
        }
