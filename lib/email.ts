
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



export async function sendUserLoginNotificationEmail(
  adminEmail: string,
  user: {
    name: string;
    email: string;
    phone: string;
  }
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

  const name = user.name || "Not provided";
  const email = user.email;
  const phone = user.phone || "Not provided";

  await transporter.sendMail({
    from,
    to: adminEmail,
    subject: `HEKSAGONAL - User Registration Notification: ${name}`,
    text: [
      "Hello Admin,",
      "",
      "A user has successfully register to HEKSAGONAL.",
      "",
      "User Details:",
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      "",
      "This is an automated notification from HEKSAGONAL.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; color: #111827; line-height: 1.6;">
        <h2 style="color: #02054b;">User Registration Notification</h2>

        <p>Hello Admin,</p>

        <p>
          A user has successfully logged in to
          <strong>HEKSAGONAL</strong>.
        </p>

        <h3 style="color: #02054b;">User Details</h3>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">
              Name
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
              ${escapeHtml(name)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">
              Email
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
              ${escapeHtml(email)}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">
              Phone
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
              ${escapeHtml(phone)}
            </td>
          </tr>
        </table>

        <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">
          This is an automated notification from HEKSAGONAL.
        </p>
      </div>
    `,
  });
}


function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}
