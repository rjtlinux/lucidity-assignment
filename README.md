# Lucidity DevOps Assignment

Production-grade Kubernetes deployment of a Hello World Python microservice on AWS EKS, with Infrastructure as Code (Terraform), Helm packaging, Prometheus/Grafana monitoring, and CI/CD via GitHub Actions.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AWS Cloud (ap-south-1)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    VPC (10.0.0.0/16)                       │ │
│  │  ┌─────────────────┐       ┌─────────────────────────┐   │   │
│  │  │  Public Subnets  │       │    Private Subnets       │   │ │
│  │  │  (NAT Gateway)   │       │  ┌───────────────────┐  │   │  │
│  │  │                   │       │  │   EKS Cluster      │  │   │  │
│  │  │                   │       │  │  ┌─────────────┐  │  │   │  │
│  │  │                   │       │  │  │ Hello World  │  │  │   │  │
│  │  │                   │       │  │  │ (Python/Flask)│  │  │   │  │
│  │  │                   │       │  │  ├─────────────┤  │  │   │  │
│  │  │                   │       │  │  │ Prometheus   │  │  │   │  │
│  │  │                   │       │  │  │ Grafana      │  │  │   │  │
│  │  │                   │       │  │  └─────────────┘  │  │   │  │
│  │  │                   │       │  └───────────────────┘  │   │  │
│  │  └─────────────────┘       └─────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Prerequisites

| Tool | Version | Installation |
|------|---------|-------------|
| AWS CLI | v2.x | `brew install awscli` |
| Terraform | >= 1.5.0 | `brew install terraform` |
| kubectl | >= 1.28 | `brew install kubectl` |
| Helm | >= 3.x | `brew install helm` |
| Docker | Latest | [Docker Desktop](https://www.docker.com/products/docker-desktop) |

**AWS Configuration:**

```bash
aws configure --profile personal
# AWS Access Key ID: <your-key>
# AWS Secret Access Key: <your-secret>
# Default region: ap-south-1
# Default output format: json
```

Verify access:

```bash
aws sts get-caller-identity --profile personal
```

## Project Structure

```
.
├── app/                          # Python Hello World microservice
│   ├── app.py                    # Flask application with /metrics endpoint
│   ├── requirements.txt          # Python dependencies
│   └── Dockerfile                # Container image definition
├── terraform/                    # Infrastructure as Code
│   ├── providers.tf              # AWS provider configuration
│   ├── variables.tf              # Input variables
│   ├── vpc.tf                    # VPC with public/private subnets
│   ├── eks.tf                    # EKS cluster and node groups
│   └── outputs.tf                # Output values
├── helm/hello-world/             # Helm chart
│   ├── Chart.yaml                # Chart metadata
│   ├── values.yaml               # Default values
│   └── templates/                # Kubernetes manifests
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── hpa.yaml
│       └── servicemonitor.yaml
├── monitoring/                   # Monitoring configuration
│   └── values-prometheus-stack.yaml
├── scripts/                      # Helper scripts
│   └── deploy-monitoring.sh
├── .github/workflows/            # CI/CD
│   └── deploy.yml                # GitHub Actions pipeline
└── README.md
```

## Step-by-Step Deployment

### 1. Provision EKS Cluster with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply (creates VPC + EKS cluster, takes ~15 minutes)
terraform apply
```

After the cluster is created, configure kubectl:

```bash
aws eks update-kubeconfig --region ap-south-1 --name lucidity-eks --profile personal
```

Verify:

```bash
kubectl get nodes
```

### 2. Build and Push Docker Image

Create an ECR repository and push the image:

```bash
# Set your AWS account ID
export ACCOUNT_ID=$(aws sts get-caller-identity --profile personal --query Account --output text)

# Create ECR repo
aws ecr create-repository --repository-name hello-world-app --region ap-south-1 --profile personal

# Get login token
aws ecr get-login-password --region ap-south-1 --profile personal | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com

# Build and push (use --platform linux/amd64 if building on Apple Silicon/ARM)
cd app
docker buildx build --platform linux/amd64 -t $ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/hello-world-app:latest --push .
```

> **Important (Apple Silicon / ARM Macs):** EKS worker nodes run on x86_64 (amd64). You **must** use `docker buildx build --platform linux/amd64` instead of plain `docker build`, otherwise the pods will fail with `ImagePullBackOff` due to platform mismatch.

### 3. Deploy Monitoring Stack (Prometheus + Grafana)

> **Note:** Monitoring must be deployed **before** the application, because the Helm chart includes a `ServiceMonitor` CRD that requires the Prometheus Operator CRDs to exist.

```bash
chmod +x scripts/deploy-monitoring.sh
./scripts/deploy-monitoring.sh
```

Verify monitoring pods:

```bash
kubectl --namespace monitoring get pods -l "release=monitoring"
```

### 4. Deploy Application with Helm

```bash
helm upgrade --install hello-world ./helm/hello-world \
  --set image.repository=$ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/hello-world-app \
  --set image.tag=latest \
  --wait
```

Verify the deployment:

```bash
kubectl get pods
kubectl get svc hello-world
```

Access the service:

```bash
# Get the LoadBalancer URL
export LB_URL=$(kubectl get svc hello-world -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "Service URL: http://$LB_URL"

# Test (may take 1-2 minutes for DNS propagation)
curl http://$LB_URL/
# Response: {"message": "Hello World"}

curl http://$LB_URL/health
# Response: {"status": "healthy"}

curl http://$LB_URL/metrics
# Response: Prometheus metrics output
```

### 5. Access Monitoring Dashboards

**Grafana:**

```bash
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
```

- URL: http://localhost:3000
- Username: `admin`
- Password: `lucidity-admin`

A custom **"Hello World Service"** dashboard is pre-configured showing:
- HTTP request rate (by method, endpoint, status)
- Request latency (p95)
- Total requests count
- Cluster CPU usage

**Prometheus:**

```bash
kubectl port-forward -n monitoring svc/monitoring-kube-prometheus-prometheus 9090:9090
```

- URL: http://localhost:9090

### 6. CI/CD Pipeline (GitHub Actions)

The pipeline (`.github/workflows/deploy.yml`) automatically on every push to `main`:
1. Builds the Docker image for `linux/amd64`
2. Pushes to Amazon ECR
3. Deploys to EKS using Helm
4. Verifies the rollout succeeded

**Setup required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |

To set them: **GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

## Application Endpoints

| Endpoint    | Description                          |
|-------------|--------------------------------------|
| `GET /`     | Returns `{"message": "Hello World"}` |
| `GET /health` | Health check endpoint              |
| `GET /metrics` | Prometheus metrics endpoint       |

## Cleanup

To tear down all resources and avoid ongoing charges:

```bash
# 1. Remove application
helm uninstall hello-world

# 2. Remove monitoring stack
helm uninstall monitoring -n monitoring
kubectl delete namespace monitoring

# 3. Delete ECR repository
aws ecr delete-repository --repository-name hello-world-app --region ap-south-1 --profile personal --force

# 4. Destroy infrastructure (VPC, EKS, NAT Gateway, etc.)
cd terraform
terraform destroy
```

> **Important:** Run `terraform destroy` when done. The EKS cluster and NAT Gateway incur hourly charges.

## Implementation Notes

### What's Implemented (All 5 Objectives)

| # | Requirement | Status | Details |
|---|-------------|--------|---------|
| 1 | EKS cluster via Terraform | Done | VPC with public/private subnets, managed node group (2x t3.medium), EKS v1.30 |
| 2 | Hello World microservice | Done | Python/Flask app returning `{"message": "Hello World"}` on `GET /` |
| 3 | Helm chart | Done | Deployment, Service (LoadBalancer), HPA, ServiceMonitor, health probes |
| 4 | Prometheus + Grafana | Done | kube-prometheus-stack with custom application dashboard, node exporter, kube-state-metrics |
| 5 | CI/CD pipeline (optional) | Done | GitHub Actions: build → ECR push → Helm deploy → rollout verification |

### Design Decisions

- **EKS Managed Node Groups** used over self-managed or Fargate for balance of control and simplicity
- **kube-prometheus-stack** Helm chart chosen as it bundles Prometheus, Grafana, Alertmanager, node-exporter, and kube-state-metrics
- **ServiceMonitor CRD** used for automatic Prometheus target discovery of the Hello World app's `/metrics` endpoint
- **Gunicorn** used as WSGI server (2 workers) instead of Flask dev server for production readiness
- **HPA** configured to auto-scale pods between 2-5 replicas based on CPU utilization

## Known Limitations

- **Single NAT Gateway:** Used for cost optimization; a production setup would use one NAT Gateway per AZ for high availability
- **Grafana credentials:** Admin password is set in plain text in the Helm values file; production should use Kubernetes Secrets or an external secret manager (e.g., AWS Secrets Manager)
- **ECR repository:** Not managed by Terraform; created manually or via CI/CD pipeline. Could be added as a Terraform resource
- **No TLS/HTTPS:** The LoadBalancer exposes HTTP only; production should use an ACM certificate with an ALB Ingress Controller
- **No Ingress Controller:** Using a plain `LoadBalancer` service type; production would use AWS ALB Ingress Controller or Nginx Ingress
- **Docker image platform:** Must be built for `linux/amd64` when building from Apple Silicon (M1/M2/M3) Macs using `docker buildx`
- **EKS version:** Using 1.30; version should be kept current as AWS deprecates older versions

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| `ImagePullBackOff` on pods | Image built for ARM (Apple Silicon) | Rebuild with `docker buildx build --platform linux/amd64` |
| `ServiceMonitor` CRD not found | Monitoring stack not installed yet | Deploy monitoring **before** the app: `./scripts/deploy-monitoring.sh` |
| `terraform apply` fails on node group AMI | Unsupported EKS version | Update `cluster_version` in `terraform/variables.tf` to a supported version |
| EKS version upgrade fails | Can only upgrade one minor version at a time | Upgrade sequentially (e.g., 1.29 → 1.30 → 1.31) |
| LoadBalancer URL not resolving | DNS propagation delay | Wait 1-2 minutes after service creation |
| `context deadline exceeded` on Helm install | Pods failing to start | Check `kubectl describe pods` and `kubectl logs` for root cause |

## Cost Considerations

The infrastructure uses:
- 2x t3.medium EC2 instances (EKS worker nodes)
- 1x NAT Gateway
- 1x Classic Load Balancer (for the service)
- EKS control plane

Estimated cost: **~$5-7/day**. **Remember to run `terraform destroy` when done.**
