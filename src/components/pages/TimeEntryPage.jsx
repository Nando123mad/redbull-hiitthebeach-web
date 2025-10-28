import { normalizeTime } from "@/lib/normalize";


export default function TimeEntryPage({ value, onChange, onBack, onNext }) {
    return (
        <div className="screen center-col">
            <h2 className="title">Enter your course time</h2>
            <div className="time-card">
                <div className="time-label">TIME</div>
                <input
                    className="time-input"
                    inputMode="numeric"
                    pattern="[0-9:]*"
                    placeholder="00:00"
                    value={value}
                    onChange={(e) => onChange(normalizeTime(e.target.value))}
                />
                <div className="unit">min</div>
            </div>
            <div className="row gap">
                <button className="btn-secondary" onClick={onBack}>
                    Back
                </button>
                <button className="btn-primary" onClick={onNext} disabled={!value}>
                    Next
                </button>
            </div>
        </div>
    );
}