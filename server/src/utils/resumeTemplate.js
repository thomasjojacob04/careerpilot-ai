const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Escapes first, then turns **text** into bold, so it is safe to use inside bullets.
const rich = (s = "") => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");

// Only real web addresses become links (blocks javascript: and similar). A missing "https://" is added.
const safeUrl = (u) => {
  const v = String(u || "").trim();
  if (!v) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
};
const link = (href, label) => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;

export const TEMPLATES = ["professional", "classic", "modern"];

/* ------------------------------------------------------------------ */
/*  Everything the user can customise, with the values that are allowed */
/* ------------------------------------------------------------------ */

// Only these font stacks can be used, so user or AI input can never inject CSS.
// The PDF uses fonts installed on the server; the preview uses fonts installed on your computer.
export const FONTS = {
  latin: { label: "Modern sans (Latin Modern)", stack: "'Latin Modern Sans','Computer Modern Sans','Helvetica Neue',Arial,sans-serif" },
  helvetica: { label: "Arial / Helvetica", stack: "'Helvetica Neue',Helvetica,Arial,sans-serif" },
  calibri: { label: "Calibri", stack: "Calibri,Carlito,'Segoe UI',Arial,sans-serif" },
  verdana: { label: "Verdana", stack: "Verdana,'DejaVu Sans',Geneva,sans-serif" },
  georgia: { label: "Georgia (serif)", stack: "Georgia,'Times New Roman',serif" },
  times: { label: "Times New Roman (serif)", stack: "'Times New Roman',Times,'Liberation Serif',serif" },
  garamond: { label: "Garamond (serif)", stack: "Garamond,'EB Garamond','Times New Roman',serif" },
  mono: { label: "Monospace", stack: "'Courier New',Courier,monospace" },
};

export const SECTION_IDS = ["summary", "experience", "projects", "education", "skills", "certifications", "languages"];
export const DEFAULT_TITLES = {
  summary: "Professional Summary",
  experience: "Professional Experience",
  projects: "Projects",
  education: "Education",
  skills: "Skills",
  certifications: "Certifications",
  languages: "Languages",
};

export const STYLE_SCHEMA = {
  options: {
    font: Object.keys(FONTS),
    textAlign: ["left", "justify"], // alignment of the summary paragraph
    headerAlign: ["left", "center", "right"],
    headerStyle: ["plain", "banner"], // banner = coloured block behind the name
    nameCase: ["upper", "normal"],
    separator: ["|", "•", "·", "/", "-"], // between email, phone, location
    headingStyle: ["plain", "underline", "caps", "caps-underline", "bar"],
    headingAlign: ["left", "center"],
    bulletStyle: ["disc", "circle", "square", "dash", "none"],
    dateStyle: ["right", "inline"],
    skillsStyle: ["list", "inline", "chips"],
  },
  ranges: {
    fontSize: [8, 14], // pt
    lineHeight: [1.1, 2],
    nameSize: [16, 44], // px
    headingSize: [10, 20], // px
    sectionGap: [4, 36], // px between sections
    itemGap: [2, 24], // px between jobs / projects
    pagePadding: [0, 40], // px
  },
  colors: ["textColor", "headingColor", "nameColor", "bannerColor"],
};

const BASE = {
  font: "latin", textAlign: "left", headerAlign: "center", headerStyle: "plain", nameCase: "upper", separator: "|",
  headingStyle: "plain", headingAlign: "left", bulletStyle: "disc", dateStyle: "right", skillsStyle: "list",
  fontSize: 10.5, lineHeight: 1.45, nameSize: 25, headingSize: 14, sectionGap: 18, itemGap: 10, pagePadding: 8,
  textColor: "#111111", headingColor: "#000000", nameColor: "#000000", bannerColor: "#2b59ff",
};

export const PRESETS = {
  // Same look as the sample resume: centred name and title, bold headings, role and date on one line.
  professional: { ...BASE },
  classic: {
    ...BASE, font: "georgia", fontSize: 10, lineHeight: 1.5, nameCase: "normal", nameSize: 24, headingStyle: "caps-underline",
    headingSize: 12, sectionGap: 14, itemGap: 7, skillsStyle: "inline", textColor: "#1f2937", headingColor: "#111827", nameColor: "#111827",
  },
  modern: {
    ...BASE, font: "helvetica", fontSize: 10, lineHeight: 1.5, headerAlign: "left", headerStyle: "banner", nameCase: "normal", nameSize: 24,
    headingStyle: "caps-underline", headingSize: 12, sectionGap: 14, itemGap: 7, skillsStyle: "inline",
    textColor: "#1f2937", headingColor: "#2b59ff", nameColor: "#2b59ff",
  },
};

const isHex = (v) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);
const clampNum = (v, [lo, hi], fallback) => {
  if (v === null || v === undefined || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
};

/** Accepts anything, returns a complete, safe style object. Unknown or invalid values fall back to the preset. */
export function normalizeStyle(input, template = "professional") {
  const def = PRESETS[template] || PRESETS.professional;
  const src = input && typeof input === "object" ? input : {};
  const out = {};
  for (const [key, allowed] of Object.entries(STYLE_SCHEMA.options)) out[key] = allowed.includes(src[key]) ? src[key] : def[key];
  for (const [key, range] of Object.entries(STYLE_SCHEMA.ranges)) out[key] = clampNum(src[key], range, def[key]);
  for (const key of STYLE_SCHEMA.colors) out[key] = isHex(src[key]) ? src[key] : def[key];
  return out;
}

/** Section order, hidden sections and renamed headings. */
export function normalizeLayout(input) {
  const src = input && typeof input === "object" ? input : {};
  const order = [];
  for (const id of Array.isArray(src.order) ? src.order : []) if (SECTION_IDS.includes(id) && !order.includes(id)) order.push(id);
  for (const id of SECTION_IDS) if (!order.includes(id)) order.push(id);
  const hidden = (Array.isArray(src.hidden) ? src.hidden : []).filter((id, i, all) => SECTION_IDS.includes(id) && all.indexOf(id) === i);
  const titles = {};
  for (const id of SECTION_IDS) {
    const t = src.titles?.[id];
    titles[id] = typeof t === "string" && t.trim() ? t.trim().slice(0, 60) : DEFAULT_TITLES[id];
  }
  return { order, hidden, titles };
}

/* ------------------------------------------------------------------ */
/*  Renderer                                                           */
/* ------------------------------------------------------------------ */

export function renderResumeHtml(r, template = "professional", options = {}) {
  const base = TEMPLATES.includes(template) ? template : "professional";
  const s = normalizeStyle(options.style, base);
  const layout = normalizeLayout(options.layout);
  const banner = s.headerStyle === "banner";

  // Show short names (GitHub, LinkedIn, Portfolio) that open the full address, instead of printing the long URLs
  const links = [["GitHub", r.links?.github], ["LinkedIn", r.links?.linkedin], ["Portfolio", r.links?.portfolio]]
    .map(([label, url]) => (safeUrl(url) ? link(safeUrl(url), label) : ""));
  const email = r.email ? (/^[^\s@<>"']+@[^\s@<>"']+$/.test(r.email.trim()) ? link(`mailto:${r.email.trim()}`, r.email.trim()) : esc(r.email)) : "";
  const contact = [email, esc(r.phone || ""), esc(r.location || ""), ...links].filter(Boolean).join(` &nbsp;${esc(s.separator)}&nbsp; `);

  const bullets = (list = []) => {
    const items = list.filter((b) => b && String(b).trim());
    return items.length ? `<ul class="b-${s.bulletStyle}">${items.map((b) => `<li>${rich(b)}</li>`).join("")}</ul>` : "";
  };

  // role / degree on the left, dates on the right (or inline after the title)
  const head = (title, date) =>
    s.dateStyle === "inline"
      ? `<div><b>${title}</b>${date ? ` <span class="date">&nbsp;${esc(s.separator)}&nbsp; ${date}</span>` : ""}</div>`
      : `<div class="row"><b>${title}</b><span class="date">${date}</span></div>`;

  const builders = {
    summary: () => (r.summary ? `<p class="summary">${rich(r.summary)}</p>` : ""),

    experience: () =>
      (r.experience || [])
        .map((e) => {
          const dates = [e.start, e.end].filter(Boolean).map(esc).join(" &ndash; ");
          const org = [e.company, e.location].filter(Boolean).map(esc).join(", ");
          return `<div class="item">${head(esc(e.role), dates)}<div class="org">${org}</div>${bullets(e.bullets)}</div>`;
        })
        .join(""),

    projects: () =>
      (r.projects || [])
        .map((p) => `<div class="item">${head(esc(p.title), esc((p.techStack || []).join(", ")))}${bullets(p.bullets)}</div>`)
        .join(""),

    education: () =>
      (r.education || [])
        .map((e) => `<div class="item">${head(esc(e.degree), esc(e.year))}<div class="org">${esc(e.institution)}${e.score ? " &middot; " + esc(e.score) : ""}</div></div>`)
        .join(""),

    skills: () => {
      const entries = Object.entries(r.skills || {}).filter(([, list]) => Array.isArray(list) && list.length);
      if (!entries.length) return "";
      if (s.skillsStyle === "list") return `<ul class="b-${s.bulletStyle}">${entries.map(([g, l]) => `<li><b>${esc(g)}:</b> ${l.map(esc).join(", ")}</li>`).join("")}</ul>`;
      if (s.skillsStyle === "chips")
        return entries.map(([g, l]) => `<div class="sk"><b>${esc(g)}</b><div>${l.map((x) => `<span class="chip">${esc(x)}</span>`).join("")}</div></div>`).join("");
      return entries.map(([g, l]) => `<p><b>${esc(g)}:</b> ${l.map(esc).join(", ")}</p>`).join("");
    },

    certifications: () => {
      const items = (r.certifications || [])
        .map((c) => `<li>${esc(c.title)}${c.issuer ? ", " + esc(c.issuer) : ""}${c.date ? " (" + esc(c.date) + ")" : ""}</li>`)
        .join("");
      return items ? `<ul class="b-${s.bulletStyle}">${items}</ul>` : "";
    },

    languages: () => {
      const items = (r.languages || [])
        .map((l) => `<li>${esc(l.name)}${l.proficiency ? " &ndash; " + esc(l.proficiency) + " proficiency" : ""}</li>`)
        .join("");
      return items ? `<ul class="b-${s.bulletStyle}">${items}</ul>` : "";
    },
  };

  const body = layout.order
    .filter((id) => !layout.hidden.includes(id))
    .map((id) => {
      const html = builders[id]();
      return html ? `<section><h2 class="h-${s.headingStyle}">${esc(layout.titles[id])}</h2>${html}</section>` : "";
    })
    .join("\n");

  const css = `
  *{box-sizing:border-box}
  body{font-family:${FONTS[s.font].stack};color:${s.textColor};font-size:${s.fontSize}pt;line-height:${s.lineHeight};margin:0;padding:${s.pagePadding}px}
  header{text-align:${s.headerAlign};${banner ? `background:${s.bannerColor};color:#fff;padding:16px 18px;border-radius:4px;` : ""}}
  h1{margin:0;font-size:${s.nameSize}px;font-weight:700;letter-spacing:${s.nameCase === "upper" ? "1px" : ".3px"};${s.nameCase === "upper" ? "text-transform:uppercase;" : ""}color:${banner ? "#fff" : s.nameColor}}
  .headline{margin-top:3px;font-size:${Math.max(11, Math.round(s.nameSize * 0.56))}px;${banner ? "opacity:.95" : "opacity:.85"}}
  .contact{margin-top:6px;font-size:${Math.max(9, s.fontSize)}pt;${banner ? "opacity:.92" : "opacity:.85"}}
  h2{font-size:${s.headingSize}px;font-weight:700;color:${s.headingColor};margin:${s.sectionGap}px 0 8px;text-align:${s.headingAlign};page-break-after:avoid}
  h2.h-underline,h2.h-caps-underline{border-bottom:1px solid ${s.headingColor};padding-bottom:2px}
  h2.h-caps,h2.h-caps-underline{text-transform:uppercase;letter-spacing:.8px}
  h2.h-bar{border-left:4px solid ${s.headingColor};padding-left:8px}
  .row{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
  .date{white-space:nowrap}
  .org{margin-top:1px}
  .item{margin-bottom:${s.itemGap}px;page-break-inside:avoid}
  p{margin:3px 0}
  a{color:inherit;text-decoration:underline}
  .summary{text-align:${s.textAlign}}
  ul{margin:5px 0 0 18px;padding:0}
  li{margin:3px 0}
  ul.b-disc{list-style:disc} ul.b-circle{list-style:circle} ul.b-square{list-style:square}
  ul.b-none{list-style:none;margin-left:0}
  ul.b-dash{list-style:none;margin-left:14px} ul.b-dash li{position:relative} ul.b-dash li::before{content:"\\2013";position:absolute;left:-13px}
  .sk{margin:4px 0}
  .chip{display:inline-block;border:1px solid ${s.headingColor};border-radius:999px;padding:1px 9px;margin:3px 4px 1px 0;font-size:.92em}`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.name)} - Resume</title>
<style>${css}
</style></head><body>
<header><h1>${esc(r.name)}</h1>${r.headline ? `<div class="headline">${esc(r.headline)}</div>` : ""}<div class="contact">${contact}</div></header>
${body}
</body></html>`;
}