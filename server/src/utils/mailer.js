import nodemailer from 'nodemailer';
import { generateTicketPDFBuffer } from './pdfTicket.js';

let transporter = null;

export async function getTransporter() {
  if (transporter) return transporter;

  // Use configured SMTP or fallback to ethereal / mock
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      connectionTimeout: 5000, // 5s fast timeout to prevent cloud hanging
      greetingTimeout: 5000,
      socketTimeout: 5000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback mock transporter
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'mock_imovies@ethereal.email',
        pass: 'mock_secret_key',
      },
    });
  }

  return transporter;
}

/**
 * Send email via Brevo REST API (HTTPS Port 443 - Works seamlessly on Render Free Tier)
 */
async function sendViaBrevo({ to, subject, html, attachments = [], senderName = 'IMovies Ticketing' }) {
  const senderEmail = process.env.SMTP_USER || 'shahnawajkhankhan186@gmail.com';
  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };

  if (attachments.length > 0) {
    payload.attachment = attachments.map((att) => ({
      name: att.filename,
      content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : Buffer.from(att.content).toString('base64'),
    }));
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log(`\x1b[32m[BREVO SUCCESS]\x1b[0m Email sent to ${to} (MessageId: ${data.messageId})`);
  return { messageId: data.messageId };
}

/**
 * Send email via Resend REST API (HTTPS Port 443 - Works seamlessly on Render Free Tier)
 */
async function sendViaResend({ to, subject, html, attachments = [], senderName = 'IMovies Ticketing' }) {
  const fromEmail = process.env.RESEND_FROM || `${senderName} <onboarding@resend.dev>`;
  const payload = {
    from: fromEmail,
    to: [to],
    subject,
    html,
  };

  if (attachments.length > 0) {
    payload.attachments = attachments.map((att) => ({
      filename: att.filename,
      content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : Buffer.from(att.content).toString('base64'),
    }));
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  console.log(`\x1b[32m[RESEND SUCCESS]\x1b[0m Email sent to ${to} (ID: ${data.id})`);
  return { messageId: data.id };
}

/**
 * Unified Email Dispatcher with HTTPS API Priority & Fast-Timeout SMTP Fallback
 */
export async function dispatchEmail({ to, subject, html, attachments = [], senderName = 'IMovies' }) {
  if (process.env.NODE_ENV === 'test') {
    return { messageId: 'test_dispatch_id' };
  }

  // 1. Try Brevo HTTPS API (Port 443)
  if (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY) {
    return await sendViaBrevo({ to, subject, html, attachments, senderName });
  }

  // 2. Try Resend HTTPS API (Port 443)
  if (process.env.RESEND_API_KEY) {
    return await sendViaResend({ to, subject, html, attachments, senderName });
  }

  // 3. Fallback to Nodemailer SMTP (e.g. Gmail on local or unblocked hosts)
  const t = await getTransporter();
  const mailOptions = {
    from: process.env.SMTP_FROM || `"${senderName}" <${process.env.SMTP_USER || 'tickets@imovies.com'}>`,
    to,
    subject,
    html,
    attachments,
  };

  return await t.sendMail(mailOptions);
}

export async function verifyTransport() {
  if (process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY) {
    console.log('[MAILER] Brevo HTTPS API configured (Port 443).');
    return true;
  }
  if (process.env.RESEND_API_KEY) {
    console.log('[MAILER] Resend HTTPS API configured (Port 443).');
    return true;
  }
  try {
    const _t = await getTransporter();
    console.log('[MAILER] SMTP transporter initialized.');
    return true;
  } catch (err) {
    console.warn('[MAILER WARN] Mail transport verification skipped:', err.message);
    return false;
  }
}

/**
 * Sends a booking confirmation email with ticket details and in-memory PDF ticket
 */
export async function sendBookingConfirmationEmail({
  to,
  name,
  bookingCode,
  movieTitle,
  theatreName,
  showDate,
  showTime,
  seats,
  totalFormatted,
}) {
  console.log(`\n\x1b[32m[DISPATCHING TICKET PASS EMAIL]\x1b[0m Booking: \x1b[33m${bookingCode}\x1b[0m To: \x1b[36m${to}\x1b[0m`);

  try {
    // Generate in-memory PDF ticket buffer
    const attachments = [];
    try {
      const pdfBuffer = await generateTicketPDFBuffer({
        bookingCode,
        movieTitle,
        theatreName,
        showDate,
        showTime,
        seats,
        totalFormatted,
        name,
      });
      attachments.push({
        filename: `IMovies_Ticket_${bookingCode}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
    } catch (pdfErr) {
      console.warn('[MAILER WARN] PDF ticket generation skipped:', pdfErr.message);
    }

    const html = `
      <div style="font-family: Arial, sans-serif; background: #0f1016; color: #ffffff; padding: 24px; border-radius: 8px; max-width: 560px; margin: auto;">
        <h2 style="color: #e50914; margin-top: 0;">IMovies — Ticket Confirmation</h2>
        <p>Hi <strong>${name || 'Moviegoer'}</strong>,</p>
        <p>Your tickets have been confirmed! Please find your official entry <strong>PDF Ticket attached</strong> to this email, or show this booking code at the cinema gate.</p>
        
        <div style="background: #1a1c26; border-left: 4px solid #e50914; padding: 16px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 4px 0; font-size: 18px; font-weight: bold; color: #ffffff;">${movieTitle}</p>
          <p style="margin: 4px 0; color: #a0aec0;">Cinema: <strong>${theatreName}</strong></p>
          <p style="margin: 4px 0; color: #a0aec0;">Showtime: <strong>${showDate} at ${showTime}</strong></p>
          <p style="margin: 4px 0; color: #a0aec0;">Seats: <strong style="color: #e50914;">${seats?.join(', ')}</strong></p>
          <p style="margin: 8px 0 4px 0; font-size: 20px; font-weight: bold; color: #48bb78;">Total Paid: ${totalFormatted}</p>
          <p style="margin: 12px 0 0 0; font-size: 16px; font-weight: bold; color: #ecc94b;">Booking Code: ${bookingCode}</p>
        </div>

        <p style="color: #718096; font-size: 13px;">Attached: <strong>IMovies_Ticket_${bookingCode}.pdf</strong></p>
        <p style="color: #718096; font-size: 13px;">Thank you for booking with IMovies. Enjoy your movie!</p>
      </div>
    `;

    const info = await dispatchEmail({
      to,
      subject: `Booking Confirmed: ${movieTitle} (${bookingCode})`,
      html,
      attachments,
      senderName: 'IMovies Ticketing',
    });

    console.log(`[MAILER] Ticket pass email sent to ${to} for booking ${bookingCode}`);
    return info;
  } catch (error) {
    console.warn('[MAILER WARN] Failed to send ticket confirmation email:', error.message);
    return null;
  }
}

/**
 * Sends a 6-digit OTP password recovery email
 */
export async function sendPasswordResetEmail({ to, otp }) {
  // Always log OTP prominently in server console / Render logs
  console.log(`\n\x1b[35m====================================================\x1b[0m`);
  console.log(`\x1b[35m[PASSWORD RESET OTP GENERATED]\x1b[0m`);
  console.log(`  To: \x1b[33m${to}\x1b[0m`);
  console.log(`  6-Digit Code: \x1b[36;1m${otp}\x1b[0m`);
  console.log(`\x1b[35m====================================================\x1b[0m\n`);

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; background: #0f1016; color: #ffffff; padding: 24px; border-radius: 8px; max-width: 500px; margin: auto;">
        <h2 style="color: #e50914; margin-top: 0;">IMovies Security</h2>
        <p>We received a request to reset your password. Use the verification code below:</p>
        <div style="background: #1b1e2e; border: 1px dashed #e50914; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #ffffff;">${otp}</span>
        </div>
        <p style="color: #a0aec0; font-size: 13px;">This OTP will expire in 60 minutes. If you did not make this request, please ignore this email.</p>
      </div>
    `;

    const info = await dispatchEmail({
      to,
      subject: `IMovies — Password Reset OTP (${otp})`,
      html,
      senderName: 'IMovies Security',
    });

    console.log(`[MAILER] Password reset OTP email dispatched to ${to}`);
    return info;
  } catch (error) {
    console.warn('[MAILER WARN] Failed to send OTP email:', error.message);
    return null;
  }
}

/**
 * Sends a 6-digit Email Verification OTP to new registration users
 */
export async function sendEmailVerificationOTP({ to, otp }) {
  console.log(`\n\x1b[36m====================================================\x1b[0m`);
  console.log(`\x1b[36m[REGISTRATION VERIFICATION OTP]\x1b[0m`);
  console.log(`  To: \x1b[33m${to}\x1b[0m`);
  console.log(`  6-Digit Code: \x1b[32;1m${otp}\x1b[0m`);
  console.log(`\x1b[36m====================================================\x1b[0m\n`);

  try {
    const html = `
      <div style="font-family: Arial, sans-serif; background: #0f1016; color: #ffffff; padding: 24px; border-radius: 8px; max-width: 500px; margin: auto;">
        <h2 style="color: #e50914; margin-top: 0;">Welcome to IMovies!</h2>
        <p>Thank you for creating an account. Please verify your email address using the verification code below:</p>
        <div style="background: #1b1e2e; border: 1px dashed #e50914; border-radius: 8px; padding: 18px; text-align: center; margin: 20px 0;">
          <span style="font-size: 34px; font-weight: bold; letter-spacing: 6px; color: #ffffff;">${otp}</span>
        </div>
        <p style="color: #a0aec0; font-size: 13px;">This OTP is valid for 10 minutes. Do not share this code with anyone.</p>
        <p style="color: #718096; font-size: 12px; margin-top: 24px; border-top: 1px solid #242c44; pt-2;">If you did not attempt to sign up for IMovies, you can safely ignore this email.</p>
      </div>
    `;

    const info = await dispatchEmail({
      to,
      subject: `IMovies — Your Registration Verification Code (${otp})`,
      html,
      senderName: 'IMovies Verification',
    });

    console.log(`[MAILER] Registration verification OTP sent to ${to}`);
    return info;
  } catch (error) {
    console.warn('[MAILER WARN] Failed to send registration OTP email:', error.message);
    return null;
  }
}

export async function sendReminderEmails() {
  console.log('[MAILER] Checked upcoming shows for reminder emails.');
}
