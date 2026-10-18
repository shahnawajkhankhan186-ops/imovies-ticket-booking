import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import TicketPrintable from '../../components/print/TicketPrintable';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertBanner from '../../components/ui/AlertBanner';
import Button from '../../components/ui/Button';
import { Printer, Home, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

export default function TicketPage() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/user/bookings/${bookingId}`);
      setBooking(res.data.booking);
    } catch (err) {
      setError(err.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <LoadingSpinner message="Generating your confirmed e-ticket..." />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container py-5">
        <AlertBanner
          type="danger"
          title="Ticket Not Found"
          message={error || 'Unable to retrieve ticket details.'}
        />
        <div className="mt-3">
          <Link to="/" className="btn btn-outline-light">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isPending = booking.status === 'AWAITING_PAYMENT';

  return (
    <div className="container py-4">
      {/* Non-printable screen banner & actions */}
      <div className="d-print-none mb-4">
        {isPending ? (
          <div className="im-glass p-3 rounded-4 mb-4 border border-warning d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h5 className="fw-bold text-warning m-0">Payment Pending</h5>
              <p className="text-secondary small m-0">
                This booking has not been confirmed yet. Please complete payment before the hold expires.
              </p>
            </div>
            <Link to={`/checkout/${booking._id}`} className="btn btn-warning d-flex align-items-center gap-2">
              <span>Complete Payment</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="im-glass p-3 rounded-4 mb-4 border border-success d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3">
              <CheckCircle2 size={36} className="text-success" />
              <div>
                <h5 className="fw-bold text-light m-0">Booking Confirmed!</h5>
                <p className="text-secondary small m-0">
                  Your tickets have been reserved. Show this digital ticket or QR code at cinema entry.
                </p>
              </div>
            </div>

            <div className="d-flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="d-flex align-items-center gap-2"
              >
                <Printer size={16} />
                <span>Print / Save PDF</span>
              </Button>

              <Link to="/my-bookings" className="btn btn-secondary d-flex align-items-center gap-2">
                <Calendar size={16} />
                <span>My Bookings</span>
              </Link>

              <Link to="/" className="btn btn-primary d-flex align-items-center gap-2">
                <Home size={16} />
                <span>Home</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Printable E-Ticket Component */}
      <div className="d-flex justify-content-center">
        <div style={{ maxWidth: '780px', width: '100%' }}>
          <TicketPrintable booking={booking} />
        </div>
      </div>
    </div>
  );
}
