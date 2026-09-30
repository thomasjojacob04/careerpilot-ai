import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { errMsg } from "../api/client";
import useProctor from "../hooks/useProctor";
import useCamera from "../hooks/useCamera";
import useObjectDetection from "../hooks/useObjectDetection";
import useSpeech from "../hooks/useSpeech";
import { Badge, Button, Card, ErrorBox, Spinner, Textarea } from "../components/ui";

const LABELS = {
  FULLSCREEN_EXIT: "You left full-screen mode",
  TAB_SWITCH: "You switched away from the interview",
  CAMERA_OFF: "Your camera was turned off",
  PHONE_DETECTED: "A mobile phone was detected",
  BOOK_DETECTED: "A book was detected",
  MULTIPLE_PERSONS: "More than one person was detected",
  NO_PERSON: "We cannot see you. Face the camera",
  COPY_PASTE: "Copy and paste are disabled",
  DEVTOOLS_ATTEMPT: "Developer tools and right-click are disabled",
  TOO_MANY_WARNINGS: "Too many warnings",
};

export default function InterviewRoom() {
  const { id } = useParams();
  const nav = useNavigate();
  const speech = useSpeech();

  const [session, setSession] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [phase, setPhase] = useState("ready"); // ready | asking | answering | scoring | feedback | finishing | cancelled
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [proctorOn, setProctorOn] = useState(false);

  const proctorRef = useRef(false);   // synchronous mirror of proctorOn, so handlers never see stale state
  const cancelledRef = useRef(false);
  const lastSent = useRef({});

  const setProctor = (v) => { proctorRef.current = v; setProctorOn(v); };

  const cancel = useCallback((reason) => {
    if (cancelledRef.current) return;
    cancelledRef.current = true;
    setProctor(false);
    speech.cancelAll();
    cam.stop();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setCancelReason(reason);
    setPhase("cancelled");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onViolation = useCallback(async (type) => {
    if (!proctorRef.current || cancelledRef.current) return;
    const now = Date.now();
    if (now - (lastSent.current[type] || 0) < 3000) return; // one report per type every 3 s
    lastSent.current[type] = now;
    try {
      const { data } = await api.post(`/interview/${id}/violation`, { type });
      if (data.cancelled) cancel(data.reason || type);
      else setWarning(`Warning ${data.warnings} of ${data.warningLimit}: ${LABELS[type] || type}`);
    } catch { /* offline: server is still the source of truth once it reconnects */ }
  }, [id, cancel]);

  const cam = useCamera(() => onViolation("CAMERA_OFF"));
  useProctor(proctorOn, onViolation);
  const detector = useObjectDetection(cam.videoRef, proctorOn && cam.ready, onViolation);

  useEffect(() => {
    api.get(`/interview/${id}`)
      .then(({ data }) => {
        if (data.status !== "in_progress") return nav(`/interview/result/${id}`, { replace: true });
        setSession(data);
        setIdx(data.answeredCount);
      })
      .catch((e) => setLoadError(errMsg(e)));
  }, [id, nav]);

  async function ask(i, s = session) {
    setIdx(i); setAnswer(""); setFeedback(null); setError(""); setPhase("asking");
    await speech.speak(s.questions[i].text);
    if (!cancelledRef.current) setPhase("answering");
  }

  async function begin() {
    setError("");
    try { await document.documentElement.requestFullscreen(); }
    catch { return setError("Full-screen is required. Allow it and try again."); }
    try { await cam.start(); }
    catch {
      await document.exitFullscreen().catch(() => {});
      return setError("Camera access is required to begin.");
    }
    setProctor(true);
    ask(session.answeredCount);
  }

  function toggleRecording() {
    if (speech.listening) return speech.stopListening();
    const ok = speech.startListening((text) => setAnswer((prev) => (prev ? `${prev} ${text}` : text)));
    if (!ok) setError("Voice input is not supported in this browser. Type your answer instead.");
  }

  async function submit() {
    speech.stopListening();
    setPhase("scoring"); setError("");
    try {
      const { data } = await api.post(`/interview/${id}/answer`, { index: idx, transcript: answer });
      setFeedback(data);
      setPhase("feedback");
    } catch (e) {
      if (e.response?.status === 409) return cancel("TOO_MANY_WARNINGS");
      setError(errMsg(e));
      setPhase("answering");
    }
  }

  async function next() {
    if (idx + 1 < session.total) return ask(idx + 1);
    setPhase("finishing");
    setProctor(false);          // stop proctoring BEFORE leaving full-screen so it is not flagged
    speech.cancelAll();
    cam.stop();
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
    try {
      await api.post(`/interview/${id}/finish`);
      nav(`/interview/result/${id}`, { replace: true });
    } catch (e) { setError(errMsg(e)); }
  }

  if (loadError) return <div className="p-8"><ErrorBox>{loadError}</ErrorBox></div>;
  if (!session) return <div className="p-8"><Spinner /></div>;

  if (phase === "cancelled") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper p-6">
        <Card className="max-w-md text-center">
          <Badge tone="bad">Interview cancelled</Badge>
          <h1 className="mt-3 text-xl font-extrabold">{LABELS[cancelReason] || "A rule was broken"}</h1>
          <p className="mt-2 text-sm text-ink-soft">This attempt has been closed and logged. You can start a new interview whenever you are ready.</p>
          <Button className="mt-5" onClick={() => nav("/interview", { replace: true })}>Back to mock interviews</Button>
        </Card>
      </div>
    );
  }

  const q = session.questions[idx];
  const inProgress = phase !== "ready";

  return (
    <div className="min-h-screen bg-paper p-4 md:p-8">
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1fr_260px]">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-extrabold">{session.role} interview</h1>
              {inProgress && <p className="text-sm text-ink-soft">Question {idx + 1} of {session.total}</p>}
            </div>
            <Badge tone="brand">{session.difficulty}</Badge>
          </div>

          {warning && <p role="alert" className="rounded-md bg-warn-soft px-4 py-3 text-sm font-semibold text-warn">{warning}</p>}
          <ErrorBox>{error}</ErrorBox>

          {phase === "ready" && (
            <Card className="space-y-4">
              <h2 className="text-lg font-bold">Ready when you are</h2>
              <p className="text-sm text-ink-soft">
                Starting will switch to full-screen and turn on your camera. From then on, leaving full-screen, switching tabs, turning off the camera,
                or showing a phone, book or another person ends the interview.
                {session.answeredCount > 0 && ` You will continue from question ${session.answeredCount + 1}.`}
              </p>
              <Button onClick={begin}>Enter full-screen and begin</Button>
            </Card>
          )}

          {inProgress && phase !== "finishing" && (
            <Card className="space-y-4">
              <p className="text-xl font-bold leading-snug">{q.text}</p>
              {phase === "asking" && <p className="text-sm text-ink-soft" role="status">Reading the question aloud...</p>}

              {(phase === "answering" || phase === "scoring") && (
                <>
                  <Textarea rows={7} value={answer} disabled={phase === "scoring"} onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Press Record and speak, or type your answer here." aria-label="Your answer" />
                  {speech.interim && <p className="text-sm italic text-ink-soft">{speech.interim}</p>}
                  <div className="flex flex-wrap gap-3">
                    <Button variant={speech.listening ? "danger" : "ghost"} onClick={toggleRecording} disabled={phase === "scoring"}>
                      {speech.listening ? "Stop recording" : "Record answer"}
                    </Button>
                    <Button onClick={submit} disabled={phase === "scoring" || !answer.trim()}>{phase === "scoring" ? "Scoring..." : "Submit answer"}</Button>
                    <Button variant="ghost" onClick={() => speech.speak(q.text)} disabled={phase === "scoring"}>Repeat question</Button>
                  </div>
                </>
              )}

              {phase === "feedback" && feedback && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.entries(feedback.scores).map(([k, v]) => (
                      <div key={k} className="rounded-md bg-paper p-3 text-center">
                        <p className="text-2xl font-extrabold">{v}<span className="text-sm text-ink-soft">/10</span></p>
                        <p className="text-xs font-semibold capitalize text-ink-soft">{k}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm">{feedback.feedback}</p>
                  {feedback.improvement && <p className="text-sm text-ink-soft"><b>Tip:</b> {feedback.improvement}</p>}
                  <Button onClick={next}>{idx + 1 < session.total ? "Next question" : "Finish interview"}</Button>
                </div>
              )}
            </Card>
          )}
          {phase === "finishing" && <Spinner text="Preparing your report..." />}
        </div>

        <aside className="space-y-3">
          <div className="overflow-hidden rounded-lg border border-line bg-ink">
            <video ref={cam.videoRef} muted playsInline className="aspect-[4/3] w-full -scale-x-100 object-cover" />
          </div>
          <Card className="space-y-2 !p-4 text-sm">
            <p className="flex justify-between"><span>Camera</span><Badge tone={cam.ready ? "ok" : "neutral"}>{cam.ready ? "On" : "Off"}</Badge></p>
            <p className="flex justify-between"><span>Object check</span>
              <Badge tone={detector === "running" ? "ok" : detector === "unavailable" ? "warn" : "neutral"}>{detector === "idle" ? "Waiting" : detector}</Badge></p>
            <p className="flex justify-between"><span>Voice input</span><Badge tone={speech.supported ? "ok" : "warn"}>{speech.supported ? "Available" : "Type only"}</Badge></p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
