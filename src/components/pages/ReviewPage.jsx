export default function ReviewPage({ avatar, courseTime, canShare, busy, shareMessage, onShare, onRetake, onChangeChoice }) {
    return (
        <div className="screen review-screen">
            <div className="stat-card">
                <div className="avatar-wrap">
                    <img src={avatar} alt="avatar" className="avatar" />
                </div>
                <div className="stat-block">
                    <div className="label">TIME</div>
                    <div className="value big">{courseTime || "00:00"}</div>
                    <div className="unit alt">min</div>
                </div>
                <div className="stat-row">
                    <div className="stat">
                        <div className="label">DISTANCE</div>
                        <div className="value">—</div>
                        <div className="unit alt">km</div>
                    </div>
                    <div className="stat">
                        <div className="label">PACE</div>
                        <div className="value">—</div>
                        <div className="unit alt">min/km</div>
                    </div>
                </div>
                <button className="btn-pill share" disabled={!canShare || busy} onClick={onShare}>
                    {busy ? "Sending..." : ("Share")}
                </button>
                {shareMessage && <div className="status">{shareMessage}</div>}
            </div>
            <div className="row gap">
                <button className="btn-secondary" onClick={onRetake}>
                    Retake
                </button>
                <button className="btn-secondary" onClick={onChangeChoice}>
                    Change choice
                </button>
            </div>
        </div>
    );
}