import { IncidentMemory } from '../types';

export const INITIAL_MEMORIES: IncidentMemory[] = [
  {
    id: 'INC-2024-0412',
    evidenceCode: 'E1',
    service: 'checkout-service',
    title: 'Checkout 504 Gateway Timeouts following v2.14 release',
    incidentDate: '2024-04-12',
    symptoms: [
      'HTTP 504 Gateway Timeout on /v1/checkout/confirm',
      'Database connection pool at 100% saturation (100/100 active connections)',
      'Service p99 latency spiked from 85ms to 12,400ms',
      'Memory utilization constant at 38%'
    ],
    rootCause: 'Connection leak introduced in v2.14 checkout service: payment validation loop omitted db_conn.release() in error catch block.',
    failedActions: [
      'Blindly restarted checkout-service pods (Triggered thundering herd, crashed DB primary with 1,200 sudden handshake attempts; delayed recovery by 45 mins)',
      'Doubled HikariCP max_pool_size from 100 to 200 (Caused PostgreSQL host CPU thrashing to 99%)',
      'Cleared Redis session cache (Forced 10,000 active shoppers to re-authenticate, cascading load to auth service)'
    ],
    successfulFix: 'Rolled back checkout-service image from v2.14 to v2.13.4 via Helm. Connection pool saturation normalized to 24% within 45 seconds.',
    lessonsLearned: [
      'DO NOT restart pods when DB connection pool is saturated without pre-warming or rate-limiting.',
      'Always inspect HikariCP active vs idle metrics before touching pool sizes.',
      'Check recently merged PRs for missing connection.release() in promise catch blocks.'
    ],
    responder: 'Elena Rostova (Staff SRE)',
    timeToResolveMinutes: 62,
    severity: 'SEV1',
    tags: ['checkout', '504-timeout', 'db-connection-pool', 'hikaricp', 'postgres', 'v2.14', 'rollback']
  },
  {
    id: 'INC-2024-0608',
    evidenceCode: 'E2',
    service: 'auth-gateway',
    title: 'Auth token verification timeouts & Redis connection exhaustion',
    incidentDate: '2024-06-08',
    symptoms: [
      'Login requests failing with 500 Internal Server Error',
      'Redis cluster memory at 45% but client connection count hit hard limit 10,000',
      'JWT verification latency exceeded 2,000ms threshold'
    ],
    rootCause: 'A microservice deployment changed Redis client keep-alive timeout from 30s to 0 (disabled), leaving zombie TCP sockets open.',
    failedActions: [
      'Flushed Redis cache keys with FLUSHDB (Wiped active user sessions, generated million-request spike to PostgreSQL)',
      'Scaled Redis cluster nodes from 3 to 6 (Took 20 minutes to rebalance hashes, did not solve open zombie sockets)'
    ],
    successfulFix: 'Ran netstat/lsof inspection to identify leaking TCP connections, set timeout 60 in redis.conf and deployed TCP keepalive fix.',
    lessonsLearned: [
      'Verify connection states via `redis-cli client list` before modifying cluster nodes or flushing data.',
      'Never execute FLUSHDB on production Redis cluster during incident response.'
    ],
    responder: 'Marcus Vance (Principal Infra Engineer)',
    timeToResolveMinutes: 48,
    severity: 'SEV1',
    tags: ['auth', 'redis', 'tcp-leak', 'connection-exhaustion', 'jwt']
  },
  {
    id: 'INC-2024-0819',
    evidenceCode: 'E3',
    service: 'payment-processor',
    title: 'Stripe webhook 429 rate limit storm & message queue dead-lettering',
    incidentDate: '2024-08-19',
    symptoms: [
      'Payment confirmations dropping, RabbitMQ DLQ depth growing +500/min',
      'Third-party Stripe API returning 429 Too Many Requests',
      'Worker CPU at 15% (idle waiting on rate limit retries)'
    ],
    rootCause: 'Exponential backoff was disabled in worker retry policy during recent refactor; retries fired every 50ms instead of backoff with jitter.',
    failedActions: [
      'Increased worker concurrency from 20 to 100 (Exacerbated 429 rate limiting drastically)',
      'Purged Dead Letter Queue (Permanently lost 340 customer payment confirmations)'
    ],
    successfulFix: 'Applied dynamic egress rate limiter in Kong API gateway to throttle outbound Stripe calls to 80 req/s, enabled jitter backoff.',
    lessonsLearned: [
      'Never purge Dead Letter Queues during an active rate limit event—quarantine them instead.',
      'Check gateway egress metrics before scaling up queue consumers.'
    ],
    responder: 'David Chen (Payments Reliability Lead)',
    timeToResolveMinutes: 35,
    severity: 'SEV2',
    tags: ['payments', 'rate-limit', '429', 'rabbitmq', 'dlq', 'stripe']
  },
  {
    id: 'INC-2024-1103',
    evidenceCode: 'E4',
    service: 'inventory-api',
    title: 'Postgres read replica replication lag spike causing stale stock data',
    incidentDate: '2024-11-03',
    symptoms: [
      'Customers purchasing out-of-stock items',
      'Read replica lag grew from 12ms to 420 seconds',
      'Disk IOPS on replica pegged at 100%'
    ],
    rootCause: 'An ad-hoc analytical query executed on read replica without statement_timeout held access exclusive lock on stock_levels table.',
    failedActions: [
      'Rebuilt replica from base backup (Took 3 hours, prolonged outage)',
      'Switched read traffic directly to primary DB (Overloaded primary DB CPU to 94%)'
    ],
    successfulFix: 'Ran `SELECT pg_terminate_backend(pid)` on long-running analytical query PID 41928. Replication caught up within 90 seconds.',
    lessonsLearned: [
      'Enforce statement_timeout = 30000ms on all replica user roles.',
      'Always query `pg_stat_activity` for blocking queries before considering replica rebuilds.'
    ],
    responder: 'Elena Rostova (Staff SRE)',
    timeToResolveMinutes: 24,
    severity: 'SEV2',
    tags: ['inventory', 'database', 'postgres', 'replica-lag', 'lock', 'pg_stat_activity']
  }
];
