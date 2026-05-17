from shared.prometheus.client import PrometheusClient
from shared.prometheus.normalizer import parse_prometheus_vector

class CPUCollector:
    def __init__(self):
        self.prom = PrometheusClient.get_instance()

    def get_pod_cpu_usage(self):
        # Universal query that captures pod CPU rates
        query = 'sum(rate(container_cpu_usage_seconds_total[1m])) by (pod)'
        try:
            results = self.prom.custom_query(query)
            return parse_prometheus_vector(results)
        except Exception as e:
            return {"error": str(e)}
