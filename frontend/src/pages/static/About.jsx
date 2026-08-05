import React from 'react';
import GlassCard from '../../components/GlassCard.jsx';

export const About = () => {
  return (
    <div className="container" style={{ maxWidth: '800px', paddingTop: '40px' }}>
      <GlassCard className="hover-lift" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }} className="gradient-text">About SkillSwap</h2>
        <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          SkillSwap was founded in 2026 with a simple mission: to democratize knowledge exchange. We believe that everyone has something to teach and everyone has something to learn. By removing financial barriers, we allow people to swap skills freely using our credit system.
        </p>
        <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Every new member receives 100 welcome credits. When you teach a skill to another user, you earn 20 credits per hour. You can then use those credits to book lessons with other experts. It is a pure peer-to-peer ecosystem built on collaboration, gamification streaks, and trust.
        </p>
      </GlassCard>
    </div>
  );
};

export default About;
