import { useEffect, useState } from "react";
import api, { errMsg } from "../../api/client";
import { Badge, Bar, Button, Card, Empty, ErrorBox, Input, PageHeader, Select, Spinner } from "../../components/ui";

export default function Students() {
  const [filters, setFilters] = useState({ search: "", dept: "", minReadiness: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true); setError("");
      try { setData((await api.get("/officer/students", { params: { ...filters, page } })).data); }
      catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
    }, 250); // debounce typing in the search box
    return () => clearTimeout(t);
  }, [filters, page]);

  const change = (k) => (e) => { setPage(1); setFilters({ ...filters, [k]: e.target.value }); };

  async function exportCsv() {
    const res = await api.get("/officer/export/students.csv", { params: filters, responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    Object.assign(document.createElement("a"), { href: url, download: "students.csv" }).click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader title="Students" subtitle="Track individual readiness and find who needs support." action={<Button variant="ghost" onClick={exportCsv}>Export CSV</Button>} />
      <Card className="mb-5 grid gap-3 !p-4 md:grid-cols-3">
        <Input placeholder="Search name, email or roll number" value={filters.search} onChange={change("search")} aria-label="Search students" />
        <Select value={filters.dept} onChange={change("dept")} aria-label="Department">
          <option value="">All departments</option>
          {(data?.departments || []).map((d) => <option key={d}>{d}</option>)}
        </Select>
        <Select value={filters.minReadiness} onChange={change("minReadiness")} aria-label="Minimum readiness">
          <option value="">Any readiness</option><option value="40">40% and above</option><option value="70">70% and above</option>
        </Select>
      </Card>
      <ErrorBox>{error}</ErrorBox>
      {loading && !data ? <Spinner /> : !data?.items.length ? <Empty>No students match these filters.</Empty> : (
        <>
          <div className="overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-paper text-ink-soft">
                <tr><th className="p-3">Student</th><th className="p-3">Dept</th><th className="p-3">CGPA</th><th className="p-3">Target role</th><th className="p-3">ATS</th><th className="w-40 p-3">Readiness</th></tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p._id} className="border-b border-line last:border-0">
                    <td className="p-3"><p className="font-semibold">{p.user?.name}</p><p className="text-xs text-ink-soft">{p.rollNo || p.user?.email}</p></td>
                    <td className="p-3">{p.department || "-"}</td><td className="p-3">{p.cgpa ?? "-"}</td><td className="p-3">{p.targetRole || "-"}</td>
                    <td className="p-3">{p.latestAtsScore?.score != null ? <Badge tone={p.latestAtsScore.score >= 70 ? "ok" : "warn"}>{p.latestAtsScore.score}</Badge> : "-"}</td>
                    <td className="p-3"><div className="flex items-center gap-2"><Bar value={p.readiness?.score || 0} /><span className="w-8 text-right font-bold">{p.readiness?.score || 0}</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-ink-soft">
            <span>{data.total} students</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span>Page {data.page} of {data.pages || 1}</span>
              <Button variant="ghost" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
