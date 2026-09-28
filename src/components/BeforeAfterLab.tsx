import React, { useState } from 'react';
import { 
  GitCompare, 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  HelpCircle
} from 'lucide-react';
import { IncidentMemory } from '../types';

interface BeforeAfterLabProps {
  memories: IncidentMemory[];
  onInspectEvidence: (code: string) => void;
}

export const BeforeAfterLab: React.FC<BeforeAfterLabProps> = ({ onInspectEvidence }) => {
  const [selectedCase, setSelectedCase] = useState<'checkout' | 'redis' | 'payments'>('checkout');

  const cases = {
    checkout: {
      title: 'Checkout 504 Timeouts & Database Pool Saturation',
      service: 'checkout-service',
      symptom: 'HTTP 504, 100/100 active connections in HikariPool, P99 latency 14s after v2.14 release',
      evidenceCode: 'E1',
      before: {
        model: 'Generic LLM (No Hindsight Memory)',
        firstAction: 'kubectl rollout restart deploy/checkout-service',
        rationale: 'Assumes container is in a deadlocked state or frozen thread pool; standard advice is to bounce pods.',
        warningGiven: 'None. Does not know that bouncing pods with a saturated DB triggers a thundering herd.',
        suggestedFix: 'Double max_pool_size from 100 to 200 and restart pods.',
        realWorldResult: '1,200 incoming connections bombarded the primary PostgreSQL DB during pod startup. DB crashed with CPU at 99%. Outage was prolonged by 45 minutes.',
        riskLevel: 'Compounded Outage'
      },
      after: {
        model: 'RecallOps (With Hindsight Persistent Memory)',
        firstAction: 'Read-only connection pool check + Image rollback to v2.13.4',
        rationale: 'Retrieved Incident INC-2024-0412 [E1]: Previous engineer documented that a missing db_conn.release() in v2.14 caused the leak.',
        warningGiven: 'DO NOT restart pods! Incident [E1] proved restarting caused a 1,200-connection thundering herd and crashed the primary DB.',
        suggestedFix: 'Roll back checkout-service to stable release v2.13.4 via Helm. Inspect HikariCP idle/active metrics before modifying any pool limits.',
        realWorldResult: 'Avoided DB crash entirely. Rollback stabilized active connection pool within 45 seconds.',
        riskLevel: 'Grounded & Safe'
      }
    },
    redis: {
      title: 'Auth Gateway Latency & Redis Max Client Limit',
      service: 'auth-gateway',
      symptom: 'HTTP 500, Redis clients at 9,998 / 10,000 ceiling, users randomly logged out',
      evidenceCode: 'E2',
      before: {
        model: 'Generic LLM (No Hindsight Memory)',
        firstAction: 'redis-cli FLUSHDB or scale Redis cluster nodes from 3 to 6',
        rationale: 'Assumes Redis memory or key space is bloated, suggesting a cache flush to clear stale keys.',
        warningGiven: 'None. Does not know FLUSHDB forces millions of re-authentications directly to the primary database.',
        suggestedFix: 'Wipe redis cache keys and increase cluster node count.',
        realWorldResult: 'FLUSHDB logged out 50,000 active shoppers. PostgreSQL received a massive 40,000 req/s auth thundering herd, cascading downtime to the entire platform.',
        riskLevel: 'Cascading Outage'
      },
      after: {
        model: 'RecallOps (With Hindsight Persistent Memory)',
        firstAction: 'Inspect TCP socket state via redis-cli client list and check keep-alive timeouts',
        rationale: 'Retrieved Incident INC-2024-0608 [E2]: Proves zombie TCP sockets from a missing keep-alive timeout caused the exhaustion, not key storage.',
        warningGiven: 'DO NOT execute FLUSHDB! Incident [E2] proved flushing cache logged out users and crashed the database.',
        suggestedFix: 'Identify leaking sockets with netstat/lsof, enforce timeout 60 in redis.conf, and patch TCP keep-alive in client config.',
        realWorldResult: 'Safely resolved connection leak without invalidating a single user session.',
        riskLevel: 'Grounded & Safe'
      }
    },
    payments: {
      title: 'Stripe 429 Rate Limit Storm & RabbitMQ DLQ Spool',
      service: 'payment-processor',
      symptom: 'Stripe returns HTTP 429, DLQ depth growing +500/min, orders failing',
      evidenceCode: 'E3',
      before: {
        model: 'Generic LLM (No Hindsight Memory)',
        firstAction: 'Scale up worker concurrency and purge/flush DLQ messages',
        rationale: 'Assumes workers are not processing fast enough to drain the queue backlog.',
        warningGiven: 'None. Does not recognize that scaling workers makes 429 rate limiting worse.',
        suggestedFix: 'Increase worker count from 20 to 100.',
        realWorldResult: 'Purging DLQ permanently lost 340 customer payment records. Increasing workers led to a 100% 429 lockout by Stripe API.',
        riskLevel: 'Data Loss'
      },
      after: {
        model: 'RecallOps (With Hindsight Persistent Memory)',
        firstAction: 'Enable API egress rate-limiting at Kong gateway & quarantine DLQ',
        rationale: 'Retrieved Incident INC-2024-0819 [E3]: Historical precedent proves missing jitter backoff caused the 429 storm.',
        warningGiven: 'DO NOT purge Dead Letter Queue (causes permanent data loss) and DO NOT increase workers during a 429 rate limit.',
        suggestedFix: 'Throttle outbound gateway egress to 80 req/s, enable jitter backoff, and quarantine DLQ messages for post-recovery replay.',
        realWorldResult: 'Stripe 429s normalized immediately, zero payments lost.',
        riskLevel: 'Grounded & Safe'
      }
    }
  };

  const active = cases[selectedCase];

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-[#0e1422] rounded-xl border border-slate-800 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">Before & After Hindsight Lab</h2>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-slate-400">Comparative Evaluation</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Demonstrates why historical experience alters future decisions without model weight retraining.
            </p>
          </div>

          {/* Case Selector Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Scenario:</span>
            <div className="flex bg-[#090d16] border border-slate-800 rounded-lg p-1">
              {(['checkout', 'redis', 'payments'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setSelectedCase(k)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    selectedCase === k
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {k === 'checkout' ? 'Checkout [E1]' : k === 'redis' ? 'Redis Auth [E2]' : 'Payments [E3]'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Scenario Headline */}
        <div className="text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <span className="text-slate-400 font-medium">{active.title}</span>
            <span className="text-slate-600 mx-2">·</span>
            <span className="text-slate-500 font-mono text-[11px]">{active.symptom}</span>
          </div>

          <button
            onClick={() => onInspectEvidence(active.evidenceCode)}
            className="text-cyan-400 hover:text-cyan-300 font-mono text-xs flex items-center gap-1 transition-colors self-start md:self-auto"
          >
            <span>Inspect Historical Docket [{active.evidenceCode}]</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Without Hindsight (Naive LLM) */}
        <div className="bg-[#121118] rounded-xl border border-rose-900/30 p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-rose-900/20 pb-3">
              <div className="text-xs font-bold text-rose-300 font-mono uppercase tracking-wider">
                Without Hindsight
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">Generic foundation model (zero memory)</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">First Action Proposed:</span>
                <div className="font-mono text-rose-300 bg-[#181119] border border-rose-900/40 p-2.5 rounded-lg flex items-center justify-between">
                  <code>{active.before.firstAction}</code>
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-2" />
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Reasoning:</span>
                <p className="text-slate-300 bg-[#090d16]/70 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                  {active.before.rationale}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-rose-400/80 block mb-1">Prior Failure Warnings:</span>
                <p className="text-rose-200/90 bg-rose-950/20 p-2.5 rounded-lg border border-rose-900/30 leading-relaxed">
                  {active.before.warningGiven}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Suggested Remediation:</span>
                <p className="text-slate-300 bg-[#090d16]/70 p-2.5 rounded-lg border border-slate-800/80">
                  {active.before.suggestedFix}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-5 border-t border-rose-900/20">
            <div className="text-[11px] text-rose-400 font-medium mb-1">Real-World Consequence:</div>
            <div className="text-xs text-rose-200 bg-rose-950/30 border border-rose-900/40 p-3 rounded-lg leading-relaxed">
              {active.before.realWorldResult}
            </div>
          </div>
        </div>

        {/* Right: With Hindsight (RecallOps) */}
        <div className="bg-[#0e161c] rounded-xl border border-emerald-900/40 p-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-emerald-900/30 pb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-300 font-mono uppercase tracking-wider">
                  With Hindsight Persistent Memory
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">RecallOps corroborated against [{active.evidenceCode}]</div>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">Grounded</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">First Action Proposed:</span>
                <div className="font-mono text-emerald-300 bg-[#0c1a17] border border-emerald-900/40 p-2.5 rounded-lg flex items-center justify-between">
                  <code>{active.after.firstAction}</code>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Reasoning (Corroborated with Evidence):</span>
                <p className="text-slate-200 bg-[#090d16]/70 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                  {active.after.rationale}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-amber-300 block mb-1">Prior Failure Warnings Issued:</span>
                <p className="text-amber-200/90 bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30 leading-relaxed font-medium">
                  {active.after.warningGiven}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Suggested Remediation:</span>
                <p className="text-slate-200 bg-[#090d16]/70 p-2.5 rounded-lg border border-slate-800/80">
                  {active.after.suggestedFix}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-5 border-t border-emerald-900/30">
            <div className="text-[11px] text-emerald-400 font-medium mb-1">Real-World Consequence:</div>
            <div className="text-xs text-emerald-200 bg-emerald-950/30 border border-emerald-900/40 p-3 rounded-lg leading-relaxed">
              {active.after.realWorldResult}
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Note on Memory Architecture */}
      <div className="bg-[#0e1422] rounded-xl border border-slate-800 p-5 text-xs text-slate-300">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-2">
          Architecture Note: Persistent Experience vs. Model Retraining
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400 leading-relaxed">
          <div>
            <strong className="text-slate-200 block mb-1">01. Dynamic Retrieval</strong>
            Base weights are never retrained. When an incident is resolved, human-confirmed lessons are stored in Hindsight and retrieved on similar future patterns.
          </div>
          <div>
            <strong className="text-slate-200 block mb-1">02. Failure Warning</strong>
            The assistant actively flags hazardous traps (e.g. restarting pods during DB saturation or flushing Redis) that delayed previous outages.
          </div>
          <div>
            <strong className="text-slate-200 block mb-1">03. Traceable Evidence</strong>
            Responders are not asked to trust black-box advice; every recommendation links to an empirical incident record with verified postmortems.
          </div>
        </div>
      </div>
    </div>
  );
};
