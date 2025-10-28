export default function ThanksPage({ channel, email, phone, onRestart }) {
    return (
        <div className="screen center-col">
            <h2 className="hero">Thank you!</h2>
            <p className="sub">
                {channel === "email"
                    ? `Your card is on the way to ${email}.`
                    : `We texted you a link at ${phone}.`}
            </p>
            <button className="btn-primary" onClick={onRestart}>
                Start Over
            </button>
        </div>
    );
}