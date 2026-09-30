import { useState } from "react";
import api, { errMsg } from "../api/client";
import useApi from "../hooks/useApi";
import { Badge, Button, Card, Empty, ErrorBox, PageHeader, Spinner } from "../components/ui";

const fmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "TBA");
const tone = { registered: "brand", shortlisted: "warn", selected: "ok", rejected: "bad" };

export default function StudentDrives() {
  const { data, loading, error, reload } = useApi("/drives");
  const [msg, setMsg] = useState("");

  async function register(id) {
    setMsg("");
    try { await api.post(`/drives/${id}/register`); reload(); }
    catch (e) { setMsg(errMsg(e)); }
  }

  if (loading) return <Spinner />;
  return (
    <>
      <PageHeader title="Placement drives" subtitle="Register for drives you are eligible for. Eligibility is based on your CGPA, backlogs and department." />
      <ErrorBox>{error || msg}</ErrorBox>
      {!data?.length && <Empty>No drives have been announced yet.</Empty>}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {data?.map((d) => (
          <Card key={d._id}>
            <div className="flex items-start justify-between gap-2">
              <div><h2 className="font-bold">{d.title}</h2><p className="text-sm text-ink-soft">{d.company?.name} &middot; {d.role}</p></div>
              <Badge tone={d.status === "completed" ? "neutral" : "brand"}>{d.status}</Badge>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-ink-soft">Drive date</dt><dd>{fmt(d.date)}</dd>
              <dt className="text-ink-soft">Register by</dt><dd>{fmt(d.deadline)}</dd>
              <dt className="text-ink-soft">Package</dt><dd>{d.package || "Not disclosed"}</dd>
              <dt className="text-ink-soft">Eligibility</dt>
              <dd>CGPA {d.eligibility?.minCgpa}+, up to {d.eligibility?.maxBacklogs} backlogs{d.eligibility?.departments?.length ? `, ${d.eligibility.departments.join("/")}` : ""}</dd>
            </dl>
            <div className="mt-4">
              {d.myStatus ? <Badge tone={tone[d.myStatus]}>You are {d.myStatus}</Badge>
                : d.status === "completed" ? <Badge>Closed</Badge>
                : d.eligible ? <Button onClick={() => register(d._id)}>Register</Button>
                : <Badge tone="warn">Not eligible. Update your CGPA or department in your profile.</Badge>}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
