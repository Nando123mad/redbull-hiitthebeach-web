import nodemailer from "nodemailer";
import twilio from "twilio";

export async function POST(req) {
  try {
    const { channel, to, name, time, attachmentDataUrl } = await req.json();
    if (!channel || !to) return Response.json({ error: "Missing channel or recipient" }, { status: 400 });

    if (channel === "email") {
      if (!attachmentDataUrl) return Response.json({ error: "Missing attachment for email" }, { status: 400 });
      const base64 = attachmentDataUrl.split(",")[1];
      if (!base64) return Response.json({ error: "Bad dataURL" }, { status: 400 });

      const transporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        secure: false,
        auth: { user: "apikey", pass: process.env.SENDGRID_KEY }
      });

      await transporter.sendMail({
        from: `"Holobox Kiosk" <${process.env.FROM_EMAIL}>`,
        to,
        subject: "Your Course Card",
        text: `Hi ${name || ""}, here is your card (Time: ${time || "-"})`,
        attachments: [
          { filename: "course-card.png", content: base64, encoding: "base64", contentType: "image/png" }
        ]
      });

      return Response.json({ ok: true });
    }

    if (channel === "phone") {
      // 1) Basic checks + normalize phone here too
      const toE164 = String(to || "").replace(/[^\d+]/g, "");
      if (!toE164.startsWith("+")) {
        return Response.json({ error: "Phone must be in E.164 format, e.g. +15551234567" }, { status: 400 });
      }

      const origin = process.env.PUBLIC_APP_URL;
      if (!origin) {
        return Response.json({ error: "Missing PUBLIC_APP_URL env var" }, { status: 500 });
      }

      const qs = new URLSearchParams({ name: name || "", time: time || "" });
      const link = `${origin}/share?${qs.toString()}`;

      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

      // Optional: use a Messaging Service (recommended for deliverability)
      const useMessagingService = !!process.env.TWILIO_MESSAGING_SERVICE_SID;

      try {
        const msg = await client.messages.create({
          to: toE164,
          ...(useMessagingService
            ? { messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID }
            : { from: process.env.TWILIO_FROM }),
          body: `Hi${name ? " " + name : ""}! Here’s your course card: ${link}`,
          // Add a status callback to observe delivery lifecycle in your logs
          statusCallback: `${origin}/api/twilio-status`
        });

        // Return Twilio SID so you can look it up in the console
        return Response.json({ ok: true, sid: msg.sid });
      } catch (e) {
        // Surface Twilio error code and message
        return Response.json({ error: `Twilio: ${e.code || ""} ${e.message}` }, { status: 500 });
      }
    }

    return Response.json({ error: "Unsupported channel" }, { status: 400 });
  } catch (err) {
    console.error("SEND ERR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
