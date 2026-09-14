# Setup Guide — EduGuard AI

## Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Any modern web browser | Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+ | Open browser |
| Python 3 (for local server) | 3.6+ | `python3 --version` |
| Internet connection | Required for Google Fonts + Chart.js CDN | — |
| IBM Bob account | Free trial at bob.ibm.com/trial | Required for IBM Bob integration |

> **No Node.js, no npm, no backend server, no database required.** EduGuard AI is a pure static web application.

---

## Environment Variables

No environment variables are required to run the demo version.

For production IBM Bob API integration, create a `.env` file (never commit it — it is in `.gitignore`):

```bash
# .env (DO NOT COMMIT — use .env.example as template)
WATSONX_API_KEY=your_ibm_watsonx_api_key_here
WATSONX_PROJECT_ID=your_watsonx_project_id_here
IBM_BOB_MCP_ENDPOINT=https://your-bob-mcp-server.ibm.com/api
CHARUSAT_FMIS_API_KEY=your_fmis_api_key_here
```

See `.env.example` for the full list with descriptions.

---

## Installation Steps

### Step 1 — Clone or download the repository

```bash
git clone https://github.com/dhyeyborad7/bob-ai-hackathon-EduGuard.git
cd bob-ai-hackathon-EduGuard
```

Or download as ZIP from GitHub and extract.

### Step 2 — Navigate to the source directory

```bash
cd src/
```

### Step 3 — Start the local web server

```bash
python3 -m http.server 8080
```

You should see:
```
Serving HTTP on 0.0.0.0 port 8080 (http://0.0.0.0:8080/) ...
```

### Step 4 — Open in browser

Open your browser and go to:
```
http://localhost:8080
```

You should see the EduGuard AI dashboard with 25 pre-loaded student risk profiles.

---

## Verifying It's Working

✅ **Dashboard loads** with 4 stat cards (Total Students, High Risk, Medium Risk, Low Risk)

✅ **Risk donut chart** renders in the top-right of the dashboard

✅ **Student cards** appear in the "All Students" view with coloured risk badges

✅ **IBM Bob AI chat** responds when you type a query or click a suggestion chip

✅ **Student modal** opens with animated circular risk gauge when you click a student

✅ **Analytics charts** (4 charts) load in the Analytics view

---

## Importing Your Own Student Data

1. Go to **All Students** view → click **📂 Import CSV**
2. Download the sample template by clicking **"Download Sample CSV Template"**
3. Fill in your student data following the column format:
   ```
   name, dept, year, sem, rollNo, email, advisor, guardian,
   attendance, marks, assignments, lab, participation,
   financialStress, socialIssues, backlogs, trend, notes
   ```
4. Drag-and-drop your `.csv` file into the import modal
5. Preview the data → click **"Import X Students"**
6. Risk scores are computed automatically for all imported students

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Page loads but no charts appear | No internet connection (Chart.js CDN unreachable) | Enable internet or download Chart.js locally |
| Fonts look wrong | No internet connection (Google Fonts CDN) | Enable internet — fonts fall back to system sans-serif |
| `python3: command not found` | Python not installed | Install from python.org or use `python -m http.server 8080` |
| Port 8080 already in use | Another process is using 8080 | Use `python3 -m http.server 3000` and open http://localhost:3000 |
| Blank page | Browser JS disabled | Enable JavaScript in browser settings |
| CSV import not working | CSV has wrong column headers | Download sample template and match column names exactly |
| Data gone after restart | localStorage cleared | Re-import your CSV — demo data auto-reloads if localStorage is empty |
