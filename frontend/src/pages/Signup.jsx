import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import GlassCard from '../components/GlassCard.jsx';
import { Lock, Mail, User, Tag } from 'lucide-react';

export const Signup = () => {
  const { signup } = useAuth();
  const { showNotification } = useNotification();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Verification code stage toggle
  const [verificationStage, setVerificationStage] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const { verifyUserEmail } = useAuth();
  const [devVerificationToken, setDevVerificationToken] = useState('');

  const navigate = useNavigate();

  const validateForm = () => {
    const tempErrors = {};
    if (!name.trim()) tempErrors.name = 'Full name is required';
    if (!username.trim()) {
      tempErrors.username = 'Username is required';
    } else if (username.length < 3) {
      tempErrors.username = 'Username must be at least 3 characters';
    }
    if (!email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      tempErrors.email = 'Email address is invalid';
    }
    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      const res = await signup(name, username, email, password, referralCode);
      // Capture generated PIN for dev simulation
      setDevVerificationToken(res.verificationToken);
      setVerificationStage(true);
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;

    setFormLoading(true);
    try {
      await verifyUserEmail(verificationCode.trim());
      // On success, redirect to Profile Onboarding Setup page
      navigate('/profile-setup');
    } catch (err) {
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  if (verificationStage) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifySelf: 'center', margin: '40px auto' }}>
        <GlassCard className="hover-lift" style={{ width: '100%', maxWidth: '420px', padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '8px' }}>Verify Your Email</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              We have generated a verification PIN code to activate your account.
            </p>
          </div>

          <form onSubmit={handleVerifySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                6-Digit PIN Code
              </label>
              <input
                type="text"
                placeholder="Enter PIN (e.g. 123456)"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="glass-input"
                style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '20px', fontWeight: 700 }}
                maxLength={6}
              />
            </div>

            {/* Developer Simulation Notice */}
            <div className="gold-gradient-bg" style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '11.5px',
              color: 'var(--text-secondary)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}>
              <strong style={{ color: 'var(--secondary)' }}>Developer Simulator:</strong><br />
              Email simulation completed successfully. Use the generated PIN code <strong>{devVerificationToken}</strong> or fallback bypass <strong>123456</strong>.
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px' }}
            >
              {formLoading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>
        </GlassCard>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 0',
    }}>
      <GlassCard className="hover-lift" style={{ width: '100%', maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>Join SkillSwap</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
            Get 100 Skill Credits on signup. Learn & teach skills today!
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <input
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input"
              />
              {errors.name && <span style={{ fontSize: '9px', color: 'var(--danger)' }}>{errors.name}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Username
              </label>
              <input
                type="text"
                placeholder="janedoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass-input"
              />
              {errors.username && <span style={{ fontSize: '9px', color: 'var(--danger)' }}>{errors.username}</span>}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={14} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                placeholder="jane@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
            {errors.email && <span style={{ fontSize: '9px', color: 'var(--danger)' }}>{errors.email}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input"
              />
              {errors.password && <span style={{ fontSize: '9px', color: 'var(--danger)' }}>{errors.password}</span>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="glass-input"
              />
              {errors.confirmPassword && <span style={{ fontSize: '9px', color: 'var(--danger)' }}>{errors.confirmPassword}</span>}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-secondary)' }}>
              Referral Code (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <Tag size={14} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="SWAP-CODE"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '40px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="btn btn-secondary"
            style={{ width: '100%', padding: '12px', marginTop: '10px' }}
          >
            {formLoading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--secondary)', fontWeight: 600, textDecoration: 'none' }}>
            Login here
          </Link>
        </div>
      </GlassCard>
    </div>
  );
};

export default Signup;
