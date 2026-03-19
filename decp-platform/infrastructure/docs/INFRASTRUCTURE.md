# DECP Platform - Infrastructure Overview

This document provides a comprehensive overview of the DECP Platform infrastructure architecture.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Web App   │  │  Mobile App │  │  Third-Party│  │   Admin UI  │             │
│  │ (Next.js)   │  │(React Native│  │  Integrations│  │  (Internal) │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼────────────────┼────────────────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │   CloudFront CDN (Assets)   │
                    │     + AWS WAF (Security)    │
                    └──────────────┬──────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────────┐
│                              EDGE LAYER                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                      Route53 DNS + ACM SSL Certificates                    │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────────┐
│                         LOAD BALANCING LAYER                                     │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                  Application Load Balancer (ALB)                           │  │
│  │         ┌────────────────┬────────────────┬────────────────┐              │  │
│  │         │  api.decp.io   │  app.decp.io   │   ws.decp.io   │              │  │
│  │         └────────────────┴────────────────┴────────────────┘              │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────────┐
│                           KUBERNETES CLUSTER                                     │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         EKS Control Plane                                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │  │
│  │  │  Namespace  │  │   Config    │  │   Secrets   │  │     RBAC    │      │  │
│  │  │decp-platform│  │   Maps      │  │  (Sealed)   │  │  Policies   │      │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘      │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         Services (Microservices)                           │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │  │
│  │  │ API      │ │ Auth     │ │ User     │ │ Product  │ │ Order    │        │  │
│  │  │ Gateway  │ │ Service  │ │ Service  │ │ Service  │ │ Service  │        │  │
│  │  │ (3 pods) │ │ (2 pods) │ │ (2 pods) │ │ (2 pods) │ │ (2 pods) │        │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                                   │  │
│  │  │ Payment  │ │ Notify   │ │ Frontend │                                   │  │
│  │  │ Service  │ │ Service  │ │ (2 pods) │                                   │  │
│  │  │ (2 pods) │ │ (2 pods) │ │          │                                   │  │
│  │  └──────────┘ └──────────┘ └──────────┘                                   │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                    Node Groups (Auto Scaling)                              │  │
│  │  ┌───────────────────────┐  ┌───────────────────────┐                      │  │
│  │  │    General Purpose    │  │        Spot           │                      │  │
│  │  │   (t3.large/t3a)      │  │   (t3.medium/t3a)     │                      │  │
│  │  │   Min: 2, Max: 10     │  │   Min: 1, Max: 5      │                      │  │
│  │  └───────────────────────┘  └───────────────────────┘                      │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────────────────┐
│                          DATA LAYER                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │   RDS PostgreSQL │  │ ElastiCache     │  │    RabbitMQ     │                 │
│  │   (Multi-AZ)     │  │    Redis        │  │   (Clustered)   │                 │
│  │                  │  │   (Cluster      │  │                 │                 │
│  │  Primary+Replica │  │    Mode)        │  │   Queues:       │                 │
│  │  Encrypted       │  │                 │  │  - emails       │                 │
│  │  Backups         │  │  - Caching      │  │  - notifications│                 │
│  │  PIT Recovery    │  │  - Sessions     │  │  - payments     │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                         S3 Storage                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                    │  │
│  │  │   Assets     │  │   Uploads    │  │    Logs      │                    │  │
│  │  │  (Public)    │  │  (Private)   │  │  (Private)   │                    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                    │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                       OBSERVABILITY LAYER                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Prometheus    │  │    Grafana      │  │      Loki       │                  │
│  │   (Metrics)     │  │  (Dashboards)   │  │     (Logs)      │                  │
│  │                 │  │                 │  │                 │                  │
│  │  - Service      │  │  - Custom       │  │  - App Logs     │                  │
│  │    Metrics      │  │    Dashboards   │  │  - System Logs  │                  │
│  │  - Node         │  │  - Alerts       │  │  - Audit Logs   │                  │
│  │    Exporter     │  │  - SLA Tracking │  │                 │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
│                                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   AlertManager  │  │   Jaeger        │  │  CloudWatch     │                  │
│  │   (Alerts)      │  │ (Distributed    │  │  (AWS Logs)     │                  │
│  │                 │  │    Tracing)     │  │                 │                  │
│  │  - Slack        │  │                 │  │  - Metrics      │                  │
│  │  - PagerDuty    │  │  - Trace        │  │  - Alarms       │                  │
│  │  - Email        │  │    Analysis     │  │  - Dashboards   │                  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Infrastructure Components

### 1. Networking (AWS VPC)

| Component | Description | CIDR |
|-----------|-------------|------|
| VPC | Main network | 10.0.0.0/16 |
| Public Subnets | ALB, NAT Gateways | 10.0.100.0/24, 10.0.101.0/24, 10.0.102.0/24 |
| Private Subnets | EKS Nodes | 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24 |
| Database Subnets | RDS, ElastiCache | 10.0.200.0/24, 10.0.201.0/24, 10.0.202.0/24 |

### 2. Compute (EKS)

| Node Group | Instance Type | Min | Desired | Max |
|------------|---------------|-----|---------|-----|
| General | t3.large | 2 | 3 | 10 |
| Spot | t3.medium | 1 | 2 | 5 |

### 3. Database (RDS PostgreSQL)

| Setting | Value |
|---------|-------|
| Engine | PostgreSQL 16 |
| Instance | db.t3.medium (Production: db.r5.large) |
| Storage | 100GB GP3 (Auto-scaling to 500GB) |
| Multi-AZ | Enabled |
| Encryption | AWS KMS |
| Backup | 30 days |

### 4. Cache (ElastiCache Redis)

| Setting | Value |
|---------|-------|
| Engine | Redis 7.0 |
| Node Type | cache.t3.medium |
| Nodes | 2 (Cluster Mode) |
| Encryption | In-transit + At-rest |

### 5. Message Queue (RabbitMQ)

| Setting | Value |
|---------|-------|
| Version | 3.13 |
| Nodes | 3 (HA Cluster) |
| Queues | Durable, Mirrored |

## Security

### Network Security

- **VPC Flow Logs**: Enabled for all traffic
- **Security Groups**: Least privilege access
- **NACLs**: Additional subnet-level protection
- **WAF**: AWS WAF with managed rules
- **Shield**: DDoS protection

### Data Security

- **Encryption at Rest**: KMS for all storage
- **Encryption in Transit**: TLS 1.2+
- **Secrets Management**: AWS Secrets Manager
- **Database**: Encrypted with customer-managed keys

### Access Control

- **IAM**: Role-based access control (RBAC)
- **IRSA**: IAM Roles for Service Accounts
- **Pod Security**: Non-root containers, read-only filesystems
- **Network Policies**: Micro-segmentation

## High Availability

### Multi-AZ Deployment

- **EKS**: Control plane across 3 AZs
- **RDS**: Multi-AZ with automatic failover
- **ElastiCache**: Multi-AZ with replica
- **ALB**: Cross-zone load balancing

### Auto Scaling

- **HPA**: Horizontal Pod Autoscaler (CPU/Memory)
- **Cluster Autoscaler**: Node scaling
- **VPA**: Vertical Pod Autoscaler (recommendations)

### Backup Strategy

| Resource | Backup Method | Frequency | Retention |
|----------|--------------|-----------|-----------|
| RDS | Automated + Manual | Daily | 30 days |
| S3 | Cross-region replication | Continuous | 90 days |
| EBS Snapshots | Automated | Daily | 7 days |

## Monitoring & Alerting

### Metrics

- **Application**: Custom business metrics
- **Infrastructure**: CPU, Memory, Disk, Network
- **Database**: Connections, Latency, Replication lag
- **Cache**: Hit ratio, Memory usage

### Alerts

| Alert | Threshold | Severity |
|-------|-----------|----------|
| High CPU | > 80% for 5m | Warning |
| High Memory | > 85% for 5m | Warning |
| Disk Full | > 90% | Critical |
| Service Down | 0 pods ready | Critical |
| Error Rate | > 1% | Critical |
| Latency | p95 > 500ms | Warning |

## Cost Optimization

### Reserved Capacity

- **RDS**: 1-year reserved instances
- **ElastiCache**: Reserved nodes
- **EKS**: Spot instances for non-critical workloads

### Storage Optimization

- **S3**: Lifecycle policies (IA after 30 days, Glacier after 90)
- **EBS**: GP3 volumes with optimized IOPS
- **Logs**: Retention policies (7 days hot, 30 days cold)

## Disaster Recovery

### RTO/RPO

| Component | RTO | RPO |
|-----------|-----|-----|
| Application | 15 minutes | N/A (stateless) |
| Database | 30 minutes | < 5 minutes |
| Cache | 10 minutes | N/A (rebuildable) |

### DR Plan

1. **Backup Restoration**: Automated daily backups
2. **Cross-Region Replication**: S3 data
3. **Multi-Region Deployment**: Optional for critical services
4. **Runbook**: Documented procedures

## Resource Quotas

### Kubernetes Namespace Quotas

| Resource | Request | Limit |
|----------|---------|-------|
| CPU | 20 cores | 40 cores |
| Memory | 40 GB | 80 GB |
| Pods | - | 50 |
| Services | - | 20 |
| PVCs | - | 20 |

## Contact

- **Infrastructure Team**: infrastructure@decp.io
- **On-Call**: +1-xxx-xxx-xxxx
- **Emergency**: emergency@decp.io

---

*Last Updated: 2024-01-15*
*Version: 1.0.0*
