// src/hooks/useCountdown.js
import { useEffect, useRef, useState } from "react";

export function useCountdown(onDone, startAt = 3) {
    const [countdown, setCountdown] = useState(0);
    const timerRef = useRef(null);
    const prevRef = useRef(countdown);

    // Clean up timer on unmount
    useEffect(() => () => clearInterval(timerRef.current), []);

    // Fire onDone after render when we detect 1 → 0 transition
    useEffect(() => {
        if (prevRef.current === 1 && countdown === 0) {
            onDone?.();
        }
        prevRef.current = countdown;
    }, [countdown, onDone]);

    const start = () => {
        if (countdown) return;           // already running
        setCountdown(startAt);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCountdown((c) => (c <= 1 ? 0 : c - 1)); // no onDone here!
        }, 1000);
    };

    const reset = () => {
        clearInterval(timerRef.current);
        setCountdown(0);
    };

    return { countdown, start, reset };
}
