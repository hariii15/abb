from kubernetes import client, config
from shared.logging.logger import get_logger

logger = get_logger(__name__)

class KubernetesClient:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            try:
                config.load_incluster_config()
                logger.info("Loaded in-cluster Kubernetes config.")
            except config.config_exception.ConfigException:
                config.load_kube_config()
                logger.info("Loaded local kubeconfig.")
            cls._instance = client.CoreV1Api()
        return cls._instance
