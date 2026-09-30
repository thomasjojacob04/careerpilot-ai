import { useEffect, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

let modelPromise;
/** Load once and share. Call early (e.g. on the setup page) so the model is warm. */
export const preloadModel = () =>
  (modelPromise ??= tf.ready().then(() => cocoSsd.load({ base: "lite_mobilenet_v2" })));

/**
 * Samples the webcam every ~1.2 s with COCO-SSD.
 * A flag must persist for consecutive frames before it is reported, which cuts false positives.
 */
export default function useObjectDetection(videoRef, active, onViolation) {
  const [status, setStatus] = useState("idle"); // idle | loading | running | unavailable
  const cb = useRef(onViolation);
  cb.current = onViolation;

  useEffect(() => {
    if (!active) return;
    let stopped = false;
    let timer;
    const streak = {};

    (async () => {
      setStatus("loading");
      let model;
      try {
        model = await preloadModel();
      } catch {
        setStatus("unavailable");
        return;
      }
      if (stopped) return;
      setStatus("running");

      const tick = async () => {
        if (stopped) return;
        const video = videoRef.current;
        if (video && video.readyState >= 2) {
          try {
            const preds = await model.detect(video, 10, 0.55);
            const persons = preds.filter((p) => p.class === "person").length;
            const flags = {
              PHONE_DETECTED: preds.some((p) => p.class === "cell phone"),
              BOOK_DETECTED: preds.some((p) => p.class === "book"),
              MULTIPLE_PERSONS: persons > 1,
              NO_PERSON: persons === 0,
            };
            for (const [type, on] of Object.entries(flags)) {
              streak[type] = on ? (streak[type] || 0) + 1 : 0;
              const needed = type === "NO_PERSON" ? 4 : 2;
              if (streak[type] === needed) cb.current(type);
            }
          } catch { /* skip frame */ }
        }
        timer = setTimeout(tick, 1200);
      };
      tick();
    })();

    return () => { stopped = true; clearTimeout(timer); };
  }, [active, videoRef]);

  return status;
}
