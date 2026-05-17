from kubernetes import client, config
import os

def get_k8s_client():
    try:
        # Tries to load in-cluster config if running inside a Pod
        config.load_incluster_config()
    except config.config_exception.ConfigException:
        # Falls back to local kubeconfig for development
        config.load_kube_config()
    
    return client.CoreV1Api()
