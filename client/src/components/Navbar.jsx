import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, MapPin, User, LogOut, Ticket, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useCity } from '../context/CityContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { city, changeCity, availableCities } = useCity();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark im-glass sticky-top py-3 border-bottom border-secondary border-opacity-25">
      <div className="container">
        {/* Brand */}
        <Link to="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4 m-0">
          <Film size={28} className="text-danger" />
          <span className="text-light" style={{ letterSpacing: '1px' }}>
            IMOVIES
          </span>
        </Link>

        {/* City Selector */}
        <div className="dropdown ms-3">
          <button
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 rounded-pill px-3 py-1 dropdown-toggle text-light"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <MapPin size={14} className="text-danger" />
            <span>{city}</span>
          </button>
          <ul className="dropdown-menu dropdown-menu-dark shadow">
            {availableCities.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  className={`dropdown-item ${c === city ? 'active fw-bold' : ''}`}
                  onClick={() => changeCity(c)}
                >
                  {c}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Toggle */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* Links & User Actions */}
        <div className="collapse navbar-collapse justify-content-end" id="navbarContent">
          <ul className="navbar-nav align-items-lg-center gap-2 mt-3 mt-lg-0">
            <li className="nav-item">
              <Link to="/" className="nav-link text-light px-3">
                Home
              </Link>
            </li>

            {user ? (
              <>
                <li className="nav-item">
                  <Link to="/my-bookings" className="nav-link text-light px-3 d-flex align-items-center gap-1">
                    <Ticket size={16} />
                    <span>My Bookings</span>
                  </Link>
                </li>

                {isAdmin && (
                  <li className="nav-item">
                    <Link
                      to="/admin"
                      className="nav-link btn btn-sm btn-outline-warning text-warning px-3 py-1 rounded-pill d-flex align-items-center gap-1"
                    >
                      <Shield size={14} />
                      <span>Admin Portal</span>
                    </Link>
                  </li>
                )}

                <li className="nav-item dropdown ms-lg-2">
                  <button
                    className="btn btn-dark border-secondary rounded-pill px-3 py-1 d-flex align-items-center gap-2 dropdown-toggle text-light"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <User size={16} className="text-secondary" />
                    <span>{user.name.split(' ')[0]}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-dark dropdown-menu-end shadow">
                    <li>
                      <Link to="/profile" className="dropdown-item">
                        Profile & Settings
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider border-secondary" />
                    </li>
                    <li>
                      <button type="button" onClick={handleLogout} className="dropdown-item text-danger d-flex align-items-center gap-2">
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <li className="nav-item d-flex align-items-center gap-2 ms-lg-2">
                <Link to="/login" className="btn btn-sm btn-outline-secondary text-light px-3 py-1 rounded-pill">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-sm btn-danger px-3 py-1 rounded-pill">
                  Register
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
