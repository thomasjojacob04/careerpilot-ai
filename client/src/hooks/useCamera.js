import { useCallback, useEffect, useRef, useState } from "react";

/** Webcam stream with a watcher that fires `onEnded` if the camera is switched off or unplugged. */
export default function useCamera(onEnded) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const endedRef = useRef(onEnded);
  endedRef.current = onEnded;
  const [ready, setReady] = useState(false);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => { t.onended = null; t.stop(); });
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setReady(false);
  }, []);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false });
    streamRef.current = stream;
    stream.getVideoTracks().forEach((t) => { t.onended = () => endedRef.current?.(); });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }
    setReady(true);
  }, []);

  // Polling catches cases where `ended` is not fired (e.g. a track disabled by the OS).
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      const t = streamRef.current?.getVideoTracks()[0];
      if (!t || t.readyState !== "live" || !t.enabled) endedRef.current?.();
    }, 2000);
    return () => clearInterval(timer);
  }, [ready]);

  useEffect(() => stop, [stop]);
  return { videoRef, ready, start, stop };
}
