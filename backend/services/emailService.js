const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null; // email not configured; caller should handle gracefully

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
};

/**
 * Sends an email if SMTP is configured. In development without SMTP configured,
 * logs the content to the console instead of failing the request — this keeps
 * registration/reset flows testable without a mail provider.
 */
const sendEmail = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t) {
    console.log(`[Email:DEV] To: ${to} | Subject: ${subject}\n${html}`);
    return { simulated: true };
  }
  return t.sendMail({
    from: process.env.SMTP_FROM || 'PropFlow <no-reply@propflow.app>',
    to,
    subject,
    html,
  });
};

const sendVerificationEmail = (to, name, verifyUrl) =>
  sendEmail({
    to,
    subject: 'Verify your PropFlow account',
    html: `<p>Hi ${name},</p><p>Welcome to PropFlow. Please verify your email by clicking the link below:</p><p><a href="${verifyUrl}">Verify Email</a></p><p>This link expires in 24 hours.</p>`,
  });

const sendPasswordResetEmail = (to, name, resetUrl) =>
  sendEmail({
    to,
    subject: 'Reset your PropFlow password',
    html: `<p>Hi ${name},</p><p>You requested a password reset. Click the link below to set a new password:</p><p><a href="${resetUrl}">Reset Password</a></p><p>This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.</p>`,
  });

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
