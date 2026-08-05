import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import GlassCard from '../components/GlassCard.jsx';
import { Compass, BookOpen, Star, Shield, ArrowRight, Award, MessageSquare } from 'lucide-react';

export const LandingPage = () => {
  const [featuredMentors, setFeaturedMentors] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const res = await api.get('/profiles');
        // Get top 3 rated teachers
        setFeaturedMentors(res.data.slice(0, 3));
      } catch (err) {
        console.error(err);
      }
    };
    fetchLandingData();
  }, []);

  const categories = [
    { name: 'Programming', count: '142 teachers', icon: <BookOpen size={24} /> },
    { name: 'AI & Machine Learning', count: '89 teachers', icon: <Award size={24} /> },
    { name: 'UI/UX & Graphic Design', count: '105 teachers', icon: <Compass size={24} /> },
    { name: 'Languages', count: '74 teachers', icon: <GlobeIcon size={24} /> },
    { name: 'Music & Art', count: '63 teachers', icon: <Star size={24} /> },
    { name: 'Business & Finance', count: '51 teachers', icon: <Shield size={24} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '60px' }}>
      {/* Hero Section */}
      <section style={{
        textAlign: 'center',
        padding: '60px 0 20px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px',
      }}>
        <div className="badge badge-gold" style={{ letterSpacing: '2px', fontSize: '11px', padding: '6px 12px' }}>
          Credit-Based Skill Exchange
        </div>
        <h1 className="gradient-text" style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 800,
          lineHeight: '1.15',
          maxWidth: '850px',
        }}>
          Teach What You Know.<br />Learn What You Don't.
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 'clamp(15px, 2.5vw, 18px)',
          maxWidth: '620px',
          lineHeight: '1.6',
        }}>
          Exchange knowledge without spending money. Earn Skill Credits by mentoring others, and redeem them to learn from global specialists. Get <strong>100 Free Credits</strong> instantly.
        </p>

        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/signup" className="btn btn-secondary btn-lg hover-lift">
            Start Swapping Now <ArrowRight size={18} />
          </Link>
          <Link to="/search" className="btn btn-outline btn-lg hover-lift">
            Explore Skills
          </Link>
        </div>
      </section>

      {/* Platform Statistics */}
      <section className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
        }}>
          {[
            { value: '10,000+', label: 'Skill Swaps Completed' },
            { value: '450+', label: 'Unique Subjects Offered' },
            { value: '150,000+', label: 'Credits Swapped' },
            { value: '4.9/5', label: 'Average Session Rating' },
          ].map((stat, i) => (
            <GlassCard key={i} style={{ textAlign: 'center' }} className="hover-lift">
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--secondary)', marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {stat.label}
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="container" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>How SkillSwap Works</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Learn and grow together in a few simple steps</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '32px',
        }}>
          {[
            {
              step: '01',
              title: 'Create Your Profile',
              desc: 'Select the skills you want to teach (Offer) and skills you want to learn (Wanted). Instantly receive a welcome wallet of 100 Credits.',
              icon: <User size={24} style={{ color: 'var(--secondary)' }} />,
            },
            {
              step: '02',
              title: 'Teach Others & Earn',
              desc: 'Approve incoming session booking requests. Share your knowledge online or hybrid. Once completed, credits transfer to your wallet (+20 CR/hr).',
              icon: <Award size={24} style={{ color: 'var(--accent)' }} />,
            },
            {
              step: '03',
              title: 'Learn from Specialists',
              desc: 'Search our directory for verified experts. Request booking using your earned credits. Gain XP, level up, and unlock certificates.',
              icon: <Compass size={24} style={{ color: 'var(--text-primary)' }} />,
            },
          ].map((item, i) => (
            <div key={i} className="gradient-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <span style={{
                position: 'absolute',
                top: '20px',
                right: '24px',
                fontSize: '48px',
                fontWeight: 900,
                opacity: 0.05,
                color: 'var(--text-primary)',
              }}>{item.step}</span>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>{item.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: '1.6' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Categories */}
      <section className="container" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Popular Exchange Categories</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Browse subjects with the highest demand right now</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '24px',
        }}>
          {categories.map((cat, i) => (
            <div
              key={i}
              onClick={() => navigate(`/search?query=${encodeURIComponent(cat.name)}`)}
              className="glass-panel hover-lift"
              style={{
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '8px',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                color: 'var(--secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {cat.icon}
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{cat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Mentors */}
      {featuredMentors.length > 0 && (
        <section className="container" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px' }}>Featured Mentors</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Learn from our top rated contributors</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px',
          }}>
            {featuredMentors.map((p) => (
              <GlassCard key={p._id} className="hover-lift" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <img
                    src={p.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.user.username}`}
                    alt={p.user.name}
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {p.user.name}
                      {p.user.isVerified && <span className="badge badge-accent" style={{ fontSize: '9px', padding: '2px 4px' }}>VERIFIED</span>}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>@{p.user.username}</span>
                  </div>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', minHeight: '38px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {p.bio}
                </p>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {p.skillsOffered.slice(0, 3).map((s, idx) => (
                    <span key={idx} className="badge badge-gold" style={{ fontSize: '10px', textTransform: 'none' }}>
                      Teaches {s.skill}
                    </span>
                  ))}
                </div>

                <div style={{
                  borderTop: '1px solid var(--glass-border)',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--secondary)', fontWeight: 600 }}>
                    <Star size={14} fill="var(--secondary)" />
                    <span>{p.rating} ({p.totalRatingsCount})</span>
                  </div>
                  <Link to={`/u/${p.user.username}`} style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    View Profile <ArrowRight size={14} />
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {/* CTA Bottom Banner */}
      <section className="container">
        <div className="gold-gradient-bg" style={{
          padding: '48px',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          border: '1.5px solid rgba(212, 175, 55, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}>
          <h2 style={{ fontSize: '32px', fontWeight: 800 }}>Ready to unlock your learning potential?</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '520px', lineHeight: '1.6' }}>
            Join a fast-growing community of students, developers, musicians, and managers sharing knowledge. No credit cards required.
          </p>
          <Link to="/signup" className="btn btn-primary btn-lg hover-lift" style={{ marginTop: '8px' }}>
            Claim Your 100 Credits
          </Link>
        </div>
      </section>
    </div>
  );
};

// Internal icon mockup for Globe
const GlobeIcon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
);

export default LandingPage;
