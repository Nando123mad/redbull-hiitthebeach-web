import { normalizePhone } from "@/lib/normalize";
import { renderShareCard } from "@/lib/shareCard";


export async function shareResult({ channel, to, name, time, avatar }) {
    const card = await renderShareCard({ name, time, avatar });


    const payload =
        channel === "email"
            ? { channel: "email", to, name, time, attachmentDataUrl: card }
            : { channel: "phone", to: normalizePhone(to), name, time, attachmentDataUrl: card };


    const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });


    if (!res.ok) throw new Error((await res.json()).error || "Send failed");
}