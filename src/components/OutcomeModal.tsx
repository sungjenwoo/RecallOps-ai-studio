import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Database
} from 'lucide-react';
import { IncidentOutcomeInput, IncidentSubmission, Severity } from '../types';

interface OutcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentIncident: IncidentSubmission | null;
  onSaveOutcome: (outcome: IncidentOutcomeInput) => void;
}

export const OutcomeModal: React.FC<OutcomeModalProps> = ({
  isOpen,
  onClose,
  currentIncident,
  onSaveOutcome
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(currentIncident?.title || 'Resolved Incident');
  const [service, setService] = useState(currentIncident?.service || 'checkout-service');
  const [severity, setSeverity] = useState<Severity>(currentIncident?.severity || 'SEV2');
  const [rootCause, setRootCause] = useState(
    'Connection pool starvation caused by unclosed DB connections in error fallback handler.'
  );
  const [failedActions, setFailedActions] = useState<string[]>([
    'Attempted rolling pod restart (caused sudden connection storm to primary DB)'
  ]);
  const [newFailedAction, setNewFailedAction] = useState('');
  const [successfulFix, setSuccessfulFix] = useState(
    'Rolled back Helm release to previous stable image and applied connection timeout.'
  );
  const [lessonsLearned, setLessonsLearned] = useState<string[]>([
    'Never restart pods during connection saturation without pre-warming',
    'Verify db connection release in error catch blocks'
  ]);
  const [newLesson, setNewLesson] = useState('');
  const [timeToResolve, setTimeToResolve] = useState<number>(38);
  const [responder, setResponder] = useState('Elena Rostova (Staff SRE)');

  const handleAddFailedAction = () => {
    if (newFailedAction.trim()) {
      setFailedActions([...failedActions, newFailedAction.trim()]);
      setNewFailedAction('');
    }
  };

  const handleRemoveFailedAction = (index: number) => {
    setFailedActions(failedActions.filter((_, i) => i !== index));
  };

  const handleAddLesson = () => {
    if (newLesson.trim()) {
      setLessonsLearned([...lessonsLearned, newLesson.trim()]);
      setNewLesson('');
    }
  };

  const handleRemoveLesson = (index: number) => {
    setLessonsLearned(lessonsLearned.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveOutcome({
      incidentId: `INC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      title,
      service,
      severity,
      rootCause,
      failedActions,
      successfulFix,
      lessonsLearned,
      timeToResolveMinutes: Number(timeToResolve) || 30,
      responder
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-[#0e1422] border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#0a0f1a] flex items-center justify-between sticky top-0 z-10">
          <div>
            <h3 className="text-sm font-semibold text-white">Record Incident Resolution</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Saves verified outcome to Hindsight to inform future on-call incident triage.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Incident Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Affected Service</label>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-2.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          {/* Confirmed Root Cause */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Confirmed Root Cause Postmortem
            </label>
            <textarea
              rows={2}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="What specifically caused this outage?"
              className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
              required
            />
          </div>

          {/* Failed Actions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-medium">
                Failed Actions Attempted (What worsened the outage)
              </label>
              <span className="text-[11px] text-slate-500">Hindsight will warn future engineers</span>
            </div>
            <div className="space-y-1.5 mb-2">
              {failedActions.map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 bg-[#140e16] border border-rose-900/40 rounded-lg px-3 py-1.5 text-rose-200"
                >
                  <span className="text-xs">✕ {action}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFailedAction(idx)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFailedAction}
                onChange={(e) => setNewFailedAction(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFailedAction())}
                placeholder="e.g. Restarted pods without pre-warming..."
                className="flex-1 bg-[#090d16] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleAddFailedAction}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Winning Fix */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Successful Remediation Applied
            </label>
            <textarea
              rows={2}
              value={successfulFix}
              onChange={(e) => setSuccessfulFix(e.target.value)}
              placeholder="e.g. Rolled back release to v2.13.4 via Helm."
              className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              required
            />
          </div>

          {/* Lessons Learned */}
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Key Lessons for Future Incidents
            </label>
            <div className="space-y-1.5 mb-2">
              {lessonsLearned.map((lesson, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 bg-[#090d16] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200"
                >
                  <span className="text-xs">· {lesson}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLesson(idx)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLesson}
                onChange={(e) => setNewLesson(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLesson())}
                placeholder="e.g. Verify connection release in promise catch blocks..."
                className="flex-1 bg-[#090d16] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={handleAddLesson}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Time to Resolve (mins)</label>
              <input
                type="number"
                value={timeToResolve}
                onChange={(e) => setTimeToResolve(Number(e.target.value))}
                className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Responder</label>
              <input
                type="text"
                value={responder}
                onChange={(e) => setResponder(e.target.value)}
                className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Footer CTA */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-colors flex items-center gap-2"
            >
              <Database className="w-3.5 h-3.5 text-slate-950" />
              <span>Save to Hindsight</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
