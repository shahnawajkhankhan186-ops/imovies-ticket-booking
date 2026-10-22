import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Film,
  Ticket,
  ShieldCheck,
  Zap,
  Sparkles,
  QrCode,
  ArrowRight,
  Play,
  Star,
  Clock,
  Heart,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import TrailerModal from '../../components/movies/TrailerModal';

export default function LandingPage() {
  const { user } = useAuth();
  const [featuredMovies, setFeaturedMovies] = useState([]);
  const [trailerMovie, setTrailerMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await api.get('/public/movies', { params: { limit: 6 } });
        setFeaturedMovies(res.data.movies || []);
      } catch (err) {
        console.error('Failed to load landing movies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const heroBg = featuredMovies[0]?.bannerUrl || featuredMovies[0]?.posterUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&auto=format&fit=crop&q=80';

  return (
    <div className="landing-page overflow-hidden">
      {/* 1. HERO SECTION */}
      <section
        className="position-relative d-flex align-items-center justify-content-center text-center text-white"
        style={{
          minHeight: '88vh',
          background: `radial-gradient(circle at center, rgba(15, 16, 22, 0.4) 0%, rgba(10, 12, 19, 0.92) 80%, rgba(10, 12, 19, 1) 100%), url(${heroBg}) center/cover no-repeat`,
        }}
      >
        <div
          className="position-absolute top-0 start-0 w-100 h-100"
          style={{
            background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(229, 9, 20, 0.25), transparent)',
            pointerEvents: 'none',
          }}
        />

        <div className="container position-relative py-5">
          <div className="mx-auto" style={{ maxWidth: '840px' }}>
            {/* Pill Badge */}
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-4 border border-danger border-opacity-50"
              style={{ background: 'rgba(229, 9, 20, 0.12)', backdropFilter: 'blur(8px)' }}
            >
              <Sparkles size={15} className="text-danger" />
              <span className="text-danger text-uppercase fw-bold" style={{ fontSize: '12px', letterSpacing: '1.5px' }}>
                The Next-Gen Cinema Booking Platform
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="display-3 fw-extrabold text-white mb-3" style={{ letterSpacing: '-1px' }}>
              Welcome to <span className="text-danger" style={{ textShadow: '0 0 35px rgba(229, 9, 20, 0.6)' }}>iMovies</span>
            </h1>

            {/* Subtitle matching syllabus requirements */}
            <p className="lead text-secondary fs-5 mb-5 mx-auto" style={{ maxWidth: '640px', lineHeight: '1.6' }}>
              Your ultimate destination for the latest blockbusters, timeless classics, real-time seat locks, and seamless digital tickets.
            </p>

            {/* Call To Action Buttons */}
            <div className="d-flex flex-wrap justify-content-center align-items-center gap-3">
              <Link
                to="/"
                className="btn btn-danger btn-lg px-4 py-3 fw-bold rounded-pill shadow d-flex align-items-center gap-2 transition"
                style={{
                  boxShadow: '0 8px 24px rgba(229, 9, 20, 0.45)',
                  fontSize: '16px',
                }}
              >
                <Ticket size={18} />
                <span>Explore Movies & Book</span>
                <ArrowRight size={18} />
              </Link>

              {!user ? (
                <div className="d-flex gap-2">
                  <Link
                    to="/login"
                    className="btn btn-outline-light btn-lg px-4 py-3 fw-bold rounded-pill transition"
                    style={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)', fontSize: '16px' }}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-outline-danger btn-lg px-4 py-3 fw-bold rounded-pill transition"
                    style={{ background: 'rgba(229, 9, 20, 0.08)', backdropFilter: 'blur(10px)', fontSize: '16px' }}
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <Link
                  to="/favorites"
                  className="btn btn-outline-danger btn-lg px-4 py-3 fw-bold rounded-pill d-flex align-items-center gap-2"
                  style={{ background: 'rgba(229, 9, 20, 0.08)', backdropFilter: 'blur(10px)', fontSize: '16px' }}
                >
                  <Heart size={18} fill="#e50914" />
                  <span>My Watchlist</span>
                </Link>
              )}
            </div>

            {/* Live Stats Strip */}
            <div
              className="row row-cols-2 row-cols-md-4 g-3 mt-5 pt-4 text-center border-top border-secondary border-opacity-25"
              style={{ maxWidth: '780px', margin: '0 auto' }}
            >
              <div className="col">
                <div className="fs-3 fw-extrabold text-white">50+</div>
                <div className="small text-secondary text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.8px' }}>
                  Blockbuster Releases
                </div>
              </div>
              <div className="col">
                <div className="fs-3 fw-extrabold text-danger">100%</div>
                <div className="small text-secondary text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.8px' }}>
                  Live Seat Lock
                </div>
              </div>
              <div className="col">
                <div className="fs-3 fw-extrabold text-white">4.9 ★</div>
                <div className="small text-secondary text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.8px' }}>
                  User Rating
                </div>
              </div>
              <div className="col">
                <div className="fs-3 fw-extrabold text-success">0 sec</div>
                <div className="small text-secondary text-uppercase" style={{ fontSize: '11px', letterSpacing: '0.8px' }}>
                  QR Gate Check-In
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NOW SHOWING SPOTLIGHT REEL */}
      <section className="py-5 bg-dark bg-opacity-50 border-top border-bottom border-secondary border-opacity-10">
        <div className="container py-3">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <div>
              <div className="d-flex align-items-center gap-2 text-danger small fw-bold text-uppercase mb-1">
                <TrendingUp size={16} />
                <span>Now In Cinemas</span>
              </div>
              <h2 className="fw-bold text-light mb-0">Trending Blockbusters</h2>
            </div>
            <Link to="/" className="btn btn-sm btn-outline-danger rounded-pill d-flex align-items-center gap-1">
              <span>View All Movies</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-6 g-3">
            {featuredMovies.slice(0, 6).map((movie) => (
              <div key={movie._id} className="col">
                <div
                  className="card border-0 bg-transparent h-100 position-relative group overflow-hidden"
                  style={{ borderRadius: '12px', transition: 'transform 0.3s ease' }}
                >
                  <div className="position-relative overflow-hidden rounded-3 shadow" style={{ aspectRatio: '2/3' }}>
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-100 h-100 object-fit-cover"
                      loading="lazy"
                    />
                    {movie.avgRating && (
                      <span className="position-absolute top-0 end-0 m-2 badge bg-dark bg-opacity-90 border border-warning text-warning d-flex align-items-center gap-1">
                        <Star size={10} fill="#f59e0b" />
                        <span>{movie.avgRating}</span>
                      </span>
                    )}
                    <span className="position-absolute bottom-0 start-0 m-2 badge bg-danger text-uppercase" style={{ fontSize: '10px' }}>
                      {movie.certificate}
                    </span>
                  </div>
                  <div className="pt-2">
                    <h6 className="text-light fw-bold text-truncate mb-1" title={movie.title} style={{ fontSize: '14px' }}>
                      {movie.title}
                    </h6>
                    <div className="d-flex align-items-center justify-content-between text-secondary small">
                      <span>{movie.genres?.[0] || 'Movie'}</span>
                      <Link to={`/movies/${movie._id}`} className="text-danger fw-semibold text-decoration-none">
                        Book &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. PREMIUM CINEMA FEATURES */}
      <section className="py-5 position-relative">
        <div className="container py-4">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '640px' }}>
            <span className="text-danger text-uppercase fw-bold small" style={{ letterSpacing: '1px' }}>
              Why Choose iMovies
            </span>
            <h2 className="display-6 fw-bold text-white mt-1">Cinema Booking Redefined</h2>
            <p className="text-secondary">
              Engineered with zero-wait concurrency, instant digital gate verification, and enterprise-grade reliability.
            </p>
          </div>

          <div className="row g-4">
            {/* Feature 1 */}
            <div className="col-md-6 col-lg-3">
              <div
                className="p-4 rounded-4 h-100 border border-secondary border-opacity-25 transition"
                style={{ background: 'rgba(20, 22, 32, 0.6)', backdropFilter: 'blur(8px)' }}
              >
                <div
                  className="d-inline-flex p-3 rounded-3 mb-3 bg-danger bg-opacity-10 text-danger"
                >
                  <Zap size={26} />
                </div>
                <h5 className="fw-bold text-light mb-2">Live Seat Lock Engine</h5>
                <p className="text-secondary small mb-0 lh-base">
                  Instant 10-minute hold window guarded by MongoDB ACID transactions prevents double-booking disputes.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="col-md-6 col-lg-3">
              <div
                className="p-4 rounded-4 h-100 border border-secondary border-opacity-25 transition"
                style={{ background: 'rgba(20, 22, 32, 0.6)', backdropFilter: 'blur(8px)' }}
              >
                <div
                  className="d-inline-flex p-3 rounded-3 mb-3 bg-primary bg-opacity-10 text-primary"
                >
                  <QrCode size={26} />
                </div>
                <h5 className="fw-bold text-light mb-2">Contactless QR Gate Pass</h5>
                <p className="text-secondary small mb-0 lh-base">
                  Skip the cinema counter queue. Your digital e-ticket generates a cryptographic QR code for instant scan entry.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="col-md-6 col-lg-3">
              <div
                className="p-4 rounded-4 h-100 border border-secondary border-opacity-25 transition"
                style={{ background: 'rgba(20, 22, 32, 0.6)', backdropFilter: 'blur(8px)' }}
              >
                <div
                  className="d-inline-flex p-3 rounded-3 mb-3 bg-success bg-opacity-10 text-success"
                >
                  <ShieldCheck size={26} />
                </div>
                <h5 className="fw-bold text-light mb-2">Instant Auto-Refunds</h5>
                <p className="text-secondary small mb-0 lh-base">
                  Transparent cancellation rules with server-computed refund tiers and direct Razorpay payout gateway triggers.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="col-md-6 col-lg-3">
              <div
                className="p-4 rounded-4 h-100 border border-secondary border-opacity-25 transition"
                style={{ background: 'rgba(20, 22, 32, 0.6)', backdropFilter: 'blur(8px)' }}
              >
                <div
                  className="d-inline-flex p-3 rounded-3 mb-3 bg-warning bg-opacity-10 text-warning"
                >
                  <Heart size={26} />
                </div>
                <h5 className="fw-bold text-light mb-2">Personalized Watchlists</h5>
                <p className="text-secondary small mb-0 lh-base">
                  Save upcoming releases and blockbusters to your personal watchlist, complete with trailer previews and alerts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS (3 SIMPLE STEPS) */}
      <section className="py-5 bg-dark bg-opacity-25 border-top border-secondary border-opacity-10">
        <div className="container py-4">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '600px' }}>
            <span className="text-danger text-uppercase fw-bold small" style={{ letterSpacing: '1px' }}>
              How It Works
            </span>
            <h2 className="display-6 fw-bold text-white mt-1">Book Tickets in 3 Steps</h2>
          </div>

          <div className="row g-4 text-center">
            <div className="col-md-4">
              <div className="p-4">
                <div
                  className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center mx-auto mb-3 fw-bold fs-4"
                  style={{ width: '56px', height: '56px', boxShadow: '0 0 20px rgba(229, 9, 20, 0.5)' }}
                >
                  1
                </div>
                <h5 className="fw-bold text-light mb-2">Choose Your Movie</h5>
                <p className="text-secondary small mb-0">
                  Filter by language, genre, format (2D, 3D, IMAX) and select your convenient city & cinema.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4">
                <div
                  className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center mx-auto mb-3 fw-bold fs-4"
                  style={{ width: '56px', height: '56px', boxShadow: '0 0 20px rgba(229, 9, 20, 0.5)' }}
                >
                  2
                </div>
                <h5 className="fw-bold text-light mb-2">Select Preferred Seats</h5>
                <p className="text-secondary small mb-0">
                  View interactive cinema layouts (VIP, Premium, Regular) with live seat lock indicators.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4">
                <div
                  className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center mx-auto mb-3 fw-bold fs-4"
                  style={{ width: '56px', height: '56px', boxShadow: '0 0 20px rgba(229, 9, 20, 0.5)' }}
                >
                  3
                </div>
                <h5 className="fw-bold text-light mb-2">Flash QR & Enjoy the Show</h5>
                <p className="text-secondary small mb-0">
                  Complete secure Razorpay payment and scan your downloadable digital e-ticket at the gate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CALL TO ACTION BANNER */}
      <section className="py-5 position-relative">
        <div className="container py-4">
          <div
            className="p-5 rounded-4 text-center text-white position-relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.85) 0%, rgba(139, 0, 0, 0.95) 100%)',
              boxShadow: '0 16px 48px rgba(229, 9, 20, 0.35)',
            }}
          >
            <div className="position-relative z-1 mx-auto" style={{ maxWidth: '640px' }}>
              <h2 className="display-5 fw-extrabold mb-3">Ready for the Show?</h2>
              <p className="fs-5 opacity-90 mb-4">
                Grab your favorite popcorn, reserve the best seats in the house, and experience movies like never before.
              </p>
              <div className="d-flex justify-content-center gap-3 flex-wrap">
                <Link
                  to="/"
                  className="btn btn-light btn-lg px-5 py-3 fw-bold rounded-pill text-danger shadow"
                >
                  Browse Now Showing
                </Link>
                {!user && (
                  <Link
                    to="/register"
                    className="btn btn-outline-light btn-lg px-5 py-3 fw-bold rounded-pill"
                  >
                    Create Free Account
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trailer Modal */}
      {trailerMovie && (
        <TrailerModal
          isOpen={Boolean(trailerMovie)}
          onClose={() => setTrailerMovie(null)}
          trailerUrl={trailerMovie.trailerUrl}
          title={trailerMovie.title}
        />
      )}
    </div>
  );
}
