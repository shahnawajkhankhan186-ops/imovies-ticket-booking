import React from 'react';
import QRCode from 'react-qr-code';
import { formatIST } from '../../lib/ist-date';
import { formatPaise } from '../../lib/currency';

export default function TicketPrintable({ booking }) {
  if (!booking) return null;

  const show = booking.showId;
  const movie = show?.movieId;
  const theatre = show?.theatreId;
  const screen = show?.screenId;
  const seatList = booking.seats?.map((s) => s.seatLabel).join(', ');

  return (
    <div
      className="ticket-printable bg-white text-dark p-4 p-md-5 rounded-4 shadow border"
      style={{ maxWidth: '650px', width: '100%', margin: '0 auto', color: '#111827' }}
    >
      {/* Brand Header */}
      <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
        <div>
          <h2 className="fw-bold m-0 text-danger" style={{ letterSpacing: '1px' }}>
            IMOVIES
          </h2>
          <div className="small text-muted">Movie ticket booking made simple.</div>
        </div>
        <div className="text-end">
          <div className="badge bg-success fs-7 px-3 py-1">CONFIRMED E-TICKET</div>
          <div className="small text-muted mt-1">Ref: {booking.bookingCode}</div>
        </div>
      </div>

      {/* Main Ticket Info */}
      <div className="row g-4 mb-4">
        <div className="col-8">
          <h3 className="fw-bold text-dark mb-1">{movie?.title}</h3>
          <div className="text-muted small mb-3">
            {movie?.certificate} • {show?.language} • {show?.format} • {movie?.durationMinutes} mins
          </div>

          <div className="mb-2">
            <span className="text-muted small d-block">Cinema & Screen</span>
            <strong className="text-dark fs-6">
              {theatre?.name}, {screen?.name}
            </strong>
            <div className="small text-muted">{theatre?.address}</div>
          </div>

          <div className="mb-2">
            <span className="text-muted small d-block">Showtime (IST)</span>
            <strong className="text-dark fs-6">{formatIST(show?.startTime)}</strong>
          </div>

          <div>
            <span className="text-muted small d-block">Seats</span>
            <strong className="text-danger fs-5">{seatList}</strong>
          </div>
        </div>

        {/* QR Code */}
        <div className="col-4 d-flex flex-column align-items-center justify-content-center text-center">
          <div className="p-2 border rounded-3 bg-white mb-2">
            <QRCode value={booking.bookingCode} size={110} />
          </div>
          <div className="fw-bold font-monospace small">{booking.bookingCode}</div>
          <div className="text-muted" style={{ fontSize: '10px' }}>
            Scan at Cinema Entrance
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-light p-3 rounded-3 mb-3 border">
        <div className="d-flex justify-content-between small text-muted mb-1">
          <span>Tickets Subtotal</span>
          <span>{formatPaise(booking.subtotal)}</span>
        </div>
        {booking.discount > 0 && (
          <div className="d-flex justify-content-between small text-success mb-1">
            <span>Coupon Discount ({booking.couponCode})</span>
            <span>-{formatPaise(booking.discount)}</span>
          </div>
        )}
        <div className="d-flex justify-content-between small text-muted mb-1">
          <span>Convenience Fee</span>
          <span>{formatPaise(booking.convenienceFee)}</span>
        </div>
        <div className="d-flex justify-content-between fw-bold text-dark border-top pt-2 mt-1 fs-6">
          <span>Total Paid</span>
          <span className="text-danger">{formatPaise(booking.total)}</span>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="small text-muted border-top pt-3 text-center" style={{ fontSize: '11px' }}>
        Please show this QR code or booking reference at the gate. Food & beverages are not allowed from outside.
      </div>
    </div>
  );
}
