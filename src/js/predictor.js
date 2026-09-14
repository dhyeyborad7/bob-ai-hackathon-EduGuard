// EduGuard AI — Risk Prediction Engine
// Multi-factor weighted scoring model for student dropout risk

const WEIGHTS = {
  attendance:      0.28,
  marks:           0.25,
  assignments:     0.15,
  lab:             0.10,
  participation:   0.10,
  financialStress: 1.0,   // scale 0–10 → contributes 0–10 pts
  socialIssues:    0.5,   // scale 0–10 → contributes 0–5 pts
  backlogPenalty:  1.8    // per backlog, capped at 12 pts total
};

function calculateRiskScore(s) {
  const academic =
    (100 - s.attendance)   * WEIGHTS.attendance   +
    (100 - s.marks)        * WEIGHTS.marks         +
    (100 - s.assignments)  * WEIGHTS.assignments   +
    (100 - s.lab)          * WEIGHTS.lab           +
    (100 - s.participation)* WEIGHTS.participation;

  const behavioural =
    s.financialStress * WEIGHTS.financialStress +
    s.socialIssues    * WEIGHTS.socialIssues    +
    Math.min(s.backlogs * WEIGHTS.backlogPenalty, 12);

  const trendMod = s.trend === 'declining' ? 4 : s.trend === 'improving' ? -4 : 0;

  return Math.min(100, Math.max(0, Math.round(academic + behavioural + trendMod)));
}

function getRiskLevel(score) {
  if (score >= 66) return { level:'HIGH',   label:'High Risk',   color:'#ff4757', bg:'rgba(255,71,87,0.13)',  border:'rgba(255,71,87,0.35)',  icon:'🔴', emoji:'🚨' };
  if (score >= 36) return { level:'MEDIUM', label:'Medium Risk', color:'#ff9f43', bg:'rgba(255,159,67,0.13)', border:'rgba(255,159,67,0.35)', icon:'🟡', emoji:'⚠️' };
  return               { level:'LOW',    label:'Low Risk',    color:'#26de81', bg:'rgba(38,222,129,0.13)', border:'rgba(38,222,129,0.35)', icon:'🟢', emoji:'✅' };
}

function getTopRiskFactors(s) {
  return [
    { name:'Attendance',         value:s.attendance,      unit:'%',   threshold:75, icon:'📅', contrib:(100-s.attendance)*WEIGHTS.attendance,   status: s.attendance<60?'critical':s.attendance<75?'warning':'ok' },
    { name:'Internal Marks',     value:s.marks,           unit:'%',   threshold:60, icon:'📝', contrib:(100-s.marks)*WEIGHTS.marks,              status: s.marks<40?'critical':s.marks<55?'warning':'ok' },
    { name:'Assignment Rate',    value:s.assignments,     unit:'%',   threshold:80, icon:'📋', contrib:(100-s.assignments)*WEIGHTS.assignments,   status: s.assignments<50?'critical':s.assignments<70?'warning':'ok' },
    { name:'Lab Attendance',     value:s.lab,             unit:'%',   threshold:80, icon:'🔬', contrib:(100-s.lab)*WEIGHTS.lab,                  status: s.lab<65?'critical':s.lab<80?'warning':'ok' },
    { name:'Participation',      value:s.participation,   unit:'%',   threshold:70, icon:'🙋', contrib:(100-s.participation)*WEIGHTS.participation,status: s.participation<40?'critical':s.participation<60?'warning':'ok' },
    { name:'Financial Stress',   value:s.financialStress, unit:'/10', threshold:4,  icon:'💰', contrib:s.financialStress*WEIGHTS.financialStress, status: s.financialStress>=8?'critical':s.financialStress>=5?'warning':'ok' },
    { name:'Social Issues',      value:s.socialIssues,    unit:'/10', threshold:3,  icon:'👥', contrib:s.socialIssues*WEIGHTS.socialIssues,       status: s.socialIssues>=7?'critical':s.socialIssues>=4?'warning':'ok' },
    { name:'Active Backlogs',    value:s.backlogs,        unit:'',    threshold:0,  icon:'⚠️', contrib:Math.min(s.backlogs*WEIGHTS.backlogPenalty,12), status: s.backlogs>=3?'critical':s.backlogs>=1?'warning':'ok' },
  ].sort((a,b) => b.contrib - a.contrib);
}

function generateInterventions(s) {
  const list = [];

  if (s.attendance < 75) list.push({
    priority: s.attendance < 60 ? 'CRITICAL' : 'HIGH',
    type: 'Attendance Monitoring',
    action: `Issue formal attendance notice. Schedule urgent review with ${s.advisor}. Involve parent/guardian if < 65%.`,
    responsible: 'Class Teacher & Faculty Advisor',
    timeline: 'Within 48 hours',
    icon: '📅'
  });

  if (s.marks < 55) list.push({
    priority: s.marks < 40 ? 'CRITICAL' : 'HIGH',
    type: 'Academic Support Program',
    action: 'Enroll in subject-wise remedial sessions. Assign a peer mentor from senior semester. Set weekly progress review.',
    responsible: 'Academic Cell & Subject HOD',
    timeline: 'Within 1 week',
    icon: '📚'
  });

  if (s.financialStress >= 6) list.push({
    priority: s.financialStress >= 8 ? 'CRITICAL' : 'HIGH',
    type: 'Financial Aid Connect',
    action: 'Refer to Student Welfare Cell for scholarship, fee waiver, or emergency fund eligibility. CHARUSAT has 3 active aid programs.',
    responsible: 'Student Welfare Officer',
    timeline: 'Within 3 days',
    icon: '💰'
  });

  if (s.socialIssues >= 5) list.push({
    priority: 'MEDIUM',
    type: 'Counselling Referral',
    action: 'Book a session with CHARUSAT Counselling Cell. Assign a peer from the Student Mentoring Program. Weekly follow-up.',
    responsible: 'Campus Counsellor',
    timeline: 'Within 1 week',
    icon: '💬'
  });

  if (s.backlogs >= 2) list.push({
    priority: 'HIGH',
    type: 'Backlog Clearance Plan',
    action: `Create a structured study roadmap to clear ${s.backlogs} pending backlog(s) before next exam cycle. Dedicated faculty hour.`,
    responsible: 'Faculty Advisor & Academic Coordinator',
    timeline: 'Start immediately',
    icon: '📖'
  });

  if (s.participation < 50) list.push({
    priority: 'MEDIUM',
    type: 'Engagement Boost',
    action: 'Involve student in department club, hackathon team, or project group. Bi-weekly check-in with mentor.',
    responsible: 'Faculty Advisor & Student Club Coordinator',
    timeline: 'Within 2 weeks',
    icon: '🌱'
  });

  if (s.lab < 70) list.push({
    priority: 'MEDIUM',
    type: 'Lab Catch-up Session',
    action: 'Schedule make-up lab sessions for missed practicals. Pair with lab partner for remaining sessions.',
    responsible: 'Lab Instructor',
    timeline: 'This week',
    icon: '🔬'
  });

  if (list.length === 0) list.push({
    priority: 'LOW',
    type: 'Routine Monitoring',
    action: 'No immediate action required. Continue regular semester monitoring with monthly coordinator review.',
    responsible: 'Faculty Advisor',
    timeline: 'Monthly review',
    icon: '✅'
  });

  return list;
}

function getDropoutProbability(score) {
  if (score >= 80) return Math.min(88, 55 + (score-80)*1.65);
  if (score >= 66) return Math.min(55, 28 + (score-66)*1.93);
  if (score >= 36) return Math.min(28,  5 + (score-36)*0.77);
  return Math.max(1, Math.round(score * 0.13));
}

// ── Build processed student list ──────────────────────────────────────────
const PROCESSED = STUDENTS.map(s => {
  const score    = calculateRiskScore(s);
  const risk     = getRiskLevel(score);
  const factors  = getTopRiskFactors(s);
  const actions  = generateInterventions(s);
  const dropout  = Math.round(getDropoutProbability(score));
  return { ...s, riskScore:score, riskLevel:risk, topFactors:factors, interventions:actions, dropoutProbability:dropout };
});

function getStats() {
  const high   = PROCESSED.filter(s => s.riskLevel.level === 'HIGH').length;
  const medium = PROCESSED.filter(s => s.riskLevel.level === 'MEDIUM').length;
  const low    = PROCESSED.filter(s => s.riskLevel.level === 'LOW').length;
  const critical = PROCESSED.filter(s => s.riskScore >= 75).length;
  return { total: PROCESSED.length, high, medium, low, critical };
}
