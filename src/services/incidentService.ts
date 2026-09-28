import { IncidentMemory, IncidentOutcomeInput, IncidentSubmission, InvestigationPlan } from '../types';
import { INITIAL_MEMORIES } from '../data/defaultMemories';

const STORAGE_KEY = 'recallops_memories_v1';

export function getLocalMemories(): IncidentMemory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load memories from localStorage', e);
  }
  return INITIAL_MEMORIES;
}

export function saveLocalMemories(memories: IncidentMemory[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  } catch (e) {
    console.warn('Failed to save memories to localStorage', e);
  }
}

export function resetToDefaultMemories(): IncidentMemory[] {
  localStorage.removeItem(STORAGE_KEY);
  return INITIAL_MEMORIES;
}

export function scoreMemoryRelevance(incident: { service: string; symptoms: string; recentChanges: string }, mem: IncidentMemory): number {
  let score = 0;
  const incText = `${incident.service} ${incident.symptoms} ${incident.recentChanges}`.toLowerCase();
  
  if (incident.service && mem.service.toLowerCase().includes(incident.service.toLowerCase())) {
    score += 40;
  }
  
  const allMemText = `${mem.title} ${mem.symptoms.join(' ')} ${mem.rootCause} ${mem.tags.join(' ')} ${mem.failedActions.join(' ')}`.toLowerCase();
  
  const keywords = incText.split(/[\s,.:;!?'"()\[\]{}]+/).filter(w => w.length >= 3);
  const seenKeywords = new Set<string>();

  for (const kw of keywords) {
    if (!seenKeywords.has(kw) && allMemText.includes(kw)) {
      score += 7;
      seenKeywords.add(kw);
    }
  }

  for (const symptom of mem.symptoms) {
    if (incText.includes(symptom.toLowerCase().substring(0, 18))) {
      score += 25;
    }
  }

  return Math.min(Math.round(score), 99);
}

export async function analyzeIncident(
  incident: IncidentSubmission,
  currentMemories: IncidentMemory[]
): Promise<{
  analysis: InvestigationPlan;
  retrievedEvidence: IncidentMemory[];
  allScoredMemories: IncidentMemory[];
  mode: string;
}> {
  // Try server-side API first
  try {
    const response = await fetch('/api/analyze-incident', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...incident,
        customMemories: currentMemories
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.analysis) {
        return {
          analysis: data.analysis,
          retrievedEvidence: data.retrievedEvidence,
          allScoredMemories: data.allScoredMemories,
          mode: data.mode
        };
      }
    }
  } catch (err) {
    console.info('Server API unreachable, using resilient client-side Hindsight engine.');
  }

  // Client-side fallback engine
  const scored = currentMemories
    .map(mem => ({
      ...mem,
      relevanceScore: scoreMemoryRelevance(incident, mem)
    }))
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  const relevantMemories = scored.filter(m => (m.relevanceScore || 0) >= 20).slice(0, 3);
  const primaryEvidence = relevantMemories[0];

  if (primaryEvidence) {
    const code = primaryEvidence.evidenceCode;
    const plan: InvestigationPlan = {
      summary: `Symptoms match historical incident [${code}] (${primaryEvidence.title}). Previous postmortem shows standard restarts escalated the outage, whereas ${primaryEvidence.successfulFix.toLowerCase()} restored stability.`,
      hypotheses: [
        {
          rank: 1,
          title: `Resource/Connection Starvation (${primaryEvidence.rootCause.split(':')[0]})`,
          confidence: 'High',
          description: `Correlated with [${code}]: Historical incident on ${primaryEvidence.incidentDate} exhibited matching symptoms. Verified root cause was: ${primaryEvidence.rootCause}`,
          evidenceReference: code
        },
        {
          rank: 2,
          title: `Regression introduced in recent changes: "${incident.recentChanges.slice(0, 60)}..."`,
          confidence: 'Medium',
          description: `Recent changes match the failure pattern from [${code}]. Verify code diff for unreleased resources before altering runtime.`,
          evidenceReference: code
        },
        {
          rank: 3,
          title: `Downstream dependency cascading backpressure`,
          confidence: 'Low',
          description: `Symptom could be an indirect manifestation of downstream backlog. Verify read-only metrics before modifying infrastructure.`,
          evidenceReference: null
        }
      ],
      readOnlyChecks: [
        {
          step: 1,
          name: 'Inspect active connection saturation and socket states',
          command: incident.service.includes('redis') 
            ? 'redis-cli -h $REDIS_HOST info clients | grep connected_clients' 
            : `kubectl exec -it deploy/${incident.service} -- netstat -an | grep ESTABLISHED | wc -l`,
          expectedObservation: 'Determine whether active connections reached maximum limit threshold [E-Ref]',
          whyBeforeAction: 'Prevents misdiagnosing code crashes when it is a connection starvation issue [Ref ' + code + ']'
        },
        {
          step: 2,
          name: 'Verify database/backend locking and slow queries',
          command: `SELECT pid, now() - query_start AS duration, query, state FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC LIMIT 5;`,
          expectedObservation: 'Detect if an analytical query or transaction lock is blocking connection pools',
          whyBeforeAction: 'Avoids mutating application code when root cause is DB lock starvation'
        },
        {
          step: 3,
          name: 'Inspect commit diff for resource leaks or disabled timeouts',
          command: `git log -p -2 -- 'src/' | grep -E 'connection|timeout|close|release|retry'`,
          expectedObservation: 'Identify unreleased connections or missing error-catch handlers',
          whyBeforeAction: `In Incident [${code}], release() was omitted in a promise catch block`
        }
      ],
      actionsToAvoid: primaryEvidence.failedActions.map(fa => ({
        action: fa.split('(')[0].trim(),
        reason: fa.includes('(') ? fa.slice(fa.indexOf('(') + 1, fa.lastIndexOf(')')) : 'Historically failed in previous incident and compounded downtime.',
        citedEvidence: code
      })),
      recommendedRemediations: [
        {
          priority: 1,
          action: primaryEvidence.successfulFix,
          rationale: `Proven fix in Incident ${primaryEvidence.id} [${code}]. Restored normal traffic in ${primaryEvidence.timeToResolveMinutes}m without compounding load.`,
          verificationStep: 'Verify latency drops back under baseline threshold and connection pool utilization stabilizes < 60%.'
        },
        {
          priority: 2,
          action: 'Apply ingress rate limiter / shed non-essential traffic',
          rationale: 'Quarantines failure domain and stops thundering herd before any pod manipulations.',
          verificationStep: 'Check ingress 5xx error percentage returns to baseline 0.01%.'
        }
      ],
      confidenceScore: Math.round(primaryEvidence.relevanceScore || 88)
    };

    return {
      analysis: plan,
      retrievedEvidence: relevantMemories,
      allScoredMemories: scored.slice(0, 5),
      mode: 'hindsight-engine-client'
    };
  }

  // Cold Start plan
  const coldPlan: InvestigationPlan = {
    summary: `No historical precedents found in Hindsight for ${incident.service}. Formulating first-principles baseline investigation plan. Once resolved, record outcome to establish memory for future engineers.`,
    hypotheses: [
      {
        rank: 1,
        title: 'Recent deployment defect or memory leak',
        confidence: 'Medium',
        description: `Given recent changes "${incident.recentChanges || 'unspecified'}", inspect container lifecycle and memory growth curves.`,
        evidenceReference: null
      },
      {
        rank: 2,
        title: 'Infrastructure resource exhaustion (cgroups / OOM)',
        confidence: 'Medium',
        description: 'Verify if pods are being killed by kernel OOM killer (Exit Code 137).',
        evidenceReference: null
      }
    ],
    readOnlyChecks: [
      {
        step: 1,
        name: 'Check recent error logs and container exit codes',
        command: `kubectl logs -l app=${incident.service} --tail=200 --prefix | grep -iE 'error|fatal|exception|killed'`,
        expectedObservation: 'Look for OOMKilled events or uncaught exceptions during startup',
        whyBeforeAction: 'Establishes factual baseline before taking invasive actions'
      },
      {
        step: 2,
        name: 'Inspect cgroup resource utilization curves',
        command: `kubectl top pods -l app=${incident.service} --containers`,
        expectedObservation: 'Determine if pods are hitting memory limits or CPU throttling',
        whyBeforeAction: 'Differentiates memory leaks from deadlock or external network failure'
      }
    ],
    actionsToAvoid: [
      {
        action: 'Do NOT blindly scale up replicas or flush caches without understanding error logs',
        reason: 'Scaling up a memory leak will consume all cluster node memory.',
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
    confidenceScore: 50
  };

  return {
    analysis: coldPlan,
    retrievedEvidence: [],
    allScoredMemories: scored.slice(0, 5),
    mode: 'hindsight-engine-client'
  };
}

export function commitNewOutcomeToMemories(
  outcome: IncidentOutcomeInput,
  currentMemories: IncidentMemory[]
): { updatedMemories: IncidentMemory[]; newMemory: IncidentMemory } {
  const nextNum = currentMemories.length + 1;
  const newMemory: IncidentMemory = {
    id: outcome.incidentId || `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    evidenceCode: `E${nextNum}`,
    service: outcome.service,
    title: outcome.title,
    incidentDate: new Date().toISOString().split('T')[0],
    symptoms: ['Observed incident symptoms recorded during resolution triage'],
    rootCause: outcome.rootCause,
    failedActions: outcome.failedActions,
    successfulFix: outcome.successfulFix,
    lessonsLearned: outcome.lessonsLearned,
    responder: outcome.responder || 'Elena Rostova (Staff SRE)',
    timeToResolveMinutes: outcome.timeToResolveMinutes || 30,
    severity: outcome.severity,
    tags: [outcome.service, 'human-confirmed', 'postmortem-resolution']
  };

  const updatedMemories = [newMemory, ...currentMemories];
  saveLocalMemories(updatedMemories);

  // Sync with server if online
  try {
    fetch('/api/memories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMemory)
    }).catch(() => {});
  } catch (e) {}

  return { updatedMemories, newMemory };
}
