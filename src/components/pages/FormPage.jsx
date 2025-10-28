import { useEffect, useState } from "react";


export default function FormPage({ form, setForm, channel, setChannel, phone, setPhone, onBack, onNext }) {
    const [canNext, setCanNext] = useState(false);


    useEffect(() => {
        setCanNext(!!form.name && (channel === "email" ? !!form.email : !!phone));
    }, [form, channel, phone]);


    return (
        <div className="screen form-screen">
            <h2 className="title">Tell us about yourself</h2>


            <div className="form">
                <label>
                    Name
                    <input
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Enter your name"
                    />
                </label>


                <div style={{ margin: "1.5vh 0", display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        type="button"
                        onClick={() => setChannel(channel === "email" ? "phone" : "email")}
                        className="toggle-btn"
                        style={{
                            background: "#eee",
                            border: "1px solid #ccc",
                            borderRadius: "20px",
                            padding: "14px 14px",
                            fontWeight: "600",
                            cursor: "pointer",
                        }}
                    >
                        {channel === "email" ? "Send via Text" : "Send via Email"}
                    </button>
                </div>


                {channel === "email" ? (
                    <label>
                        Email
                        <input
                            value={form.email}
                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                            type="email"
                            placeholder="Email address"
                        />
                    </label>
                ) : (
                    <label>
                        Mobile number
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+1 555 123 4567" />

                        <small
                            style={{
                                display: "block",
                                marginTop: "6px",
                                fontSize: "12px",
                                color: "#5b6782",
                                lineHeight: "1.4",
                            }}
                        >
                            By entering your mobile number, you agree to receive a text message with
                            a link to your result. Message and data rates may apply.
                        </small>
                    </label>
                )}
            </div>


            <div className="row gap">
                <button className="btn-secondary" onClick={onBack}>
                    Back
                </button>
                <button className="btn-primary" onClick={onNext} disabled={!canNext}>
                    Next
                </button>
            </div>
        </div>
    );
}