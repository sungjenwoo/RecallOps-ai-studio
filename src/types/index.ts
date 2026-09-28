export type Severity = 'SEV1' | 'SEV2' | 'SEV3';

export interface IncidentMemory {
  id: string;
  evidenceCode: string; // e.g. E1, E2, E3
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
  severity: Severity;
  tags: string[];
  relevanceScore?: number;
}

export interface SyntheticScenario {
  id: string;
  title: string;
  service: string;
  severity: Severity;
  symptoms: string;
  recentChanges: string;
  badgeLabel: string;
  description: string;
}

export interface Hypothesis {
  rank: number;
  title: string;
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
  evidenceReference: string | null;
}

export interface ReadOnlyCheck {
  step: number;
  name: string;
  command: string;
  expectedObservation: string;
  whyBeforeAction: string;
}

export interface ActionToAvoid {
  action: string;
  reason: string;
  citedEvidence: string;
}

export interface RecommendedRemediation {
  priority: number;
  action: string;
  rationale: string;
  verificationStep: string;
}

export interface InvestigationPlan {
  summary: string;
  hypotheses: Hypothesis[];
  readOnlyChecks: ReadOnlyCheck[];
  actionsToAvoid: ActionToAvoid[];
  recommendedRemediations: RecommendedRemediation[];
  confidenceScore: number;
}

export interface IncidentSubmission {
  id?: string;
  title: string;
  service: string;
  severity: Severity;
  symptoms: string;
  recentChanges: string;
}

export interface IncidentOutcomeInput {
  incidentId: string;
  service: string;
  title: string;
  rootCause: string;
  failedActions: string[];
  successfulFix: string;
  lessonsLearned: string[];
  timeToResolveMinutes: number;
  severity: Severity;
  responder: string;
}
