import React from 'react';
import GlassCard from '../../components/GlassCard.jsx';

export const PrivacyPolicy = () => {
  return (
    <div className="container" style={{ maxWidth: '800px', paddingTop: '40px' }}>
      <GlassCard className="hover-lift">
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }} className="gradient-text">Privacy Policy</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '12px' }}>
          At SkillSwap, your privacy is our top priority. We do not sell your personal data. We collect details necessary to build your exchange profile (username, location, languages, avatar preferences) and ensure smooth session coordination.
        </p>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Chat logs are encrypted in transit and at rest to maintain confidentiality. Meeting note summaries generated via Gemini AI are private and visible only to the session participants.
        </p>
      </GlassCard>
    </div>
  );
};

export default PrivacyPolicy;
