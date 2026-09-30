const ALIASES = {
  js: "javascript", "node": "node.js", nodejs: "node.js", "node js": "node.js",
  reactjs: "react", "react.js": "react", "react js": "react",
  "express.js": "express", expressjs: "express",
  mongo: "mongodb", postgres: "postgresql", psql: "postgresql",
  ts: "typescript", py: "python", ml: "machine learning", "ai": "machine learning",
  "html5": "html", "css3": "css", "k8s": "kubernetes", "rest api": "rest apis", "restful api": "rest apis", "restful apis": "rest apis",
  "problem solving": "data structures", dsa: "data structures", "data structures & algorithms": "data structures",
};

export const normalize = (s = "") => {
  const k = s.toLowerCase().trim().replace(/\s+/g, " ");
  return ALIASES[k] || k;
};

const LEVEL_FACTOR = { Beginner: 0.6, Intermediate: 0.85, Advanced: 1 };

/** Compare profile skills (plus project tech stacks) with a role's weighted requirements. */
export function matchSkills(profile, requiredSkills) {
  const owned = new Map();
  for (const s of profile.skills || []) owned.set(normalize(s.name), LEVEL_FACTOR[s.level] ?? 0.85);
  for (const p of profile.projects || [])
    for (const t of p.techStack || []) if (!owned.has(normalize(t))) owned.set(normalize(t), 0.7);

  let gained = 0, total = 0;
  const matched = [], missing = [];
  for (const req of requiredSkills) {
    const w = req.weight ?? 1;
    total += w;
    const factor = owned.get(normalize(req.name));
    if (factor) { gained += w * factor; matched.push(req.name); }
    else missing.push(req.name);
  }
  return { matched, missing, matchPercent: total ? Math.round((gained / total) * 100) : 0 };
}
