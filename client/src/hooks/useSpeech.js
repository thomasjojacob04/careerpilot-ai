import { useCallback, useEffect, useRef, useState } from "react";

const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

/** Text-to-speech for questions and speech-to-text for answers (Chrome / Edge). */
export default function useSpeech() {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef(null);
  const wantRef = useRef(false);

  const speak = useCallback((text) =>
    new Promise((resolve) => {
      if (!("speechSynthesis" in window)) return resolve();
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.onend = resolve;
      u.onerror = resolve;
      window.speechSynthesis.speak(u);
    }), []);

  const startListening = useCallback((onFinal) => {
    if (!SR) return false;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";
    rec.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) onFinal(r[0].transcript.trim());
        else live += r[0].transcript;
      }
      setInterim(live);
    };
    // Chrome ends recognition after silence, so restart while the user still wants to record.
    rec.onend = () => {
      if (wantRef.current) { try { rec.start(); } catch { /* already started */ } }
      else setListening(false);
    };
    rec.onerror = (e) => { if (e.error === "not-allowed") { wantRef.current = false; setListening(false); } };
    wantRef.current = true;
    recRef.current = rec;
    rec.start();
    setListening(true);
    return true;
  }, []);

  const stopListening = useCallback(() => {
    wantRef.current = false;
    recRef.current?.stop();
    setInterim("");
    setListening(false);
  }, []);

  const cancelAll = useCallback(() => {
    stopListening();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, [stopListening]);

  useEffect(() => cancelAll, [cancelAll]);

  return { supported: !!SR, listening, interim, speak, startListening, stopListening, cancelAll };
}
