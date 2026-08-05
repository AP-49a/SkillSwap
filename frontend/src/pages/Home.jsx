import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import GlassCard from '../components/GlassCard.jsx';
import Loader from '../components/Loader.jsx';
import api from '../utils/api.js';
import {
  Compass,
  Star,
  Coins,
  Calendar,
  Flame,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck,
  CheckCircle,
} from 'lucide-react';

export const Home = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [aiSkills, setAiSkills] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        // Recommendations
        const recs = await api.get('/profiles/dashboard/recommendations');
        setRecommendations(recs.data);

        // Upcoming sessions
        const sess = await api.get('/sessions/my-sessions');
        const future = sess.data
          .filter((s) => s.status === 'accepted' && new Date(s.date) > new Date())
          .slice(0, 2);
        setUpcomingSessions(future);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    if (user) {
      fetchHomeData();
    }
  }, [user]);

  const fetchAISkillSuggestions = async () => {
    setAiLoading(true);
    try {
      const res = await api.post('/ai/recommend-skills');
      setAiSkills(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
  };

  const mockLeaderboard = [
    { rank: 1, name: 'Alex Rivera', username: 'alexr', level: 9, swaps: 28, rating: 4.9 },
    { rank: 2, name: 'Serena Chen', username: 'serenac', level: 7, swaps: 22, rating: 5.0 },
    { rank: 3, name: 'Marcus Miller', username: 'marcusm', level: 6, swaps: 19, rating: 4.8 },
  ];

  const dailyChallenges = [
    { id: 1, text: 'Claim your Daily Streak Reward', xp: 20, done: user?.streak > 0 },
    { id: 2, text: 'Send a message to a potential mentor', xp: 15, done: false },
    { id: 3, text: 'Book a learning session', xp: 30, done: false },
  ];

  if (loading) return <Loader fullPage={true} />;

  return (
    <div className="container" style={{
      paddingTop: '20px',
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '32px',
    }}>
      <style>{`
        @media (min-width: 992px) {
          .home-grid-layout {
            grid-template-columns: 240px 1fr 300px !important;
          }
        }
      `}</style>
      
      <div className="home-grid-layout" style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px',
        alignItems: 'start',
      }}>
        {/* Left Column: Sidebar Navigation */}
        <Sidebar />

        {/* Center Column: Main Dash Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Welcome & Search Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Hello, {user?.name}!</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                Strengthen your mind today. What are you looking to master?
              </p>
            </div>
            
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by skill name, location, language..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="glass-input"
                  style={{ paddingLeft: '48px', height: '48px', borderRadius: '12px' }}
                />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ padding: '0 24px', borderRadius: '12px' }}>
                Search
              </button>
            </form>
          </div>

          {/* Gamification Streak & Challenges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <GlassCard className="gold-gradient-bg" style={{ display: 'flex', gap: '16px', alignItems: 'center', border: '1px solid rgba(212,175,55,0.2)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(212,175,55,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--secondary)',
              }}>
                <Flame size={24} fill="var(--secondary)" />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Daily login streak</div>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{user?.streak || 1} Days Active</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Login daily to earn bonus credits!</div>
              </div>
            </GlassCard>

            <GlassCard style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34,197,94,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}>
                <Coins size={24} fill="var(--accent)" />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Skill wallet balance</div>
                <div style={{ fontSize: '20px', fontWeight: 800 }}>{user?.credits} Credits</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Equivalent to {Math.floor(user?.credits / 20)} teaching hours.</div>
              </div>
            </GlassCard>
          </div>

          {/* Upcoming Bookings */}
          {upcomingSessions.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Upcoming Sessions</h3>
                <Link to="/bookings" style={{ fontSize: '12px', color: 'var(--secondary)', textDecoration: 'none', fontWeight: 600 }}>
                  View Calendar
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {upcomingSessions.map((s) => {
                  const partner = s.teacher._id === user?._id ? s.learner : s.teacher;
                  const roleLabel = s.teacher._id === user?._id ? 'Teaching' : 'Learning';
                  return (
                    <GlassCard key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-secondary)',
                          textAlign: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          lineHeight: '1.2',
                        }}>
                          <div>{new Date(s.date).toLocaleDateString([], { month: 'short' }).toUpperCase()}</div>
                          <div style={{ fontSize: '16px', color: 'var(--secondary)' }}>{new Date(s.date).getDate()}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: s.teacher._id === user?._id ? 'var(--accent)' : 'var(--secondary)' }}>
                            {roleLabel} {s.skill}
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600 }}>Partner: {partner.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Calendar size={12} /> {s.timeSlot} ({s.durationHours} hr)
                          </div>
                        </div>
                      </div>
                      <Link to="/bookings" className="btn btn-outline btn-sm">
                        Details
                      </Link>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Teachers / Mentors */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Recommended Mentors</h3>
              <Link to="/search" style={{ fontSize: '12px', color: 'var(--secondary)', textDecoration: 'none', fontWeight: 600 }}>
                See All
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {recommendations.slice(0, 4).map((p) => (
                <GlassCard key={p._id} className="hover-lift" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <img
                      src={p.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.user.username}`}
                      alt={p.user.name}
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{p.user.name}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--secondary)' }}>
                        <Star size={10} fill="var(--secondary)" />
                        <span>{p.rating} ({p.totalRatingsCount})</span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', minHeight: '36px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {p.bio}
                  </p>

                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {p.skillsOffered.slice(0, 2).map((s, i) => (
                      <span key={i} className="badge badge-gold" style={{ fontSize: '9px', textTransform: 'none', padding: '2px 6px' }}>
                        {s.skill}
                      </span>
                    ))}
                  </div>

                  <Link
                    to={`/u/${p.user.username}`}
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: '6px', justifyContent: 'center' }}
                  >
                    View Swap Profile
                  </Link>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Challenges, Leaderboard & AI Recommendation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Daily Challenges */}
          <GlassCard style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={16} color="var(--secondary)" /> Daily Challenges
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {dailyChallenges.map((c) => (
                <div key={c.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle size={16} color={c.done ? 'var(--accent)' : 'var(--glass-border)'} fill={c.done ? 'rgba(34,197,94,0.15)' : 'none'} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: c.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: c.done ? 'line-through' : 'none' }}>{c.text}</span>
                    <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 600 }}>+{c.xp} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* AI Helper Recs */}
          <GlassCard style={{ padding: '20px', border: '1px solid rgba(212,175,55,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="var(--secondary)" fill="var(--secondary)" /> AI Skill Matches
              </h4>
              {aiSkills.length === 0 && !aiLoading && (
                <button
                  onClick={fetchAISkillSuggestions}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '9px', padding: '2px 8px' }}
                >
                  Generate
                </button>
              )}
            </div>

            {aiLoading ? (
              <Loader size={20} />
            ) : aiSkills.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {aiSkills.slice(0, 3).map((item, idx) => (
                  <div key={idx} style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--secondary)' }}>{item.skill}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>{item.reason}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Analyze your offerings and targets to fetch recommended topics tailored for you.
              </p>
            )}
          </GlassCard>

          {/* Top Swappers Leaderboard */}
          <GlassCard style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={16} color="var(--secondary)" /> Top Swappers
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mockLeaderboard.map((swapper) => (
                <div key={swapper.rank} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(17,17,17,0.03)' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', width: '12px' }}>{swapper.rank}</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600 }}>{swapper.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Level {swapper.level}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--secondary)' }}>{swapper.swaps} swaps</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>★ {swapper.rating}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/leaderboard" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--secondary)', textDecoration: 'none', fontWeight: 600, marginTop: '12px', justifyContent: 'center' }}>
              View full rankings <ArrowRight size={12} />
            </Link>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Home;
