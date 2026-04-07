import nodemailer from "nodemailer";
import { env } from "@/lib/env";

type RegistrationEmailOptions = {
  to: string;
  loginUrl: string;
  username: string;
};

function hasSmtpConfig() {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.SMTP_FROM);
}

export async function sendRegistrationEmail(options: RegistrationEmailOptions) {
  if (!hasSmtpConfig()) {
    return { sent: false, reason: "SMTP configuration is missing." };
  }

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  await transport.sendMail({
    from: env.SMTP_FROM,
    to: options.to,
    subject: "Welcome to SocialConnect",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Welcome, ${options.username}</h2>
        <p>Your SocialConnect account is ready.</p>
        <p>You can log in here:</p>
        <p><a href="${options.loginUrl}">${options.loginUrl}</a></p>
      </div>
    `
  });

  return { sent: true };
}