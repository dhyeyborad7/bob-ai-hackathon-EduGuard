# Architecture — EduGuard AI

## System Architecture Diagram

```mermaid
graph TD
    A[👤 Academic Coordinator] -->|Opens browser| B[EduGuard AI Frontend\nHTML5 / CSS3 / JS]

    B -->|Loads student data| C{Data Source}
    C -->|CSV Import| D[📊 University ERP Export\n.csv file]
    C -->|Manual Entry| E[📝 Add Student Form]
    C -->|Default| F[🧪 Synthetic Demo Dataset\n25 CHARUSAT students]

    D --> G[🔄 Data Normaliser\npredictor.js]
    E --> G
    F --> G

    G -->|Compute risk| H[⚡ Risk Scoring Engine\nWeighted Multi-Factor Model\n8 academic + behavioural signals]
    H -->|Risk score 0-100| I[📦 Student Risk Profile\nriskScore · riskLevel · topFactors\ninterventions · dropoutProbability]
    I -->|Persisted| J[💾 localStorage\nBrowser-side persistence]

    B -->|Renders 4 views| K[📊 Dashboard View]
    B --> L[👥 Students Grid View]
    B --> M[🤖 IBM Bob AI Chat View]
    B --> N[📈 Analytics View]

    M -->|Natural language queries| O[IBM Bob Agent Mode\nwatsonx.ai Foundation Model]
    O -->|Student analysis| P[Risk Pattern Detection]
    O -->|Intervention design| Q[IBM Bob Plan Mode\nMulti-stakeholder intervention sequences]
    O -->|Batch analysis| R[IBM Bob Subagents\nParallel student record processing]
    O -->|Scheduled reports| S[IBM Bob Background Tasks\nWeekly coordinator digest]

    O -->|MCP Integrations| T[🔗 External Systems]
    T --> T1[CHARUSAT FMIS\nAttendance API]
    T --> T2[Exam Results Portal]
    T --> T3[Student Welfare Cell DB]

    N -->|Visualised by| U[Chart.js\nDonut · Bar · Radar · Stacked]
```

---

## Component Table

| Component | Technology | Responsibility |
|-----------|-----------|---------------|
| **EduGuard Frontend** | HTML5, CSS3, Vanilla JS | SPA shell, routing, rendering 4 views |
| **Risk Scoring Engine** | `predictor.js` (JS) | Weighted multi-factor risk computation, intervention generation |
| **Student Data Layer** | `data.js` + localStorage | Synthetic demo data, CSV import, client-side persistence |
| **IBM Bob Agent** | IBM Bob Agent Mode | Conversational AI, student risk analysis, NLP queries |
| **IBM Bob Planner** | IBM Bob Plan Mode | Intervention sequence design before recommending actions |
| **IBM Bob Subagents** | IBM Bob Subagents | Parallel batch processing of large student datasets |
| **MCP: Attendance** | IBM Bob MCP | Real-time sync with CHARUSAT FMIS attendance system |
| **MCP: Exam Portal** | IBM Bob MCP | Pull current semester marks and backlog data |
| **Analytics Engine** | Chart.js 4.4 (CDN) | Interactive charts: donut, bar, radar, stacked bar |
| **Data Persistence** | Web localStorage API | Persist imported student data across sessions |

---

## Data Flow — End to End

```
1. COORDINATOR opens EduGuard AI in browser
        ↓
2. app.js → loadData() → checks localStorage → falls back to STUDENTS[] in data.js
        ↓
3. predictor.js → processStudent(s) → calculateRiskScore() → getRiskLevel() → getTopRiskFactors() → generateInterventions()
        ↓
4. APP_DATA[] populated with 25 fully-scored student objects
        ↓
5. navigate('dashboard') renders overview stats + high-risk table + donut chart
        ↓
6. COORDINATOR clicks student → openModal() → animated SVG risk gauge + factor breakdown + Bob intervention plan
        ↓
7. COORDINATOR opens Bob AI chat → types query → getBobResponse() simulates IBM Bob Agent Mode → returns formatted analysis
        ↓
8. COORDINATOR imports CSV → parseCSV() → processStudent() for each row → APP_DATA updated → saveData() to localStorage
        ↓
9. Analytics view → buildCharts() → Chart.js renders 4 charts using live APP_DATA
```

---

## Security & Scalability Notes

- **No credentials stored in code** — `.env.example` defines all environment variables; no `.env` committed
- **Client-side only (demo)** — Production would add server-side auth and HTTPS
- **IBM Bob subagents** enable horizontal scaling — 1,000 student batch analysis runs without degrading main chat responsiveness
- **MCP pattern** ensures EduGuard can connect to any university's existing data systems without re-architecting the frontend
- **localStorage** is suitable for demo; production would use IndexedDB or a secured backend API
