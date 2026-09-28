import React from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Lightbulb
} from 'lucide-react';
import { IncidentMemory } from '../types';

interface EvidenceDrawerProps {
  evidence: IncidentMemory | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ evidence, onClose }) => {
  if (!evidence) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#0e1422] border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#0a0f1a] sticky top-0 z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-cyan-400">
                [{evidence.evidenceCode}] {evidence.id}
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-300 font-medium">{evidence.service}</span>
            </div>
            <h3 className="text-sm font-semibold text-white mt-1">
              {evidence.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 border-b border-slate-800 pb-3">
            <div>
              <span className="text-slate-500">Date: </span>
              <span className="text-slate-300 font-mono">{evidence.incidentDate}</span>
            </div>
            <span className="text-slate-700">·</span>
            <div>
              <span className="text-slate-500">Severity: </span>
              <span className={`font-mono ${evidence.severity === 'SEV1' ? 'text-rose-400' : 'text-amber-400'}`}>
                {evidence.severity}
              </span>
            </div>
            <span className="text-slate-700">·</span>
            <div>
              <span className="text-slate-500">Responder: </span>
              <span className="text-slate-300">{evidence.responder}</span>
            </div>
            <span className="text-slate-700">·</span>
            <div>
              <span className="text-slate-500">MTTR: </span>
              <span className="text-emerald-400 font-mono tabular-nums">{evidence.timeToResolveMinutes}m</span>
            </div>
          </div>

          {/* Historical Symptoms Recorded */}
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Historical Symptoms Recorded
            </span>
            <div className="bg-[#090d16] border border-slate-800 rounded-lg p-3 space-y-1.5 font-mono text-[11px] text-slate-300">
              {evidence.symptoms.map((sym, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-slate-500">·</span>
                  <span>{sym}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirmed Root Cause */}
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Confirmed Root Cause Postmortem
            </span>
            <div className="bg-[#090d16] border border-slate-800 rounded-lg p-3 text-slate-200 leading-relaxed">
              {evidence.rootCause}
            </div>
          </div>

          {/* Failed Actions */}
          <div>
            <span className="text-[11px] font-mono text-rose-400 uppercase tracking-wider block mb-1.5">
              Failed Actions Attempted (What worsened the outage)
            </span>
            <div className="space-y-2">
              {evidence.failedActions.map((action, idx) => (
                <div
                  key={idx}
                  className="bg-[#140e16] border border-rose-900/40 rounded-lg p-3 text-rose-200"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold shrink-0">✕</span>
                    <span className="leading-relaxed">{action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Winning Fix */}
          <div>
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block mb-1.5">
              Successful Remediation Applied
            </span>
            <div className="bg-[#0c1817] border border-emerald-900/40 rounded-lg p-3 text-emerald-200 leading-relaxed font-medium">
              {evidence.successfulFix}
            </div>
          </div>

          {/* Lessons Learned */}
          <div>
            <span className="text-[11px] font-mono text-amber-300 uppercase tracking-wider block mb-1.5">
              Lessons Saved to Hindsight for Future Engineers
            </span>
            <div className="bg-[#090d16] border border-slate-800 rounded-lg p-3 space-y-1.5">
              {evidence.lessonsLearned.map((lesson, idx) => (
                <div key={idx} className="text-slate-300 text-xs">
                  · {lesson}
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-800">
            <span>Tags:</span>
            {evidence.tags.map((tag, idx) => (
              <span key={idx} className="text-slate-400">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0a0f1a] flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Hindsight Docket ID: {evidence.id}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
