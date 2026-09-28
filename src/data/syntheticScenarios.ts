import { SyntheticScenario } from '../types';

export const SYNTHETIC_SCENARIOS: SyntheticScenario[] = [
  {
    id: 'scenario-checkout-504',
    badgeLabel: 'Scenario 1 (Hindsight Match E1)',
    title: 'Checkout Service 504 Gateway Timeouts & Connection Pool Saturation',
    service: 'checkout-service',
    severity: 'SEV1',
    description: 'Direct precedent match: Demonstrates warning against blind pod restarts and prioritizes rollback.',
    symptoms: `HTTP 504 Gateway Timeout on POST /v1/checkout/confirm
HikariPool-1 - Connection is not available, request timed out after 30005ms
Active connections: 100/100 (Max limit reached)
P99 latency: 14,200ms (Baseline: 80ms)
Error rate: 38.4% of all checkout transactions failing`,
    recentChanges: `Deploy checkout-service:v2.15 to production 20 minutes ago.
PR #8492: "Optimized cart checkout validation pipeline and payment tokenization"
Helm release 2.15.0 upgraded by CI/CD runner.`
  },
  {
    id: 'scenario-auth-redis',
    badgeLabel: 'Scenario 2 (Hindsight Match E2)',
    title: 'Auth Gateway Token Latency & Redis Client Socket Leak',
    service: 'auth-gateway',
    severity: 'SEV1',
    description: 'Demonstrates avoidance of FLUSHDB and cluster scaling mistakes from earlier incident.',
    symptoms: `HTTP 500 on /oauth/token and /v1/auth/verify
Redis command timeout: OOM / Too many open files
Connected clients on primary: 9,998 / 10,000 max clients
Auth endpoint latency: 2,450ms
Users being logged out prematurely across mobile and web clients`,
    recentChanges: `Deployed microservice auth-gateway:v3.8.1 with updated Go redis client library.
Adjusted redis connection pool settings in values-prod.yaml.`
  },
  {
    id: 'scenario-payments-429',
    badgeLabel: 'Scenario 3 (Hindsight Match E3)',
    title: 'Payment Gateway Rate Limit Storm & Queue Dead-Letter Overflow',
    service: 'payment-processor',
    severity: 'SEV2',
    description: 'Demonstrates DLQ quarantine instead of purge and client-side egress rate throttling.',
    symptoms: `Stripe API response: 429 Too Many Requests (Rate limit exceeded)
RabbitMQ payments.processing.dlq message count: 4,820 (growing +300/min)
Pending payments backlog: $420,000 unconfirmed orders
Workers reporting exponential retry failures without jitter`,
    recentChanges: `Refactored payment retry queue consumer in payment-processor:v1.9.0.
Increased default concurrency configuration from 20 to 50 workers.`
  },
  {
    id: 'scenario-inventory-lag',
    badgeLabel: 'Scenario 4 (Hindsight Match E4)',
    title: 'PostgreSQL Read Replica Lag Spike & Stale Inventory Stock',
    service: 'inventory-api',
    severity: 'SEV2',
    description: 'Demonstrates pg_stat_activity query termination instead of catastrophic 3-hour replica rebuild.',
    symptoms: `Replication lag alert: replica-01 lag is 490 seconds (Threshold: 30s)
Read traffic serving stale inventory stock quantities
Customer reports of oversold clearance items
Replica disk IOPS pinned at 100%, disk queue depth: 64`,
    recentChanges: `Quarterly BI analytics batch sync triggered 15 minutes ago via read-only replica credentials.
No code deployments in past 48 hours.`
  },
  {
    id: 'scenario-cold-start',
    badgeLabel: 'Scenario 5 (Cold Start - No Memory)',
    title: 'Billing Notification Service Memory Spike & OOM Crash Loops',
    service: 'billing-notifier',
    severity: 'SEV2',
    description: 'Demonstrates Cold Start handling without prior memory, prompting engineer to record resolution.',
    symptoms: `Kubernetes pod crashloop: OOMKilled (Exit Code 137)
Memory usage ramps linearly from 120MB to 1024MB limit over 8 minutes
Email dispatch latency growing; 12,000 PDF invoices delayed in spool
CPU utilization low (< 10%)`,
    recentChanges: `Enabled new high-resolution PDF rendering module for German tax compliance (v1.2.0).
Updated headless chrome puppeteer dependency.`
  }
];
