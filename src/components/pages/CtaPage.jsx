export default function CtaPage({ onStart }) {
    return (
        <div className="screen center-col">
            <h1 className="hero">
                Share Your <span className="accent">Run</span>
            </h1>
            <p className="sub">Tap to start the experience</p>
            <button className="btn-primary xl" onClick={onStart}>
                Start
            </button>
        </div>
    );
}