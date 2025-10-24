"use client";
import React, { useEffect, useState } from "react";
import { renderShareCard } from "../../lib/shareCard";

export default function SharePage() {
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get("name") || "Runner";
    const time = params.get("time") || "00:00";
    const avatar = buildDefaultAvatar(name);
    (async () => {
      const card = await renderShareCard({ name, time, avatar });
      setImgUrl(card);
    })();
  }, []);

  return (
    <div style={{ minHeight: "100dvh", background: "#e8eef5", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 28 }}>Your Course Card</h1>
        {imgUrl ? (
          <>
            <img src={imgUrl} alt="card" style={{ width: "min(90vw, 540px)", height: "auto", borderRadius: 16, boxShadow: "0 12px 32px rgba(0,0,0,.2)", margin: "18px 0" }} />
            <div>
              <a href={imgUrl} download="course-card.png" style={{ background: "#e03a4e", color: "#fff", padding: "12px 18px", borderRadius: 12, textDecoration: "none", fontWeight: 800 }}>Download</a>
            </div>
          </>
        ) : (
          <p>Building your card…</p>
        )}
      </div>
    </div>
  );
}

function buildDefaultAvatar(name = "Runner") {
  const initials = name.split(" ").map(s=>s[0]||"").join("").slice(0,2).toUpperCase();
  const size = 1024;
  const c = document.createElement("canvas"); c.width = size; c.height = size;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#1F2A44"; ctx.fillRect(0,0,size,size);
  ctx.beginPath(); ctx.arc(size/2, size/2, size/2 - 10, 0, Math.PI*2); ctx.fillStyle = "#e03a4e"; ctx.fill();
  ctx.fillStyle = "white"; ctx.font = "bold 360px Inter, system-ui, sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(initials, size/2, size/2 + 10);
  return c.toDataURL("image/png");
}
