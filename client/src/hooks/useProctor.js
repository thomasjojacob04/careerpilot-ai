import { useEffect, useRef } from "react";

/**
 * Browser-level proctoring: full-screen exit, tab/app switch, copy/paste, DevTools shortcuts.
 * Runs only while `active` is true. Detection is a deterrent; the server is the source of truth.
 */
export default function useProctor(active, onViolation) {
  const cb = useRef(onViolation);
  cb.current = onViolation;

  useEffect(() => {
    if (!active) return;
    const report = (type) => cb.current(type);

    const onFullscreen = () => { if (!document.fullscreenElement) report("FULLSCREEN_EXIT"); };
    const onVisibility = () => { if (document.hidden) report("TAB_SWITCH"); };
    const onBlur = () => report("TAB_SWITCH");
    const onClipboard = (e) => { e.preventDefault(); report("COPY_PASTE"); };
    const onContext = (e) => { e.preventDefault(); report("DEVTOOLS_ATTEMPT"); };
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      const devtools =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(k)) ||
        (e.metaKey && e.altKey && ["i", "j", "c"].includes(k)) ||
        ((e.ctrlKey || e.metaKey) && k === "u");
      if (devtools) { e.preventDefault(); report("DEVTOOLS_ATTEMPT"); }
    };

    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    ["copy", "cut", "paste"].forEach((ev) => document.addEventListener(ev, onClipboard));
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      ["copy", "cut", "paste"].forEach((ev) => document.removeEventListener(ev, onClipboard));
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [active]);
}
