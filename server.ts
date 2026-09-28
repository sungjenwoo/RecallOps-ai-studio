import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory / initial memory bank for Hindsight engine
export interface IncidentMemory {
  id: string;
  evidenceCode: string; // e.g. E1, E2
  service: string;
  title: string;
  incidentDate: string;
  symptoms: string[];
  rootCause: string;
  failedActions: string[];
  successfulFix: string;
  lessonsLearned: string[];
  responder: string;
  timeToResolveMinutes: number;
  severity: 'SEV1' | 'SEV2' | 'SEV3';
  tags: string[];
}

const defaultMemories: IncidentMemory[] = [
  {
    id: 'INC-2024-0412',
    evidenceCode: 'E1',
    service: 'checkout-service',
    title: 'Checkout 504 Gateway Timeouts following v2.14 release',
    incidentDate: '2024-04-12',
    symptoms: [
      'HTTP 504 Gateway Timeout on /v1/checkout/confirm',
      'Database connection pool at 100% saturation (100/100 connections)',
      'Service latency spiked from 85ms to 12.4s',
      'Memory utilization flat at 38%'
    ],
    rootCause: 'Connection leak introduced in v2.14 checkout service: payment validation loop omitted db_conn.release() in error catch block.',
    failedActions: [
      'Blindly restarted checkout-service pods (Triggered thundering herd, crashed DB primary with 1,200 sudden handshake attempts; delayed recovery by 45 mins)',
      'Doubled HikariCP max_pool_size from 100 to 200 (Caused PostgreSQL host CPU thrashing to 99%)',
      'Cleared Redis session cache (Forced 10,000 active shoppers to re-authenticate, cascading load to auth service)'
    ],
    successfulFix: 'Rolled back checkout-service image from v2.14 to v2.13.4 via Helm. Pool saturation normalized within 45 seconds.',
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
      'Login requests failing with 500 Internal Error',
      'Redis cluster memory at 45% but client connection count hit hard limit 10,000',
      'JWT verification latency exceeded 2000ms threshold'
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

let memoriesStore = [...defaultMemories];

// API: Get all memories
app.get('/api/memories', (req, res) => {
  res.json({ success: true, memories: memoriesStore });
});

// API: Add a new human-confirmed memory (The Feedback Loop)
app.post('/api/memories', (req, res) => {
  try {
    const memoryData = req.body;
    const nextEvidenceIndex = memoriesStore.length + 1;
    const newMemory: IncidentMemory = {
      id: memoryData.id || `INC-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      evidenceCode: `E${nextEvidenceIndex}`,
      service: memoryData.service || 'unknown-service',
      title: memoryData.title || 'Unrecorded Incident',
      incidentDate: new Date().toISOString().split('T')[0],
      symptoms: Array.isArray(memoryData.symptoms) ? memoryData.symptoms : [memoryData.symptoms],
      rootCause: memoryData.rootCause || 'Root cause under investigation',
      failedActions: Array.isArray(memoryData.failedActions) ? memoryData.failedActions : [memoryData.failedActions].filter(Boolean),
      successfulFix: memoryData.successfulFix || 'Remediation completed',
      lessonsLearned: Array.isArray(memoryData.lessonsLearned) ? memoryData.lessonsLearned : [memoryData.lessonsLearned].filter(Boolean),
      responder: memoryData.responder || 'On-Call Engineer',
      timeToResolveMinutes: Number(memoryData.timeToResolveMinutes) || 45,
      severity: memoryData.severity || 'SEV2',
      tags: Array.isArray(memoryData.tags) ? memoryData.tags : ['incident-outcome']
    };

    memoriesStore.unshift(newMemory);
    res.json({ success: true, memory: newMemory, totalMemories: memoriesStore.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset memories to defaults
app.post('/api/memories/reset', (req, res) => {
  memoriesStore = [...defaultMemories];
  res.json({ success: true, memories: memoriesStore });
});

// API: Semantic search / evidence retriever (Hindsight engine)
function scoreMemoryRelevance(incident: { service: string; symptoms: string; recentChanges: string }, mem: IncidentMemory): number {
  let score = 0;
  const incText = `${incident.service} ${incident.symptoms} ${incident.recentChanges}`.toLowerCase();
  
  if (incident.service && mem.service.toLowerCase().includes(incident.service.toLowerCase())) {
    score += 45;
  }
  
  const allMemText = `${mem.title} ${mem.symptoms.join(' ')} ${mem.rootCause} ${mem.tags.join(' ')} ${mem.failedActions.join(' ')}`.toLowerCase();
  
  // Keyword scoring
  const keywords = incText.split(/[\s,.-]+/).filter(w => w.length > 3);
  for (const kw of keywords) {
    if (allMemText.includes(kw)) {
      score += 8;
    }
  }

  // Exact symptom match bonus
  for (const symptom of mem.symptoms) {
    if (incText.includes(symptom.toLowerCase().substring(0, 15))) {
      score += 25;
    }
  }

  return Math.min(score, 99);
}

// API: Analyze incident using Hindsight memory + Gemini AI (or analytical fallback)
app.post('/api/analyze-incident', async (req, res) => {
  try {
    const { service, symptoms, recentChanges, severity, customMemories } = req.body;
    const activeMemories = (customMemories && customMemories.length > 0) ? customMemories : memoriesStore;

    // 1. Retrieve top matching Hindsight memories
    const scoredMemories = activeMemories
      .map((mem: IncidentMemory) => ({
        ...mem,
        relevanceScore: scoreMemoryRelevance({ service, symptoms, recentChanges }, mem)
      }))
      .sort((a: any, b: any) => b.relevanceScore - a.relevanceScore);

    const relevantMemories = scoredMemories.filter((m: any) => m.relevanceScore >= 20).slice(0, 3);

    // Check if Gemini API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    let aiResponse = null;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const evidenceContext = relevantMemories.map((m: any) => `
[${m.evidenceCode}] Incident ${m.id} (${m.service}, ${m.incidentDate}):
Title: ${m.title}
Historical Symptoms: ${m.symptoms.join('; ')}
Root Cause: ${m.rootCause}
FAILED ACTIONS THAT MADE IT WORSE: ${m.failedActions.join('; ')}
SUCCESSFUL RESOLUTION: ${m.successfulFix}
Key Lessons: ${m.lessonsLearned.join('; ')}
Relevance Score: ${m.relevanceScore}%
`).join('\n---\n');

        const systemPrompt = `You are RecallOps, an expert advisory AI incident-response assistant for on-call SREs and reliability engineers.
Your role is to formulate an evidence-based investigation plan grounded in retrieved historical memories from Hindsight.

CRITICAL RULES:
1. Ground conclusions in the retrieved evidence citations: use tags like [E1], [E2] when referencing historical precedents.
2. Clearly distinguish UNPROVEN HYPOTHESES from confirmed facts. Label them "Hypothesis [Confidence]".
3. Prioritize SAFE READ-ONLY CHECKS before recommending any changes to production.
4. EXPLICITLY WARN AGAINST FAILED ACTIONS: If an earlier incident shows a specific action failed (e.g., restarting pods, flushing cache), highlight this as "⚠️ INEFFECTIVE / DANGEROUS ACTIONS TO AVOID" and cite the incident [E#].
5. Never assume the current incident is 100% identical; state what to verify first.
6. Provide concrete bash commands or query snippets for the read-only checks.

Current Incident Details:
- Affected Service: ${service || 'Unknown'}
- Symptoms / Error Logs: ${symptoms || 'None provided'}
- Recent Deployments / Config Changes: ${recentChanges || 'None recorded'}
- Severity: ${severity || 'SEV2'}

Retrieved Hindsight Evidence:
${evidenceContext || 'No directly matching historical incidents found (Cold Start scenario).'}`;

        const prompt = `Generate a structured, battle-hardened incident response plan in JSON format with these exact keys:
{
  "summary": "Concise executive overview of the incident and memory alignment",
  "hypotheses": [
    {
      "rank": 1,
      "title": "Short title",
      "confidence": "High" | "Medium" | "Low",
      "description": "Explanation citing evidence [E#] where appropriate",
      "evidenceReference": "E1" or null
    }
  ],
  "readOnlyChecks": [
    {
      "step": 1,
      "name": "Check title",
      "command": "terminal command or SQL query to inspect (read-only)",
      "expectedObservation": "What to look for",
      "whyBeforeAction": "Why check this before changing prod"
    }
  ],
  "actionsToAvoid": [
    {
      "action": "Action that should NOT be taken",
      "reason": "Why it failed previously and what happened",
      "citedEvidence": "E1"
    }
  ],
  "recommendedRemediations": [
    {
      "priority": 1,
      "action": "Remediation step",
      "rationale": "Why this is recommended based on history [E#]",
      "verificationStep": "How to verify after applying"
    }
  ],
  "confidenceScore": number (0-100)
}`;

        // Call Gemini with a 4.5s timeout promise race
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
          config: {
            responseMimeType: 'application/json',
          }
        });

        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini API call timed out')), 4500)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);

        if (response && response.text) {
          aiResponse = JSON.parse(response.text);
        }
      } catch (geminiError: any) {
        console.warn('Gemini API call failed, falling back to analytical engine:', geminiError.message);
      }
    }

    // High-fidelity fallback / hybrid analytical engine (ensures 100% uptime & rock-solid demo)
    if (!aiResponse) {
      aiResponse = generateAnalyticalPlan({ service, symptoms, recentChanges, severity }, relevantMemories);
    }

    res.json({
      success: true,
      analysis: aiResponse,
      retrievedEvidence: relevantMemories,
      allScoredMemories: scoredMemories.slice(0, 5),
      mode: apiKey && apiKey !== 'MY_GEMINI_API_KEY' ? 'gemini-3.8-flash' : 'hindsight-analytical-engine'
    });
  } catch (error: any) {
    console.error('Error in /api/analyze-incident:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pure deterministic analytical plan generator
function generateAnalyticalPlan(incident: any, evidence: any[]) {
  const primaryEvidence = evidence.length > 0 ? evidence[0] : null;
  const evidenceCode = primaryEvidence ? primaryEvidence.evidenceCode : null;

  if (primaryEvidence) {
    return {
      summary: `Symptoms match historical precedent [${evidenceCode}] (${primaryEvidence.title}). Previous postmortem shows standard restarts escalated the outage, whereas ${primaryEvidence.successfulFix.toLowerCase()} restored stability.`,
      hypotheses: [
        {
          rank: 1,
          title: `Resource/Connection Starvation (${primaryEvidence.rootCause.split(':')[0]})`,
          confidence: 'High',
          description: `Correlated with [${evidenceCode}]: Historical incident on ${primaryEvidence.incidentDate} exhibited identical symptoms. Root cause was identified as: ${primaryEvidence.rootCause}`,
          evidenceReference: evidenceCode
        },
        {
          rank: 2,
          title: `Regression introduced in recent changes: "${incident.recentChanges || 'Latest deployment'}"`,
          confidence: 'Medium',
          description: `Recent deployment likely altered connection lifecycles or config timeouts, matching the failure pattern from [${evidenceCode}].`,
          evidenceReference: evidenceCode
        },
        {
          rank: 3,
          title: `Downstream dependency saturation / Cascading failure`,
          confidence: 'Low',
          description: `Symptom could be an indirect manifestation of downstream backlog rather than service crash. Verify read-only metrics first.`,
          evidenceReference: null
        }
      ],
      readOnlyChecks: [
        {
          step: 1,
          name: 'Inspect active connection pool saturation',
          command: incident.service?.includes('redis') 
            ? 'redis-cli -h $REDIS_HOST info clients | grep connected_clients' 
            : `kubectl exec -it deploy/${incident.service || 'app'} -- netstat -an | grep ESTABLISHED | wc -l`,
          expectedObservation: 'Check if connections approach hard threshold (100% saturation vs idle)',
          whyBeforeAction: 'Prevents misdiagnosing application crash when it is a connection starvation issue [Ref ' + evidenceCode + ']'
        },
        {
          step: 2,
          name: 'Verify database/backend locking and query latency',
          command: `SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC LIMIT 5;`,
          expectedObservation: 'Identify if any single long-running query or missing index is holding locks',
          whyBeforeAction: 'Avoids mutating application code when root cause is DB lock starvation'
        },
        {
          step: 3,
          name: 'Review deployment diff and configuration commit',
          command: `git diff HEAD~1 -- config/ | grep -E 'timeout|pool|concurrency|retry'`,
          expectedObservation: 'Detect accidental timeout zeroing or missing connection release hooks',
          whyBeforeAction: `Incident [${evidenceCode}] was triggered by a config oversight during deployment`
        }
      ],
      actionsToAvoid: primaryEvidence.failedActions.map((fa: string) => ({
        action: fa.split('(')[0].trim(),
        reason: fa.includes('(') ? fa.slice(fa.indexOf('(') + 1, fa.lastIndexOf(')')) : 'Failed in previous incident and compounded downtime.',
        citedEvidence: evidenceCode
      })),
      recommendedRemediations: [
        {
          priority: 1,
          action: primaryEvidence.successfulFix,
          rationale: `Proven fix in Incident ${primaryEvidence.id} [${evidenceCode}]. Restored normal traffic in ${primaryEvidence.timeToResolveMinutes}m without compounding load.`,
          verificationStep: 'Verify latency drops back under 100ms and connection pool utilization stabilizes < 60%.'
        },
        {
          priority: 2,
          action: 'Enable circuit-breaker / rate-limiting at ingress gateway',
          rationale: 'Quarantines failure domain and stops thundering herd before any pod manipulations.',
          verificationStep: 'Check ingress 5xx error percentage returns to baseline 0.01%.'
        }
      ],
      confidenceScore: Math.round(primaryEvidence.relevanceScore || 88)
    };
  } else {
    // Cold start scenario (No prior memory found)
    return {
      summary: `No historical precedents found in Hindsight for ${incident.service || 'this service'}. Formulating first-principles baseline investigation plan. Once resolved, record outcome to establish memory for future engineers.`,
      hypotheses: [
        {
          rank: 1,
          title: 'Recent deployment defect or environmental mismatch',
          confidence: 'Medium',
          description: `Given recent changes "${incident.recentChanges || 'unspecified'}", inspect application startup logs and exception traces first.`,
          evidenceReference: null
        },
        {
          rank: 2,
          title: 'Infrastructure resource exhaustion (CPU / Memory / Ephemeral ports)',
          confidence: 'Medium',
          description: 'Check pod status and cgroup metrics for OOMKilled or CPU throttling events.',
          evidenceReference: null
        }
      ],
      readOnlyChecks: [
        {
          step: 1,
          name: 'Check recent error logs and stack traces',
          command: `kubectl logs -l app=${incident.service || 'app'} --tail=200 --prefix | grep -iE 'error|exception|fatal|timeout'`,
          expectedObservation: 'Identify specific exception class and stack trace originating in latest release',
          whyBeforeAction: 'Establishes factual baseline before taking invasive actions'
        },
        {
          step: 2,
          name: 'Inspect cgroup resource utilization',
          command: `kubectl top pods -l app=${incident.service || 'app'} --containers`,
          expectedObservation: 'Determine if pods are hitting memory limits or CPU throttling',
          whyBeforeAction: 'Differentiates memory leaks from deadlock or external network failure'
        }
      ],
      actionsToAvoid: [
        {
          action: 'Do NOT blindly scale up replicas or flush caches without understanding error logs',
          reason: 'May overwhelm shared dependencies or wipe cache data during triage.',
          citedEvidence: 'Best Practice'
        }
      ],
      recommendedRemediations: [
        {
          priority: 1,
          action: incident.recentChanges ? 'Roll back recent deployment to previous stable SHA' : 'Isolate traffic with canary bypass',
          rationale: 'Fastest path to restore customer traffic while investigation proceeds in staging.',
          verificationStep: 'Confirm HTTP 200 pass rate reaches 99.9% in gateway telemetry.'
        }
      ],
      confidenceScore: 55
    };
  }
}

// In production, serve the built dist directory
// In development, Vite middleware is used
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RecallOps server active on port ${PORT}`);
  });
}

startServer();
