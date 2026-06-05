# Engineering SRE Runbook - Production Operations

## System Topology
- API Gateway: Azure API Management
- Core Services: Node.js microservices on AKS
- Data Plane: Azure PostgreSQL + Redis cache
- Search Plane: Azure AI Search index `doc-eye-index`
- Blob Storage: `usergdoceye` container

## Reliability SLOs
- API Availability SLO: 99.9%
- P95 Latency SLO: < 350ms
- Error budget policy: 43m 49s monthly downtime max

## Incident Handling Steps
1. Triage with severity matrix (SEV1-SEV3)
2. Verify telemetry in Azure Monitor + App Insights
3. Check AKS pod health and autoscaling state
4. Validate search index query latency and vector recall
5. Roll back if P95 > 2x SLO for 10 min

## Technical KPIs
- Current P95 latency: 284ms
- Current error rate: 0.28%
- Current cache hit ratio: 91.6%
- Current deployment frequency: 23 releases/month

## Dependency Constraints
- Mistral API timeout threshold: 8s
- Azure Search query timeout threshold: 4s
- Blob upload max payload: 25MB