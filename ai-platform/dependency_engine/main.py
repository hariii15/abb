import networkx as nx
from kubernetes import client, config
from shared.logging.logger import get_logger

logger = get_logger(__name__)

class DependencyEngine:
    def __init__(self):
        try:
            config.load_kube_config()
        except Exception:
            config.load_incluster_config()
        self.v1 = client.CoreV1Api()
        self.apps_v1 = client.AppsV1Api()

    def build_service_graph(self, metrics_data=None, anomaly_data=None):
        """
        Builds an enriched graph containing health, traffic, and dependencies.
        """
        graph = nx.DiGraph()
        
        # 1. Define Core Services (The Backbone)
        services = [
            "api-gateway", "plc-controller", "sensor-service", 
            "motor-service", "conveyor-service", "robot-arm-service",
            "alarm-service", "energy-service", "notification-service"
        ]
        
        # 2. Add Nodes with Health Status
        anomaly_map = {a.get('service'): a for a in anomaly_data} if anomaly_data else {}
        
        # We first determine raw health
        service_stats = {}
        for svc in services:
            status = "healthy"
            metric_label = ""
            
            # Find the pod that belongs to this service
            if metrics_data:
                for pod_name, stats in metrics_data.items():
                    if pod_name.startswith(svc):
                        cpu = stats.get("cpu", 0)
                        mem = stats.get("memory", 0)
                        metric_label = f"{cpu}m | {int(mem)}MB"
                        
                        # Check for anomaly
                        if pod_name in anomaly_map:
                            status = "critical"
                        break
            
            service_stats[svc] = {"status": status, "metric": metric_label}

        # 3. Cascading Risk: If a dependent is critical, source becomes warning
        dependencies = [
            ("api-gateway", "plc-controller", "Commands"),
            ("api-gateway", "sensor-service", "Metrics"),
            ("api-gateway", "energy-service", "Energy"),
            ("plc-controller", "motor-service", "Motor Control"),
            ("plc-controller", "conveyor-service", "Conveyor Control"),
            ("plc-controller", "robot-arm-service", "Robot Control"),
            ("sensor-service", "alarm-service", "Thresholds"),
            ("alarm-service", "notification-service", "Alerts"),
        ]

        for source, target, label in dependencies:
            # If target is critical, source might be at risk
            if service_stats[target]["status"] == "critical" and service_stats[source]["status"] == "healthy":
                service_stats[source]["status"] = "warning"

        for svc in services:
            data = service_stats[svc]
            graph.add_node(svc, 
                label=f"{svc.upper()}\n{data['metric']}",
                status=data["status"],
                cpu=data["metric"]
            )

        # 4. Define Edges with Dynamic Animation and Inferred Traffic Labels
        for source, target, label in dependencies:
            # Animate if target is struggling
            data = service_stats[target]
            is_risky = data["status"] != "healthy"
            
            # Infer RPS from traffic if available (simple scaling)
            # e.g. 10 KB/s ~ 50 requests/s
            rps = 0
            if metrics_data:
                for pod, stats in metrics_data.items():
                    if pod.startswith(target):
                        net = stats.get("network", {})
                        total_kb = net.get("rx", 0) + net.get("tx", 0)
                        rps = int(total_kb * 5.2) # Scaling factor for demo
                        break
            
            traffic_label = f"{label}\n({rps} req/s)" if rps > 0 else label

            graph.add_edge(source, target, label=traffic_label, animated=is_risky, rps=rps)

        from shared.models.topology_model import TopologyNode, TopologyEdge
        nodes = []
        edges = []
        
        # Simple layout positioning
        pos = {
            "api-gateway": {"x": 350, "y": 0},
            "plc-controller": {"x": 350, "y": 150},
            "sensor-service": {"x": 150, "y": 150},
            "energy-service": {"x": -50, "y": 150},
            "motor-service": {"x": 150, "y": 300},
            "conveyor-service": {"x": 350, "y": 300},
            "robot-arm-service": {"x": 550, "y": 300},
            "alarm-service": {"x": 550, "y": 150},
            "notification-service": {"x": 750, "y": 150},
        }

        for node, data in graph.nodes(data=True):
            p = pos.get(node, {"x": 0, "y": 0})
            n = TopologyNode(
                id=node,
                label=data["label"],
                health=data["status"],
                cpu=data["cpu"],
                x=p["x"],
                y=p["y"]
            )
            nodes.append({
                "id": n.id,
                "data": { "label": n.label, "status": n.health, "cpu": n.cpu },
                "position": {"x": n.x, "y": n.y},
                "type": n.type,
            })

        for u, v, data in graph.edges(data=True):
            e = TopologyEdge(
                source=u,
                target=v,
                label=data.get("label", "")
            )
            edges.append({
                "id": f"e-{e.source}-{e.target}",
                "source": e.source,
                "target": e.target,
                "label": e.label,
                "animated": e.animated
            })

        logger.info(f"Built enriched topology with {len(nodes)} nodes.")
        return {"nodes": nodes, "edges": edges}
