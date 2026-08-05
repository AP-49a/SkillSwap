import React, { useState } from 'react';
import GlassCard from '../../components/GlassCard.jsx';
import { useNotification } from '../../context/NotificationContext.jsx';

export const Contact = () => {
  const { showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    showNotification('Feedback Received', 'Thank you for reaching out! We will reply shortly.', 'success');
    setEmail('');
    setMsg('');
  };

  return (
    <div className="container" style={{ maxWidth: '600px', paddingTop: '40px' }}>
      <GlassCard className="hover-lift">
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }} className="gradient-text">Contact Support</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Have questions or encountered a bug? Send us a message directly.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input" required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Message Description</label>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)} className="glass-input" style={{ minHeight: '100px' }} required />
          </div>
          <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '12px' }}>
            Submit Query
          </button>
        </form>
      </GlassCard>
    </div>
  );
};

export default Contact;
