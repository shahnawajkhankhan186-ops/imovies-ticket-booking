import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Public Pages
import HomePage from '../pages/public/HomePage';
import LandingPage from '../pages/public/LandingPage';
import MovieDetailPage from '../pages/public/MovieDetailPage';
import ShowSelectionPage from '../pages/public/ShowSelectionPage';
import SeatSelectionPage from '../pages/public/SeatSelectionPage';
import NotFoundPage from '../pages/public/NotFoundPage';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

// User Pages
import CheckoutPage from '../pages/user/CheckoutPage';
import TicketPage from '../pages/user/TicketPage';
import MyBookingsPage from '../pages/user/MyBookingsPage';
import ProfilePage from '../pages/user/ProfilePage';
import FavoritesPage from '../pages/user/FavoritesPage';

// Admin Portal Pages
import AdminLayout from '../pages/admin/AdminLayout';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminMoviesPage from '../pages/admin/AdminMoviesPage';
import AdminReviewsPage from '../pages/admin/AdminReviewsPage';
import AdminTheatresPage from '../pages/admin/AdminTheatresPage';
import AdminScreensPage from '../pages/admin/AdminScreensPage';
import AdminShowsPage from '../pages/admin/AdminShowsPage';
import AdminBookingsPage from '../pages/admin/AdminBookingsPage';
import AdminVerifyTicketPage from '../pages/admin/AdminVerifyTicketPage';
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminCouponsPage from '../pages/admin/AdminCouponsPage';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';

// Guards
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Entrance */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/pages/landing/Landing" element={<LandingPage />} />

      {/* Inside Website Pages - Protected: Requires Sign-in */}
      <Route
        path="/movies"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/movies/:id"
        element={
          <ProtectedRoute>
            <MovieDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/movie/:id"
        element={
          <ProtectedRoute>
            <MovieDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/movies/:id/shows"
        element={
          <ProtectedRoute>
            <ShowSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/movie/:id/shows"
        element={
          <ProtectedRoute>
            <ShowSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shows/:showId/seats"
        element={
          <ProtectedRoute>
            <SeatSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/shows/:id/seats"
        element={
          <ProtectedRoute>
            <SeatSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book/:showId"
        element={
          <ProtectedRoute>
            <SeatSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/book/:id"
        element={
          <ProtectedRoute>
            <SeatSelectionPage />
          </ProtectedRoute>
        }
      />

      {/* Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected User Routes */}
      <Route
        path="/checkout/:bookingId"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket/:bookingId"
        element={
          <ProtectedRoute>
            <TicketPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking/:bookingId"
        element={
          <ProtectedRoute>
            <TicketPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-bookings"
        element={
          <ProtectedRoute>
            <MyBookingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/watchlist"
        element={
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pages/favoriteshows/FavoriteShows"
        element={
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="movies" element={<AdminMoviesPage />} />
        <Route path="theatres" element={<AdminTheatresPage />} />
        <Route path="screens" element={<AdminScreensPage />} />
        <Route path="shows" element={<AdminShowsPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="verify-ticket" element={<AdminVerifyTicketPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
