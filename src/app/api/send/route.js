import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    const { to, subject, name, attachmentDataUrl } = await req.json();
    if (!to || !attachmentDataUrl) {
      return Response.json({ error: "Missing 'to' or attachment" }, { status: 400 });
    }
    const base64 = attachmentDataUrl.split(",")[1];
    if (!base64) {
      return Response.json({ error: "Bad dataURL" }, { status: 400 });
    }

    // SendGrid SMTP
    const transporter = nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      secure: false,
      auth: { user: "apikey", pass: process.env.SENDGRID_KEY },
    });

    await transporter.sendMail({
      from: `"Red Bull HIIT the Beach " <${process.env.FROM_EMAIL}>`,
      to,
      subject: subject || "Your - Red Bull HIIT the Beach - Course Card",
      text: `Hi ${name || ""}, here is your card! Good job on the HIIT the Beach workout today! Thank you for coming out great energy all around. Don’t forget to tag us on social media!`,
      attachments: [
        { filename: "course-card.png", content: base64, encoding: "base64", contentType: "image/png" },
      ],
    });

    return Response.json({ ok: true });
  } catch (err) {
    console.error("MAIL ERR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
