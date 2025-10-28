export function normalizePhone(raw) {
    let s = (raw || "").replace(/[^\d+]/g, "");
    if (s.startsWith("+")) return s;
    if (s.length === 10) return "+1" + s; // assume US
    return s;
}


export function normalizeTime(s) {
    s = (s || "").replace(/[^\d:]/g, "");
    if (!s.includes(":")) {
        if (s.length > 2) s = s.slice(0, 2) + ":" + s.slice(2, 4);
    }
    return s.slice(0, 5);
}