import { useState } from "react";
import api, { errMsg } from "../api/client";
import { Badge, Bar, Button, Card, ErrorBox, Field, List, PageHeader, ScoreRing, Textarea } from "../components/ui";

export default function AtsAnalyzer() {
  const [file, setFile] = useState(null);
  const [target, setTarget] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function analyze(e) {
    e.preventDefault();
    if (!file) return setError("Choose a PDF or DOCX file first.");
    setBusy(true); setError(""); setResult(null);
    const body = new FormData();
    body.append("resume", file);
    body.append("target", target);
    try { setResult((await api.post("/ats/analyze", body)).data); }
    catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="ATS resume check" subtitle="Your file is read in memory and discarded straight away. Only the score is saved to update your readiness." />
      <Card>
        <form onSubmit={analyze} className="grid gap-4 md:grid-cols-2">
          <Field label="Resume (PDF or DOCX, max 5 MB)">
            <input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files[0])}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-soft file:px-4 file:py-2 file:font-semibold file:text-brand-dark" />
          </Field>
          <Field label="Target role or job description (optional)">
            <Textarea rows={3} value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Paste a job description, or type a role like Backend Developer" />
          </Field>
          <div className="md:col-span-2"><Button disabled={busy}>{busy ? "Analysing..." : "Analyse resume"}</Button></div>
        </form>
      </Card>
      <div className="mt-4"><ErrorBox>{error}</ErrorBox></div>

      {result && (
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          <Card className="flex flex-col items-center gap-3">
            <ScoreRing value={result.atsScore} label="ATS score" />
            <p className="text-center text-xs text-ink-soft">60% AI review ({result.aiScore}) + 40% rule checks ({result.ruleScore})</p>
            <div className="w-full">
              <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">Keyword match</span><span>{result.keywordMatch}%</span></div>
              <Bar value={result.keywordMatch} />
            </div>
          </Card>
          <Card className="md:col-span-2">
            <h2 className="mb-3 font-bold">Rule checks</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {result.checks.map((c) => (
                <li key={c.name} className="flex items-center gap-2 text-sm">
                  <Badge tone={c.pass ? "ok" : "bad"}>{c.pass ? "Pass" : "Fix"}</Badge>{c.name}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="md:col-span-2">
            <h2 className="mb-3 font-bold">What to improve</h2>
            <List items={result.suggestions} />
            {result.formattingIssues.length > 0 && (<><h3 className="mb-2 mt-4 font-bold">Formatting issues</h3><List items={result.formattingIssues} /></>)}
          </Card>
          <Card>
            <h2 className="mb-3 font-bold">Missing keywords</h2>
            <div className="flex flex-wrap gap-2">
              {result.missingKeywords.length ? result.missingKeywords.map((k) => <Badge key={k} tone="warn">{k}</Badge>) : <span className="text-sm text-ink-soft">None found.</span>}
            </div>
            {result.strengths.length > 0 && (<><h3 className="mb-2 mt-4 font-bold">Strengths</h3><List items={result.strengths} tone="text-ok" /></>)}
          </Card>
          {Object.keys(result.sectionFeedback).length > 0 && (
            <Card className="md:col-span-3">
              <h2 className="mb-3 font-bold">Section feedback</h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                {Object.entries(result.sectionFeedback).map(([k, v]) => (
                  <div key={k}><dt className="text-sm font-bold capitalize">{k}</dt><dd className="text-sm text-ink-soft">{v}</dd></div>
                ))}
              </dl>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
