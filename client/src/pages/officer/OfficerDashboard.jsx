import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import { Badge, Card, Empty, ErrorBox, PageHeader, Spinner } from "../../components/ui";

const Stat = ({ label, value, hint }) => (
  <Card>
    <p className="text-sm font-semibold text-ink-soft">{label}</p>
    <p className="mt-1 text-3xl font-extrabold">{value}</p>
    {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
  </Card>
);

export default function OfficerDashboard() {
  const { data, loading, error } = useApi("/officer/dashboard");
  if (loading) return <Spinner />;
  if (error) return <ErrorBox>{error}</ErrorBox>;

  return (
    <>
      <PageHeader title="Placement overview" subtitle="Where your cohort stands today." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Registered students" value={data.students} />
        <Stat label="Average readiness" value={`${data.avgReadiness}%`} hint={`${data.readyStudents} students score 70 or above`} />
        <Stat label="Active drives" value={data.activeDrives} hint={`${data.companies} companies on file`} />
        <Stat label="Mock interviews completed" value={data.interviewsCompleted} />
      </div>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="font-bold">Upcoming drives</h2>
        <Link to="/officer/drives" className="text-sm font-semibold text-brand">Manage drives</Link>
      </div>
      {!data.upcomingDrives.length ? <Empty>No upcoming drives. Create one from the Drives page.</Empty> : (
        <div className="space-y-2">
          {data.upcomingDrives.map((d) => (
            <Card key={d._id} className="flex flex-wrap items-center justify-between gap-2 !p-4">
              <div><p className="font-semibold">{d.title}</p><p className="text-sm text-ink-soft">{d.company?.name} &middot; {d.role}</p></div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-ink-soft">{d.date ? new Date(d.date).toLocaleDateString() : "Date TBA"}</span>
                <Badge tone="brand">{d.registeredCount} registered</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
