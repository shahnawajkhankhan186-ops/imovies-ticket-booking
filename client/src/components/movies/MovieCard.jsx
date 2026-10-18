import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Ticket } from 'lucide-react';

export default function MovieCard({ movie }) {
  if (!movie) return null;

  return (
    <div className="im-card overflow-hidden h-100 d-flex flex-column">
      {/* Poster */}
      <div className="position-relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
        <img
          src={movie.posterUrl}
          alt={movie.title}
          className="w-100 h-100 object-fit-cover transition"
          style={{ transition: 'transform 0.3s ease' }}
          loading="lazy"
        />

        {/* Certificate Badge */}
        <span
          className="position-absolute top-0 start-0 m-2 badge bg-dark bg-opacity-75 border border-secondary text-light px-2 py-1"
          style={{ fontSize: '11px' }}
        >
          {movie.certificate}
        </span>

        {/* Rating Badge */}
        {movie.avgRating ? (
          <span className="position-absolute bottom-0 start-0 m-2 badge bg-dark bg-opacity-90 border border-warning text-warning d-flex align-items-center gap-1 px-2 py-1">
            <Star size={12} fill="#f59e0b" />
            <span className="fw-bold">{movie.avgRating}</span>
            <span className="text-secondary small">({movie.reviewCount || 0})</span>
          </span>
        ) : null}
      </div>

      {/* Info */}
      <div className="p-3 d-flex flex-column flex-grow-1 justify-content-between">
        <div>
          <h6 className="fw-bold text-light text-truncate mb-1" title={movie.title}>
            {movie.title}
          </h6>
          <div className="text-secondary small d-flex align-items-center gap-2 mb-2">
            <span>{movie.languages?.join(', ')}</span>
            <span>•</span>
            <span className="d-flex align-items-center gap-1">
              <Clock size={12} /> {movie.durationMinutes}m
            </span>
          </div>
          <div className="d-flex flex-wrap gap-1 mb-3">
            {movie.genres?.slice(0, 2).map((g) => (
              <span key={g} className="badge bg-secondary bg-opacity-25 text-secondary" style={{ fontSize: '10px' }}>
                {g}
              </span>
            ))}
          </div>
        </div>

        <Link
          to={`/movies/${movie._id}`}
          className="btn btn-sm btn-danger w-100 d-flex align-items-center justify-content-center gap-2 fw-medium mt-auto"
        >
          <Ticket size={14} />
          <span>{movie.status === 'UPCOMING' ? 'View Details' : 'Book Tickets'}</span>
        </Link>
      </div>
    </div>
  );
}
