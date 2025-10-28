// src/components/pages/ManualCameraPage.jsx
import { useState, useCallback } from "react";
import { useManualCamera } from "@/hooks/useManualCamera";
import { useCountdown } from "@/hooks/useCountdown";

export default function ManualCameraPage({
  onBack,
  onCaptured,
  outSize = 1024,
  upBias = 0.08, // 0..~0.35 upward nudge
}) {
  const [errorMsg, setErrorMsg] = useState("");
  const { videoRef, frameCanvasRef, captureFrame } = useManualCamera(true, (err) =>
    setErrorMsg(err?.message || "Camera init failed.")
  );

  const performCapture = useCallback(async () => {
    const png = await captureFrame({ outSize, upBias });
    if (!png) {
      setErrorMsg("Could not capture a frame. Please try again.");
      return;
    }
    onCaptured(png);
  }, [captureFrame, onCaptured, outSize, upBias]);

  const { countdown, start } = useCountdown(performCapture, 3);

  // Convert upBias (0..1) to object-position Y offset:
  // 50% is centered; subtract (upBias*100)% to nudge upward.
  const objectPosY = `calc(50% - ${upBias * 100}%)`;

  return (
    <div className="screen camera-screen">
      <h2 className="title">Center yourself, then tap Capture</h2>

      {/* Square live preview */}
      <div
        className="camera-preview"
        style={{
          position: "relative",
          width: "min(70vmin, 520px)",
          aspectRatio: "1 / 1",   // perfect square
          overflow: "hidden",
          borderRadius: "20px",
          border: "3px solid rgba(255,255,255,0.3)",
          boxShadow: "0 0 30px rgba(0,0,0,0.3)",
          margin: "0 auto",
          lineHeight: 0,          // removes inline baseline gap under video
          background: "#000",     // avoids white flashes
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: "absolute",
            inset: 0,            // fill the square
            width: "100%",
            height: "100%",
            display: "block",    // kill baseline gap
            objectFit: "cover",  // crop to square
            objectPosition: `50% ${objectPosY}`, // upward bias
            background: "#000",
          }}
        />
        <canvas ref={frameCanvasRef} className="hidden-canvas" />

        {countdown > 0 && (
          <div
            className="countdown"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "rgba(0,0,0,0.4)",
              color: "#fff",
              fontSize: "5vmin",
              fontWeight: "bold",
              borderRadius: "20px",
            }}
          >
            {countdown}
          </div>
        )}
      </div>

      <div className="row gap" style={{ marginTop: "3vh" }}>
        <button className="btn-secondary" onClick={onBack}>Back</button>
        <button className="btn-primary" onClick={start}>{countdown ? "…" : "Capture"}</button>
      </div>

      <p className="hint">Preview shows exactly what will be sent.</p>
      {errorMsg && <div className="status">{errorMsg}</div>}
    </div>
  );
}
