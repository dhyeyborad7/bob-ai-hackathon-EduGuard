# EduGuard AI — Source Code

This directory contains all source code for EduGuard AI.

## Structure

```
src/
├── index.html          ← Main application entry point
├── css/
│   └── style.css       ← Full UI stylesheet (dark theme, glassmorphism, animations)
└── js/
    ├── data.js         ← Synthetic student dataset (25 CHARUSAT students)
    ├── predictor.js    ← Risk scoring engine (weighted multi-factor model)
    └── app.js          ← Main SPA logic (4 views, IBM Bob chat, CSV import)
```

## Running

```bash
python3 -m http.server 8080
# Open http://localhost:8080
```

## Key Files

- **`predictor.js`** — The AI risk engine. Contains `calculateRiskScore()`, `getTopRiskFactors()`, `generateInterventions()`, and `getDropoutProbability()`. This is where IBM Bob's scoring logic lives.
- **`app.js`** — Full SPA. Dashboard, Students, Bob AI, Analytics views. CSV import/export, localStorage persistence, animated student modals, IBM Bob chat simulation.
- **`data.js`** — 25 realistic synthetic students from CHARUSAT departments (CE, IT, AIML, CSE, ME, EC) across all 4 years, with a deliberate mix of high/medium/low risk profiles.
