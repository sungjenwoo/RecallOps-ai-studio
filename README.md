# RecallOps: AI Incident-Response Assistant with Persistent Hindsight

> **Advisory SRE incident-response assistant that remembers previous problems, failed fixes, and successful resolutions—so engineers don't have to start from zero each time.**

RecallOps solves the acute challenge faced by on-call engineers, IT operations, and reliability teams: when critical services (like checkout, auth, or databases) fail, incident knowledge usually sits trapped in old tickets or scattered notes. 

RecallOps retrieves that historical experience via **Hindsight**, correlates symptoms, and synthesizes an **evidence-based investigation plan** with verifiable references `[E1]`, safe read-only checks, and explicit warnings against previously failed actions.

---

## Key Capabilities

1. **Active Incident Analysis**:
   - Ingests symptoms, stack traces, affected service, severity (`SEV1`-`SEV3`), and recent deployments.
   - Includes 5 labelled synthetic scenarios for 1-click evaluation (Checkout 504 pool starvation, Redis auth connection leak, Stripe 429 rate limit storm, PostgreSQL read replica lag, and Cold Start).

2. **Verifiable Evidence Inspector `[E1]`, `[E2]`, `[E3]`**:
   - Every recommendation references historical precedent. Responders can click any `[E#]` citation to inspect the verified postmortem, past failed actions, and winning resolution.

3. **Anti-Pattern Warnings (What NOT to do)**:
   - Identifies past failed actions that worsened outages (e.g., warning: *"DO NOT blindly restart checkout pods—in Incident [E1], restarting triggered a 1,200 connection thundering herd to PostgreSQL and delayed recovery by 45 minutes"*).

4. **Safe Read-Only Diagnostic Checks**:
   - Provides concrete bash/SQL commands with copy-to-clipboard buttons, explaining why each check must be performed before touching production.

5. **Human-Confirmed Outcome Feedback Loop**:
   - Responders record confirmed root causes, failed attempts, and winning fixes into the Hindsight Memory Bank.
   - Newly learned lessons immediately inform future incident triage without model retraining.

6. **Hindsight Impact Lab (Before vs. After Demonstration)**:
   - Controlled comparative evaluation demonstrating how naive LLM advice (e.g. recommending pod restarts) causes catastrophic downtime, whereas Hindsight-equipped RecallOps steers engineers away from traps and toward verified fixes.

7. **Hackathon Submission & Judge Checklist**:
   - Live audit panel verifying all 8 deliverables from the project brief.

---

## Architectural Principles

- **Advisory AI Only**: Never mutates production, restarts pods, or drops database tables autonomously.
- **Dynamic Persistent Memory vs. Retraining**: The model's recommendations change because it receives relevant stored experience from Hindsight, avoiding costly and slow weight fine-tuning.
- **Hypothesis Labeling**: Unsupported inferences are strictly labelled as hypotheses (`High`, `Medium`, `Low` confidence) paired with read-only verification steps.

---

## Local Development & Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
