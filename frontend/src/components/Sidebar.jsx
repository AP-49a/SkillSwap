import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  Coins,
  User,
  Shield,
  Clapperboard,
  Menu,
  PanelLeftClose,
} from 'lucide-react';

export const Sidebar = ({ className = '' }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('skillswap-sidebar-collapsed') === 'true'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const updateViewport = () => {
      setIsMobileViewport(media.matches);
      if (!media.matches) setMobileOpen(false);
    };
    updateViewport();
    media.addEventListener?.('change', updateViewport);
    return () => media.removeEventListener?.('change', updateViewport);
  }, []);

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Explore Courses', path: '/search', icon: <Compass size={18} /> },
    { name: 'My Courses', path: '/my-courses', icon: <BookOpen size={18} /> },
    { name: 'Wallet', path: '/credits', icon: <Coins size={18} /> },
    { name: 'Teacher Studio', path: '/teacher/studio', icon: <Clapperboard size={18} /> },
    { name: 'Profile Settings', path: '/profile', icon: <User size={18} /> },
  ];

  if (user?.role === 'admin') {
    links.push({
      name: 'Admin Panel',
      path: '/admin',
      icon: <Shield size={18} />,
    });
  }

  const activeLabel = links.find((link) => location.pathname === link.path || (link.path !== '/dashboard' && location.pathname.startsWith(`${link.path}/`)))?.name || 'Navigation';
  const dashboardSidebar = className.includes('dashboard-sidebar');
  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      try { localStorage.setItem('skillswap-sidebar-collapsed', String(next)); } catch { /* Storage may be disabled. */ }
      return next;
    });
  };

  return (
    <aside
      className={`glass-panel app-sidebar ${className} ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`.trim()}
      style={dashboardSidebar ? undefined : {
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
        height: 'fit-content',
        position: 'sticky',
        top: '100px',
      }}
    >
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => {
          if (window.matchMedia('(max-width: 900px)').matches) setMobileOpen((value) => !value);
          else toggleCollapsed();
        }}
        aria-label={mobileOpen ? 'Close navigation menu' : collapsed ? 'Expand side panel' : 'Minimize side panel'}
        aria-expanded={isMobileViewport ? mobileOpen : !collapsed}
        title={collapsed ? 'Expand side panel' : 'Minimize side panel'}
      >
        {mobileOpen ? <PanelLeftClose size={18} /> : <Menu size={19} />}
        <span className="sidebar-toggle-label">Menu</span>
        <span className="sidebar-current-label">{activeLabel}</span>
      </button>

      <div className="sidebar-profile" style={{
        padding: '0 8px 16px 8px',
        borderBottom: '1px solid var(--glass-border)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <img
          src={user?.profile?.avatar || user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || 'user'}`}
          alt="avatar"
          onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/avatars/default.svg'; }}
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>@{user?.username}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user?.role === 'admin' ? 'Admin' : 'Member'}</span>
        </div>
      </div>

      <nav className="sidebar-links" aria-label="Main navigation">
      {links.map((link) => (
        <NavLink
          key={link.name}
          to={link.path}
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            textDecoration: 'none',
            fontSize: '13.5px',
            fontWeight: isActive ? 600 : 500,
            color: isActive ? 'var(--secondary)' : 'var(--text-secondary)',
            backgroundColor: isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
            borderLeft: isActive ? '3px solid var(--secondary)' : '3px solid transparent',
            transition: 'var(--transition)',
          })}
          className="hover-sidebar-item"
          title={collapsed ? link.name : undefined}
          onClick={() => setMobileOpen(false)}
        >
          <style>{`
            .hover-sidebar-item:hover {
              background-color: rgba(var(--primary-rgb), 0.03);
              color: var(--text-primary);
            }
          `}</style>
          {link.icon}
          <span className="sidebar-link-label">{link.name}</span>
        </NavLink>
      ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
