import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { formatINR } from '../../lib/currency';
import { formatISTDateTime } from '../../lib/ist-date';
import CountdownTimer from '../../components/ui/CountdownTimer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import AlertBanner from '../../components/ui/AlertBanner';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { ShieldCheck, Film, MapPin, Tag, CreditCard, ArrowLeft, Clock, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState(null);

  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/user/bookings/${bookingId}`);
      const b = res.data.booking;
      setBooking(b);

      if (b.status === 'CONFIRMED' || b.status === 'USED') {
        navigate(`/ticket/${b._id}`, { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [bookingId, navigate]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleHoldExpired = () => {
    toast.error('Seat hold expired. Seats have been released.');
    fetchBooking();
  };

  const handleRelease = async () => {
    try {
      setReleasing(true);
      await api.post(`/user/bookings/${bookingId}/release`);
      toast.success('Seats released successfully');
      navigate(-1);
    } catch (err) {
      toast.error(err.message || 'Failed to release seats');
    } finally {
      setReleasing(false);
      setReleaseOpen(false);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError(null);

    try {
      // Release current hold and re-hold with coupon to get authoritative server-side calculation
      const showId = booking.showId._id;
      const seatLabels = booking.seats.map((s) => s.seatLabel);

      await api.post(`/user/bookings/${bookingId}/release`);
      const holdRes = await api.post('/user/bookings/hold', {
        showId,
        seatLabels,
        couponCode: couponCode.trim().toUpperCase(),
      });

      toast.success(`Coupon applied! Saved ${formatINR(holdRes.data.booking.discount)}`);
      navigate(`/checkout/${holdRes.data.booking._id}`, { replace: true });
    } catch (err) {
      setCouponError(err.message || 'Invalid or inapplicable coupon');
      fetchBooking(); // refresh current booking state
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleSimulatePayment = async () => {
    try {
      setPaying(true);
      const res = await api.post(`/user/bookings/${bookingId}/test-pay`);
      toast.success('Payment verified! Ticket confirmed.');
      navigate(`/ticket/${res.data.bookingId}`, { replace: true });
    } catch (err) {
      toast.error(err.message || 'Payment simulation failed');
      fetchBooking();
    } finally {
      setPaying(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setPaying(true);
    try {
      const res = await api.post(`/user/bookings/${bookingId}/pay`);
      const { orderId, amount, bookingCode } = res.data;

      const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_imovies_dummy_key_id';

      if (!window.Razorpay) {
        toast('Razorpay SDK not loaded in test mode. Falling back to test payment simulation.');
        await handleSimulatePayment();
        return;
      }

      const options = {
        key: rzpKey,
        amount,
        currency: 'INR',
        name: 'IMovies',
        description: `Booking #${bookingCode}`,
        order_id: orderId,
        handler: async function (response) {
          toast.success('Payment authorized. Confirming booking...');
          // Poll for confirmed booking
          let attempts = 0;
          const interval = setInterval(async () => {
            attempts += 1;
            try {
              const checkRes = await api.get(`/user/bookings/${bookingId}`);
              if (checkRes.data.booking.status === 'CONFIRMED') {
                clearInterval(interval);
                navigate(`/ticket/${bookingId}`, { replace: true });
              }
            } catch (pErr) {
              // continue
            }
            if (attempts > 5) {
              clearInterval(interval);
              // Trigger test pay verification to ensure confirmation in dev
              await handleSimulatePayment();
            }
          }, 1500);
        },
        theme: {
          color: '#e50914',
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (failRes) {
        toast.error(`Payment failed: ${failRes.error?.description || 'Gateway error'}`);
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.message || 'Failed to initiate payment');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <LoadingSpinner message="Securing your booking order..." />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container py-5">
        <AlertBanner
          type="danger"
          title="Booking Not Found"
          message={error || 'Unable to load booking details.'}
        />
        <div className="mt-3">
          <Link to="/" className="btn btn-outline-light">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const isExpired =
    booking.status === 'EXPIRED' ||
    (booking.holdExpiresAt && new Date(booking.holdExpiresAt) < new Date());

  if (isExpired) {
    return (
      <div className="container py-5">
        <div className="im-glass p-5 rounded-4 text-center max-w-lg mx-auto" style={{ maxWidth: '580px' }}>
          <Clock size={48} className="text-warning mb-3" />
          <h2 className="fw-bold mb-2">Hold Expired</h2>
          <p className="text-secondary mb-4">
            The 7-minute seat hold timer for this booking has expired. The seats have been released for other moviegoers.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/" className="btn btn-primary">
              Browse Movies
            </Link>
            <Link to="/my-bookings" className="btn btn-outline-secondary">
              My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const show = booking.showId;
  const movie = show?.movieId;
  const theatre = show?.theatreId;
  const screen = show?.screenId;

  return (
    <div className="container py-4">
      {/* Top Banner / Timer */}
      <div className="im-glass p-3 rounded-4 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex align-items-center gap-3">
          <Link to={-1} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <h5 className="m-0 fw-bold">Order Checkout</h5>
            <span className="text-secondary small">Booking Ref: {booking.bookingCode}</span>
          </div>
        </div>

        {booking.holdExpiresAt && (
          <div className="d-flex align-items-center gap-2">
            <CountdownTimer expiresAt={booking.holdExpiresAt} onExpire={handleHoldExpired} />
          </div>
        )}
      </div>

      <div className="row g-4">
        {/* Left Column: Show & Seat Summary */}
        <div className="col-lg-7">
          <div className="im-glass p-4 rounded-4 mb-4">
            <div className="d-flex gap-3 mb-4">
              <img
                src={movie?.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400'}
                alt={movie?.title}
                className="rounded-3 shadow"
                style={{ width: '100px', height: '145px', objectFit: 'cover' }}
              />
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h4 className="fw-bold m-0">{movie?.title}</h4>
                  {movie?.certificate && (
                    <span className="badge bg-secondary">{movie.certificate}</span>
                  )}
                </div>
                <div className="text-secondary small d-flex align-items-center gap-2 mb-2">
                  <Film size={14} />
                  <span>{show?.format} • {show?.language}</span>
                </div>
                <div className="text-secondary small d-flex align-items-center gap-2 mb-2">
                  <MapPin size={14} />
                  <span>{theatre?.name}, {theatre?.city} ({screen?.name})</span>
                </div>
                <div className="text-light small fw-medium">
                  {show?.startTime && formatISTDateTime(show.startTime)}
                </div>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--border-color)' }} />

            <div>
              <div className="text-secondary small text-uppercase fw-semibold mb-2">Selected Seats</div>
              <div className="d-flex flex-wrap gap-2">
                {booking.seats?.map((s) => (
                  <span
                    key={s.seatLabel}
                    className="badge p-2 px-3 fs-6 d-flex align-items-center gap-2"
                    style={{ background: '#1c2236', border: '1px solid #2d3752', color: '#fff' }}
                  >
                    <span className="fw-bold">{s.seatLabel}</span>
                    <span className="badge bg-danger text-uppercase" style={{ fontSize: '0.65rem' }}>
                      {s.category}
                    </span>
                    <span className="text-secondary small">{formatINR(s.price)}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Coupon Box */}
          <div className="im-glass p-4 rounded-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Tag size={18} className="text-danger" />
              <h6 className="fw-bold m-0">Apply Coupon Code</h6>
            </div>

            {booking.couponCode ? (
              <div className="p-3 rounded-3 d-flex align-items-center justify-content-between" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e' }}>
                <div>
                  <span className="badge bg-success me-2">{booking.couponCode}</span>
                  <span className="text-success small fw-medium">Coupon applied successfully!</span>
                </div>
                <span className="text-success fw-bold">-{formatINR(booking.discount)}</span>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="d-flex gap-2">
                <Input
                  placeholder="Enter code (e.g. WELCOME100, IMOVIES50)"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  error={couponError}
                  disabled={applyingCoupon}
                />
                <Button
                  type="submit"
                  variant="outline"
                  loading={applyingCoupon}
                  disabled={!couponCode.trim()}
                >
                  Apply
                </Button>
              </form>
            )}

            <div className="mt-2 text-secondary small">
              Available coupons: <span className="text-light fw-medium">WELCOME100</span> (₹100 off), <span className="text-light fw-medium">IMOVIES50</span> (50% off up to ₹150)
            </div>
          </div>
        </div>

        {/* Right Column: Price Breakdown & Pay */}
        <div className="col-lg-5">
          <div className="im-glass p-4 rounded-4">
            <h5 className="fw-bold mb-4">Payment Breakdown</h5>

            <div className="d-flex justify-content-between mb-2">
              <span className="text-secondary">Seat Subtotal ({booking.seats?.length} tickets)</span>
              <span className="fw-medium">{formatINR(booking.subtotal)}</span>
            </div>

            <div className="d-flex justify-content-between mb-2">
              <span className="text-secondary">Convenience Fee (5%)</span>
              <span className="fw-medium">{formatINR(booking.convenienceFee)}</span>
            </div>

            {booking.discount > 0 && (
              <div className="d-flex justify-content-between mb-2 text-success">
                <span>Coupon Discount ({booking.couponCode})</span>
                <span className="fw-bold">-{formatINR(booking.discount)}</span>
              </div>
            )}

            <hr style={{ borderColor: 'var(--border-color)' }} />

            <div className="d-flex justify-content-between mb-4">
              <span className="fs-5 fw-bold">Total Amount Payable</span>
              <span className="fs-4 fw-bold text-danger">{formatINR(booking.total)}</span>
            </div>

            <div className="d-flex flex-column gap-3 mb-4">
              <Button
                variant="primary"
                size="lg"
                loading={paying}
                onClick={handleSimulatePayment}
                className="w-100 d-flex align-items-center justify-content-center gap-2"
              >
                <Zap size={18} />
                <span>Simulate Instant Payment (Test Mode)</span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                loading={paying}
                onClick={handleRazorpayPayment}
                className="w-100 d-flex align-items-center justify-content-center gap-2"
              >
                <CreditCard size={18} />
                <span>Pay via Razorpay Modal</span>
              </Button>
            </div>

            <div className="d-flex align-items-center justify-content-center gap-2 text-secondary small mb-4">
              <ShieldCheck size={16} className="text-success" />
              <span>100% Secure Payment • Instant E-Ticket Confirmation</span>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setReleaseOpen(true)}
                className="btn btn-link text-secondary text-decoration-none small p-0"
              >
                Cancel and release seats
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={releaseOpen}
        title="Release Seats?"
        message="Are you sure you want to release your reserved seats? Other moviegoers may book them immediately."
        confirmText="Yes, Release"
        cancelText="Keep My Seats"
        variant="warning"
        loading={releasing}
        onConfirm={handleRelease}
        onCancel={() => setReleaseOpen(false)}
      />
    </div>
  );
}
