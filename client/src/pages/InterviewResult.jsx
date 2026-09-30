import { Link, useParams } from "react-router-dom";
import useApi from "../hooks/useApi";
import { Badge, Card, ErrorBox, List, PageHeader, ScoreRing, Spinner } from "../components/ui";

export default function InterviewResult() {
  const { id } = useParams();
  const { data: s, loading, error } = useApi(`/interview/${id}`);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox>{error}</ErrorBox>;

  return (
    <>
      <PageHeader title={`${s.role} interview`} subtitle={new Date(s.startedAt).toLocaleString()}
        action={<Link to="/interview" className="text-sm font-semibold text-brand">Back to mock interviews</Link>} />

      {s.status === "cancelled" && (
        <Card className="mb-5 !border-bad/30 !bg-bad-soft">
          <p className="font-bold text-bad">This interview was cancelled</p>
          <p className="text-sm">Reason: {String(s.cancelReason || "").replace(/_/g, " ").toLowerCase()}. Cancelled interviews do not count towards your readiness score.</p>
        </Card>
      )}

      {s.status === "completed" && (
        <div className="grid gap-5 md:grid-cols-3">
          <Card className="flex flex-col items-center gap-2">
            <ScoreRing value={s.overallScore * 10} label="overall" />
            <p className="text-sm text-ink-soft">{s.overallScore} out of 10</p>
          </Card>
          <Card className="space-y-3 md:col-span-2">
            <p className="text-sm">{s.summary?.text}</p>
            {s.summary?.strengths?.length > 0 && (<><h3 className="font-bold">Strengths</h3><List items={s.summary.strengths} tone="text-ok" /></>)}
            {s.summary?.weaknesses?.length > 0 && (<><h3 className="font-bold">To work on</h3><List items={s.summary.weaknesses} /></>)}
            {s.summary?.nextSteps?.length > 0 && (<><h3 className="font-bold">Next steps</h3><List items={s.summary.nextSteps} /></>)}
          </Card>
        </div>
      )}

      <h2 className="mb-3 mt-8 font-bold">Question by question</h2>
      <div className="space-y-4">
        {s.questions.map((q, i) => (
          <Card key={i}>
            <div className="mb-2 flex items-start justify-between gap-3">
              <p className="font-bold">Q{i + 1}. {q.text}</p>
              <Badge tone="neutral">{q.type}</Badge>
            </div>
            {q.answeredAt ? (
              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  {Object.entries(q.scores).map(([k, v]) => <Badge key={k} tone={v >= 7 ? "ok" : v >= 4 ? "warn" : "bad"}>{k} {v}/10</Badge>)}
                </div>
                <p className="mb-2 rounded-md bg-paper p-3 text-sm text-ink-soft"><b className="text-ink">Your answer:</b> {q.answerTranscript || "(no answer)"}</p>
                <p className="text-sm">{q.feedback}</p>
                {q.improvement && <p className="mt-1 text-sm text-ink-soft"><b>Tip:</b> {q.improvement}</p>}
              </>
            ) : <p className="text-sm text-ink-soft">Not answered.</p>}
          </Card>
        ))}
      </div>

      {s.violations?.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 font-bold">Proctoring log</h2>
          <Card>
            <ul className="space-y-1 text-sm">
              {s.violations.map((v, i) => (
                <li key={i} className="flex justify-between"><span>{v.type.replace(/_/g, " ").toLowerCase()}</span><span className="text-ink-soft">{new Date(v.timestamp).toLocaleTimeString()}</span></li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </>
  );
}
