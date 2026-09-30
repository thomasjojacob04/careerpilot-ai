import { useEffect, useState } from "react";
import api, { errMsg } from "../api/client";
import { Badge, Bar, Button, Card, Empty, ErrorBox, PageHeader } from "../components/ui";

export default function Careers() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { api.get("/careers").then((r) => setData(r.data)).catch(() => {}); }, []);

  async function generate() {
    setBusy(true); setError("");
    try { setData((await api.post("/careers/recommend")).data); }
    catch (e) { setError(errMsg(e)); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader
        title="Career recommendations"
        subtitle="Roles that fit your skills, projects and interests, with the skills that would raise each match."
        action={<Button onClick={generate} disabled={busy}>{busy ? "Thinking..." : data ? "Refresh suggestions" : "Suggest roles"}</Button>}
      />
      <ErrorBox>{error}</ErrorBox>
      {!data && !busy && <Empty>Add skills and projects to your profile, then choose Suggest roles.</Empty>}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.roles.map((r) => (
          <Card key={r.title}>
            <div className="mb-2 flex items-start justify-between gap-2">
              <h2 className="font-bold">{r.title}</h2>
              <Badge tone={r.matchPercent >= 70 ? "ok" : "brand"}>{r.matchPercent}% match</Badge>
            </div>
            <Bar value={r.matchPercent} />
            <p className="mt-3 text-sm">{r.reason}</p>
            {r.topSkillsToAdd?.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-ink-soft">Learn next:</span>
                {r.topSkillsToAdd.map((s) => <Badge key={s} tone="warn">{s}</Badge>)}
              </div>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
