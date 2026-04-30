#!/bin/bash
set -e

echo "=== Deploying Prometheus & Grafana Monitoring Stack ==="

# Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create monitoring namespace
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -

# Install kube-prometheus-stack
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values monitoring/values-prometheus-stack.yaml \
  --wait --timeout 10m

echo ""
echo "=== Monitoring Stack Deployed ==="
echo ""
echo "Grafana access:"
echo "  kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80"
echo "  URL: http://localhost:3000"
echo "  Username: admin"
echo "  Password: lucidity-admin"
echo ""
echo "Prometheus access:"
echo "  kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090"
echo "  URL: http://localhost:9090"
