export default function PhotoDecidePage({ onSkip, onTake }) {
    return (
        <div className="screen center-col">
            <h2 className="title">Want to take a picture?</h2>
            <div className="row gap">
                <button className="btn-secondary" onClick={onSkip}>
                    Not now
                </button>
                <button className="btn-primary" onClick={onTake}>
                    Take photo
                </button>
            </div>
        </div>
    );
}