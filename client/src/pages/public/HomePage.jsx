import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Play } from 'lucide-react';
import api from '../../lib/api';
import { useCity } from '../../context/CityContext';
import MovieCard from '../../components/movies/MovieCard';
import TrailerModal from '../../components/movies/TrailerModal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

export default function HomePage() {
  const { city } = useCity();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('NOW_SHOWING'); // NOW_SHOWING | UPCOMING
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [trailerMovie, setTrailerMovie] = useState(null);

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        status: activeTab,
        city: activeTab === 'NOW_SHOWING' ? city : undefined,
      };
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (selectedGenre) params.genre = selectedGenre;
      if (selectedLanguage) params.language = selectedLanguage;

      const res = await api.get('/public/movies', { params });
      setMovies(res.data.movies || []);
    } catch (err) {
      console.error('Failed to load movies:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, city, searchQuery, selectedGenre, selectedLanguage]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMovies();
  };

  // Hero movie (e.g. first movie in list)
  const heroMovie = movies.find((m) => m.bannerUrl) || movies[0];

  const genresList = ['Action', 'Sci-Fi', 'Adventure', 'Drama', 'Biography', 'Crime', 'History'];
  const languagesList = ['English', 'Hindi', 'Telugu', 'Tamil'];

  return (
    <div className="home-page pb-5">
      {/* Hero Section */}
      {heroMovie && (
        <div
          className="position-relative w-100 overflow-hidden mb-5"
          style={{
            minHeight: '440px',
            background: `linear-gradient(to top, var(--bg-main) 10%, rgba(10, 12, 19, 0.4) 60%, rgba(10, 12, 19, 0.8) 100%), url(${
              heroMovie.bannerUrl || heroMovie.posterUrl
            }) center/cover no-repeat`,
          }}
        >
          <div className="container h-100 d-flex flex-column justify-content-end py-5" style={{ minHeight: '440px' }}>
            <div style={{ maxWidth: '640px' }}>
              <span className="badge bg-danger px-3 py-1 text-uppercase fw-bold mb-2">
                Featured Spotlight
              </span>
              <h1 className="display-4 fw-extrabold text-white mb-2">{heroMovie.title}</h1>
              <div className="d-flex align-items-center gap-3 text-secondary small mb-3">
                <span className="badge bg-dark border border-secondary">{heroMovie.certificate}</span>
                <span>{heroMovie.languages?.join(', ')}</span>
                <span>•</span>
                <span>{heroMovie.durationMinutes} mins</span>
                <span>•</span>
                <span>{heroMovie.genres?.join(', ')}</span>
              </div>
              <p className="text-light opacity-90 line-clamp-3 mb-4 fs-6">
                {heroMovie.synopsis}
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to={`/movies/${heroMovie._id}`} className="btn btn-danger btn-lg px-4 py-2 fw-semibold">
                  Book Tickets
                </Link>
                {heroMovie.trailerUrl && (
                  <button
                    type="button"
                    onClick={() => setTrailerMovie(heroMovie)}
                    className="btn btn-outline-light btn-lg px-4 py-2 d-flex align-items-center gap-2 fw-semibold"
                  >
                    <Play size={18} fill="#ffffff" />
                    <span>Watch Trailer</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Catalog Container */}
      <div className="container">
        {/* Search & Filter Bar */}
        <div className="im-glass p-3 rounded-4 mb-4">
          <div className="row g-3 align-items-center">
            {/* Search */}
            <div className="col-lg-5">
              <form onSubmit={handleSearchSubmit} className="input-group">
                <span className="input-group-text bg-dark border-secondary text-secondary">
                  <Search size={18} />
                </span>
                <input
                  type="text"
                  placeholder="Search movies, cast, director..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-control bg-dark text-light border-secondary"
                />
                <button type="submit" className="btn btn-danger px-3">
                  Search
                </button>
              </form>
            </div>

            {/* Genre Filter */}
            <div className="col-sm-6 col-lg-3">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="form-select bg-dark text-light border-secondary"
              >
                <option value="">All Genres</option>
                {genresList.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Filter */}
            <div className="col-sm-6 col-lg-3">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="form-select bg-dark text-light border-secondary"
              >
                <option value="">All Languages</option>
                {languagesList.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="col-lg-1 text-end">
              {(searchQuery || selectedGenre || selectedLanguage) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('');
                    setSelectedLanguage('');
                  }}
                  className="btn btn-sm btn-link text-secondary text-decoration-none"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="d-flex align-items-center justify-content-between border-bottom border-secondary border-opacity-25 mb-4">
          <div className="d-flex gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('NOW_SHOWING')}
              className={`btn btn-link text-decoration-none pb-3 px-2 position-relative fw-bold fs-5 ${
                activeTab === 'NOW_SHOWING' ? 'text-danger' : 'text-secondary hover-text-white'
              }`}
            >
              Now Showing in {city}
              {activeTab === 'NOW_SHOWING' && (
                <span
                  className="position-absolute bottom-0 start-0 w-100 bg-danger"
                  style={{ height: '3px', borderRadius: '3px 3px 0 0' }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('UPCOMING')}
              className={`btn btn-link text-decoration-none pb-3 px-2 position-relative fw-bold fs-5 ${
                activeTab === 'UPCOMING' ? 'text-danger' : 'text-secondary hover-text-white'
              }`}
            >
              Coming Soon
              {activeTab === 'UPCOMING' && (
                <span
                  className="position-absolute bottom-0 start-0 w-100 bg-danger"
                  style={{ height: '3px', borderRadius: '3px 3px 0 0' }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Movie Cards Grid */}
        {loading ? (
          <LoadingSpinner text="Fetching movies..." />
        ) : movies.length === 0 ? (
          <EmptyState
            title="No movies found"
            description={
              activeTab === 'NOW_SHOWING'
                ? `No movies currently scheduled in ${city}. Try switching cities or clearing filters.`
                : 'No upcoming movies match your current criteria.'
            }
          />
        ) : (
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 g-4">
            {movies.map((movie) => (
              <div key={movie._id} className="col">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {trailerMovie && (
        <TrailerModal
          isOpen={!!trailerMovie}
          onClose={() => setTrailerMovie(null)}
          trailerUrl={trailerMovie.trailerUrl}
          title={trailerMovie.title}
        />
      )}
    </div>
  );
}
