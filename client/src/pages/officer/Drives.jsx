import { useState } from "react";
import api, { errMsg } from "../../api/client";
import useApi from "../../hooks/useApi";
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, PageHeader, Select, Spinner, Textarea } from "../../components/ui";

const blank = { company: "", title: "", role: "", package: "", location: "", date: "", deadline: "", minCgpa: 6, maxBacklogs: 0, departments: "", rounds: "", status: "upcoming", description: "" };
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
const tone = { registered: "brand", shortlisted: "warn", selected: "ok", rejected: "bad" };

function Manage({ drive }) {
  const regs = useApi(`/drives/${drive._id}/registrations`);
  const elig = useApi(`/drives/${drive._id}/eligible-students`);
  const [err, setErr] = useState("");

  async function setStatus(studentId, status) {
    try { await api.put(`/drives/${drive._id}/registrations/${studentId}`, { status }); regs.reload(); }
    catch (e) { setErr(errMsg(e)); }
  }

  return (
    <div className="mt-4 grid gap-5 border-t border-line pt-4 lg:grid-cols-2">
      <ErrorBox>{err}</ErrorBox>
      <div>
        <h3 className="mb-2 font-bold">Registered ({regs.data?.length ?? 0})</h3>
        {regs.loading ? <Spinner /> : !regs.data?.length ? <p className="text-sm text-ink-soft">No registrations yet.</p> : (
          <ul className="space-y-2">
            {regs.data.map((r) => (
              <li key={r.student?._id} className="flex items-center justify-between gap-2 rounded-md bg-paper p-2 text-sm">
                <span className="min-w-0 truncate"><b>{r.student?.name}</b> <span className="text-ink-soft">{r.profile?.rollNo}</span></span>
                <Select value={r.status} onChange={(e) => setStatus(r.student._id, e.target.value)} aria-label={`Status for ${r.student?.name}`}>
                  {["registered", "shortlisted", "selected", "rejected"].map((s) => <option key={s}>{s}</option>)}
                </Select>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h3 className="mb-2 font-bold">Eligible students ({elig.data?.length ?? 0})</h3>
        {elig.loading ? <Spinner /> : !elig.data?.length ? <p className="text-sm text-ink-soft">No students match the criteria.</p> : (
          <ul className="max-h-72 space-y-1 overflow-y-auto text-sm">
            {elig.data.map((p) => (
              <li key={p._id} className="flex justify-between rounded-md bg-paper px-3 py-1.5">
                <span>{p.user?.name} <span className="text-ink-soft">{p.department} &middot; {p.cgpa}</span></span>
                <Badge tone={p.readiness?.score >= 70 ? "ok" : "warn"}>{p.readiness?.score ?? 0}%</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function Drives() {
  const drives = useApi("/drives");
  const companies = useApi("/companies");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(null);
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const csv = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

  async function save(e) {
    e.preventDefault();
    setMsg("");
    const body = {
      company: form.company, title: form.title, role: form.role, package: form.package, location: form.location, description: form.description,
      date: form.date || undefined, deadline: form.deadline || undefined, status: form.status, rounds: csv(form.rounds),
      eligibility: { minCgpa: Number(form.minCgpa), maxBacklogs: Number(form.maxBacklogs), departments: csv(form.departments) },
    };
    try {
      if (editing) await api.put(`/drives/${editing}`, body); else await api.post("/drives", body);
      setForm(blank); setEditing(null); drives.reload();
    } catch (err) { setMsg(errMsg(err)); }
  }
  function edit(d) {
    setEditing(d._id);
    setForm({
      company: d.company?._id || "", title: d.title, role: d.role, package: d.package || "", location: d.location || "", date: day(d.date), deadline: day(d.deadline),
      minCgpa: d.eligibility?.minCgpa ?? 0, maxBacklogs: d.eligibility?.maxBacklogs ?? 0, departments: (d.eligibility?.departments || []).join(", "),
      rounds: (d.rounds || []).join(", "), status: d.status, description: d.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function remove(d) {
    if (!confirm(`Delete "${d.title}" and its registrations?`)) return;
    try { await api.delete(`/drives/${d._id}`); drives.reload(); } catch (err) { setMsg(errMsg(err)); }
  }

  return (
    <>
      <PageHeader title="Placement drives" subtitle="Create drives, set eligibility, and move students through shortlisting and selection." />
      <Card className="mb-6">
        <form onSubmit={save} className="grid gap-4 md:grid-cols-3">
          <Field label="Company">
            <Select required value={form.company} onChange={set("company")}>
              <option value="">Choose a company</option>
              {(companies.data || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Drive title"><Input required value={form.title} onChange={set("title")} /></Field>
          <Field label="Role"><Input required value={form.role} onChange={set("role")} /></Field>
          <Field label="Drive date"><Input type="date" value={form.date} onChange={set("date")} /></Field>
          <Field label="Registration deadline"><Input type="date" value={form.deadline} onChange={set("deadline")} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={set("status")}><option>upcoming</option><option>ongoing</option><option>completed</option></Select>
          </Field>
          <Field label="Minimum CGPA"><Input type="number" step="0.1" min="0" max="10" value={form.minCgpa} onChange={set("minCgpa")} /></Field>
          <Field label="Max backlogs"><Input type="number" min="0" value={form.maxBacklogs} onChange={set("maxBacklogs")} /></Field>
          <Field label="Departments" hint="Comma separated. Leave empty for all."><Input value={form.departments} onChange={set("departments")} /></Field>
          <Field label="Package"><Input value={form.package} onChange={set("package")} /></Field>
          <Field label="Location"><Input value={form.location} onChange={set("location")} /></Field>
          <Field label="Rounds (comma separated)"><Input value={form.rounds} onChange={set("rounds")} placeholder="Online test, Technical, HR" /></Field>
          <Field label="Description" className="md:col-span-3"><Textarea rows={2} value={form.description} onChange={set("description")} /></Field>
          <div className="flex items-center gap-3 md:col-span-3">
            <Button>{editing ? "Save drive" : "Create drive"}</Button>
            {editing && <Button type="button" variant="ghost" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</Button>}
          </div>
        </form>
        <div className="mt-3"><ErrorBox>{msg}</ErrorBox></div>
      </Card>

      {drives.loading ? <Spinner /> : !drives.data?.length ? <Empty>No drives yet. Add a company first, then create a drive.</Empty> : (
        <div className="space-y-4">
          {drives.data.map((d) => (
            <Card key={d._id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{d.title}</h2>
                  <p className="text-sm text-ink-soft">{d.company?.name} &middot; {d.role} &middot; {d.date ? new Date(d.date).toLocaleDateString() : "Date TBA"}</p>
                  <p className="mt-1 text-xs text-ink-soft">CGPA {d.eligibility?.minCgpa}+, up to {d.eligibility?.maxBacklogs} backlogs{d.eligibility?.departments?.length ? `, ${d.eligibility.departments.join("/")}` : ", all departments"}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Badge tone="brand">{d.registeredCount} registered</Badge><Badge>{d.status}</Badge>
                  <button onClick={() => setOpen(open === d._id ? null : d._id)} className="font-semibold text-brand">{open === d._id ? "Hide" : "Manage"}</button>
                  <button onClick={() => edit(d)} className="font-semibold text-brand">Edit</button>
                  <button onClick={() => remove(d)} className="font-semibold text-bad">Delete</button>
                </div>
              </div>
              {open === d._id && <Manage drive={d} />}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
