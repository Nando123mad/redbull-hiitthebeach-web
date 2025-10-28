import { useCallback, useState } from "react";
import { useCountdown } from "@/hooks/useCountdown";
import { useAIFaceCamera } from "@/hooks/useAIFaceCamera";
import { cropFaceFromFrame } from "@/lib/avatar";


export default function CameraPage({ onBack, onCaptured }) {
    const [errorMsg, setErrorMsg] = useState("");
    const { videoRef, frameCanvasRef, latestDetection } = useAIFaceCamera(true, () =>
        setErrorMsg("AI camera init failed. See console.")
    );


    const performCapture = useCallback(() => {
        const frameCanvas = frameCanvasRef.current;
        const det = latestDetection.current;
        const faceUrl = det
            ? cropFaceFromFrame({ frameCanvas, detection: det, upBias: 0.24, outSize: 1024 })
            : frameCanvas.toDataURL("image/png");
        onCaptured(faceUrl);
    }, [frameCanvasRef, latestDetection, onCaptured]);


    const { countdown, start } = useCountdown(performCapture, 3);


    return (
        <div className="screen camera-screen">
            <h2 className="title">Center your face, then tap Capture</h2>
            <div className="camera-wrap">
                <video ref={videoRef} className="video" autoPlay playsInline muted />
                <canvas ref={frameCanvasRef} className="hidden-canvas" />
                {countdown > 0 && (
                    <div className="countdown">
                        <div className="count-number">{countdown}</div>
                    </div>
                )}
            </div>
            <div className="row gap">
                <button className="btn-secondary" onClick={onBack}>
                    Back
                </button>
                <button className="btn-primary" onClick={start}>{countdown ? "…" : "Capture"}</button>
            </div>
            <p className="hint">
                Tip: the camera crops automatically so your face stays centered.
            </p>
            {errorMsg && <div className="status">{errorMsg}</div>}
        </div>
    );
}