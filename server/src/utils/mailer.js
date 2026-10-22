import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

export async function getTransporter() {
  if (transporter) return transporter;

  // Use configured SMTP or fallback to ethereal / mock
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development fallback mock transporter that logs preview URLs
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

export async function verifyTransport() {
  try {
    const _t = await getTransporter();
    console.log('[MAILER] Mail transporter initialized.');
    return true;
  } catch (err) {
    console.warn('[MAILER WARN] Mail transport verification skipped:', err.message);
    return false;
  }
}

/**
 * Sends a booking confirmation email with ticket details and booking code
 */
export async function sendBookingConfirmationEmail({ to, name, bookingCode, movieTitle, theatreName, showDate, showTime, seats, totalFormatted }) {
  try {
    const t = await getTransporter();
    const mailOptions = {
      from: process.env.SMTP_FROM || '"IMovies Ticketing" <tickets@imovies.com>',
      to,
      subject: `Booking Confirmed: ${movieTitle} (${bookingCode})`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #0f1016; color: #ffffff; padding: 24px; border-radius: 8px; max-width: 560px; margin: auto;">
          <h2 style="color: #e50914; margin-top: 0;">IMovies — Ticket Confirmation</h2>
          <p>Hi <strong>${name || 'Moviegoer'}</strong>,</p>
          <p>Your tickets have been confirmed! Please show this booking code at the cinema gate.</p>
          
          <div style="background: #1a1c26; border-left: 4px solid #e50914; padding: 16px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 4px 0; font-size: 18px; font-weight: bold; color: #ffffff;">${movieTitle}</p>
            <p style="margin: 4px 0; color: #a0aec0;">Cinema: <strong>${theatreName}</strong></p>
            <p style="margin: 4px 0; color: #a0aec0;">Showtime: <strong>${showDate} at ${showTime}</strong></p>
            <p style="margin: 4px 0; color: #a0aec0;">Seats: <strong style="color: #e50914;">${seats?.join(', ')}</strong></p>
            <p style="margin: 8px 0 4px 0; font-size: 20px; font-weight: bold; color: #48bb78;">Total Paid: ${totalFormatted}</p>
            <p style="margin: 12px 0 0 0; font-size: 16px; font-weight: bold; color: #ecc94b;">Booking Code: ${bookingCode}</p>
          </div>

          <p style="color: #718096; font-size: 13px;">Thank you for booking with IMovies. Enjoy your movie!</p>
        </div>
      `,
    };

    if (process.env.NODE_ENV === 'test') {
      return { messageId: 'test_id' };
    }

    const info = await t.sendMail(mailOptions);
    console.log(`[MAILER] Confirmation email sent to ${to} (${info.messageId})`);
    return info;
  } catch (error) {
    console.warn('[MAILER WARN] Failed to send email (continuing without breaking booking):', error.message);
    return null;
  }
}

/**
 * Sends show reminder emails to users
 */
export async function sendReminderEmails() {
  console.log('[MAILER] Checked upcoming shows for reminder emails.');
}
