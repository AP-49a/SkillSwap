import React from 'react';
import GlassCard from '../../components/GlassCard.jsx';

export const Terms = () => {
  return (
    <div className="container" style={{ maxWidth: '800px', paddingTop: '40px' }}>
      <GlassCard className="hover-lift">
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }} className="gradient-text">Terms of Service</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
          By using SkillSwap, you agree to treat other members with respect. Any form of harassment, spamming, or abuse of the credit system (e.g. creating fake accounts to farm credits) will result in permanent account suspension.
        </p>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Credits have no financial cash value and cannot be redeemed for fiat currency. They are strictly utility tokens designed for internal skill exchanges.
        </p>
      </GlassCard>
    </div>
  );
};

export default Terms;
