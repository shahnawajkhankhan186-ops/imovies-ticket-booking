import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Film,
  Building,
  Monitor,
  CalendarDays,
  Ticket,
  ScanLine,
  CreditCard,
  Users,
  Tag,
  BarChart3,
  History,
  Settings,
} from 'lucide-react';

export default function AdminSidebar() {
  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Movies', path: '/admin/movies', icon: Film },
    { label: 'Theatres', path: '/admin/theatres', icon: Building },
    { label: 'Screens & Layouts', path: '/admin/screens', icon: Monitor },
    { label: 'Shows', path: '/admin/shows', icon: CalendarDays },
    { label: 'Bookings', path: '/admin/bookings', icon: Ticket },
    { label: 'Verify Ticket', path: '/admin/verify-ticket', icon: ScanLine },
    { label: 'Payments', path: '/admin/payments', icon: CreditCard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Coupons', path: '/admin/coupons', icon: Tag },
    { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: History },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <aside
      className="im-glass p-3 rounded-4 d-flex flex-column h-100"
      style={{ minWidth: '240px', border: '1px solid var(--border-subtle)' }}
    >
      <div className="small fw-bold text-uppercase text-secondary px-3 mb-3" style={{ letterSpacing: '1px' }}>
        Administration
      </div>
      <nav className="nav flex-column gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-3 px-3 py-2 rounded-3 text-secondary transition ${
                  isActive
                    ? 'bg-danger text-white fw-semibold shadow-sm'
                    : 'hover-bg-dark hover-text-white'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
