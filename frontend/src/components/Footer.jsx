import React from 'react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--glass-border)',
        padding: '32px 0',
        marginTop: '64px',
        color: 'var(--text-secondary)',
        fontSize: '13px',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
        }}
      >
        <style>{`
          @media (min-width: 768px) {
            .footer-wrap {
              flex-direction: row !important;
            }
          }
        `}</style>
        <div
          className="footer-wrap"
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} SkillSwap Platform. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/about" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              About
            </Link>
            <Link to="/contact" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Contact
            </Link>
            <Link to="/faq" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              FAQ
            </Link>
            <Link to="/privacy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
            <Link to="/terms" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
