import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import GlassCard from '../components/GlassCard.jsx';
import { Mail } from 'lucide-react';

export const ForgotPassword = () => {
  const { showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [generatedPIN, setGeneratedPIN] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setFormLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      showNotification('PIN Code Sent', 'Password reset instructions have been generated.', 'success');
      // Capture PIN code for simulator
      setGeneratedPIN(res.data.resetToken);
    } catch (error) {
      showNotification('Request Failed', error.message, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 0',
    }}>
      <GlassCard className="hover-lift" style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Forgot Password</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Enter your email to generate a recovery PIN code.
          </p>
        </div>

        {generatedPIN ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="gold-gradient-bg" style={{
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              fontSize: '13px',
              color: 'var(--text-primary)',
            }}>
              <strong style={{ color: 'var(--secondary)' }}>Recovery PIN Code Generated:</strong><br />
              Use code <strong>{generatedPIN}</strong> to set a new password.<br /><br />
              Please write this down or copy it before proceeding.
            </div>
            <Link
              to={`/reset-password?email=${encodeURIComponent(email)}&token=${generatedPIN}`}
              className="btn btn-secondary"
              style={{ width: '100%', textAlign: 'center', padding: '12px' }}
            >
              Go to Password Reset
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input"
                  style={{ paddingLeft: '40px' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', marginTop: '10px' }}
            >
              {formLoading ? 'Sending...' : 'Get Recovery PIN'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
            Back to Login
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};

export default ForgotPassword;
