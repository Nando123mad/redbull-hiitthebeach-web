// src/hooks/useAIFaceCamera.js
import { useEffect, useRef } from "react";

export function useAIFaceCamera(active, onDetectionError) {
    const videoRef = useRef(null);
    const frameCanvasRef = useRef(null);
    const cameraInstanceRef = useRef(null);
    const latestDetection = useRef(null);

    useEffect(() => {
        if (!active) return;
        let destroyed = false;

        const loadScript = (src) =>
            new Promise((resolve, reject) => {
                const el = document.createElement("script");
                el.src = src;
                el.async = true;
                el.onload = resolve;
                el.onerror = reject;
                document.head.appendChild(el);
            });

        // Wait until refs are attached to actual DOM nodes
        const waitForRefs = () =>
            new Promise((resolve, reject) => {
                const start = performance.now();
                const step = () => {
                    const video = videoRef.current;
                    const canvas = frameCanvasRef.current;
                    if (video && canvas) return resolve({ video, canvas });
                    if (destroyed) return reject(new Error("Unmounted before refs became available"));
                    if (performance.now() - start > 1000) {
                        return reject(new Error("Camera elements not mounted (video/canvas refs are null)"));
                    }
                    requestAnimationFrame(step);
                };
                step();
            });

        (async () => {
            try {
                // 1) Ensure DOM refs exist
                const { video, canvas } = await waitForRefs();

                // 2) Load MediaPipe UMD bundles
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/face_detection.js");
                await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");

                // 3) Resolve constructors
                const FDns = window.FaceDetection || window.faceDetection || window.face_detection;
                const FaceDetectionCtor = (FDns && (FDns.FaceDetection || FDns)) || null;

                const CamNs = window.Camera || window.CameraUtils || window.cameraUtils;
                const CameraCtor = (CamNs && (CamNs.Camera || CamNs)) || window.Camera || null;

                if (!FaceDetectionCtor) throw new Error("AI FaceDetection not found on window.");
                if (!CameraCtor) throw new Error("Camera utils not found on window.");

                // 4) Get 2D context safely
                const frameCtx = canvas.getContext?.("2d");
                if (!frameCtx) throw new Error("Canvas 2D context unavailable (getContext('2d') returned null).");

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
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    frameCtx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    await fd.send({ image: canvas });
                };

                const cam = new CameraCtor(video, { onFrame, width: 1920, height: 1080 });
                cameraInstanceRef.current = cam;
                await cam.start();
            } catch (err) {
                if (!destroyed) {
                    console.error("AI Camera init failed:", err);
                    onDetectionError?.(err);
                }
            }
        })();

        return () => {
            destroyed = true;
            try {
                cameraInstanceRef.current?.stop();
            } catch { }
            cameraInstanceRef.current = null;
        };
    }, [active, onDetectionError]);

    return { videoRef, frameCanvasRef, latestDetection };
}
