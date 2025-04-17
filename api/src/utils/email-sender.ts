import nodemailer, { Transporter, SendMailOptions } from "nodemailer";

/**
 * Email options interface for the sendEmail function
 */
interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    path?: string;
    contentType?: string;
    encoding?: string;
    cid?: string;
  }>;
}

/**
 * Sends an email with optional attachments using Nodemailer
 * @param options - Email configuration options
 * @returns Promise resolving with info about the sent email
 */
export async function sendEmail(
  options: EmailOptions
): Promise<nodemailer.SentMessageInfo> {
  // Create a transporter using SMTP configuration
  const transporter: Transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  // Email message configuration
  const mailOptions: SendMailOptions = {
    from: process.env.EMAIL_FROM || "noreply@yourdomain.com",
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments || [],
  };

  // Send email and return the promise
  return transporter.sendMail(mailOptions);
}

export default sendEmail;
