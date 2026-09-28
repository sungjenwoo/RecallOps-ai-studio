# RecallOps

> **The incident-response teammate that remembers what went wrong last time.**

RecallOps helps on-call engineers respond to production outages without repeating old mistakes. An engineer describes what is broken, RecallOps searches the team’s past incident memory through **Hindsight**, warns about fixes that previously made an outage worse, and suggests safe read-only checks before any production change.

## The problem in simple words

During an outage, engineers are under pressure. The same mistakes happen again because the useful context is hidden in old tickets and postmortems. A generic AI can suggest a plausible fix, but it does not know what failed in **this team’s** systems before.

## What makes RecallOps different

- **It remembers real incidents:** past symptoms, root causes, failed actions, successful fixes, and lessons.
- **It makes memory visible:** every matched precedent is shown as clickable evidence such as `[E1]`.
- **It prevents repeat mistakes:** the plan clearly says what not to do when a previous action made an outage worse.
- **It starts safely:** the first recommendations are read-only checks, not automatic production changes.
- **It learns from the team:** after an incident is resolved, a human can save the confirmed outcome. That lesson becomes available to future responders without retraining the model.

## 60-second judge demo

1. Open the **Incident console**. The page explains the product in one sentence: *Don’t debug the same outage twice.*
2. Click **Find the safest next step** on the preloaded Checkout 504 scenario.
3. Point out **Memory found** and the `[E1]` evidence card: RecallOps found a similar past incident.
4. Point out **Do not make it worse**: the previous incident proves that blindly restarting pods caused a larger database outage.
5. Point out **Check before you change anything**: the assistant gives copyable read-only checks first.
6. Open **Why memory matters** to compare generic AI advice with the Hindsight-backed response.
7. Optionally click **Save the lesson** to show the feedback loop.

## Architecture

```text
Incident details
      ↓
Hindsight memory retrieval
      ↓
Evidence-backed plan + failed-action warnings
      ↓
Human-confirmed outcome
      ↓
New searchable team memory
```

The app includes a resilient local analytical engine for the demo, seeded with realistic synthetic incidents. If a Gemini key is configured, the server can also synthesize a structured response using the retrieved evidence. The assistant is advisory only and never mutates production.

## Run locally

```bash
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:3000`.

For a production client build:

```bash
npm run lint
npm run build
```

## Hackathon alignment

- **Innovation:** turns postmortems into a live safety layer for incident response.
- **Use of Hindsight:** persistent memory is central to retrieval, warnings, evidence, and future improvement.
- **Technical implementation:** React + TypeScript client, Express API, structured incident memory, deterministic fallback, and optional Gemini synthesis.
- **User experience:** a guided scenario can be demonstrated in under one minute.
- **Real-world impact:** helps SRE and operations teams reduce repeated mistakes during high-pressure outages.
