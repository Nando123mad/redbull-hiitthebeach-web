import nodemailer from "nodemailer";
import twilio from "twilio";
import { put } from "@vercel/blob";

export async function POST(req) {
  try {
    const { channel, to, name, time, attachmentDataUrl } = await req.json();
    if (!channel || !to) {
      return Response.json({ error: "Missing channel or recipient" }, { status: 400 });
    }

    // ---------------- EMAIL ----------------
    if (channel === "email") {
      if (!attachmentDataUrl) {
        return Response.json({ error: "Missing attachment for email" }, { status: 400 });
      }

      const base64 = attachmentDataUrl.split(",")[1];
      if (!base64) {
        return Response.json({ error: "Bad dataURL" }, { status: 400 });
      }

      const transporter = nodemailer.createTransport({
        host: "smtp.sendgrid.net",
        port: 587,
        secure: false,
        auth: { user: "apikey", pass: process.env.SENDGRID_KEY },
      });

      const emailMessage = {
        from: `"Holobox Kiosk" <${process.env.FROM_EMAIL}>`,
        to,
        subject: "Your Course Card",
        text: `Hi ${name || ""}, here is your course card!`,
        attachments: [
          {
            filename: "course-card.png",
            content: base64,
            encoding: "base64",
            contentType: "image/png",
          },
        ],
      };

      // Log outgoing email details
      console.log("Sending email message:");
      console.log({
        to: emailMessage.to,
        subject: emailMessage.subject,
        text: emailMessage.text,
      });

      await transporter.sendMail(emailMessage);

      console.log("Email successfully sent to:", to);
      return Response.json({ ok: true });
    }

    // ---------------- PHONE (MMS) ----------------
    if (channel === "phone") {
      const toE164 = String(to || "").replace(/[^\d+]/g, "");

      if (!toE164.startsWith("+")) {
        return Response.json({ error: "Phone must be E.164 format, e.g. +15551234567" }, { status: 400 });
      }

      if (!attachmentDataUrl) {
        return Response.json({ error: "Missing image dataURL for MMS" }, { status: 400 });
      }

      const [meta, b64] = attachmentDataUrl.split(",");
      const contentTypeMatch = /^data:(image\/[a-zA-Z0-9.+-]+);base64$/.exec(meta || "");
      const contentType = contentTypeMatch?.[1] || "image/jpeg";
      const ext = contentType === "image/png" ? "png" : "jpg";

      const buf = Buffer.from(b64, "base64");
      if (buf.length > 5 * 1024 * 1024)
        return Response.json({ error: "Image too large (>5MB)" }, { status: 400 });

      const filename = `cards/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const blob = await put(filename, buf, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        contentType,
      });
      const mediaUrl = blob.url;

      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const useMessagingService = !!process.env.TWILIO_MESSAGING_SERVICE_SID;

      const bodyText = `Hi${name ? " " + name : ""}! Here’s your course card.`;

      // Log outgoing phone message
      console.log("Sending MMS message:");
      console.log({
        to: toE164,
        body: bodyText,
        mediaUrl,
      });

      const msg = await client.messages.create({
        to: toE164,
        ...(useMessagingService
          ? { messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID }
          : { from: process.env.TWILIO_FROM }),
        body: bodyText,
        mediaUrl: [mediaUrl],
      });

      console.log("MMS successfully sent:", { sid: msg.sid, to: toE164 });
      return Response.json({ ok: true, sid: msg.sid, mediaUrl });
    }



    
    return Response.json({ error: "Unsupported channel" }, { status: 400 });
  } catch (err) {
    console.error("SEND ERR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
