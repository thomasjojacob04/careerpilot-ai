import { useState } from "react";
import api, { errMsg } from "../api/client";
import useApi from "../hooks/useApi";
import { Badge, Button, Card, Empty, ErrorBox, Field, PageHeader, ScoreRing, Select, Spinner } from "../components/ui";

export default function SkillGap() {
  const roles = useApi("/skillgap/roles");
  const history = useApi("/skillgap/history");
  const [roleId, setRoleId] = useState("");
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try { setReport((await api.post("/skillgap/analyze", { roleId })).data); history.reload(); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  }

  if (roles.loading) return <Spinner />;
  return (
    <>
      <PageHeader title="Skill gap analysis" subtitle="Compares your skills and project tech stacks with what a role asks for, then builds a learning path for the gaps." />
      <Card>
        <form onSubmit={run} className="flex flex-wrap items-end gap-3">
          <Field label="Target role" className="min-w-64 flex-1">
            <Select required value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              <option value="">Choose a role</option>
              {(roles.data || []).map((r) => <option key={r._id} value={r._id}>{r.title}</option>)}
            </Select>
          </Field>
          <Button disabled={busy || !roleId}>{busy ? "Analysing..." : "Analyse gap"}</Button>
        </form>
      </Card>
      <div className="mt-4"><ErrorBox>{error}</ErrorBox></div>

      {report && (
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <Card className="flex flex-col items-center gap-2">
            <ScoreRing value={report.matchPercent} label="skill match" />
            <p className="text-sm text-ink-soft">{report.targetRole}</p>
          </Card>
          <Card className="md:col-span-2">
            <h2 className="mb-2 font-bold">You already have</h2>
            <div className="mb-4 flex flex-wrap gap-2">
              {report.matched.length ? report.matched.map((s) => <Badge key={s} tone="ok">{s}</Badge>) : <span className="text-sm text-ink-soft">No matching skills yet.</span>}
            </div>
            <h2 className="mb-2 font-bold">Still missing</h2>
            <div className="flex flex-wrap gap-2">
              {report.missing.length ? report.missing.map((s) => <Badge key={s} tone="warn">{s}</Badge>) : <span className="text-sm text-ok">Nothing missing. You cover every required skill.</span>}
            </div>
          </Card>
          {report.learningPath.length > 0 && (
            <Card className="md:col-span-3">
              <h2 className="mb-4 font-bold">Your learning path</h2>
              <ol className="space-y-4">
                {[...report.learningPath].sort((a, b) => a.order - b.order).map((step, i) => (
                  <li key={step.skill} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-dark">{i + 1}</span>
                    <div>
                      <p className="font-bold">{step.skill} <span className="text-sm font-medium text-ink-soft">{step.estimatedTime}</span></p>
                      <p className="text-sm">{step.why}</p>
                      <ul className="mt-1 list-disc pl-5 text-sm text-ink-soft">{step.resources.map((r, j) => <li key={j}>{r}</li>)}</ul>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      )}

      <h2 className="mb-3 mt-8 font-bold">Previous analyses</h2>
      {!history.data?.length ? <Empty>Your past analyses will appear here.</Empty> : (
        <div className="grid gap-3 sm:grid-cols-2">
          {history.data.map((h) => (
            <Card key={h._id} className="flex items-center justify-between !p-4">
              <div><p className="font-semibold">{h.targetRole}</p><p className="text-xs text-ink-soft">{new Date(h.createdAt).toLocaleDateString()}</p></div>
              <Badge tone={h.matchPercent >= 70 ? "ok" : "warn"}>{h.matchPercent}% match</Badge>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
