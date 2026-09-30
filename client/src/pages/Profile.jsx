import { useEffect, useState } from "react";
import api, { errMsg } from "../api/client";
import { Badge, Bar, Button, Card, Empty, ErrorBox, Field, Input, PageHeader, Select, Spinner, Textarea } from "../components/ui";

const TABS = ["Basics", "Skills", "Projects", "Certifications", "Education"];

const SECTIONS = {
  skills: {
    fields: [
      { name: "name", label: "Skill", required: true },
      { name: "level", label: "Level", options: ["Beginner", "Intermediate", "Advanced"], default: "Intermediate" },
    ],
    title: (i) => i.name,
    meta: (i) => i.level,
  },
  projects: {
    fields: [
      { name: "title", label: "Project title", required: true },
      { name: "description", label: "What does it do? What did you build?", textarea: true },
      { name: "techStack", label: "Tech stack (comma separated)", list: true },
      { name: "link", label: "Link (GitHub or live URL)" },
    ],
    title: (i) => i.title,
    meta: (i) => (i.techStack || []).join(", "),
    body: (i) => i.description,
  },
  certifications: {
    fields: [
      { name: "title", label: "Certification", required: true },
      { name: "issuer", label: "Issued by" },
      { name: "date", label: "Year" },
      { name: "url", label: "Credential URL" },
    ],
    title: (i) => i.title,
    meta: (i) => [i.issuer, i.date].filter(Boolean).join(", "),
  },
  education: {
    fields: [
      { name: "degree", label: "Degree", required: true },
      { name: "institution", label: "Institution", required: true },
      { name: "year", label: "Years (e.g. 2022-2026)" },
      { name: "score", label: "CGPA or percentage" },
    ],
    title: (i) => i.degree,
    meta: (i) => [i.institution, i.year, i.score].filter(Boolean).join(", "),
  },
};

function SectionEditor({ section, items, onChange }) {
  const cfg = SECTIONS[section];
  const blank = () => Object.fromEntries(cfg.fields.map((f) => [f.name, f.default || ""]));
  const [form, setForm] = useState(blank());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    setBusy(true); setError("");
    const body = { ...form };
    cfg.fields.filter((f) => f.list).forEach((f) => { body[f.name] = form[f.name].split(",").map((x) => x.trim()).filter(Boolean); });
    try {
      onChange((await api.post(`/profile/${section}`, body)).data);
      setForm(blank());
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  }
  async function remove(id) {
    try { onChange((await api.delete(`/profile/${section}/${id}`)).data); } catch (err) { setError(errMsg(err)); }
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Card>
        <form onSubmit={add} className="space-y-3">
          {cfg.fields.map((f) => (
            <Field key={f.name} label={f.label}>
              {f.options ? (
                <Select value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>{f.options.map((o) => <option key={o}>{o}</option>)}</Select>
              ) : f.textarea ? (
                <Textarea value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
              ) : (
                <Input required={f.required} value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
              )}
            </Field>
          ))}
          <ErrorBox>{error}</ErrorBox>
          <Button disabled={busy}>Add</Button>
        </form>
      </Card>
      <div className="space-y-3">
        {items.length === 0 && <Empty>Nothing here yet. Add your first entry using the form.</Empty>}
        {items.map((i) => (
          <Card key={i._id} className="flex items-start justify-between gap-3 !p-4">
            <div className="min-w-0">
              <p className="font-bold">{cfg.title(i)}</p>
              {cfg.meta(i) && <p className="text-sm text-ink-soft">{cfg.meta(i)}</p>}
              {cfg.body?.(i) && <p className="mt-1 text-sm">{cfg.body(i)}</p>}
            </div>
            <button onClick={() => remove(i._id)} className="text-sm font-semibold text-bad" aria-label={`Remove ${cfg.title(i)}`}>Remove</button>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Basics({ profile, onChange }) {
  const [form, setForm] = useState({
    rollNo: profile.rollNo || "", department: profile.department || "", batch: profile.batch || "",
    cgpa: profile.cgpa ?? "", backlogs: profile.backlogs ?? 0, phone: profile.phone || "",
    github: profile.links?.github || "", linkedin: profile.links?.linkedin || "", portfolio: profile.links?.portfolio || "",
    targetRole: profile.targetRole || "", interests: (profile.interests || []).join(", "),
  });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    try {
      const { data } = await api.put("/profile", {
        rollNo: form.rollNo, department: form.department, batch: form.batch, phone: form.phone,
        cgpa: form.cgpa === "" ? undefined : Number(form.cgpa), backlogs: Number(form.backlogs) || 0,
        links: { github: form.github, linkedin: form.linkedin, portfolio: form.portfolio },
        targetRole: form.targetRole, interests: form.interests.split(",").map((x) => x.trim()).filter(Boolean),
      });
      onChange(data);
      setMsg("Saved");
    } catch (err) { setMsg(errMsg(err)); } finally { setBusy(false); }
  }

  return (
    <Card>
      <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
        <Field label="Roll number"><Input value={form.rollNo} onChange={set("rollNo")} /></Field>
        <Field label="Department"><Input value={form.department} onChange={set("department")} placeholder="Computer Science" /></Field>
        <Field label="Batch (graduation year)"><Input value={form.batch} onChange={set("batch")} placeholder="2026" /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={set("phone")} /></Field>
        <Field label="CGPA (0-10)"><Input type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={set("cgpa")} /></Field>
        <Field label="Active backlogs"><Input type="number" min="0" value={form.backlogs} onChange={set("backlogs")} /></Field>
        <Field label="GitHub URL"><Input value={form.github} onChange={set("github")} /></Field>
        <Field label="LinkedIn URL"><Input value={form.linkedin} onChange={set("linkedin")} /></Field>
        <Field label="Portfolio URL"><Input value={form.portfolio} onChange={set("portfolio")} /></Field>
        <Field label="Target job role" hint="Used for skill gap and readiness."><Input value={form.targetRole} onChange={set("targetRole")} placeholder="Full Stack Developer" /></Field>
        <Field label="Interests (comma separated)" className="md:col-span-2"><Input value={form.interests} onChange={set("interests")} placeholder="Web development, AI, open source" /></Field>
        <div className="flex items-center gap-3 md:col-span-2">
          <Button disabled={busy}>Save changes</Button>
          {msg && <span role="status" className="text-sm font-semibold text-ink-soft">{msg}</span>}
        </div>
      </form>
    </Card>
  );
}

export default function Profile() {
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("Basics");
  const [error, setError] = useState("");

  useEffect(() => { api.get("/profile").then((r) => setState(r.data)).catch((e) => setError(errMsg(e))); }, []);
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!state) return <Spinner />;
  const { profile, completeness } = state;

  return (
    <>
      <PageHeader title="My profile" subtitle="Your resume, skill gap analysis and interview questions are all built from this profile." />
      <Card className="mb-5 !p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold">Profile completeness</span>
          <Badge tone={completeness >= 80 ? "ok" : "warn"}>{completeness}%</Badge>
        </div>
        <Bar value={completeness} />
      </Card>
      <div className="mb-5 flex gap-1 overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold ${tab === t ? "bg-ink text-white" : "bg-white text-ink-soft hover:text-ink"}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === "Basics" ? (
        <Basics profile={profile} onChange={setState} />
      ) : (
        <SectionEditor key={tab} section={tab.toLowerCase()} items={profile[tab.toLowerCase()] || []} onChange={setState} />
      )}
    </>
  );
}
