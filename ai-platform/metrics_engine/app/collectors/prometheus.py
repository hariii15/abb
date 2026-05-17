from prometheus_api_client import PrometheusConnect
import os

PROMETHEUS_URL = os.getenv("PROMETHEUS_URL", "http://prometheus-service.default.svc.cluster.local:9090")

class PrometheusCollector:
    def __init__(self):
        self.prom = PrometheusConnect(url=PROMETHEUS_URL, disable_ssl=True)

    def get_pod_cpu_usage(self):
        query = 'sum(rate(container_cpu_usage_seconds_total{image!=""}[1m])) by (pod)'
        return self.prom.custom_query(query)

    def get_pod_memory_usage(self):
        query = 'sum(container_memory_usage_bytes{image!=""}) by (pod)'
        return self.prom.custom_query(query)
