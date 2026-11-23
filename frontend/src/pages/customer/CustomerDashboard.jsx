import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Package, Send, Search, Bell, User, LogOut,
  LayoutDashboard, Menu, X, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import TcLoader from '../../components/ui/TcLoader';
import '../../styles/layout.css';

const NAV_ITEMS = [
  { to: '/app/shipments', icon: Package,       label: 'My Shipments' },
  { to: '/app/send',      icon: Send,          label: 'Send a Parcel' },
  { to: '/app/track',     icon: Search,        label: 'Track Parcel'  }
];

function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
      onClick={onClick}
    >
      <Icon size={16} className="nav-icon" />
      <span>{label}</span>
    </NavLink>
  );
}

function UserDropdown({ user, onLogout, onClose }) {
  const initials = (user?.full_name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <div className="tc-dropdown-backdrop" onClick={onClose} />
      <div className="tc-user-dropdown">
        <div className="tc-dropdown-header">
          <div className="tc-dropdown-user-fullname">{user?.full_name || 'User'}</div>
          <div className="tc-dropdown-user-sub">{user?.phone || user?.email || ''}</div>
        </div>
        <button className="tc-dropdown-item" onClick={() => { onClose(); }}>
          <User size={15} /> My Profile
        </button>
        <div className="tc-dropdown-divider" />
        <button className="tc-dropdown-item" style={{ color: 'var(--color-danger)' }} onClick={onLogout}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </>
  );
}

export default function CustomerDashboard() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <TcLoader size="lg" message="Loading your dashboard..." />
      </div>
    );
  }

  const initials = (user?.full_name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const SidebarContent = ({ onNavClick }) => (
    <>
      <div className="sidebar-header">
        <div className="tc-logo" onClick={() => navigate('/')}>
          <img src="/transcage_logo.png" alt="Transcage" className="tc-logo-img" />
          <span className="tc-logo-wordmark">Trans<span>cage</span></span>
        </div>
        {onNavClick && (
          <button className="tc-btn tc-btn-icon tc-btn-ghost" onClick={onNavClick} aria-label="Close menu">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav" aria-label="Customer navigation">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.to} {...item} onClick={onNavClick} />
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 'var(--radius-md)',
          background: 'var(--tc-navy-light)'
        }}>
          <div className="tc-user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tc-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name || 'Customer'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Customer</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="app-sidebar" aria-label="Sidebar">
        <SidebarContent />
      </aside>

      {/* ── Mobile Drawer Backdrop ──────────────────────────────────────── */}
      <div className={`drawer-backdrop${drawerOpen ? ' open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <div className={`app-drawer${drawerOpen ? ' open' : ''}`} aria-label="Mobile navigation">
        <SidebarContent onNavClick={() => setDrawerOpen(false)} />
      </div>

      {/* ── Main Column ─────────────────────────────────────────────────── */}
      <div className="app-main">
        {/* Top header */}
        <header className="tc-app-header">
          <div className="tc-app-header-left">
            <button
              className="tc-drawer-toggle-btn mobile-only"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--tc-navy)', display: 'none' }} className="mobile-only">
              Transcage
            </span>
          </div>

          <div className="tc-app-header-right">
            {/* Notifications placeholder */}
            <button className="tc-btn tc-btn-icon tc-btn-ghost" aria-label="Notifications">
              <Bell size={18} />
            </button>

            {/* User chip */}
            <div className="tc-user-chip-wrap">
              <button
                className="tc-user-chip"
                onClick={() => setDropdownOpen(o => !o)}
                aria-label="Account menu"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
              >
                <div className="tc-user-avatar">{initials}</div>
                <span className="tc-user-name">{user?.full_name?.split(' ')[0] || 'Account'}</span>
                <ChevronDown size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </button>

              {dropdownOpen && (
                <UserDropdown
                  user={user}
                  onLogout={handleLogout}
                  onClose={() => setDropdownOpen(false)}
                />
              )}
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <div className="tc-app-body">
          <div className="tc-app-content">
            <Outlet />
          </div>
        </div>
      </div>

      {/* ── Mobile Bottom Nav ────────────────────────────────────────────── */}
      <nav className="tc-bottom-nav" aria-label="Bottom navigation">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `tc-bottom-tab${isActive ? ' active' : ''}`}
          >
            <Icon size={20} />
            <span className="tc-bottom-tab-label">{label}</span>
          </NavLink>
        ))}
        <button className="tc-bottom-tab" onClick={handleLogout}>
          <LogOut size={20} />
          <span className="tc-bottom-tab-label">Sign Out</span>
        </button>
      </nav>
    </div>
  );
}
