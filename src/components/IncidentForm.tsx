import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Terminal, 
  RotateCcw, 
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { IncidentSubmission, Severity } from '../types';
import { SYNTHETIC_SCENARIOS } from '../data/syntheticScenarios';

interface IncidentFormProps {
  onSubmit: (incident: IncidentSubmission) => void;
  isLoading: boolean;
}

export const IncidentForm: React.FC<IncidentFormProps> = ({ onSubmit, isLoading }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario-checkout-504');
  const [title, setTitle] = useState(SYNTHETIC_SCENARIOS[0].title);
  const [service, setService] = useState(SYNTHETIC_SCENARIOS[0].service);
  const [severity, setSeverity] = useState<Severity>(SYNTHETIC_SCENARIOS[0].severity);
  const [symptoms, setSymptoms] = useState(SYNTHETIC_SCENARIOS[0].symptoms);
  const [recentChanges, setRecentChanges] = useState(SYNTHETIC_SCENARIOS[0].recentChanges);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    const scenario = SYNTHETIC_SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      setTitle(scenario.title);
      setService(scenario.service);
      setSeverity(scenario.severity);
      setSymptoms(scenario.symptoms);
      setRecentChanges(scenario.recentChanges);
      setValidationError(null);
    }
  };

  const handleClear = () => {
    setSelectedScenarioId('');
    setTitle('');
    setService('');
    setSymptoms('');
    setRecentChanges('');
    setSeverity('SEV2');
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !symptoms.trim() && !service.trim()) {
      setValidationError('Please provide symptoms or an affected service to analyze.');
      return;
    }
    setValidationError(null);
    onSubmit({
      title: title.trim() || `${service || 'Service'} Triage Alert`,
      service: service.trim() || 'core-service',
      severity,
      symptoms: symptoms.trim(),
      recentChanges: recentChanges.trim()
    });
  };

  return (
    <div className="bg-[#0e1422] rounded-xl border border-slate-800 shadow-lg overflow-hidden">
      {/* Editorial Header & Quick Scenario Switcher */}
      <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Active Incident Ingestion</h2>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>Define observed telemetry and recent deployments</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500">RecallOps correlates with Hindsight memory</span>
          </div>
        </div>

        {/* Preloaded Synthetic Scenario Selector */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400 whitespace-nowrap font-medium">
            Demo Scenario:
          </span>
          <select
            value={selectedScenarioId}
            onChange={(e) => handleSelectScenario(e.target.value)}
            className="bg-[#090d16] border border-slate-700/80 text-xs text-cyan-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 cursor-pointer font-medium"
          >
            {SYNTHETIC_SCENARIOS.map((scenario) => (
              <option key={scenario.id} value={scenario.id} className="bg-[#0e1422] text-slate-200">
                {scenario.badgeLabel}: {scenario.service}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {validationError && (
          <div className="bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs p-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Incident Title */}
          <div className="md:col-span-8">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Incident Summary & Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Checkout 504 timeouts after v2.14 deployment"
              className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
            />
          </div>

          {/* Affected Service */}
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Affected Service
            </label>
            <input
              type="text"
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="e.g. checkout-service"
              className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
            />
          </div>
        </div>

        {/* Severity Selector */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">Declared Severity Level</label>
            <span className="text-[11px] text-slate-500">Advisory classification</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['SEV1', 'SEV2', 'SEV3'] as Severity[]).map((level) => {
              const isSelected = severity === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSeverity(level)}
                  className={`border rounded-lg py-2 px-3 text-xs font-mono transition-all text-left flex items-center justify-between ${
                    isSelected
                      ? level === 'SEV1'
                        ? 'bg-rose-950/40 border-rose-600 text-rose-200'
                        : level === 'SEV2'
                        ? 'bg-amber-950/40 border-amber-600 text-amber-200'
                        : 'bg-blue-950/40 border-blue-600 text-blue-200'
                      : 'bg-[#090d16] border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="font-semibold">{level}</span>
                  <span className="text-[11px] text-slate-400">
                    {level === 'SEV1' ? 'Critical Outage' : level === 'SEV2' ? 'Major Degradation' : 'Minor Impact'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Symptoms and Error Logs */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>Observed Symptoms, Stack Traces & Telemetry</span>
            </label>
            <span className="text-[11px] text-slate-500">Searched against Hindsight embedding index</span>
          </div>
          <textarea
            rows={4}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Paste logs, HTTP error codes, latency spikes, or connection exhaustion logs..."
            className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono leading-relaxed"
          />
        </div>

        {/* Recent Deployments / Config Changes */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">
              Recent Deployments & Configuration Changes
            </label>
            <span className="text-[11px] text-slate-500">Correlation parameter</span>
          </div>
          <input
            type="text"
            value={recentChanges}
            onChange={(e) => setRecentChanges(e.target.value)}
            placeholder="e.g. Deployed checkout-service:v2.14 20 mins ago, PR #8492..."
            className="w-full bg-[#090d16] border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
          />
        </div>

        {/* Actions Bar */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Advisory recommendations only · No automated changes to production</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClear}
              className="px-3.5 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 sm:flex-none px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Retrieving Hindsight & Synthesizing...</span>
                </>
              ) : (
                <>
                  <span>Formulate Investigation Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
