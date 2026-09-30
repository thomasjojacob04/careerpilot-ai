import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errMsg } from "../api/client";
import useApi from "../hooks/useApi";
import { preloadModel } from "../hooks/useObjectDetection";
import { Badge, Button, Card, ErrorBox, Field, Input, PageHeader, Select } from "../components/ui";

const RULES = [
  "The interview runs in full-screen. Leaving full-screen ends it.",
  "Switching tabs or apps ends it.",
  "Your camera must stay on. A phone, a book, or a second person in view ends it.",
  "Copy, paste, right-click and developer tools are blocked. Three attempts end it.",
  "Questions are read aloud. Answer by voice (Chrome or Edge) or type your answer.",
];

export default function InterviewSetup() {
  const nav = useNavigate();
  const history = useApi("/interview/history");
  const [form, setForm] = useState({ role: "", difficulty: "medium", count: 5 });
  const [camOk, setCamOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const speechOk = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => { preloadModel().catch(() => {}); }, []); // warm the detection model while the student reads the rules

  async function checkCamera() {
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true });
      s.getTracks().forEach((t) => t.stop());
      setCamOk(true);
    } catch { setError("Camera permission was blocked. Allow camera access in your browser and try again."); }
  }

  async function start(e) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { data } = await api.post("/interview/start", { ...form, count: Number(form.count) });
      nav(`/interview/room/${data.id}`);
    } catch (err) { setError(errMsg(err)); setBusy(false); }
  }

  return (
    <>
      <PageHeader title="Proctored mock interview" subtitle="A voice-based interview scored on clarity, correctness, completeness and communication." />
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <form onSubmit={start} className="space-y-4">
            <Field label="Role you are interviewing for"><Input required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Full Stack Developer" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Difficulty">
                <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </Select>
              </Field>
              <Field label="Questions">
                <Select value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })}>{[3, 5, 7, 10].map((n) => <option key={n}>{n}</option>)}</Select>
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="ghost" onClick={checkCamera}>{camOk ? "Camera works" : "Test camera"}</Button>
              {camOk && <Badge tone="ok">Ready</Badge>}
              {!speechOk && <Badge tone="warn">Voice input needs Chrome or Edge. You can type instead.</Badge>}
            </div>
            <ErrorBox>{error}</ErrorBox>
            <Button disabled={busy || !camOk} className="w-full">{busy ? "Preparing your questions..." : "Start interview"}</Button>
            {!camOk && <p className="text-xs text-ink-soft">Test your camera to unlock the start button.</p>}
          </form>
        </Card>
        <Card>
          <h2 className="mb-3 font-bold">Rules</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm">{RULES.map((r) => <li key={r}>{r}</li>)}</ul>
        </Card>
      </div>

      <h2 className="mb-3 mt-8 font-bold">Past interviews</h2>
      <div className="space-y-2">
        {history.data?.length === 0 && <p className="text-sm text-ink-soft">No interviews yet.</p>}
        {history.data?.filter((h) => h.status !== "in_progress").map((h) => (
          <Link key={h._id} to={`/interview/result/${h._id}`} className="flex items-center justify-between rounded-lg border border-line bg-white p-4 hover:border-brand">
            <div><p className="font-semibold">{h.role}</p><p className="text-xs text-ink-soft">{new Date(h.startedAt).toLocaleString()} &middot; {h.difficulty}</p></div>
            {h.status === "completed" ? <Badge tone="ok">{h.overallScore} / 10</Badge> : <Badge tone="bad">Cancelled</Badge>}
          </Link>
        ))}
      </div>
    </>
  );
}
