export function buildDefaultAvatar(name = "Runner") {
    const initials = name
        .split(" ")
        .map((s) => s[0] || "")
        .join("")
        .slice(0, 2)
        .toUpperCase();
    const size = 1024;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#1F2A44";
    ctx.fillRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
    ctx.fillStyle = "#e03a4e";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 360px Inter, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials, size / 2, size / 2 + 10);
    return c.toDataURL("image/png");
}


export function cropFaceFromFrame({ frameCanvas, detection, upBias = 0.24, outSize = 1024 }) {
    if (!detection) return null;
    const srcW = frameCanvas.width,
        srcH = frameCanvas.height;
    const bbox = detection.boundingBox;
    const bw = bbox.width * srcW,
        bh = bbox.height * srcH;
    const cx = bbox.xCenter * srcW,
        cy = bbox.yCenter * srcH;
    const scale = 2.0;
    const side = Math.max(bw, bh) * scale;
    let x = Math.round(cx - side / 2),
        y = Math.round(cy - side / 2 - side * upBias);
    x = Math.max(0, Math.min(x, srcW - side));
    y = Math.max(0, Math.min(y, srcH - side));
    const off = document.createElement("canvas");
    off.width = outSize;
    off.height = outSize;
    const octx = off.getContext("2d");
    octx.imageSmoothingQuality = "high";
    octx.drawImage(frameCanvas, x, y, side, side, 0, 0, outSize, outSize);
    return off.toDataURL("image/png");
}