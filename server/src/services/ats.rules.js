/** Deterministic checks that keep the ATS score stable between runs. */
export function ruleChecks(text) {
  const lower = text.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean).length;
  const bullets = (text.match(/^\s*[•\-*▪●]/gm) || []).length;
  const has = (re) => re.test(lower);

  const checks = [
    { name: "Email address found", pass: /[\w.+-]+@[\w-]+\.[\w.]+/.test(text), weight: 10 },
    { name: "Phone number found", pass: /(\+?\d[\d\s-]{8,}\d)/.test(text), weight: 8 },
    { name: "LinkedIn or GitHub link", pass: has(/linkedin\.com|github\.com/), weight: 6 },
    { name: "Education section", pass: has(/\beducation\b|\bacademic/), weight: 10 },
    { name: "Skills section", pass: has(/\bskills\b|technologies|technical/), weight: 12 },
    { name: "Projects or experience section", pass: has(/\bprojects?\b|\bexperience\b|\binternship/), weight: 14 },
    { name: "Summary or objective", pass: has(/\bsummary\b|\bobjective\b|\bprofile\b/), weight: 6 },
    { name: "Length between 250 and 900 words", pass: words >= 250 && words <= 900, weight: 10 },
    { name: "Uses bullet points", pass: bullets >= 5, weight: 8 },
    {
      name: "Uses action verbs",
      pass: (lower.match(/\b(developed|built|designed|implemented|created|led|optimi[sz]ed|analy[sz]ed|deployed|integrated|improved)\b/g) || []).length >= 4,
      weight: 8,
    },
    { name: "Contains measurable results (numbers or %)", pass: /\d+\s?%|\b\d{2,}\+?\b/.test(text), weight: 8 },
  ];
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.filter((c) => c.pass).reduce((s, c) => s + c.weight, 0);
  return { score: Math.round((got / total) * 100), checks, words };
}
