export async function renderShareCard({ name, time, avatar }) {
  const W = 2160, H = 3840;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#c8d3df"; ctx.fillRect(0,0,W,H);

  ctx.save(); ctx.translate(0, H - 1040); ctx.rotate(-0.08);
  ctx.fillStyle = "#8fb1c8"; ctx.fillRect(-200, 0, W + 400, 1040);
  ctx.restore();

  const pad = 128, cardX = pad, cardY = 520, cardW = W - pad * 2, cardH = H - 1600;
  roundRect(ctx, cardX, cardY, cardW, cardH, 56, "#b7c6d4");

  const avatarSize = 720, ax = W/2, ay = 460;
  await drawCircularImage(ctx, avatar, ax, ay, avatarSize/2, 20, "white");

  ctx.fillStyle = "#d73a4a"; ctx.font = "700 144px Inter, system-ui, sans-serif"; ctx.textAlign = "left";
  ctx.fillText("TIME", cardX + 128, cardY + 360);

  ctx.fillStyle = "#ffffff"; ctx.font = "800 360px 'Seven Segment', system-ui, sans-serif";
  ctx.fillText(time, cardX + 128, cardY + 720);

  ctx.fillStyle = "#1F2A44"; ctx.font = "700 128px Inter, system-ui, sans-serif";
  ctx.fillText("min", cardX + 128, cardY + 880);

  ctx.fillStyle = "#1F2A44"; ctx.textAlign = "center"; ctx.font = "600 112px Inter, system-ui, sans-serif";
  ctx.fillText(name, W/2, H - 112);

  return c.toDataURL("image/png");
}

function roundRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
}

function drawCircularImage(ctx, src, cx, cy, radius, border = 0, borderColor = "white") {
  const img = new Image(); img.crossOrigin = "anonymous"; img.src = src;
  return new Promise((resolve) => {
    img.onload = () => {
      ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,radius,0,Math.PI*2); ctx.closePath(); ctx.clip();
      ctx.drawImage(img, cx-radius, cy-radius, radius*2, radius*2);
      ctx.restore();
      if (border>0) { ctx.beginPath(); ctx.arc(cx,cy,radius+border/2,0,Math.PI*2);
        ctx.strokeStyle = borderColor; ctx.lineWidth = border; ctx.stroke(); }
      resolve();
    };
  });
}