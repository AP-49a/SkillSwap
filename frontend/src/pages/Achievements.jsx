import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import GlassCard from '../components/GlassCard.jsx';
import Loader from '../components/Loader.jsx';
import api from '../utils/api.js';
import { Award, Flame, Star, Sparkles, CheckCircle, ShieldCheck } from 'lucide-react';

export const Achievements = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const res = await api.get(`/profiles/${user.username}`);
        setProfile(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  if (loading) return <Loader fullPage={true} />;

  // Badges array definition
  const badges = [
    {
      id: 'welcome_badge',
      title: 'First Step',
      desc: 'Registered your account on SkillSwap.',
      icon: <Award size={28} />,
      color: '#cda21b',
    },
    {
      id: 'verified_badge',
      title: 'Verified Member',
      desc: 'Completed your email security verification.',
      icon: <ShieldCheck size={28} />,
      color: '#22c55e',
    },
    {
      id: 'profile_completed',
      title: 'Profile Master',
      desc: 'Completed all bio and skills details.',
      icon: <CheckCircle size={28} />,
      color: '#3b82f6',
    },
    {
      id: 'pro_teacher',
      title: 'Elite Mentor',
      desc: 'Taught 5 swap sessions to other users.',
      icon: <Sparkles size={28} />,
      color: '#a855f7',
    },
    {
      id: 'pro_learner',
      title: 'Hungry Student',
      desc: 'Learned from 5 swap sessions.',
      icon: <Flame size={28} />,
      color: '#f97316',
    },
    {
      id: 'star_teacher',
      title: '5-Star Expert',
      desc: 'Maintained a rating above 4.8 with 3 reviews.',
      icon: <Star size={28} />,
      color: '#eab308',
    },
  ];

  const currentXP = user?.xp || 0;
  const levelXP = currentXP % 100;
  const currentLevel = user?.level || 1;

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <style>{`
        @media (min-width: 992px) {
          .achievements-grid-layout {
            grid-template-columns: 240px 1fr !important;
          }
        }
      `}</style>

      <div className="achievements-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
        <Sidebar />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Achievements & Streak Tracker</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Level up, earn badges, and track your active swap streaks.
            </p>
          </div>

          {/* XP Progression Bar Card */}
          <GlassCard style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span className="badge badge-gold" style={{ fontSize: '10px' }}>Level {currentLevel} Swapper</span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px' }}>{currentXP} Total XP Earned</h3>
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {levelXP}/100 XP to next level
              </span>
            </div>
            
            {/* Progress line */}
            <div style={{
              height: '12px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid var(--glass-border)',
            }}>
              <div style={{
                width: `${levelXP}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--secondary) 0%, var(--accent) 100%)',
                transition: 'width 0.5s ease',
              }}></div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>💡 Earn +40 XP by teaching a class</span>
              <span>💡 Earn +15 XP by learning a class</span>
            </div>
          </GlassCard>

          {/* Badges Grid section */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>Medal Showcase</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {badges.map((badge) => {
                const unlocked = profile?.achievements?.includes(badge.id);
                return (
                  <GlassCard
                    key={badge.id}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'center',
                      opacity: unlocked ? 1 : 0.45,
                      border: unlocked ? `1px solid ${badge.color}35` : '1px solid var(--glass-border)',
                      transition: 'var(--transition)',
                    }}
                    className={unlocked ? 'hover-lift' : ''}
                  >
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      backgroundColor: unlocked ? `${badge.color}15` : 'var(--bg-tertiary)',
                      color: unlocked ? badge.color : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {badge.icon}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: unlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {badge.title}
                      </h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                        {badge.desc}
                      </p>
                      <span style={{ fontSize: '9px', fontWeight: 600, color: unlocked ? badge.color : 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                        {unlocked ? 'UNLOCKED' : 'LOCKED'}
                      </span>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
