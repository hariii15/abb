class RecommendationEngine:
    def __init__(self):
        pass

    def get_recommendation_for_anomaly(self, anomaly: dict):
        """
        Processes an anomaly and generates a structured recommendation and YAML patch.
        """
        service_name = anomaly.get("service")
        severity = anomaly.get("severity")
        anomaly_type = anomaly.get("type")
        
        # Default recommendation
        recommendation = {
            "service": service_name,
            "action": "Investigate",
            "message": f"Anomaly detected in {service_name}. Manual inspection recommended.",
            "patch": None
        }

        # Rule-based logic for specific anomalies
        if anomaly_type == "resource_anomaly" and severity in ["high", "critical"]:
            details = anomaly.get("details", {})
            cpu_latest = details.get("cpu_latest", 0)
            cpu_mean = details.get("cpu_mean", 0)

            if cpu_latest > cpu_mean * 2:
                recommendation["action"] = "Scale Up"
                recommendation["message"] = f"Detected high CPU usage on {service_name}. Suggesting a horizontal scale-up to handle the load."
                recommendation["patch"] = self.generate_scaling_patch(service_name, 3) # Recommend 3 replicas
        
        return recommendation

    def generate_scaling_patch(self, service_name: str, replicas: int):
        """
        Generates a JSON patch for scaling replicas.
        """
        return {
            "op": "replace",
            "path": "/spec/replicas",
            "value": replicas
        }

    def generate_resource_patch(self, service_name: str, cpu: str, memory: str):
        """
        Generates a JSON patch for resource limits.
        """
        return {
            "op": "replace",
            "path": "/spec/template/spec/containers/0/resources/limits",
            "value": {
                "cpu": cpu,
                "memory": memory
            }
        }
