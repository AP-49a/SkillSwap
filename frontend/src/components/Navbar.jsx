import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import SkillSwapLogo from './SkillSwapLogo.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import api from '../utils/api.js';
import {
  Bell,
  User,
  Sun,
  Moon,
  LogOut,
  Compass,
  Menu,
  Shield,
  BookOpen,
  Clapperboard,
  X,
  Search,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showNotification } = useNotification();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notiDropdownOpen, setNotiDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [creditBalance, setCreditBalance] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const profileRef = useRef(null);
  const notiRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setCreditBalance(null);
      return;
    }
    let active = true;
    api.get('/users/dashboard')
      .then((res) => { if (active) setCreditBalance(res.data?.credits ?? 0); })
      .catch(() => { if (active) setCreditBalance(null); });
    return () => { active = false; };
  }, [user]);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(query ? `/search?query=${encodeURIComponent(query)}` : '/search');
    setSearchQuery('');
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (notiRef.current && !notiRef.current.contains(event.target)) {
        setNotiDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.isRead).length);
    } catch (error) {
      console.error('Navbar error fetching notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    
    // Set up a polling interval for live notifications simulation (every 10s)
    let interval;
    if (user) {
      interval = setInterval(fetchNotifications, 10000);
    }
    return () => clearInterval(interval);
  }, [fetchNotifications, location.pathname, user]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/readall');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      showNotification('Success', 'All notifications marked as read', 'success');
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotiClick = async (noti) => {
    try {
      await api.put(`/notifications/${noti._id}`);
      fetchNotifications();
      setNotiDropdownOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    navigate('/');
  };

  return (
    <nav className="glass-panel app-navbar" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      width: '100%',
      height: '64px',
      borderRadius: 0,
      borderWidth: '0 0 1px 0',
      padding: 0,
      margin: 0,
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        maxWidth: 'none',
        height: '64px',
        padding: '0 24px',
        gap: '24px',
      }}>
        {/* Branding Logo */}
        <Link to="/" className="navbar-brand" aria-label="SkillSwap home">
          <SkillSwapLogo />
        </Link>

        <form className="navbar-search" onSubmit={handleSearch} role="search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search courses, skills, or topics..."
            aria-label="Search courses, skills, or topics"
          />
        </form>

        {/* Desktop Navigation Links */}
        <div style={{ display: 'none', gap: '24px', alignItems: 'center' }} className="desktop-nav-links-wrap">
          <style>{`
            @media (min-width: 768px) {
              .desktop-nav-links-wrap {
                display: flex !important;
              }
              .mobile-toggle {
                display: none !important;
              }
            }
          `}</style>
          <Link to="/search" style={{
            color: location.pathname === '/search' ? 'var(--secondary)' : 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'var(--transition)',
          }}>
            <Compass size={16} /> Explore
          </Link>
          {user && (
            <Link to="/my-courses" style={{
              color: location.pathname === '/my-courses' ? 'var(--secondary)' : 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition)',
            }}>
              <BookOpen size={16} /> My Courses
            </Link>
          )}
          <Link to="/about" style={{
            color: location.pathname === '/about' ? 'var(--secondary)' : 'var(--text-secondary)',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 500,
            transition: 'var(--transition)',
          }}>
            About
          </Link>
        </div>

        {/* Action Panel */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              padding: '6px',
              borderRadius: '8px',
              transition: 'var(--transition)',
            }}
            className="hover-lift"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {user ? (
            <>
              <Link className="navbar-credit-pill" to="/wallet">
                <span /> {creditBalance === null ? 'Credits' : `${Number(creditBalance).toLocaleString()} Credits`}
              </Link>
              {/* Notifications Center Bell */}
              <div style={{ position: 'relative' }} ref={notiRef}>
                <button
                  onClick={() => setNotiDropdownOpen(!notiDropdownOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    display: 'flex',
                    padding: '6px',
                    position: 'relative',
                  }}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      backgroundColor: 'var(--accent)',
                      color: 'white',
                      fontSize: '9px',
                      fontWeight: 800,
                      width: '15px',
                      height: '15px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--bg-primary)',
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {notiDropdownOpen && (
                  <div className="glass-panel" style={{
                    position: 'absolute',
                    right: 0,
                    top: '38px',
                    width: '320px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 1010,
                    padding: '16px 0',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <div style={{
                      padding: '0 16px 12px 16px',
                      borderBottom: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--secondary)',
                            fontSize: '11px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{
                          padding: '24px 16px',
                          textAlign: 'center',
                          color: 'var(--text-muted)',
                          fontSize: '13px',
                        }}>
                          No new notifications
                        </div>
                      ) : (
                        notifications.map((noti) => (
                          <div
                            key={noti._id}
                            onClick={() => handleNotiClick(noti)}
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid var(--glass-border)',
                              cursor: 'pointer',
                              backgroundColor: noti.isRead ? 'transparent' : 'rgba(var(--secondary-rgb), 0.05)',
                              transition: 'var(--transition)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '2px',
                            }}
                            className="hover-bg-adjust"
                          >
                            <style>{`
                              .hover-bg-adjust:hover {
                                background-color: rgba(var(--primary-rgb), 0.03) !important;
                              }
                            `}</style>
                            <span style={{
                              fontWeight: noti.isRead ? 500 : 600,
                              fontSize: '12.5px',
                              color: 'var(--text-primary)',
                            }}>{noti.title}</span>
                            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{noti.message}</span>
                            <span style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '4px' }}>
                              {new Date(noti.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown Profile Trigger */}
              <div style={{ position: 'relative' }} ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  style={{
                    background: 'none',
                    border: '1.5px solid var(--glass-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={user.profile?.avatar || user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`}
                    alt="avatar"
                    onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/avatars/default.svg'; }}
                    style={{
                      width: '28px',
                      height: '28px',
                      objectFit: 'cover',
                      borderRadius: '50%',
                    }}
                  />
                </button>

                {profileDropdownOpen && (
                  <div className="glass-panel" style={{
                    position: 'absolute',
                    right: 0,
                    top: '38px',
                    width: '220px',
                    zIndex: 1010,
                    padding: '12px 0',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <div style={{
                      padding: '0 16px 12px 16px',
                      borderBottom: '1px solid var(--glass-border)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>@{user.username}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.email}</span>
                    </div>

                    <div style={{ padding: '8px 0' }}>
                      <Link
                        to="/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 16px',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          fontSize: '13px',
                          transition: 'var(--transition)',
                        }}
                        className="hover-bg-adjust"
                      >
                        <Compass size={14} /> Dashboard
                      </Link>
                      <Link
                        to="/my-courses"
                        onClick={() => setProfileDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 16px',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          fontSize: '13px',
                          transition: 'var(--transition)',
                        }}
                        className="hover-bg-adjust"
                      >
                        <BookOpen size={14} /> My Courses
                      </Link>
                      <Link
                        to="/teacher/studio"
                        onClick={() => setProfileDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 16px',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          fontSize: '13px',
                          transition: 'var(--transition)',
                        }}
                        className="hover-bg-adjust"
                      >
                        <Clapperboard size={14} /> Teacher Studio
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 16px',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          fontSize: '13px',
                          transition: 'var(--transition)',
                        }}
                        className="hover-bg-adjust"
                      >
                        <User size={14} /> Profile Settings
                      </Link>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setProfileDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 16px',
                            color: 'var(--danger)',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: 500,
                            transition: 'var(--transition)',
                          }}
                          className="hover-bg-adjust"
                        >
                          <Shield size={14} /> Admin Panel
                        </Link>
                      )}
                    </div>

                    <div style={{
                      padding: '8px 0 0 0',
                      borderTop: '1px solid var(--glass-border)',
                    }}>
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 16px',
                          color: 'var(--text-primary)',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'var(--transition)',
                        }}
                        className="hover-bg-adjust"
                      >
                        <LogOut size={14} /> Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" style={{
                color: 'var(--text-primary)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
              }}>
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile Menu Icon */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              display: 'flex',
              padding: '6px',
            }}
            className="mobile-toggle"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Panel */}
      {mobileMenuOpen && (
        <div className="glass-panel navbar-mobile-drawer" style={{
          position: 'absolute',
          top: '60px',
          left: '12px',
          right: '12px',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          {(user ? [
            ['Dashboard', '/dashboard'], ['Explore courses', '/search'], ['My courses', '/my-courses'],
            ['My schedule', '/bookings'], ['Messages', '/messages'], ['Wallet', '/wallet'],
            ['Teacher studio', '/teacher/studio'], ['Profile settings', '/profile'],
          ] : [['Explore courses', '/search'], ['About', '/about'], ['Contact', '/contact']]).map(([label, path]) => (
            <Link key={path} className="navbar-mobile-link" to={path} onClick={() => setMobileMenuOpen(false)}>{label}</Link>
          ))}
          {!user && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-outline"
                style={{ textAlign: 'center' }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="btn btn-primary"
                style={{ textAlign: 'center' }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
