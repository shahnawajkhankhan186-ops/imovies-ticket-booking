import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, MapPin, User, LogOut, Ticket, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { useCity } from '../context/CityContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { city, changeCity, availableCities } = useCity();
  const navigate = useNavigate();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setCityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    try {
      await logout();
      toast.success('Signed out successfully');
      navigate('/');
    } catch {
      toast.success('Signed out');
      navigate('/');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark im-glass sticky-top py-2 py-lg-3 border-bottom border-secondary border-opacity-25">
      <div className="container">
        {/* Brand & City Wrapper */}
        <div className="d-flex align-items-center">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4 m-0 py-0">
            <Film size={26} className="text-danger flex-shrink-0" />
            <span className="text-light" style={{ letterSpacing: '1px' }}>
              IMOVIES
            </span>
          </Link>

          {/* City Selector */}
          <div className="dropdown ms-2 ms-sm-3 position-relative" ref={cityDropdownRef}>
            <button
              className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1.5 rounded-pill px-2.5 px-sm-3 py-1 dropdown-toggle text-light"
              type="button"
              onClick={() => {
                setCityDropdownOpen(!cityDropdownOpen);
                setUserDropdownOpen(false);
              }}
              aria-expanded={cityDropdownOpen}
              style={{ fontSize: '0.8rem' }}
            >
              <MapPin size={13} className="text-danger flex-shrink-0" />
              <span className="text-truncate" style={{ maxWidth: '85px' }}>{city}</span>
            </button>
            <ul
              className={`dropdown-menu dropdown-menu-dark shadow ${cityDropdownOpen ? 'show' : ''}`}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                zIndex: 1060,
                maxHeight: '260px',
                overflowY: 'auto',
                display: cityDropdownOpen ? 'block' : 'none',
              }}
            >
              {availableCities.map((c) => (
                <li key={c}>
                  <button
                    type="button"
                    className={`dropdown-item ${c === city ? 'active fw-bold' : ''}`}
                    onClick={() => {
                      changeCity(c);
                      setCityDropdownOpen(false);
                    }}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Hamburger Toggle */}
        <button
          className="navbar-toggler border-0 p-1"
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-controls="navbarContent"
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        {/* Links & User Actions */}
        <div
          className={`collapse navbar-collapse justify-content-end ${mobileMenuOpen ? 'show' : ''}`}
          id="navbarContent"
        >
          <ul className="navbar-nav align-items-lg-center gap-2 mt-3 mt-lg-0 pt-2 pt-lg-0 border-top border-lg-0 border-secondary border-opacity-25">
            <li className="nav-item">
              <Link to="/" className="nav-link text-light px-3 py-2 rounded-3 hover-bg-dark" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
            </li>

            {user ? (
              <>
                <li className="nav-item">
                  <Link
                    to="/my-bookings"
                    className="nav-link text-light px-3 py-2 rounded-3 hover-bg-dark d-flex align-items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Ticket size={16} />
                    <span>My Bookings</span>
                  </Link>
                </li>

                {isAdmin && (
                  <li className="nav-item my-1 my-lg-0">
                    <Link
                      to="/admin"
                      className="nav-link btn btn-sm btn-outline-warning text-warning px-3 py-1.5 rounded-pill d-inline-flex align-items-center gap-1.5"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield size={14} />
                      <span>Admin Portal</span>
                    </Link>
                  </li>
                )}

                {/* Desktop User Dropdown */}
                <li className="nav-item dropdown ms-lg-2 position-relative d-none d-lg-block" ref={userDropdownRef}>
                  <button
                    className="btn btn-dark border-secondary rounded-pill px-3 py-1 d-flex align-items-center gap-2 dropdown-toggle text-light"
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(!userDropdownOpen);
                      setCityDropdownOpen(false);
                    }}
                    aria-expanded={userDropdownOpen}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="rounded-circle"
                        style={{ width: '20px', height: '20px', objectFit: 'cover' }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User size={16} className="text-secondary" />
                    )}
                    <span>{user.name.split(' ')[0]}</span>
                  </button>
                  <ul
                    className={`dropdown-menu dropdown-menu-dark dropdown-menu-end shadow ${
                      userDropdownOpen ? 'show' : ''
                    }`}
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      zIndex: 1060,
                      display: userDropdownOpen ? 'block' : 'none',
                    }}
                  >
                    <li>
                      <Link
                        to="/profile"
                        className="dropdown-item"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setMobileMenuOpen(false);
                        }}
                      >
                        Profile & Settings
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider border-secondary" />
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="dropdown-item text-danger d-flex align-items-center gap-2"
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </li>
                  </ul>
                </li>

                {/* Mobile User Profile & Sign Out Links */}
                <li className="nav-item d-lg-none mt-2 pt-2 border-top border-secondary border-opacity-25">
                  <div className="d-flex align-items-center gap-2 px-3 py-2 text-secondary small">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="rounded-circle"
                        style={{ width: '24px', height: '24px', objectFit: 'cover' }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User size={18} />
                    )}
                    <span className="text-light fw-medium">{user.name}</span>
                  </div>
                  <Link
                    to="/profile"
                    className="nav-link text-light px-3 py-2 rounded-3 hover-bg-dark"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile & Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn btn-link nav-link text-danger px-3 py-2 d-flex align-items-center gap-2 w-100 text-start text-decoration-none"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item d-flex align-items-center gap-2 ms-lg-2 mt-2 mt-lg-0">
                <Link
                  to="/login"
                  className="btn btn-sm btn-outline-secondary text-light px-3 py-1.5 rounded-pill flex-grow-1 flex-lg-grow-0 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-sm btn-danger px-3 py-1.5 rounded-pill flex-grow-1 flex-lg-grow-0 text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
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

