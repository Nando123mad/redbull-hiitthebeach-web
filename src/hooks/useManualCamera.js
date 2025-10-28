// src/hooks/useManualCamera.js
import { useEffect, useRef } from "react";

export function useManualCamera(active, onError) {
  const videoRef = useRef(null);
  const frameCanvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    let destroyed = false;

    (async () => {
      try {
        const waitForRefs = () =>
          new Promise((resolve, reject) => {
            const start = performance.now();
            const tick = () => {
              if (destroyed) return reject(new Error("Unmounted before refs mounted"));
              if (videoRef.current && frameCanvasRef.current) return resolve();
              if (performance.now() - start > 2000) {
                return reject(new Error("Camera elements not mounted (video/canvas refs are null)"));
              }
              requestAnimationFrame(tick);
            };
            tick();
          });
        await waitForRefs();

        // Start camera
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: "user" },
          audio: false,
        });

        if (destroyed) return;

        const video = videoRef.current;
        video.muted = true;          // extra safety for autoplay
        video.playsInline = true;    // iOS/Safari inline playback
        video.srcObject = streamRef.current;
        await video.play();

        // Wait until we have dimensions and an actual frame
        await ensureVideoReady(video);
      } catch (err) {
        if (!destroyed) {
          console.error("Manual camera init failed:", err);
          onError?.(err);
        }
      }
    })();

    return () => {
      destroyed = true;
      try { streamRef.current?.getTracks()?.forEach((t) => t.stop()); } catch {}
      streamRef.current = null;
    };
  }, [active, onError]);

  // ----- helpers -----

  async function ensureVideoReady(video) {
    // Wait for metadata so videoWidth/Height are set
    if (!video.videoWidth || !video.videoHeight) {
      await waitEvent(video, "loadedmetadata", 1500).catch(() => {});
    }
    // Then wait for an actual decoded frame
    await waitForNextVideoFrame(video, 500);
  }

  function waitEvent(el, type, timeoutMs = 1000) {
    return new Promise((resolve, reject) => {
      const on = () => { cleanup(); resolve(); };
      const to = setTimeout(() => { cleanup(); reject(new Error(`${type} timeout`)); }, timeoutMs);
      const cleanup = () => {
        clearTimeout(to);
        el.removeEventListener(type, on);
      };
      el.addEventListener(type, on, { once: true });
    });
  }

  function waitForNextVideoFrame(video, timeoutMs = 800) {
    // Prefer requestVideoFrameCallback when available
    if (typeof video.requestVideoFrameCallback === "function") {
      return new Promise((resolve, reject) => {
        let timedOut = false;
        const to = setTimeout(() => { timedOut = true; reject(new Error("rVFC timeout")); }, timeoutMs);
        video.requestVideoFrameCallback(() => {
          if (timedOut) return;
          clearTimeout(to);
          resolve();
        });
      });
    }
    // Fallback: wait for timeupdate or a tiny delay
    return new Promise(async (resolve) => {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth && video.videoHeight) {
        resolve(); return;
      }
      await waitEvent(video, "loadeddata", 800).catch(() => {});
      setTimeout(resolve, 50);
    });
  }

  /**
   * Capture a SQUARE crop from the current <video> frame.
   * Ensures the next decoded frame is ready before drawing.
   * @param {Object} opts
   * @param {number} opts.outSize - output square size
   * @param {number} opts.upBias  - small upward shift (0..~0.35)
   * @returns {Promise<string|null>} PNG dataURL
   */
  const captureFrame = async ({ outSize = 1024, upBias = 0.18 } = {}) => {
    const video = videoRef.current;
    const workCanvas = frameCanvasRef.current;
    if (!video || !workCanvas) return null;

    // wait for the next painted/decoded frame
    await waitForNextVideoFrame(video, 800).catch(() => {});

    if (!video.videoWidth || !video.videoHeight) return null;

    const srcW = video.videoWidth;
    const srcH = video.videoHeight;
    const side = Math.min(srcW, srcH);

    let x = Math.round((srcW - side) / 2);
    let y = Math.round((srcH - side) / 2 - side * upBias);
    x = Math.max(0, Math.min(x, srcW - side));
    y = Math.max(0, Math.min(y, srcH - side));

    const out = document.createElement("canvas");
    out.width = outSize;
    out.height = outSize;
    const octx = out.getContext("2d");
    if (!octx) return null;
    octx.imageSmoothingQuality = "high";
    octx.drawImage(video, x, y, side, side, 0, 0, outSize, outSize);

    return out.toDataURL("image/png");
  };

  return { videoRef, frameCanvasRef, captureFrame };
}
