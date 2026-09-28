import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, CircleHelp, Database, GitCompare, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Header } from './components/Header';
import { IncidentForm } from './components/IncidentForm';
import { InvestigationPlanView } from './components/InvestigationPlanView';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { OutcomeModal } from './components/OutcomeModal';
import { BeforeAfterLab } from './components/BeforeAfterLab';
import { MemoryBankView } from './components/MemoryBankView';
import { SubmissionChecklistView } from './components/SubmissionChecklistView';
import { ExportModal } from './components/ExportModal';
import { IncidentMemory, IncidentOutcomeInput, IncidentSubmission, InvestigationPlan } from './types';
import { getLocalMemories, saveLocalMemories, resetToDefaultMemories, analyzeIncident, commitNewOutcomeToMemories } from './services/incidentService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'console' | 'lab' | 'memories' | 'checklist'>('console');
  const [memories, setMemories] = useState<IncidentMemory[]>([]);
  const [currentIncident, setCurrentIncident] = useState<IncidentSubmission | null>(null);
  const [investigationPlan, setInvestigationPlan] = useState<InvestigationPlan | null>(null);
  const [retrievedEvidence, setRetrievedEvidence] = useState<IncidentMemory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inspectedEvidence, setInspectedEvidence] = useState<IncidentMemory | null>(null);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    const loaded = getLocalMemories();
    setMemories(loaded);
    fetch('/api/memories').then(res => res.json()).then(data => {
      if (data.success && Array.isArray(data.memories) && data.memories.length) {
        const merged = [...data.memories, ...loaded.filter(local => !data.memories.some((remote: IncidentMemory) => remote.id === local.id))];
        setMemories(merged);
        saveLocalMemories(merged);
      }
    }).catch(() => undefined);
  }, []);

  const showNotification = (title: string, message: string) => {
    setNotification({ title, message });
    window.setTimeout(() => setNotification(null), 4500);
  };

  const handleAnalyzeIncident = async (incident: IncidentSubmission) => {
    setIsLoading(true);
    setCurrentIncident(incident);
    try {
      const result = await analyzeIncident(incident, memories);
      setInvestigationPlan(result.analysis);
      setRetrievedEvidence(result.retrievedEvidence);
      showNotification(
        result.retrievedEvidence.length ? 'Memory found' : 'Starting a new memory',
        result.retrievedEvidence.length
          ? `${result.retrievedEvidence.length} past incident${result.retrievedEvidence.length > 1 ? 's' : ''} matched this problem.`
          : 'No close match yet. Save the confirmed fix and RecallOps will remember it next time.'
      );
    } catch (error) {
      showNotification('Could not analyze incident', 'Try the demo scenario again or check your connection.');
      console.error(error);
    } finally { setIsLoading(false); }
  };

  const handleInspectEvidence = (code: string) => {
    const found = memories.find(memory => memory.evidenceCode === code || memory.id === code) || retrievedEvidence.find(memory => memory.evidenceCode === code);
    if (found) setInspectedEvidence(found);
  };

  const handleSaveOutcome = (outcome: IncidentOutcomeInput) => {
    const { updatedMemories, newMemory } = commitNewOutcomeToMemories(outcome, memories);
    setMemories(updatedMemories);
    setIsOutcomeModalOpen(false);
    showNotification(`Lesson saved as [${newMemory.evidenceCode}]`, 'Future incident plans can now use this confirmed outcome.');
    if (currentIncident) handleAnalyzeIncident(currentIncident);
  };

  const handleResetMemories = () => {
    const defaults = resetToDefaultMemories();
    setMemories(defaults);
    showNotification('Demo reset', 'The original incident memories are ready for the next walkthrough.');
  };

  return (
    <div className="min-h-screen bg-[#071018] text-slate-200 selection:bg-cyan-400/20 selection:text-cyan-100">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} memoryCount={memories.length} isEngineActive hasAnalyzed={!!investigationPlan} />
      {notification && <div className="toast"><CheckCircle2 className="h-4 w-4 text-emerald-300" /><div><strong>{notification.title}</strong><p>{notification.message}</p></div></div>}

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        {activeTab === 'console' && <div className="space-y-8">
          <section className="hero-panel">
            <div className="hero-copy">
              <div className="eyebrow"><span className="live-dot" /> On-call intelligence for production incidents</div>
              <h1>Don’t debug the same outage twice.</h1>
              <p>RecallOps remembers how your team solved past incidents, warns you about fixes that made things worse, and gives you a safe next step in plain English.</p>
              <div className="hero-actions"><button className="primary-button" onClick={() => document.getElementById('incident-form')?.scrollIntoView({ behavior: 'smooth' })}><Zap className="h-4 w-4" /> Try the 60-second demo <ChevronRight className="h-4 w-4" /></button><button className="text-button" onClick={() => setActiveTab('lab')}><GitCompare className="h-4 w-4" /> See why memory matters</button></div>
            </div>
            <div className="hero-proof"><div className="proof-orbit"><Database className="h-6 w-6" /><span>Hindsight<br /><b>memory</b></span></div><div className="proof-line" /><div className="proof-card"><span className="proof-label">PAST INCIDENT FOUND</span><strong>Checkout 504s</strong><span>“A restart made it worse last time.”</span><b className="proof-safe"><ShieldCheck className="h-3.5 w-3.5" /> Safe rollback suggested</b></div></div>
          </section>

          <section className="metric-grid"><div><span>What judges can see</span><strong>1 clear workflow</strong><small>One incident, one safer decision</small></div><div><span>Past experience stored</span><strong>{memories.length} incidents</strong><small>Searchable team memory</small></div><div><span>Safety guardrail</span><strong>Read-only first</strong><small>No automatic production changes</small></div><div><span>Human feedback</span><strong>Gets smarter</strong><small>Save the confirmed outcome</small></div></section>

          <section className="story-strip"><div className="story-title"><Sparkles className="h-4 w-4 text-cyan-300" /><span>How RecallOps works</span><small>Three steps. No AI jargon.</small></div><div className="story-step active"><span>1</span><div><b>Tell it what is broken</b><small>Logs, service, and recent changes</small></div></div><ChevronRight className="story-chevron" /><div className="story-step"><span>2</span><div><b>It searches team memory</b><small>Finds similar incidents and failed fixes</small></div></div><ChevronRight className="story-chevron" /><div className="story-step"><span>3</span><div><b>You get a safer plan</b><small>Check first, then act with evidence</small></div></div></section>

          <div id="incident-form"><IncidentForm onSubmit={handleAnalyzeIncident} isLoading={isLoading} /></div>
          {investigationPlan && <InvestigationPlanView plan={investigationPlan} retrievedEvidence={retrievedEvidence} onInspectEvidence={handleInspectEvidence} onOpenOutcomeModal={() => setIsOutcomeModalOpen(true)} onExportReport={() => setIsExportModalOpen(true)} onOpenBeforeAfterLab={() => setActiveTab('lab')} />}
        </div>}
        {activeTab === 'lab' && <BeforeAfterLab memories={memories} onInspectEvidence={handleInspectEvidence} />}
        {activeTab === 'memories' && <MemoryBankView memories={memories} onInspectEvidence={handleInspectEvidence} onResetMemories={handleResetMemories} onAddNewMemoryClick={() => setIsOutcomeModalOpen(true)} />}
        {activeTab === 'checklist' && <SubmissionChecklistView onNavigateToConsole={() => setActiveTab('console')} onNavigateToLab={() => setActiveTab('lab')} onNavigateToMemories={() => setActiveTab('memories')} onInspectEvidence={handleInspectEvidence} memoryCount={memories.length} />}
      </main>

      <EvidenceDrawer evidence={inspectedEvidence} onClose={() => setInspectedEvidence(null)} />
      <OutcomeModal isOpen={isOutcomeModalOpen} onClose={() => setIsOutcomeModalOpen(false)} currentIncident={currentIncident} onSaveOutcome={handleSaveOutcome} />
      <ExportModal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} incident={currentIncident} plan={investigationPlan} evidence={retrievedEvidence} />
      <footer className="site-footer"><span><b>RecallOps</b> · The incident teammate that remembers.</span><span>Built with Hindsight · Advisory only</span></footer>
    </div>
  );
}
