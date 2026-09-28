import React, { useState } from 'react';
import { 
  Terminal, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertOctagon, 
  ArrowRight, 
  FileText, 
  GitFork,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { IncidentMemory, InvestigationPlan } from '../types';

interface InvestigationPlanViewProps {
  plan: InvestigationPlan;
  retrievedEvidence: IncidentMemory[];
  onInspectEvidence: (evidenceCode: string) => void;
  onOpenOutcomeModal: () => void;
  onExportReport: () => void;
  onOpenBeforeAfterLab: () => void;
}

export const InvestigationPlanView: React.FC<InvestigationPlanViewProps> = ({
  plan,
  retrievedEvidence,
  onInspectEvidence,
  onOpenOutcomeModal,
  onExportReport,
  onOpenBeforeAfterLab
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCommand = (command: string, index: number) => {
    navigator.clipboard.writeText(command);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const renderEvidenceCitation = (code: string | null) => {
    if (!code) return null;
    return (
      <button
        onClick={() => onInspectEvidence(code)}
        className="inline-flex items-center gap-1 font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2 text-xs transition-colors ml-1"
        title={`Inspect historical precedent [${code}]`}
      >
        <span>[{code}]</span>
        <ArrowUpRight className="w-3 h-3 opacity-80" />
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Executive Briefing Card */}
      <div className="bg-[#0e1422] rounded-xl border border-slate-800 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white tracking-tight">Synthesized Investigation Plan</h3>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                Confidence: {plan.confidenceScore}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Formulated from active telemetry and corroborated against Hindsight historical outcomes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenBeforeAfterLab}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <GitFork className="w-3.5 h-3.5 text-indigo-400" />
              <span>Before & After Impact</span>
            </button>

            <button
              onClick={onExportReport}
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Report</span>
            </button>
          </div>
        </div>

        {/* Executive Summary Prose */}
        <div className="text-sm text-slate-200 leading-relaxed max-w-4xl">
          <p>{plan.summary}</p>
        </div>

        {/* Retrieved Evidence Row */}
        {retrievedEvidence.length > 0 ? (
          <div className="mt-5 pt-4 border-t border-slate-800/80">
            <div className="text-xs text-slate-400 font-medium mb-3 flex items-center justify-between">
              <span>Correlated Historical Precedents ({retrievedEvidence.length} matching incidents)</span>
              <span className="text-slate-500 text-[11px]">Click to inspect recorded root cause & failed fixes</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {retrievedEvidence.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => onInspectEvidence(ev.evidenceCode)}
                  className="text-left bg-[#090d16] hover:bg-slate-900 border border-slate-800/90 hover:border-slate-700 rounded-lg p-3 transition-colors group"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-cyan-300 font-medium">
                      [{ev.evidenceCode}] {ev.id}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px] tabular-nums">
                      {ev.relevanceScore}% match
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium truncate group-hover:text-white">
                    {ev.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 truncate">
                    Resolved by: {ev.responder}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
            <span>Cold Start: No direct historical precedent found. Generating baseline first-principles investigation.</span>
            <span className="text-cyan-400">Record resolution below to seed the first memory for this service.</span>
          </div>
        )}
      </div>

      {/* Grid: 01 Hypotheses & 02 Ineffective Actions Warning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section 01: Ranked Hypotheses */}
        <div className="lg:col-span-7 bg-[#0e1422] rounded-xl border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                01. Hypotheses (Requires Verification)
              </h4>
            </div>
            <span className="text-[11px] text-slate-500">Ranked by likelihood</span>
          </div>

          <div className="space-y-3">
            {plan.hypotheses.map((hyp) => (
              <div
                key={hyp.rank}
                className="p-3.5 rounded-lg bg-[#090d16] border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs text-slate-500 font-semibold tabular-nums">
                      0{hyp.rank}.
                    </span>
                    <span className="text-xs font-semibold text-slate-100">
                      {hyp.title}
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono shrink-0 ${
                    hyp.confidence === 'High' ? 'text-rose-400' : hyp.confidence === 'Medium' ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {hyp.confidence} Confidence
                  </span>
                </div>
                <p className="text-xs text-slate-300 pl-5 leading-relaxed">
                  {hyp.description}
                  {renderEvidenceCitation(hyp.evidenceReference)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 02: Critical Warning - INEFFECTIVE / FAILED ACTIONS TO AVOID */}
        <div className="lg:col-span-5 bg-[#120f17] rounded-xl border border-rose-900/40 p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-rose-900/30 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider font-mono">
                  02. Actions to Avoid
                </h4>
              </div>
              <span className="text-[11px] text-rose-400/80 font-mono">Past failure lessons</span>
            </div>

            <div className="space-y-3">
              {plan.actionsToAvoid.length > 0 ? (
                plan.actionsToAvoid.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[#181119] border border-rose-900/50 text-xs text-slate-200"
                  >
                    <div className="font-medium text-rose-300 flex items-center flex-wrap gap-1">
                      <span>Avoid: {action.action}</span>
                      {renderEvidenceCitation(action.citedEvidence)}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      <span className="text-rose-400/90 font-medium">Why it failed:</span> {action.reason}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 p-3 bg-slate-900/50 rounded-lg">
                  No specific past anti-patterns detected. Execute read-only checks first.
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-rose-900/30 text-[11px] text-slate-400">
            Past incidents showed standard restarts or cache flushes prolonged outages. Always verify with read-only commands below.
          </div>
        </div>
      </div>

      {/* Section 03: Safe Diagnostic Checks */}
      <div className="bg-[#0e1422] rounded-xl border border-slate-800 p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              03. Safe Read-Only Diagnostic Checks
            </h4>
          </div>
          <span className="text-xs text-slate-500">Run before changing production</span>
        </div>

        <div className="space-y-3">
          {plan.readOnlyChecks.map((chk, idx) => (
            <div
              key={chk.step}
              className="p-4 rounded-lg bg-[#090d16] border border-slate-800/90 transition-colors hover:border-slate-700"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-cyan-400 font-semibold tabular-nums">
                    Step {chk.step}:
                  </span>
                  <span className="text-xs font-medium text-slate-200">{chk.name}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-500">Observe: </span>
                  <span className="text-slate-300">{chk.expectedObservation}</span>
                </div>
              </div>

              {/* Terminal command strip */}
              <div className="bg-[#06080e] border border-slate-800 rounded-md p-2.5 flex items-center justify-between gap-2 font-mono text-xs text-cyan-300">
                <code className="text-[11px] overflow-x-auto whitespace-nowrap">{chk.command}</code>
                <button
                  onClick={() => handleCopyCommand(chk.command, idx)}
                  className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors flex items-center gap-1 shrink-0 font-sans"
                  title="Copy command to clipboard"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-2 text-[11px] text-slate-400">
                <span className="text-slate-500">Why check first: </span>
                <span>{chk.whyBeforeAction}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 04: Proposed Remediation Steps */}
      <div className="bg-[#0e1422] rounded-xl border border-slate-800 p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              04. Recommended Remediations
            </h4>
          </div>
          <span className="text-xs text-slate-500">Prioritized by past resolution success</span>
        </div>

        <div className="space-y-3">
          {plan.recommendedRemediations.map((rem) => (
            <div
              key={rem.priority}
              className="p-4 rounded-lg bg-[#090d16] border border-slate-800/90 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <span className="font-mono text-xs text-emerald-400 font-semibold tabular-nums mt-0.5">
                  P{rem.priority}.
                </span>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-100">{rem.action}</div>
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <span className="text-slate-500 font-medium">Historical Rationale: </span>
                    {rem.rationale}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span className="text-slate-500">Post-Verification: </span>
                    {rem.verificationStep}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Human Resolution Feedback CTA */}
      <div className="bg-[#0e1422] border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-white">Record Human-Confirmed Resolution</h4>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl leading-relaxed">
            Close the feedback loop. Save confirmed root causes, attempted failed fixes, and winning solutions into Hindsight to inform all future on-call engineers.
          </p>
        </div>

        <button
          onClick={onOpenOutcomeModal}
          className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-2 shrink-0 shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-slate-950" />
          <span>Save Outcome to Hindsight</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
        </button>
      </div>
    </div>
  );
};
