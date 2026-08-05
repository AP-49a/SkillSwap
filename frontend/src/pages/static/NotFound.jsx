import React from 'react';
import { Link } from 'react-router-dom';
import GlassCard from '../../components/GlassCard.jsx';

export const NotFound = () => {
  return (
    <div className="container" style={{ maxWidth: '500px', paddingTop: '80px', textAlign: 'center' }}>
      <GlassCard className="hover-lift" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <h1 style={{ fontSize: '64px', fontWeight: 800, color: 'var(--secondary)' }}>404</h1>
        <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Page Not Found</h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          The page you are looking for does not exist or has been relocated.
        </p>
        <Link to="/" className="btn btn-primary btn-sm" style={{ marginTop: '8px' }}>
          Back to Home
        </Link>
      </GlassCard>
    </div>
  );
};

export default NotFound;
