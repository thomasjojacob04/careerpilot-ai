import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import useApi from "../../hooks/useApi";
import { Card, Empty, ErrorBox, PageHeader, Spinner } from "../../components/ui";

const Chart = ({ title, note, data, children, layout = "horizontal", height = 260 }) => (
  <Card>
    <h2 className="font-bold">{title}</h2>
    {note && <p className="mb-3 text-xs text-ink-soft">{note}</p>}
    {!data?.length ? <Empty>Not enough data yet.</Empty> : (
      <div style={{ height }}>
        <ResponsiveContainer>
          <BarChart data={data} layout={layout} margin={{ left: layout === "vertical" ? 40 : 0 }}>
            <CartesianGrid stroke="#dde2ee" vertical={layout === "vertical"} horizontal={layout !== "vertical"} />
            {children}
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </Card>
);

export default function Analytics() {
  const { data, loading, error } = useApi("/officer/analytics");
  if (loading) return <Spinner />;
  if (error) return <ErrorBox>{error}</ErrorBox>;

  return (
    <>
      <PageHeader title="Reports and analytics" subtitle="Use these to decide where training time is best spent." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Chart title="Readiness distribution" note="Number of students in each readiness band" data={data.readinessDistribution}>
          <XAxis dataKey="range" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} width={30} tick={{ fontSize: 12 }} /><Tooltip />
          <Bar dataKey="count" name="Students" fill="#2b59ff" radius={[4, 4, 0, 0]} />
        </Chart>

        <Chart title="Average readiness by department" data={data.departmentReadiness}>
          <XAxis dataKey="department" tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} width={30} tick={{ fontSize: 12 }} /><Tooltip />
          <Bar dataKey="avg" name="Avg readiness" fill="#188a63" radius={[4, 4, 0, 0]} />
        </Chart>

        <Chart title="Most common missing skills" note="Across students' latest skill gap reports" data={data.topMissingSkills} layout="vertical" height={320}>
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} /><YAxis type="category" dataKey="skill" width={100} tick={{ fontSize: 12 }} /><Tooltip />
          <Bar dataKey="students" name="Students" fill="#b56f08" radius={[0, 4, 4, 0]} />
        </Chart>

        <Chart title="Drive funnel" note="Registered, shortlisted and selected per drive" data={data.driveFunnel} height={320}>
          <XAxis dataKey="title" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} width={30} tick={{ fontSize: 12 }} /><Tooltip /><Legend />
          <Bar dataKey="registered" name="Registered" fill="#9db4ff" /><Bar dataKey="shortlisted" name="Shortlisted" fill="#2b59ff" /><Bar dataKey="selected" name="Selected" fill="#188a63" />
        </Chart>
      </div>

      <h2 className="mb-3 mt-8 font-bold">Mock interviews</h2>
      {!data.interviews.length ? <Empty>No interviews taken yet.</Empty> : (
        <div className="grid gap-4 sm:grid-cols-3">
          {data.interviews.map((i) => (
            <Card key={i.status}>
              <p className="text-sm font-semibold capitalize text-ink-soft">{i.status.replace("_", " ")}</p>
              <p className="text-3xl font-extrabold">{i.count}</p>
              {i.avgScore != null && <p className="text-xs text-ink-soft">Average score {i.avgScore} / 10</p>}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
