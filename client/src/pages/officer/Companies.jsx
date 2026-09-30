import { useState } from "react";
import api, { errMsg } from "../../api/client";
import useApi from "../../hooks/useApi";
import { Button, Card, Empty, ErrorBox, Field, Input, PageHeader, Spinner, Textarea } from "../../components/ui";

const blank = { name: "", industry: "", website: "", packageRange: "", roles: "", description: "" };

export default function Companies() {
  const { data, loading, error, reload } = useApi("/companies");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setMsg("");
    const body = { ...form, roles: form.roles.split(",").map((x) => x.trim()).filter(Boolean) };
    try {
      if (editing) await api.put(`/companies/${editing}`, body); else await api.post("/companies", body);
      setForm(blank); setEditing(null); reload();
    } catch (err) { setMsg(errMsg(err)); }
  }
  function edit(c) {
    setEditing(c._id);
    setForm({ name: c.name, industry: c.industry || "", website: c.website || "", packageRange: c.packageRange || "", roles: (c.roles || []).join(", "), description: c.description || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function remove(c) {
    if (!confirm(`Delete ${c.name}?`)) return;
    try { await api.delete(`/companies/${c._id}`); reload(); } catch (err) { setMsg(errMsg(err)); }
  }

  return (
    <>
      <PageHeader title="Companies" subtitle="Recruiters you work with. Drives are created against a company." />
      <Card className="mb-6">
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <Field label="Company name"><Input required value={form.name} onChange={set("name")} /></Field>
          <Field label="Industry"><Input value={form.industry} onChange={set("industry")} /></Field>
          <Field label="Website"><Input value={form.website} onChange={set("website")} /></Field>
          <Field label="Package range"><Input value={form.packageRange} onChange={set("packageRange")} placeholder="6-9 LPA" /></Field>
          <Field label="Hiring roles (comma separated)" className="md:col-span-2"><Input value={form.roles} onChange={set("roles")} /></Field>
          <Field label="Description" className="md:col-span-2"><Textarea rows={2} value={form.description} onChange={set("description")} /></Field>
          <div className="flex items-center gap-3 md:col-span-2">
            <Button>{editing ? "Save company" : "Add company"}</Button>
            {editing && <Button type="button" variant="ghost" onClick={() => { setEditing(null); setForm(blank); }}>Cancel</Button>}
          </div>
        </form>
        <div className="mt-3"><ErrorBox>{msg}</ErrorBox></div>
      </Card>

      {loading ? <Spinner /> : error ? <ErrorBox>{error}</ErrorBox> : !data.length ? <Empty>No companies yet. Add your first recruiter above.</Empty> : (
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper text-ink-soft"><tr><th className="p-3">Company</th><th className="p-3">Industry</th><th className="p-3">Roles</th><th className="p-3">Package</th><th className="p-3" /></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c._id} className="border-b border-line last:border-0">
                  <td className="p-3 font-semibold">{c.name}</td><td className="p-3">{c.industry}</td>
                  <td className="p-3">{(c.roles || []).join(", ")}</td><td className="p-3">{c.packageRange}</td>
                  <td className="whitespace-nowrap p-3 text-right">
                    <button onClick={() => edit(c)} className="mr-3 font-semibold text-brand">Edit</button>
                    <button onClick={() => remove(c)} className="font-semibold text-bad">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
