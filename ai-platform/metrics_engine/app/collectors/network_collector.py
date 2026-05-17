from shared.prometheus.client import PrometheusClient
from shared.prometheus.normalizer import parse_prometheus_vector

class NetworkCollector:
    def __init__(self):
        self.prom = PrometheusClient.get_instance()

    def get_pod_network_receive(self):
        query = 'sum(rate(container_network_receive_bytes_total{pod!=""}[5m])) by (pod)'
        try:
            results = self.prom.custom_query(query)
            return parse_prometheus_vector(results)
        except Exception:
            return []

    def get_pod_network_transmit(self):
        query = 'sum(rate(container_network_transmit_bytes_total{pod!=""}[5m])) by (pod)'
        try:
            results = self.prom.custom_query(query)
            return parse_prometheus_vector(results)
        except Exception:
            return []
