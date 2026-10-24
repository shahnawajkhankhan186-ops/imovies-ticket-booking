import React, { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../../lib/api';
import { formatINR } from '../../lib/currency';
import { formatISTDateTime } from '../../lib/ist-date';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import SeatMap from '../../components/seats/SeatMap';
import {
  CalendarDays,
  Plus,
  Trash2,
  Eye,
  AlertTriangle,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminShowsPage() {
  const [shows, setShows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [theatreFilter, setTheatreFilter] = useState('');
  const [movieFilter, setMovieFilter] = useState('');
  const [screenFilter, setScreenFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'tomorrow' | 'upcoming' | 'past' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' = Nearest First, 'desc' = Furthest First

  // Create Show Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [movieId, setMovieId] = useState('');
  const [theatreId, setTheatreId] = useState('');
  const [screenId, setScreenId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [format, setFormat] = useState('2D');
  const [language, setLanguage] = useState('Hindi');
  const [priceVip, setPriceVip] = useState(400);
  const [pricePremium, setPricePremium] = useState(300);
  const [priceRegular, setPriceRegular] = useState(200);

  // Occupancy Map Modal
  const [seatMapShow, setSeatMapShow] = useState(null);
  const [showSeats, setShowSeats] = useState([]);
  const [seatLayout, setSeatLayout] = useState(null);
  const [loadingSeats, setLoadingSeats] = useState(false);

  // Cancel/Delete Dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk Selection & Deletion State
  const [selectedShowIds, setSelectedShowIds] = useState([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState('date'); // 'date' | 'past' | 'selected'
  const [bulkDate, setBulkDate] = useState('');
  const [bulkTheatreId, setBulkTheatreId] = useState('');
  const [bulkMovieId, setBulkMovieId] = useState('');
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchShows = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        sort: sortOrder,
      };

      if (theatreFilter) params.theatreId = theatreFilter;
      if (movieFilter) params.movieId = movieFilter;
      if (screenFilter) params.screenId = screenFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      if (dateFilter === 'custom' && customDate) {
        params.date = customDate;
      } else if (dateFilter && dateFilter !== 'all') {
        params.date = dateFilter;
      }

      const res = await api.get('/admin/shows', { params });
      setShows(res.data.shows || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch shows');
    } finally {
      setLoading(false);
    }
  }, [
    page,
    limit,
    sortOrder,
    theatreFilter,
    movieFilter,
    screenFilter,
    statusFilter,
    searchQuery,
    dateFilter,
    customDate,
  ]);

  const fetchDependencies = async () => {
    try {
      const [mRes, tRes, sRes] = await Promise.all([
        api.get('/admin/movies'),
        api.get('/admin/theatres'),
        api.get('/admin/screens'),
      ]);
      setMovies(mRes.data.movies || []);
      setTheatres(tRes.data.theatres || []);
      setScreens(sRes.data.screens || []);
    } catch (err) {
      // quiet
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchShows();
  }, [fetchShows]);

  const filteredScreensForCreate = useMemo(() => {
    return screens.filter(
      (s) => !theatreId || s.theatreId?._id === theatreId || s.theatreId === theatreId
    );
  }, [screens, theatreId]);

  const filteredScreensForFilter = useMemo(() => {
    return screens.filter(
      (s) => !theatreFilter || s.theatreId?._id === theatreFilter || s.theatreId === theatreFilter
    );
  }, [screens, theatreFilter]);

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      theatreFilter ||
      movieFilter ||
      screenFilter ||
      statusFilter ||
      dateFilter !== 'all' ||
      customDate ||
      sortOrder !== 'asc'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setTheatreFilter('');
    setMovieFilter('');
    setScreenFilter('');
    setDateFilter('all');
    setCustomDate('');
    setStatusFilter('');
    setSortOrder('asc');
    setLimit(50);
    setPage(1);
  };

  const handleOpenCreate = () => {
    const firstMovie = movies[0];
    const firstTheatre = theatres[0];
    const availScreens = screens.filter(
      (s) => s.theatreId?._id === firstTheatre?._id || s.theatreId === firstTheatre?._id
    );

    setMovieId(firstMovie?._id || '');
    setTheatreId(firstTheatre?._id || '');
    setScreenId(availScreens[0]?._id || '');

    // Default to tomorrow 6:00 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0);
    setStartTime(tomorrow.toISOString().slice(0, 16));
    setFormat(firstMovie?.formats?.[0] || '2D');
    setLanguage(firstMovie?.languages?.[0] || 'Hindi');
    setPriceVip(450);
    setPricePremium(320);
    setPriceRegular(220);
    setModalOpen(true);
  };

  const handleCreateShow = async (e) => {
    e.preventDefault();
    if (!movieId || !theatreId || !screenId || !startTime) {
      toast.error('All fields are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        movieId,
        theatreId,
        screenId,
        startTime: new Date(startTime),
        format,
        language,
        pricing: {
          RECLINER: Math.round(Number(priceVip) * 100),
          VIP: Math.round(Number(priceVip) * 100),
          PREMIUM: Math.round(Number(pricePremium) * 100),
          REGULAR: Math.round(Number(priceRegular) * 100),
        },
      };

      await api.post('/admin/shows', payload);
      toast.success('Show scheduled successfully! Seats generated.');
      setModalOpen(false);
      fetchShows();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule show (possible screen time clash)');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSeatOccupancy = async (show) => {
    setSeatMapShow(show);
    setLoadingSeats(true);
    try {
      const res = await api.get(`/admin/shows/${show._id}/seats`);
      setShowSeats(res.data.seats || []);
      setSeatLayout(res.data.screen?.layout || null);
    } catch (err) {
      toast.error(err.message || 'Failed to load show seats');
      setSeatMapShow(null);
    } finally {
      setLoadingSeats(false);
    }
  };

  const handleDeleteShow = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/admin/shows/${deleteTarget._id}`);
      toast.success(res.data.message || 'Show deleted successfully');
      setDeleteTarget(null);
      setSelectedShowIds((prev) => prev.filter((id) => id !== deleteTarget._id));
      fetchShows();
    } catch (err) {
      toast.error(err.message || 'Failed to delete show');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      let payload = {};
      if (bulkMode === 'selected') {
        if (selectedShowIds.length === 0) {
          toast.error('No shows selected');
          return;
        }
        payload = { showIds: selectedShowIds };
      } else if (bulkMode === 'date') {
        if (!bulkDate) {
          toast.error('Please pick a date for bulk deletion');
          return;
        }
        payload = { date: bulkDate };
        if (bulkTheatreId) payload.theatreId = bulkTheatreId;
        if (bulkMovieId) payload.movieId = bulkMovieId;
      } else if (bulkMode === 'past') {
        payload = { beforeDate: 'now' };
        if (bulkTheatreId) payload.theatreId = bulkTheatreId;
        if (bulkMovieId) payload.movieId = bulkMovieId;
      }

      const res = await api.post('/admin/shows/bulk-delete', payload);
      toast.success(res.data.message || 'Shows deleted successfully!');
      setBulkModalOpen(false);
      setSelectedShowIds([]);
      setBulkDate('');
      fetchShows();
    } catch (err) {
      toast.error(err.message || 'Failed to bulk delete shows');
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedShowIds.length === shows.length) {
      setSelectedShowIds([]);
    } else {
      setSelectedShowIds(shows.map((s) => s._id));
    }
  };

  const toggleSelectShow = (id) => {
    setSelectedShowIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const startIndex = total === 0 ? 0 : (page - 1) * (limit === 'all' ? total : limit) + 1;
  const endIndex = limit === 'all' ? total : Math.min(page * limit, total);

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h2 className="fw-bold m-0 fs-3 fs-sm-2">Showtime Scheduler</h2>
            <span className="badge bg-danger rounded-pill px-2.5 py-1">
              {total} {total === 1 ? 'Show' : 'Shows'}
            </span>
          </div>
          <p className="text-secondary small m-0 mt-1">
            Schedule screenings, filter by cinema or date, and view full seating occupancy.
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2 w-100 w-sm-auto">
          <button
            type="button"
            className="btn btn-outline-danger d-flex align-items-center justify-content-center gap-2 shadow-sm"
            onClick={() => {
              setBulkMode(selectedShowIds.length > 0 ? 'selected' : 'date');
              setBulkModalOpen(true);
            }}
          >
            <Trash2 size={16} />
            <span>Bulk Delete Shows</span>
          </button>

          <Button
            variant="primary"
            onClick={handleOpenCreate}
            disabled={movies.length === 0 || screens.length === 0}
            className="d-flex align-items-center justify-content-center gap-2 shadow"
          >
            <Plus size={16} />
            <span>Schedule New Show</span>
          </Button>
        </div>
      </div>

      {/* Comprehensive Filter Control Bar */}
      <div className="im-glass p-3 rounded-4 mb-4">
        <div className="row g-2 align-items-center">
          {/* Search by Movie */}
          <div className="col-12 col-md-3">
            <div className="position-relative">
              <Search
                size={16}
                className="position-absolute top-50 translate-middle-y ms-3 text-secondary"
              />
              <input
                type="text"
                className="form-control text-light ps-5"
                placeholder="Search movie title..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                style={{ background: '#121624', borderColor: 'var(--border-color)' }}
              />
            </div>
          </div>

          {/* Theatre Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select text-light"
              value={theatreFilter}
              onChange={(e) => {
                setTheatreFilter(e.target.value);
                setScreenFilter('');
                setPage(1);
              }}
              style={{ background: '#121624', borderColor: 'var(--border-color)' }}
            >
              <option value="">All Theatres</option>
              {theatres.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.city})
                </option>
              ))}
            </select>
          </div>

          {/* Movie Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select text-light"
              value={movieFilter}
              onChange={(e) => {
                setMovieFilter(e.target.value);
                setPage(1);
              }}
              style={{ background: '#121624', borderColor: 'var(--border-color)' }}
            >
              <option value="">All Movies ({movies.length})</option>
              {movies.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select text-light"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              style={{ background: '#121624', borderColor: 'var(--border-color)' }}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="upcoming">Upcoming Only</option>
              <option value="past">Past Shows</option>
              <option value="custom">Custom Date...</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="col-6 col-md-2">
            <select
              className="form-select text-light"
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value);
                setPage(1);
              }}
              style={{ background: '#121624', borderColor: 'var(--border-color)' }}
            >
              <option value="asc">Nearest Showtime First</option>
              <option value="desc">Furthest Showtime First</option>
            </select>
          </div>

          {/* Rows Per Page */}
          <div className="col-6 col-md-1">
            <select
              className="form-select text-light"
              value={limit}
              onChange={(e) => {
                setLimit(e.target.value === 'all' ? 'all' : Number(e.target.value));
                setPage(1);
              }}
              style={{ background: '#121624', borderColor: 'var(--border-color)' }}
              title="Shows per page"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>

        {/* Secondary controls row: Custom Date picker & Reset filters button */}
        {(dateFilter === 'custom' || hasActiveFilters) && (
          <div
            className="d-flex flex-wrap align-items-center justify-content-between gap-2 mt-3 pt-2 border-top"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {dateFilter === 'custom' ? (
              <div className="d-flex align-items-center gap-2">
                <span className="text-secondary small">Pick Date:</span>
                <input
                  type="date"
                  className="form-control form-control-sm text-light"
                  value={customDate}
                  onChange={(e) => {
                    setCustomDate(e.target.value);
                    setPage(1);
                  }}
                  style={{ background: '#121624', borderColor: 'var(--border-color)', width: 'auto' }}
                />
              </div>
            ) : (
              <div />
            )}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 ms-auto"
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Shows Table */}
      <div className="im-glass p-3 p-sm-4 rounded-4">
        {loading ? (
          <div className="text-center py-5">
            <LoadingSpinner message="Loading scheduled screenings..." />
          </div>
        ) : shows.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <p className="mb-2">No shows match your current filter criteria.</p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
              >
                <RotateCcw size={14} />
                <span>Clear Filters to Show All ({total})</span>
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Multi-selection Floating Action Bar */}
            {selectedShowIds.length > 0 && (
              <div
                className="d-flex flex-wrap align-items-center justify-content-between p-3 rounded-3 mb-3 border border-danger-subtle gap-2"
                style={{ background: 'rgba(239, 68, 68, 0.12)' }}
              >
                <div className="d-flex align-items-center gap-2">
                  <AlertTriangle className="text-danger" size={18} />
                  <span className="text-light fw-medium">
                    <strong className="text-danger">{selectedShowIds.length}</strong>{' '}
                    {selectedShowIds.length === 1 ? 'screening' : 'screenings'} selected on this page
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setSelectedShowIds([])}
                  >
                    Clear Selection
                  </button>
                  <button
                    className="btn btn-sm btn-danger d-flex align-items-center gap-1.5 fw-semibold"
                    onClick={() => {
                      setBulkMode('selected');
                      setBulkModalOpen(true);
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete Selected ({selectedShowIds.length})</span>
                  </button>
                </div>
              </div>
            )}

            <div className="table-responsive touch-scroll">
              <table
                className="table table-dark table-hover align-middle mb-0 text-nowrap"
                style={{ background: 'transparent' }}
              >
                <thead>
                  <tr className="text-secondary small text-uppercase">
                    <th style={{ width: '40px' }} className="ps-3">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        style={{ cursor: 'pointer' }}
                        checked={shows.length > 0 && selectedShowIds.length === shows.length}
                        onChange={toggleSelectAll}
                        aria-label="Select all shows"
                      />
                    </th>
                    <th>Movie</th>
                    <th>Cinema & Screen</th>
                    <th>Showtime (IST)</th>
                    <th>Format / Audio</th>
                    <th>Pricing (Base)</th>
                    <th>Status</th>
                    <th className="text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shows.map((s) => (
                    <tr
                      key={s._id}
                      style={
                        selectedShowIds.includes(s._id)
                          ? { background: 'rgba(239, 68, 68, 0.08)' }
                          : {}
                      }
                    >
                      <td className="ps-3">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          style={{ cursor: 'pointer' }}
                          checked={selectedShowIds.includes(s._id)}
                          onChange={() => toggleSelectShow(s._id)}
                          aria-label={`Select show ${s.movieId?.title}`}
                        />
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <img
                            src={
                              s.movieId?.posterUrl ||
                              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100'
                            }
                            alt={s.movieId?.title}
                            className="rounded-2"
                            style={{ width: '36px', height: '48px', objectFit: 'cover' }}
                          />
                          <div>
                            <span className="fw-bold text-light d-block">{s.movieId?.title}</span>
                            {s.movieId?.durationMinutes && (
                              <span className="text-secondary small">
                                {s.movieId.durationMinutes} mins • {s.movieId.certificate || 'UA'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold text-light">{s.theatreId?.name}</div>
                        <div className="text-secondary small">
                          {s.screenId?.name} ({s.theatreId?.city})
                        </div>
                      </td>
                      <td>
                        <div className="text-light fw-medium">
                          {s.startTime ? formatISTDateTime(s.startTime) : 'N/A'}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-secondary me-1">{s.format}</span>
                        <span className="badge bg-dark border border-secondary text-secondary">
                          {s.language}
                        </span>
                      </td>
                      <td>
                        <div className="small">
                          <span className="text-danger fw-semibold">
                            REC: {formatINR(s.pricing?.RECLINER || s.pricing?.VIP || 40000)}
                          </span>{' '}
                          •{' '}
                          <span className="text-warning fw-semibold">
                            PREM: {formatINR(s.pricing?.PREMIUM || 30000)}
                          </span>{' '}
                          •{' '}
                          <span className="text-info fw-semibold">
                            REG: {formatINR(s.pricing?.REGULAR || 20000)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="text-end pe-3">
                        <div className="d-inline-flex gap-2">
                          <button
                            className="btn btn-sm btn-outline-info d-flex align-items-center gap-1"
                            onClick={() => handleOpenSeatOccupancy(s)}
                            title="View Live Seat Occupancy"
                          >
                            <Eye size={14} />
                            <span>Seats</span>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setDeleteTarget(s)}
                            title="Delete Show & Seat Inventory"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Showing Count + Pagination Bar */}
            <div
              className="d-flex flex-wrap justify-content-between align-items-center mt-3 pt-3 border-top gap-2"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <span className="text-secondary small">
                Showing <strong className="text-light">{startIndex}–{endIndex}</strong> of{' '}
                <strong className="text-light">{total}</strong> screenings
              </span>

              {totalPages > 1 && limit !== 'all' && (
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={14} />
                    <span>Prev</span>
                  </button>

                  <div className="d-flex align-items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="text-secondary px-1">...</span>
                          )}
                          <button
                            className={`btn btn-sm px-2.5 py-1 ${
                              page === p
                                ? 'btn-danger text-white fw-bold'
                                : 'btn-dark text-secondary'
                            }`}
                            onClick={() => setPage(p)}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>

                  <button
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Show Modal */}
      <Modal
        isOpen={modalOpen}
        title="Schedule New Movie Screening"
        onClose={() => setModalOpen(false)}
        size="lg"
      >
        <form onSubmit={handleCreateShow}>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label text-secondary small fw-medium">Select Movie</label>
              <select
                className="form-select text-light"
                value={movieId}
                onChange={(e) => setMovieId(e.target.value)}
                style={{ background: '#121624', borderColor: 'var(--border-color)' }}
                required
              >
                {movies.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.durationMinutes}m)
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label text-secondary small fw-medium">
                Select Cinema Multiplex
              </label>
              <select
                className="form-select text-light"
                value={theatreId}
                onChange={(e) => {
                  setTheatreId(e.target.value);
                  const matching = screens.filter(
                    (s) => s.theatreId?._id === e.target.value || s.theatreId === e.target.value
                  );
                  setScreenId(matching[0]?._id || '');
                }}
                style={{ background: '#121624', borderColor: 'var(--border-color)' }}
                required
              >
                {theatres.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label text-secondary small fw-medium">
                Select Auditorium Screen
              </label>
              <select
                className="form-select text-light"
                value={screenId}
                onChange={(e) => setScreenId(e.target.value)}
                style={{ background: '#121624', borderColor: 'var(--border-color)' }}
                required
              >
                {filteredScreensForCreate.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.soundSystem || 'Stereo'})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6">
              <Input
                type="datetime-local"
                label="Show Start Time (IST)"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <Input
                label="Experience Format"
                placeholder="2D, 3D, IMAX 3D"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <Input
                label="Audio Language"
                placeholder="Hindi, English, Tamil"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                required
              />
            </div>

            <div className="col-12">
              <div
                className="p-3 rounded-3"
                style={{ background: '#121624', border: '1px solid #242c44' }}
              >
                <div className="fw-semibold text-light mb-2 small text-uppercase">
                  Seat Category Pricing (in INR ₹)
                </div>
                <div className="row g-2">
                  <div className="col-12 col-sm-4">
                    <Input
                      type="number"
                      label="RECLINER / VIP Row (₹)"
                      value={priceVip}
                      onChange={(e) => setPriceVip(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12 col-sm-4">
                    <Input
                      type="number"
                      label="PREMIUM Row (₹)"
                      value={pricePremium}
                      onChange={(e) => setPricePremium(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12 col-sm-4">
                    <Input
                      type="number"
                      label="REGULAR Row (₹)"
                      value={priceRegular}
                      onChange={(e) => setPriceRegular(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              Schedule Show
            </Button>
          </div>
        </form>
      </Modal>

      {/* Live Seat Occupancy Modal */}
      {seatMapShow && (
        <Modal
          isOpen={Boolean(seatMapShow)}
          title={`Live Seat Occupancy — ${seatMapShow.movieId?.title} (${seatMapShow.screenId?.name})`}
          onClose={() => setSeatMapShow(null)}
          size="xl"
        >
          {loadingSeats ? (
            <div className="text-center py-5">
              <LoadingSpinner message="Loading live seats..." />
            </div>
          ) : (
            <div>
              <div className="mb-3 text-secondary small">
                Showing live occupancy for {formatISTDateTime(seatMapShow.startTime)}. Red seats are
                booked, yellow are held, dark are free.
              </div>
              <SeatMap
                layout={seatLayout}
                seats={showSeats}
                selectedSeats={[]}
                onToggleSeat={() => {}} // admin view is read-only
                mode="admin"
              />
            </div>
          )}
        </Modal>
      )}

      {/* Date-Wise & Bulk Delete Shows Modal */}
      <Modal
        isOpen={bulkModalOpen}
        title="Bulk Delete Showtime Screenings"
        onClose={() => setBulkModalOpen(false)}
        size="lg"
      >
        <div>
          {/* Mode Selector Tabs */}
          <div className="d-flex gap-2 p-1 rounded-3 mb-4" style={{ background: '#0a0d18', border: '1px solid var(--border-color)' }}>
            <button
              type="button"
              className={`btn btn-sm flex-grow-1 ${bulkMode === 'date' ? 'btn-danger text-white fw-bold' : 'btn-dark text-secondary'}`}
              onClick={() => setBulkMode('date')}
            >
              Date-Wise Delete
            </button>
            <button
              type="button"
              className={`btn btn-sm flex-grow-1 ${bulkMode === 'past' ? 'btn-danger text-white fw-bold' : 'btn-dark text-secondary'}`}
              onClick={() => setBulkMode('past')}
            >
              Purge All Past Shows
            </button>
            {selectedShowIds.length > 0 && (
              <button
                type="button"
                className={`btn btn-sm flex-grow-1 ${bulkMode === 'selected' ? 'btn-danger text-white fw-bold' : 'btn-dark text-secondary'}`}
                onClick={() => setBulkMode('selected')}
              >
                Selected Shows ({selectedShowIds.length})
              </button>
            )}
          </div>

          {/* Mode 1: By Specific Date */}
          {bulkMode === 'date' && (
            <div className="mb-4">
              <label className="form-label text-light fw-medium">
                Target Date for Bulk Deletion <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                className="form-control text-light"
                value={bulkDate}
                onChange={(e) => setBulkDate(e.target.value)}
                style={{ background: '#121624', borderColor: 'var(--border-color)' }}
                required
              />
              <div className="form-text text-secondary mt-1">
                All shows scheduled on this calendar day in Indian Standard Time (IST) will be deleted.
              </div>

              {/* Optional Narrowing Filters */}
              <div className="row g-2 mt-3">
                <div className="col-12 col-md-6">
                  <label className="form-label text-secondary small">Filter by Cinema (Optional)</label>
                  <select
                    className="form-select text-light"
                    value={bulkTheatreId}
                    onChange={(e) => setBulkTheatreId(e.target.value)}
                    style={{ background: '#121624', borderColor: 'var(--border-color)' }}
                  >
                    <option value="">All Theatres on this Date</option>
                    {theatres.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-secondary small">Filter by Movie (Optional)</label>
                  <select
                    className="form-select text-light"
                    value={bulkMovieId}
                    onChange={(e) => setBulkMovieId(e.target.value)}
                    style={{ background: '#121624', borderColor: 'var(--border-color)' }}
                  >
                    <option value="">All Movies on this Date</option>
                    {movies.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Purge All Past Shows */}
          {bulkMode === 'past' && (
            <div className="mb-4">
              <div className="alert alert-warning p-3 small d-flex gap-2 mb-3">
                <AlertTriangle size={20} className="flex-shrink-0 text-warning" />
                <div>
                  <strong>Purge Old Historical Screenings:</strong>
                  <div className="pt-1">
                    This will delete all past screenings that have already ended, free up database storage, and clean up orphan seat maps.
                  </div>
                </div>
              </div>

              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <label className="form-label text-secondary small">Filter by Cinema (Optional)</label>
                  <select
                    className="form-select text-light"
                    value={bulkTheatreId}
                    onChange={(e) => setBulkTheatreId(e.target.value)}
                    style={{ background: '#121624', borderColor: 'var(--border-color)' }}
                  >
                    <option value="">All Theatres</option>
                    {theatres.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.city})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label text-secondary small">Filter by Movie (Optional)</label>
                  <select
                    className="form-select text-light"
                    value={bulkMovieId}
                    onChange={(e) => setBulkMovieId(e.target.value)}
                    style={{ background: '#121624', borderColor: 'var(--border-color)' }}
                  >
                    <option value="">All Movies</option>
                    {movies.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Mode 3: Selected Shows */}
          {bulkMode === 'selected' && (
            <div className="mb-4">
              <div className="alert alert-info p-3 small d-flex gap-2 mb-0">
                <Eye size={20} className="flex-shrink-0 text-info" />
                <div>
                  <strong>Selected Screenings:</strong>
                  <div className="pt-1">
                    You have checked <strong>{selectedShowIds.length}</strong> specific screenings on this page to delete.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Critical Warning Box */}
          <div className="alert alert-danger p-3 small d-flex gap-2 mb-4">
            <AlertTriangle size={20} className="flex-shrink-0 text-danger" />
            <div>
              <strong>Irreversible Deletion & Refund Invariant:</strong>
              <div className="pt-1">
                All seat inventories and screening records matching this criteria will be permanently deleted. Any customers with active confirmed bookings will be automatically refunded 100% via Razorpay.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex justify-content-end gap-2">
            <Button
              variant="outline-secondary"
              onClick={() => setBulkModalOpen(false)}
              disabled={bulkDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              disabled={bulkDeleting || (bulkMode === 'date' && !bulkDate) || (bulkMode === 'selected' && selectedShowIds.length === 0)}
              className="d-flex align-items-center gap-2"
            >
              {bulkDeleting ? <LoadingSpinner size="sm" /> : <Trash2 size={16} />}
              <span>
                {bulkDeleting
                  ? 'Deleting Shows...'
                  : bulkMode === 'selected'
                  ? `Delete Selected Shows (${selectedShowIds.length})`
                  : bulkMode === 'date'
                  ? `Delete All Shows on ${bulkDate || 'Selected Date'}`
                  : 'Purge All Past Shows'}
              </span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Single Delete Show Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Show & Seat Inventory"
        message={
          deleteTarget ? (
            <div>
              <p>
                Are you sure you want to permanently delete the show of <strong>{deleteTarget.movieId?.title}</strong> on{' '}
                <strong>{formatISTDateTime(deleteTarget.startTime)}</strong>?
              </p>
              <div className="alert alert-danger p-3 small mb-0 d-flex gap-2">
                <AlertTriangle size={18} className="flex-shrink-0" />
                <div>
                  <strong>Refund Invariant:</strong>
                  <div className="pt-1">
                    Deleting this show will release and remove all seat inventory records. Any confirmed bookings will be <strong>100% automatically refunded</strong> to moviegoers.
                  </div>
                </div>
              </div>
            </div>
          ) : (
            ''
          )
        }
        confirmText="Delete Show & Clean Inventory"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteShow}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
