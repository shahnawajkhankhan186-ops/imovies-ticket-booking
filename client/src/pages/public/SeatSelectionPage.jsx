import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Film, Clock, MapPin, AlertCircle, Sparkles } from 'lucide-react';
import api from '../../lib/api';
import { formatIST, formatISTTimeOnly } from '../../lib/ist-date';
import { formatPaise } from '../../lib/currency';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import SeatMap from '../../components/seats/SeatMap';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import AlertBanner from '../../components/ui/AlertBanner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function SeatSelectionPage() {
  const { id: showId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showData, setShowData] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeatLabels, setSelectedSeatLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Unpaid hold dialog state if user already has an active hold
  const [unpaidHoldDialog, setUnpaidHoldDialog] = useState(null);

  // Load show and seat availability
  const loadShowSeats = useCallback(async () => {
    try {
      const res = await api.get(`/public/shows/${showId}/seats`);
      setShowData(res.data.show);
      setSeats(res.data.seats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [showId]);

  useEffect(() => {
    loadShowSeats();
  }, [loadShowSeats]);

  // Real-time Socket.io integration with polling fallback
  useSocket(showId, {
    onSeatsHeld: ({ seatLabels: heldLabels }) => {
      setSeats((prev) =>
        prev.map((s) => (heldLabels.includes(s.seatLabel) ? { ...s, status: 'HELD' } : s))
      );
      // If any of my selected seats were held by someone else, deselect them
      setSelectedSeatLabels((prev) => prev.filter((label) => !heldLabels.includes(label)));
    },
    onSeatsReleased: ({ seatLabels: releasedLabels }) => {
      setSeats((prev) =>
        prev.map((s) => (releasedLabels.includes(s.seatLabel) ? { ...s, status: 'AVAILABLE' } : s))
      );
    },
    onSeatsBooked: ({ seatLabels: bookedLabels }) => {
      setSeats((prev) =>
        prev.map((s) => (bookedLabels.includes(s.seatLabel) ? { ...s, status: 'BOOKED' } : s))
      );
      setSelectedSeatLabels((prev) => prev.filter((label) => !bookedLabels.includes(label)));
    },
    onPollRefresh: () => {
      loadShowSeats();
    },
  });

  // Toggle seat selection
  const handleToggleSeat = (seatLabel) => {
    setError(null);
    if (selectedSeatLabels.includes(seatLabel)) {
      setSelectedSeatLabels((prev) => prev.filter((l) => l !== seatLabel));
    } else {
      if (selectedSeatLabels.length >= 8) {
        setError('You can select a maximum of 8 seats per booking.');
        return;
      }
      setSelectedSeatLabels((prev) => [...prev, seatLabel]);
    }
  };

  // Preview subtotal calculation (preview only — server recomputes authoritatively)
  const previewSubtotal = selectedSeatLabels.reduce((acc, label) => {
    const s = seats.find((item) => item.seatLabel === label);
    return acc + (s?.price || 0);
  }, 0);

  // Proceed to Hold and Checkout
  const handleProceedToPay = async () => {
    if (!user) {
      // Direct user to login, preserving destination
      navigate('/login', { state: { from: `/shows/${showId}/seats` } });
      return;
    }

    if (selectedSeatLabels.length === 0) {
      setError('Please select at least one seat to proceed.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/user/bookings/hold', {
        showId,
        seatLabels: selectedSeatLabels,
      });

      // Navigate to checkout with bookingId
      navigate(`/checkout/${res.data.bookingId}`);
    } catch (err) {
      if (err.code === 'UNPAID_HOLD' && err.details) {
        // User already has a live hold on this show
        setUnpaidHoldDialog(err.details);
      } else {
        setError(err.message || 'Failed to place seat hold. Please try again.');
        // Refresh seats to sync current map
        loadShowSeats();
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Release previous hold and re-attempt
  const handleReleasePreviousHoldAndContinue = async () => {
    if (!unpaidHoldDialog?.existingBookingId) return;
    try {
      await api.post(`/user/bookings/${unpaidHoldDialog.existingBookingId}/release`);
      setUnpaidHoldDialog(null);
      // Re-trigger proceed
      handleProceedToPay();
    } catch (err) {
      setError(err.message);
      setUnpaidHoldDialog(null);
    }
  };

  if (loading) return <LoadingSpinner text="Drawing cinema seat map..." fullScreen />;
  if (!showData) {
    return (
      <div className="container py-5 text-center">
        <h4 className="text-danger">Show details not found</h4>
        <Link to="/" className="btn btn-outline-secondary mt-3">
          Back to Home
        </Link>
      </div>
    );
  }

  const movie = showData.movie;
  const theatre = showData.theatre;
  const screen = showData.screen;

  return (
    <div className="seat-selection-page py-4 pb-5">
      <div className="container">
        {/* Header Bar */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
          <div className="d-flex align-items-center gap-3">
            <Link to={`/movies/${movie?._id}/shows`} className="btn btn-sm btn-outline-secondary rounded-circle p-2 text-light">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h4 className="fw-bold text-white m-0">{movie?.title}</h4>
              <div className="text-secondary small d-flex flex-wrap align-items-center gap-2 mt-1">
                <span>{theatre?.name}</span>
                <span>•</span>
                <span>{screen?.name}</span>
                <span>•</span>
                <span className="text-danger fw-semibold">{formatIST(showData.startTime)}</span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-dark border border-secondary text-light px-3 py-2">
              Max 8 Seats
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} className="mb-4" />}

        {/* Seat Map Surface */}
        <div className="im-glass p-4 rounded-4 shadow-lg mb-4">
          <SeatMap
            layout={screen?.layout}
            seats={seats}
            selectedSeats={selectedSeatLabels}
            onToggleSeat={handleToggleSeat}
            selectable={true}
            pricing={showData.pricing}
          />
        </div>

        {/* Sticky Price & Checkout Bar */}
        <div
          className="im-glass p-3 px-4 rounded-4 shadow-lg d-flex flex-wrap align-items-center justify-content-between gap-3 sticky-bottom"
          style={{ bottom: '1rem', border: '1px solid var(--border-subtle)', zIndex: 100 }}
        >
          <div>
            <div className="text-secondary small">
              Selected Seats:{' '}
              <strong className="text-white">
                {selectedSeatLabels.length > 0 ? selectedSeatLabels.join(', ') : 'None'}
              </strong>
            </div>
            <div className="fs-5 fw-bold text-light">
              Preview Total:{' '}
              <span className="text-danger">{formatPaise(previewSubtotal)}</span>
              <span className="text-secondary small fw-normal ms-2">(taxes & fees calculated at checkout)</span>
            </div>
          </div>

          <div>
            <Button
              variant="primary"
              size="lg"
              disabled={selectedSeatLabels.length === 0 || submitting}
              loading={submitting}
              onClick={handleProceedToPay}
            >
              {user ? 'Proceed to Pay' : 'Sign in & Book'}
            </Button>
          </div>
        </div>
      </div>

      {/* Unpaid Hold Conflict Dialog */}
      {unpaidHoldDialog && (
        <ConfirmDialog
          isOpen={!!unpaidHoldDialog}
          title="Active Hold in Progress"
          message={`You already have an active unpaid hold on this show (expires in ~${unpaidHoldDialog.remainingMinutes} min). Would you like to resume payment on that hold, or release it to select these new seats?`}
          confirmText="Release Hold & Pick New"
          cancelText="Resume Previous Hold"
          variant="danger"
          onConfirm={handleReleasePreviousHoldAndContinue}
          onCancel={() => navigate(`/checkout/${unpaidHoldDialog.existingBookingId}`)}
        />
      )}
    </div>
  );
}
