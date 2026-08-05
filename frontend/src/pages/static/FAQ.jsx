import React from 'react';
import GlassCard from '../../components/GlassCard.jsx';

export const FAQ = () => {
  const faqs = [
    { q: 'Is it completely free?', a: 'Yes! SkillSwap operates on a credit system. You earn credits by teaching others, and spend those credits to learn. No real money is required.' },
    { q: 'How many credits do I get when I start?', a: 'Every new user gets 100 welcome credits on completing registration.' },
    { q: 'How are session rates determined?', a: 'Session rates are fixed at 20 credits per hour. This guarantees fair trade across all disciplines.' },
    { q: 'What happens if a user is late or skips a session?', a: 'You can cancel or reschedule bookings from your active calendar up to 1 hour before start. You can also report users in their profile.' },
  ];

  return (
    <div className="container" style={{ maxWidth: '800px', paddingTop: '40px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800 }} className="gradient-text">Frequently Asked Questions</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {faqs.map((f, i) => (
          <GlassCard key={i} className="hover-lift">
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>{f.q}</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{f.a}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

export default FAQ;
