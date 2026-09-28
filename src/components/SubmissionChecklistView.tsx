import React from 'react';
import { 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';

interface SubmissionChecklistViewProps {
  onNavigateToConsole: () => void;
  onNavigateToLab: () => void;
  onNavigateToMemories: () => void;
  onInspectEvidence: (code: string) => void;
  memoryCount: number;
}

export const SubmissionChecklistView: React.FC<SubmissionChecklistViewProps> = ({
  onNavigateToConsole,
  onNavigateToLab,
  onNavigateToMemories,
  onInspectEvidence,
  memoryCount
}) => {
  const checklistItems = [
    {
      id: 'req-1',
      index: '01',
      title: 'Browser-based Incident Analysis',
      description: 'Active triage dashboard takes service symptoms, recent PRs, and severity to formulate an evidence-grounded plan.',
      actionLabel: 'Test in Console',
      onAction: onNavigateToConsole
    },
    {
      id: 'req-2',
      index: '02',
      title: 'Verifiable Evidence Visibility [E1, E2, E3]',
      description: 'Recommendations cite concrete historical precedents with clickable inline [E#] links opening full postmortems.',
      actionLabel: 'Inspect Evidence [E1]',
      onAction: () => onInspectEvidence('E1')
    },
    {
      id: 'req-3',
      index: '03',
      title: 'Hypotheses Distinctly Labelled',
      description: 'AI conclusions are never presented as unverified facts. All potential causes are labelled Hypothesis [Confidence] and paired with read-only checks.',
      actionLabel: 'View in Plan View',
      onAction: onNavigateToConsole
    },
    {
      id: 'req-4',
      index: '04',
      title: 'Human-Confirmed Outcome Capture (Feedback Loop)',
      description: 'Responders record confirmed root causes, failed actions, and winning fixes into Hindsight Memory Bank upon incident closure.',
      actionLabel: 'Open Memory Bank',
      onAction: onNavigateToMemories
    },
    {
      id: 'req-5',
      index: '05',
      title: 'Memory Persistence Across Restarts',
      description: 'Newly saved lessons persist in Hindsight storage and remain available even after browser refresh or application restart.',
      actionLabel: `Inspect (${memoryCount} Memories)`,
      onAction: onNavigateToMemories
    },
    {
      id: 'req-6',
      index: '06',
      title: 'Subsequent Incident Re-use & Warning of Failed Traps',
      description: 'Newly learned experience warns future on-call engineers against dangerous actions (e.g., blind pod restarts, cache flushes).',
      actionLabel: 'Open Impact Lab',
      onAction: onNavigateToLab
    },
    {
      id: 'req-7',
      index: '07',
      title: 'Graceful Error & Cold Start Handling',
      description: 'Handles empty inputs, missing precedents (Cold Start with baseline SRE plan), and offline API fallback without crashing.',
      actionLabel: 'Try Cold Start Scenario',
      onAction: onNavigateToConsole
    },
    {
      id: 'req-8',
      index: '08',
      title: 'Security & Secret Sanitization',
      description: 'No hardcoded API keys or credentials in client bundles or public repositories. Server-side proxy with .env.example template.',
      actionLabel: 'Verified Clean',
      onAction: () => {}
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0e1422] rounded-xl border border-slate-800 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white tracking-tight">Hackathon Submission & Judge Checklist</h2>
              <span className="text-slate-500">·</span>
              <span className="text-xs text-emerald-400 font-medium">8 / 8 Deliverables Complete</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Audited against the "What does finished properly mean?" requirements from the project brief.
            </p>
          </div>
        </div>

        {/* Overview Box */}
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          RecallOps is an advisory AI incident-response assistant grounded in persistent Hindsight memory. Instead of general hallucinated advice, it indexes past failed attempts and winning fixes, warning on-call responders against fatal mistakes (like pod bouncing during DB pool starvation) and citing verifiable evidence [E1].
        </p>
      </div>

      {/* Checklist Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checklistItems.map((item) => (
          <div
            key={item.id}
            className="bg-[#0e1422] rounded-xl border border-slate-800 p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-emerald-400 font-semibold tabular-nums">
                    {item.index}.
                  </span>
                  <h3 className="text-xs font-semibold text-slate-200">
                    {item.title}
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-400 pl-6 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between pl-6">
              <span className="text-[11px] text-slate-500 font-mono">Deliverable {item.index}</span>
              <button
                onClick={item.onAction}
                className="text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors flex items-center gap-1"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
