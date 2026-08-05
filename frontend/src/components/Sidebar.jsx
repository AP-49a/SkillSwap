import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import {
  LayoutDashboard,
  CalendarDays,
  Compass,
  MessageSquare,
  Coins,
  Award,
  Shield,
  Settings,
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Bookings', path: '/bookings', icon: <CalendarDays size={18} /> },
    { name: 'Explore Mentors', path: '/search', icon: <Compass size={18} /> },
    { name: 'Messages', path: '/messages', icon: <MessageSquare size={18} /> },
    { name: 'Credits & Wallet', path: '/credits', icon: <Coins size={18} /> },
    { name: 'Achievements', path: '/achievements', icon: <Award size={18} /> },
  ];

  if (user?.role === 'admin') {
    links.push({
      name: 'Admin Panel',
      path: '/admin',
      icon: <Shield size={18} />,
    });
  }

  return (
    <aside
      className="glass-panel"
      style={{
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
      <div style={{
        padding: '0 8px 16px 8px',
        borderBottom: '1px solid var(--glass-border)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <img
          src={user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username}`}
          alt="avatar"
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Level {user?.level} Teacher</span>
        </div>
      </div>

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
        >
          <style>{`
            .hover-sidebar-item:hover {
              background-color: rgba(var(--primary-rgb), 0.03);
              color: var(--text-primary);
            }
          `}</style>
          {link.icon}
          <span>{link.name}</span>
        </NavLink>
      ))}
    </aside>
  );
};

export default Sidebar;
