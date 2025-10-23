"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import "./globals.css";
import VirtualKeyboard from "../components/VirtualKeyboard";
import { renderShareCard } from "../lib/shareCard";

const Steps = {
  CTA: "CTA",
  FORM: "FORM",
  TIME: "TIME",
  PHOTO_DECIDE: "PHOTO_DECIDE",
  CAMERA: "CAMERA",
  REVIEW: "REVIEW",
  THANKS: "THANKS",
};

export default function Page() {
  const [step, setStep] = useState(Steps.CTA);

  // NEW: contact method & value
  const [contactMethod, setContactMethod] = useState("email"); // "email" | "phone"
  const [contactValue, setContactValue] = useState("");        // email or phone
  const [form, setForm] = useState({ name: "" });              // name only now
  const [courseTime, setCourseTime] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [busy, setBusy] = useState(false);
  const [shareMessage, setShareMessage] = useState("");

  // keyboard
  const [kbTarget, setKbTarget] = useState(null); // "name" | "contact" | "time" | null

  // countdown
  const [countdown, setCountdown] = useState(0);
  const countdownTimer = useRef(null);

  // camera / mediapipe
  const videoRef = useRef(null);
  const frameCanvasRef = useRef(null);
  const cameraInst = useRef(null);
  const latestDetection = useRef(null);

  // init mediapipe when CAMERA
useEffect(() => {
  if (step !== Steps.CAMERA) return;

  let cameraInstance;
  let destroyed = false;

  // tiny helper to load UMD scripts
  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.async = true;
      el.onload = resolve;
      el.onerror = reject;
      document.head.appendChild(el);
    });

  (async () => {
    // 1) Load UMD bundles so they attach to window
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js");
    await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");

    // 2) Resolve globals safely
    const FDns = window.FaceDetection || window.faceDetection || window.face_detection;
    const FaceDetectionCtor = (FDns && (FDns.FaceDetection || FDns)) || null;

    const CamNs = window.Camera || window.CameraUtils || window.cameraUtils;
    const CameraCtor =
      (CamNs && (CamNs.Camera || CamNs)) || window.Camera || null;

    if (!FaceDetectionCtor) {
      throw new Error("MediaPipe FaceDetection constructor not found on window.");
    }
    if (!CameraCtor) {
      throw new Error("MediaPipe Camera constructor not found on window.");
    }

    // 3) Wire up detection
    const video = videoRef.current;
    const frameCanvas = frameCanvasRef.current;
    const frameCtx = frameCanvas.getContext("2d");

    const fd = new FaceDetectionCtor({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
    });
    fd.setOptions({ model: "short", minDetectionConfidence: 0.5 });
    fd.onResults((res) => {
      if (destroyed) return;
      latestDetection.current = (res.detections && res.detections[0]) || null;
    });

    const onFrame = async () => {
      if (!video.videoWidth) return;
      frameCanvas.width = video.videoWidth;
      frameCanvas.height = video.videoHeight;
      frameCtx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
      await fd.send({ image: frameCanvas });
    };

    cameraInstance = new CameraCtor(video, {
      onFrame,
      width: 1920,
      height: 1080,
    });

    await cameraInstance.start();
  })().catch((err) => {
    console.error("MediaPipe init failed:", err);
    // show a friendly hint in UI if you want
    // setShareMessage("Camera init failed. See console.");
  });

  return () => {
    destroyed = true;
    try { cameraInstance?.stop(); } catch {}
    clearInterval(countdownTimer.current);
    setCountdown(0);
  };
}, [step]);


  const startCountdown = () => {
    if (countdown) return;
    setCountdown(3);
    countdownTimer.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(countdownTimer.current);
          performCapture();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const performCapture = () => {
    const frameCanvas = frameCanvasRef.current;
    const det = latestDetection.current;
    const faceUrl = det
      ? cropFaceFromFrame({ frameCanvas, detection: det, upBias: 0.24, outSize: 1024 })
      : frameCanvas.toDataURL("image/png");
    setAvatar(faceUrl);
    setStep(Steps.REVIEW);
  };

  const handleSkipPhoto = () => {
    setAvatar(buildDefaultAvatar(form.name || "Runner"));
    setStep(Steps.REVIEW);
  };

  const canShare = useMemo(
    () => form.name && form.email && courseTime && avatar,
    [form, courseTime, avatar]
  );

  const share = async () => {
    setBusy(true); setShareMessage("");
    try {
      const card = await renderShareCard({ name: form.name, time: courseTime, avatar });
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: form.email, subject: "Your - Red Bull HIIT the Beach - Course Card", name: form.name, attachmentDataUrl: card }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Mail send failed");
      setStep(Steps.THANKS);
    } catch (e) {
      console.error(e);
      setShareMessage(e.message || "Couldn’t send email.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kiosk-root">
      <div className="bg-pattern" />

      {step === Steps.CTA && (
        <div className="screen center-col">
          <h1 className="hero">Ready to <span className="accent">Run</span>?</h1>
          <p className="sub">Tap to start the experience</p>
          <button className="btn-primary xl" onClick={() => setStep(Steps.FORM)}>Start</button>
        </div>
      )}

      {step === Steps.FORM && (
        <div className="screen form-screen">
          <h2 className="title">Tell us about you</h2>
          <div className="form">
            <label>
              Name
              <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jordan Runner" />
            </label>
            <label>
              Email
              <input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} type="email" placeholder="you@email.com" />
            </label>
          </div>
          <div className="row gap">
            <button className="btn-secondary" onClick={() => setStep(Steps.CTA)}>Back</button>
            <button className="btn-primary" onClick={() => setStep(Steps.TIME)} disabled={!form.name || !form.email}>Next</button>
          </div>
        </div>
      )}

      {step === Steps.TIME && (
        <div className="screen center-col">
          <h2 className="title">Enter your course time</h2>
          <div className="time-card">
            <div className="time-label">TIME</div>
            <input className="time-input" inputMode="numeric" pattern="[0-9]*" placeholder="00:00"
              value={courseTime} onChange={(e) => setCourseTime(e.target.value)} />
            <div className="unit">min</div>
          </div>
          <div className="row gap">
            <button className="btn-secondary" onClick={() => setStep(Steps.FORM)}>Back</button>
            <button className="btn-primary" onClick={() => setStep(Steps.PHOTO_DECIDE)} disabled={!courseTime}>Next</button>
          </div>
        </div>
      )}

      {step === Steps.PHOTO_DECIDE && (
        <div className="screen center-col">
          <h2 className="title">Want to take a picture?</h2>
          <div className="row gap">
            <button className="btn-secondary" onClick={handleSkipPhoto}>Not now</button>
            <button className="btn-primary" onClick={() => setStep(Steps.CAMERA)}>Take photo</button>
          </div>
        </div>
      )}

      {step === Steps.CAMERA && (
        <div className="screen camera-screen">
          <h2 className="title">Center your face, then tap Capture</h2>
          <div className="camera-wrap">
            <video ref={videoRef} className="video" autoPlay playsInline muted />
            <canvas ref={frameCanvasRef} className="hidden-canvas" />
            {countdown > 0 && <div className="countdown"><div className="count-number">{countdown}</div></div>}
          </div>
          <div className="row gap">
            <button className="btn-secondary" onClick={() => setStep(Steps.PHOTO_DECIDE)}>Back</button>
            <button className="btn-primary" onClick={startCountdown}>{countdown ? "…" : "Capture"}</button>
          </div>
          <p className="hint">Tip: stand on the marked spot. The camera is above you — we’ll crop upward automatically so your face is centered.</p>
        </div>
      )}

      {step === Steps.REVIEW && (
        <div className="screen review-screen">
          <div className="stat-card">
            <div className="avatar-wrap"><img src={avatar} alt="avatar" className="avatar" /></div>
            <div className="stat-block">
              <div className="label">TIME</div>
              <div className="value big">{courseTime || "00:00"}</div>
              <div className="unit alt">min</div>
            </div>
            <div className="stat-row">
              <div className="stat"><div className="label">DISTANCE</div><div className="value">—</div><div className="unit alt">km</div></div>
              <div className="stat"><div className="label">PACE</div><div className="value">—</div><div className="unit alt">min/km</div></div>
            </div>
            <button className="btn-pill share" disabled={!canShare || busy} onClick={share}>{busy ? "Sending..." : "Share"}</button>
            {shareMessage && <div className="status">{shareMessage}</div>}
          </div>
          <div className="row gap">
            <button className="btn-secondary" onClick={() => setStep(Steps.CAMERA)}>Retake</button>
            <button className="btn-secondary" onClick={() => setStep(Steps.PHOTO_DECIDE)}>Change choice</button>
          </div>
        </div>
      )}

      {step === Steps.THANKS && (
        <div className="screen center-col">
          <h2 className="hero">Thank you! 🎉</h2>
          <p className="sub">Your card is on the way to {form.email}.</p>
          <button className="btn-primary" onClick={() => {
            setForm({ name: "", email: "" }); setCourseTime(""); setAvatar(null); setShareMessage(""); setStep(Steps.CTA);
          }}>Start Over</button>
        </div>
      )}
    </div>
  );
}

// ---------- helpers ----------
function buildDefaultAvatar(name = "Runner") {
  const initials = name.split(" ").map(s => s[0] || "").join("").slice(0, 2).toUpperCase();
  const size = 1024;
  const c = document.createElement("canvas"); c.width = size; c.height = size;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#1F2A44"; ctx.fillRect(0, 0, size, size);
  ctx.beginPath(); ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2); ctx.fillStyle = "#e03a4e"; ctx.fill();
  ctx.fillStyle = "white"; ctx.font = "bold 360px Inter, system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(initials, size / 2, size / 2 + 10);
  return c.toDataURL("image/png");
}

function cropFaceFromFrame({ frameCanvas, detection, upBias = 0.24, outSize = 1024 }) {
  if (!detection) return null;
  const srcW = frameCanvas.width, srcH = frameCanvas.height;
  const bbox = detection.boundingBox;
  const bw = bbox.width * srcW, bh = bbox.height * srcH;
  const cx = bbox.xCenter * srcW, cy = bbox.yCenter * srcH;
  const scale = 2.0; const side = Math.max(bw, bh) * scale;
  let x = Math.round(cx - side / 2), y = Math.round(cy - side / 2 - side * upBias);
  x = Math.max(0, Math.min(x, srcW - side)); y = Math.max(0, Math.min(y, srcH - side));
  const off = document.createElement("canvas"); off.width = outSize; off.height = outSize;
  const octx = off.getContext("2d"); octx.imageSmoothingQuality = "high";
  octx.drawImage(frameCanvas, x, y, side, side, 0, 0, outSize, outSize);
  return off.toDataURL("image/png");
}
