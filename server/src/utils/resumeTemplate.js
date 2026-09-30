const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const TEMPLATES = ["classic", "modern"];

export function renderResumeHtml(r, template = "classic") {
  const modern = template === "modern";
  const accent = modern ? "#2b59ff" : "#111827";
  const font = modern ? "'Helvetica Neue', Arial, sans-serif" : "Georgia, 'Times New Roman', serif";
  const links = [r.links?.github, r.links?.linkedin, r.links?.portfolio].filter(Boolean);
  const contact = [r.email, r.phone, ...links].filter(Boolean).map(esc).join(" &nbsp;|&nbsp; ");

  const section = (title, body) => (body ? `<section><h2>${title}</h2>${body}</section>` : "");

  const education = (r.education || [])
    .map((e) => `<div class="row"><span><b>${esc(e.degree)}</b>, ${esc(e.institution)}</span><span>${esc(e.year)}${e.score ? " &middot; " + esc(e.score) : ""}</span></div>`)
    .join("");

  const skills = Object.entries(r.skills || {})
    .filter(([, list]) => Array.isArray(list) && list.length)
    .map(([group, list]) => `<p><b>${esc(group)}:</b> ${list.map(esc).join(", ")}</p>`)
    .join("");

  const projects = (r.projects || [])
    .map((p) => `
      <div class="proj">
        <div class="row"><span><b>${esc(p.title)}</b></span><span>${esc((p.techStack || []).join(", "))}</span></div>
        <ul>${(p.bullets || []).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>
      </div>`)
    .join("");

  const certs = (r.certifications || [])
    .map((c) => `<li>${esc(c.title)}${c.issuer ? ", " + esc(c.issuer) : ""}${c.date ? " (" + esc(c.date) + ")" : ""}</li>`)
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(r.name)} - Resume</title>
<style>
  *{box-sizing:border-box} body{font-family:${font};color:#1f2937;font-size:11px;line-height:1.5;margin:0;padding:8px}
  header{${modern ? `background:${accent};color:#fff;padding:16px 18px;border-radius:4px;` : `border-bottom:2px solid ${accent};padding-bottom:8px;text-align:center;`}}
  h1{margin:0;font-size:24px;letter-spacing:.3px} .contact{margin-top:4px;font-size:10.5px;${modern ? "opacity:.92" : "color:#4b5563"}}
  h2{font-size:12px;margin:14px 0 6px;padding-bottom:2px;border-bottom:1px solid ${modern ? "#c7d2fe" : "#9ca3af"};color:${accent};text-transform:uppercase;letter-spacing:.8px}
  .row{display:flex;justify-content:space-between;gap:12px} ul{margin:3px 0 6px 16px;padding:0} li{margin:1px 0} p{margin:2px 0} .proj{margin-bottom:6px}
</style></head><body>
<header><h1>${esc(r.name)}</h1><div class="contact">${contact}</div></header>
${section("Summary", r.summary ? `<p>${esc(r.summary)}</p>` : "")}
${section("Education", education)}
${section("Skills", skills)}
${section("Projects", projects)}
${section("Certifications", certs ? `<ul>${certs}</ul>` : "")}
</body></html>`;
}
