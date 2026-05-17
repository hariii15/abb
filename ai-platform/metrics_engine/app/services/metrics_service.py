from app.collectors.prometheus import PrometheusCollector

class MetricsService:
    def __init__(self):
        self.collector = PrometheusCollector()

    def get_normalized_cpu_metrics(self):
        raw_data = self.collector.get_pod_cpu_usage()
        # TODO: Normalize with pandas
        return raw_data

    def get_normalized_memory_metrics(self):
        raw_data = self.collector.get_pod_memory_usage()
        # TODO: Normalize with pandas
        return raw_data
