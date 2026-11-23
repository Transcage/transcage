import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Package, Send, Search, Bell, LogOut, ChevronDown, Menu, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function CustomerDashboard() {
  const { user, logout, activeRole } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const initials = user?.full_name
    ? user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/app/shipments', label: 'My Shipments', icon: Package },
    { to: '/app/send',      label: 'Send a Parcel', icon: Send },
    { to: '/app/track',     label: 'Track Parcel',  icon: Search }
  ];

  return (
    <div className="app-shell">
      {/* ── Desktop Sidebar ───────────────────────────────────────────────── */}
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <div className="tc-logo">
            <img src="/transcage_logo.png" alt="Transcage" className="tc-logo-img" />
            <span className="tc-logo-wordmark">Trans<span>cage</span></span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={17} className="nav-icon" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item tc-btn-full" style={{ width: '100%' }} onClick={handleLogout}>
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile nav drawer backdrop */}
      {drawerOpen && (
        <div className="drawer-backdrop open" onClick={() => setDrawerOpen(false)} />
      )}
      {/* Mobile drawer */}
      <div className={`app-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="tc-logo">
            <img src="/transcage_logo.png" alt="Transcage" className="tc-logo-img" />
            <span className="tc-logo-wordmark">Trans<span>cage</span></span>
          </div>
          <button className="tc-btn-icon" onClick={() => setDrawerOpen(false)}><X size={18} /></button>
        </div>
        <nav className="sidebar-nav">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={() => setDrawerOpen(false)}
            >
              <Icon size={17} className="nav-icon" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item" style={{ width: '100%' }} onClick={handleLogout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div className="app-main">
        {/* Top Header */}
        <header className="tc-app-header">
          <div className="tc-app-header-left">
            <button className="tc-drawer-toggle-btn" onClick={() => setDrawerOpen(true)}>
              <Menu size={20} />
            </button>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--tc-navy)' }}>
              Customer Portal
            </span>
          </div>

          <div className="tc-app-header-right">
            {/* User chip */}
            <div className="tc-user-chip-wrap">
              <button
                className="tc-user-chip"
                id="user-menu-btn"
                onClick={() => setUserMenuOpen(o => !o)}
              >
                <div className="tc-user-avatar">{initials}</div>
                <span className="tc-user-name">{user?.full_name?.split(' ')[0]}</span>
                <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="tc-dropdown-backdrop" onClick={() => setUserMenuOpen(false)} />
                  <div className="tc-user-dropdown">
                    <div className="tc-dropdown-header">
                      <div className="tc-dropdown-user-fullname">{user?.full_name}</div>
                      <div className="tc-dropdown-user-sub">{user?.phone} · {activeRole}</div>
                    </div>
                    <div className="tc-dropdown-divider" />
                    <button className="tc-dropdown-item" onClick={() => { setUserMenuOpen(false); handleLogout(); }}>
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="tc-app-body">
          <div className="tc-app-content">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
