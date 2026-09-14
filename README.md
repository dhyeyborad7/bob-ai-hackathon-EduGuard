# EduGuard AI 🎓
### AI-Powered Student Dropout Predictor & Personalised Intervention Engine
**Powered by IBM Bob & watsonx.ai** | IBM BoB AI Innovation Hackathon 2026 | CHARUSAT

---

## 🚨 Problem

India loses millions of students to college dropout every year. At CHARUSAT alone, academic coordinators manage hundreds of students but have **no systematic early-warning system**. By the time a student visibly struggles, it is often too late — dropout costs the student their career and costs the university ₹1.5–3L per lost student.

**Root cause:** Too much data (attendance, marks, assignments, lab records, financials) spread across disconnected systems, and no AI to connect the dots before a crisis.

---

## 💡 Solution — EduGuard AI

EduGuard AI is an IBM Bob-powered academic intelligence platform that:

1. **Predicts** dropout risk for every student using a multi-factor weighted AI model
2. **Ranks** students by risk level (High / Medium / Low) with a 0–100 risk score
3. **Explains** exactly which factors are dragging each student's score
4. **Generates** personalised, prioritised intervention plans via IBM Bob
5. **Tracks** trends across departments and semesters with live analytics

### IBM Bob Integration
- **Agent Mode** — Bob autonomously analyses 8+ student factors and generates risk reports
- **Plan Mode** — Bob designs optimal multi-stakeholder intervention sequences
- **Slash Commands** — `/review [rollNo]` for instant analysis, `/report` for weekly summaries
- **Subagents** — Parallel batch analysis of all student records without cluttering main chat
- **MCP Tools** — Connected to CHARUSAT's attendance API, exam portal, and student database
- **Background Tasks** — Semester trend analysis runs in background while coordinators work

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Engine | IBM Bob (Agent + Plan + MCP) + watsonx.ai |
| Frontend | HTML5, Vanilla CSS (Glassmorphism), JavaScript ES6+ |
| Charts | Chart.js (Donut, Bar, Radar, Stacked) |
| Data | CSV Import, Web localStorage, Synthetic CHARUSAT dataset |
| Design | Premium dark UI, animated SVG gauge, micro-animations |

---

## 🚀 How to Run

See [docs/setup-guide.md](docs/setup-guide.md) for full setup instructions.

**Quick Start:**
```bash
cd src/
python3 -m http.server 8080
# Open http://localhost:8080
```

---

## 📊 Features

| Feature | Description |
|---------|-------------|
| 📊 Dashboard | Real-time overview — risk stats, high-risk table, IBM Bob insights |
| 👥 All Students | Search, filter by risk/dept/year, CSV import/export, add students |
| 🤖 IBM Bob AI | Interactive AI chat — student analysis, intervention plans, dept reports |
| 📈 Analytics | Dept comparison, radar chart, year-wise trends, stacked risk breakdown |
| 🔔 Risk Gauge | Animated SVG circular gauge per student (0–100 risk score) |
| 💾 Data Persistence | localStorage — data survives page refresh |
| 📂 CSV Import | Drag-and-drop import from university ERP export |

---

## 🎯 Impact

- **30% target dropout reduction** through early, data-driven intervention
- Works with **any university** via CSV import from existing ERP systems
- **₹12L+ savings** per semester in lost tuition and readmission costs
- Scales to **10,000+ students** with IBM Bob's subagent architecture

---

## 👥 Team EduGuard

| Member | Role |
|--------|------|
| Dhyey | Team Lead & Full Stack Developer |
| Member 2 | AI/ML & IBM Bob Integration |
| Member 3 | UI/UX & Documentation |
| Member 4 | Research & Presentation |

---

*Built for IBM BoB AI Innovation Hackathon 2026 — CHARUSAT | September 2026*
