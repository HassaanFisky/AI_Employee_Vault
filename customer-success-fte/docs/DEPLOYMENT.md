# Kubernetes Deployment Guide

## Prerequisites

- kubectl configured for your cluster
- Helm 3.x installed
- Docker registry access
- cert-manager installed (for TLS)
- nginx ingress controller installed

---

## 1. Build and Push Docker Images

```bash
# Set your registry
export REGISTRY=your-registry.io/fte

# API service
docker build -f docker/Dockerfile.api -t $REGISTRY/fte-api:latest .
docker push $REGISTRY/fte-api:latest

# Worker service
docker build -f docker/Dockerfile.worker -t $REGISTRY/fte-worker:latest .
docker push $REGISTRY/fte-worker:latest

# Web form
docker build -f docker/Dockerfile.webform -t $REGISTRY/fte-webform:latest .
docker push $REGISTRY/fte-webform:latest
```

Update the `image:` fields in each k8s yaml to match your registry.

---

## 2. Deploy Kafka with Strimzi Operator

```bash
# Install Strimzi operator
kubectl create namespace kafka
kubectl apply -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka

# Deploy 3-broker Kafka cluster
cat <<EOF | kubectl apply -f -
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: fte-kafka
  namespace: kafka
spec:
  kafka:
    replicas: 3
    listeners:
      - name: plain
        port: 9092
        type: internal
        tls: false
    storage:
      type: jbod
      volumes:
        - id: 0
          type: persistent-claim
          size: 100Gi
  zookeeper:
    replicas: 3
    storage:
      type: persistent-claim
      size: 10Gi
EOF
```

---

## 3. Deploy PostgreSQL with Helm

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install fte-postgres bitnami/postgresql \
  --namespace fte-system \
  --create-namespace \
  --set auth.username=fte_user \
  --set auth.password=YOUR_SECURE_PASSWORD \
  --set auth.database=customer_fte \
  --set primary.persistence.size=50Gi \
  --set image.repository=pgvector/pgvector \
  --set image.tag=pg16

# Apply schema
kubectl run schema-init --rm -i --restart=Never \
  --namespace fte-system \
  --image=postgres:16 \
  --env="PGPASSWORD=YOUR_SECURE_PASSWORD" \
  -- psql -h fte-postgres-postgresql -U fte_user customer_fte \
  < database/schema.sql
```

---

## 4. Configure Secrets

> ⚠️ **Never commit real secrets to source control.**
> Use [External Secrets Operator](https://external-secrets.io) or [Sealed Secrets](https://sealed-secrets.netlify.app).

```bash
# Example using kubectl (for small teams / initial setup)
kubectl create secret generic fte-secrets \
  --namespace fte-system \
  --from-literal=OPENAI_API_KEY=sk-... \
  --from-literal=DATABASE_URL=postgresql+asyncpg://fte_user:pass@fte-postgres:5432/customer_fte \
  --from-literal=DATABASE_URL_SYNC=postgresql://fte_user:pass@fte-postgres:5432/customer_fte \
  --from-literal=TWILIO_ACCOUNT_SID=ACxxx \
  --from-literal=TWILIO_AUTH_TOKEN=xxx \
  --from-literal=API_SECRET_KEY=$(openssl rand -hex 32)
```

---

## 5. Deploy Application Services

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/worker-deployment.yaml
kubectl apply -f k8s/webform-deployment.yaml
```

---

## 6. Verify Deployment

```bash
# Check pod status
kubectl get pods -n fte-system

# Check HPA
kubectl get hpa -n fte-system

# View API logs
kubectl logs -n fte-system deployment/fte-api -f

# View worker logs
kubectl logs -n fte-system deployment/fte-worker -f

# Test health endpoint
kubectl port-forward -n fte-system svc/fte-api-svc 8000:80 &
curl http://localhost:8000/health
```

---

## 7. Seed Knowledge Base

```bash
kubectl run kb-seed --rm -it --restart=Never \
  --namespace fte-system \
  --image=your-registry/fte-api:latest \
  --env-from=configmap/fte-config \
  --env-from=secret/fte-secrets \
  -- python database/seed_knowledge_base.py
```

---

## 8. Configure TLS / Ingress

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.5/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ops@yourcompany.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

Update `k8s/webform-deployment.yaml` ingress with your real domain names, then:
```bash
kubectl apply -f k8s/webform-deployment.yaml
```

---

## 9. Scaling

The system auto-scales via HPA:

| Component | Min | Max | Trigger |
|-----------|-----|-----|---------|
| API | 3 | 10 | CPU 70% |
| Worker | 5 | 20 | CPU 60% |

Manual scale:
```bash
kubectl scale deployment fte-worker --replicas=10 -n fte-system
```

---

## 10. Monitoring

Prometheus metrics are exposed at `/metrics` on each API pod.

```bash
# Port-forward Prometheus (if installed)
kubectl port-forward svc/prometheus-server 9090:80 -n monitoring &

# Key metrics to watch:
# http_requests_total{path="/support/message"}
# agent_messages_processed_total
# agent_escalations_total
# http_request_duration_seconds
```
