import { Link } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useApi from "../hooks/useApi";
import { Bar, Card, ErrorBox, PageHeader, ScoreRing, Spinner } from "../components/ui";

const PARTS = [
  { key: "profile", label: "Profile completeness", to: "/profile", cta: "Complete your profile" },
  { key: "resume", label: "Resume (ATS score)", to: "/ats", cta: "Check your resume" },
  { key: "skills", label: "Skill match for target role", to: "/skill-gap", cta: "Run a skill gap analysis" },
  { key: "interview", label: "Mock interview (last 3)", to: "/interview", cta: "Take a mock interview" },
];

export default function Dashboard() {
  const { data, loading, error } = useApi("/readiness");
  const history = useApi("/readiness/history");

  if (loading) return <Spinner text="Calculating your readiness..." />;
  if (error) return <ErrorBox>{error}</ErrorBox>;

  const next = [...PARTS].sort((a, b) => data.breakdown[a.key] - data.breakdown[b.key])[0];
  const trend = (history.data || []).map((h) => ({ date: new Date(h.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }), score: h.score }));

  return (
    <>
      <PageHeader title="Placement readiness" subtitle="Four equal parts: profile, resume, skills and interview. Each is worth 25%." />
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="flex flex-col items-center justify-center gap-3 py-8">
          <ScoreRing value={data.score} size={190} label="out of 100" />
          <Link to={next.to} className="mt-2 rounded-md bg-brand-soft px-3 py-2 text-center text-sm font-semibold text-brand-dark">
            Biggest gain: {next.cta}
          </Link>
        </Card>

        <Card className="space-y-5 md:col-span-2">
          {PARTS.map((p) => (
            <div key={p.key}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <Link to={p.to} className="font-semibold hover:text-brand">{p.label}</Link>
                <span className="font-bold">{Math.round(data.breakdown[p.key])}%</span>
              </div>
              <Bar value={data.breakdown[p.key]} />
            </div>
          ))}
        </Card>

        <Card className="md:col-span-3">
          <h2 className="mb-3 font-bold">Your trend</h2>
          {trend.length < 2 ? (
            <p className="text-sm text-ink-soft">Your trend appears here after your score changes a few times. Update your profile or run a check.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid stroke="#dde2ee" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} width={30} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#2b59ff" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
