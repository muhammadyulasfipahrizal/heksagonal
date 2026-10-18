
import nodemailer from "nodemailer";

const smtpPort = Number(process.env.SMTP_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string
) {
  const from = process.env.SMTP_FROM;

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS ||
    !from
  ) {
    throw new Error("SMTP configuration is incomplete.");
  }

  await transporter.sendMail({
    from,
    to: email,
    subject: "Reset Your HEKSAGONAL Password",
    text: [
      "We received a request to reset your HEKSAGONAL password.",
      "",
      `Open this link to reset your password: ${resetUrl}`,
      "",
      "This link expires in 30 minutes.",
      "If you did not request a password reset, you can ignore this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; color: #111827;">
        <h2 style="color: #02054b;">Reset your password</h2>
        <p>We received a request to reset your HEKSAGONAL password.</p>
        <p>
          <a href="${resetUrl}"
             style="display: inline-block; padding: 12px 20px; background: #02054b; color: #ffffff; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </p>
        <p>This link expires in 30 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
