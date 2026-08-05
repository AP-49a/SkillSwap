import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import GlassCard from '../components/GlassCard.jsx';
import Loader from '../components/Loader.jsx';
import api from '../utils/api.js';
import {
  MapPin,
  Calendar,
  Star,
  Globe,
  Plus,
  Coins,
  ShieldCheck,
  MessageSquare,
  UserPlus,
  UserMinus,
  CheckCircle,
  Link as LinkIcon,
} from 'lucide-react';

export const UserProfile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const navigate = useNavigate();

  // Booking Form State
  const [bookSkill, setBookSkill] = useState('');
  const [bookDate, setBookDate] = useState('');
  const [bookSlot, setBookSlot] = useState('');
  const [bookDuration, setBookDuration] = useState(1);
  const [bookDescription, setBookDescription] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/profiles/${username}`);
      setProfile(res.data);
      if (currentUser) {
        setIsFollowing(res.data.followers.some((f) => f._id === currentUser._id || f === currentUser._id));
      }
      if (res.data.skillsOffered.length > 0) {
        setBookSkill(res.data.skillsOffered[0].skill);
      }
      if (res.data.availabilityCalendar.length > 0) {
        setBookSlot(res.data.availabilityCalendar[0]);
      }
    } catch (err) {
      showNotification('Profile Error', err.message, 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username, currentUser]);

  const handleFollowToggle = async () => {
    try {
      const res = await api.post(`/profiles/${profile._id}/follow`);
      setIsFollowing(res.isFollowing);
      showNotification('Profile Update', res.message, 'success');
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartChat = async () => {
    // Navigate to messages sending recipient ID
    navigate(`/messages?recipient=${profile.user._id}`);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookDate || !bookSlot) {
      showNotification('Input Error', 'Please select a date and time slot', 'error');
      return;
    }

    setBookingLoading(true);
    try {
      await api.post('/sessions', {
        teacherId: profile.user._id,
        skill: bookSkill,
        description: bookDescription,
        date: bookDate,
        timeSlot: bookSlot,
        durationHours: Number(bookDuration),
      });
      showNotification('Booking Sent!', 'Your request has been delivered to the teacher.', 'success');
      setBookDescription('');
      navigate('/bookings');
    } catch (err) {
      showNotification('Booking Failed', err.message, 'error');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) return <Loader fullPage={true} />;
  if (!profile) return null;

  const isSelf = currentUser?._id === profile.user._id;
  const creditsCost = bookDuration * 20;

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <style>{`
        @media (min-width: 992px) {
          .profile-page-grid {
            grid-template-columns: 240px 1fr !important;
          }
          .profile-main-layout {
            grid-template-columns: 1fr 320px !important;
          }
        }
      `}</style>

      <div className="profile-page-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
        <Sidebar />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Header Banner Block */}
          <div className="glass-panel" style={{ overflow: 'hidden', padding: 0, borderRadius: 'var(--radius-lg)' }}>
            <div style={{
              height: '160px',
              backgroundImage: `url(${profile.coverImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}></div>
            <div style={{ padding: '0 24px 24px 24px', position: 'relative' }}>
              <img
                src={profile.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.user.username}`}
                alt={profile.user.name}
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid var(--bg-primary)',
                  position: 'relative',
                  marginTop: '-48px',
                  backgroundColor: 'var(--bg-primary)',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginTop: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {profile.user.name}
                    {profile.user.isVerified && <ShieldCheck size={20} color="var(--accent)" fill="rgba(34,197,94,0.15)" />}
                  </h2>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>@{profile.user.username}</span>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 500 }}>
                    {profile.bio}
                  </p>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> {profile.location || 'Remote'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Globe size={14} /> Speaks {profile.languages.join(', ')}</span>
                  </div>
                </div>

                {!isSelf && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handleFollowToggle} className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'} btn-sm`}>
                      {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />} {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                    <button onClick={handleStartChat} className="btn btn-secondary btn-sm">
                      <MessageSquare size={14} /> Chat
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Counters */}
              <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid var(--glass-border)', marginTop: '24px', paddingTop: '16px' }}>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{profile.completedSwapsCount}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completed Swaps</div>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{profile.followers.length}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Followers</div>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ★ {profile.rating}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rating ({profile.totalRatingsCount})</div>
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>Level {profile.user.level}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Teacher Level</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Layout Grid */}
          <div className="profile-main-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
            {/* Left Column: Bio Details, Skills, Reviews */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* About Box */}
              <GlassCard>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>About Me</h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {profile.about || 'No details provided yet.'}
                </p>
              </GlassCard>

              {/* Skills Box */}
              <GlassCard style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--secondary)' }}>Skills Offered</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {profile.skillsOffered.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None listed</span>
                    ) : (
                      profile.skillsOffered.map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ fontWeight: 500 }}>{s.skill}</span>
                          <span className="badge badge-gold" style={{ fontSize: '9px', padding: '2px 6px' }}>{s.level}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent)' }}>Skills Wanted</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {profile.skillsWanted.length === 0 ? (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None listed</span>
                    ) : (
                      profile.skillsWanted.map((s, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ fontWeight: 500 }}>{s.skill}</span>
                          <span className="badge badge-accent" style={{ fontSize: '9px', padding: '2px 6px' }}>{s.priority}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </GlassCard>

              {/* Portfolio and Projects */}
              {(profile.projects.length > 0 || profile.portfolioLinks.github || profile.portfolioLinks.linkedin) && (
                <GlassCard>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Portfolio & Projects</h3>
                  
                  {/* Social Links */}
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    {profile.portfolioLinks.linkedin && (
                      <a href={`https://${profile.portfolioLinks.linkedin}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <LinkIcon size={12} /> LinkedIn Profile
                      </a>
                    )}
                    {profile.portfolioLinks.github && (
                      <a href={`https://${profile.portfolioLinks.github}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <LinkIcon size={12} /> GitHub Repos
                      </a>
                    )}
                    {profile.portfolioLinks.website && (
                      <a href={`https://${profile.portfolioLinks.website}`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <LinkIcon size={12} /> Personal Website
                      </a>
                    )}
                  </div>

                  {/* Projects Listing */}
                  {profile.projects.map((p, idx) => (
                    <div key={idx} style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: idx < profile.projects.length - 1 ? '1px solid var(--glass-border)' : 'none' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600 }}>{p.title}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{p.description}</p>
                      {p.link && <a href={p.link} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--secondary)', textDecoration: 'none', marginTop: '6px', display: 'inline-block' }}>Visit link</a>}
                    </div>
                  ))}
                </GlassCard>
              )}

              {/* Reviews List */}
              <GlassCard>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Reviews & Feedback</h3>
                {profile.reviews.length === 0 ? (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                    No reviews received yet.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {profile.reviews.map((rev) => (
                      <div key={rev._id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{rev.reviewer.name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{rev.reviewer.username}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--secondary)', fontSize: '12px', fontWeight: 600 }}>
                            ★ {rev.rating}
                          </div>
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: 600 }}>Learned: {rev.skillLearned}</span>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          "{rev.reviewText}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Right Column: Availability & Booking Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Availability Slots Calendar */}
              <GlassCard>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>Weekly Availability</h4>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {profile.availabilityCalendar.length === 0 ? (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No regular slots listed.</span>
                  ) : (
                    profile.availabilityCalendar.map((slot, i) => (
                      <span key={i} className="badge badge-muted" style={{ fontSize: '10px', textTransform: 'none', padding: '6px 10px', borderRadius: '12px' }}>
                        {slot}
                      </span>
                    ))
                  )}
                </div>
              </GlassCard>

              {/* Book session card */}
              {!isSelf && profile.skillsOffered.length > 0 && (
                <GlassCard style={{ border: '1.5px solid rgba(212, 175, 55, 0.2)' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={16} color="var(--secondary)" /> Request a Swap
                  </h4>
                  <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                        Select Skill
                      </label>
                      <select value={bookSkill} onChange={(e) => setBookSkill(e.target.value)} className="glass-input" style={{ fontSize: '12px', padding: '0 8px', height: '36px' }}>
                        {profile.skillsOffered.map((s, idx) => (
                          <option key={idx} value={s.skill}>{s.skill}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                        Select Date
                      </label>
                      <input type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)} className="glass-input" style={{ fontSize: '12px', height: '36px' }} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                        Select Slot
                      </label>
                      <select value={bookSlot} onChange={(e) => setBookSlot(e.target.value)} className="glass-input" style={{ fontSize: '12px', padding: '0 8px', height: '36px' }}>
                        {profile.availabilityCalendar.map((slot, idx) => (
                          <option key={idx} value={slot}>{slot}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                        Duration
                      </label>
                      <select value={bookDuration} onChange={(e) => setBookDuration(Number(e.target.value))} className="glass-input" style={{ fontSize: '12px', padding: '0 8px', height: '36px' }}>
                        <option value={1}>1 Hour</option>
                        <option value={2}>2 Hours</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                        Request Message
                      </label>
                      <textarea
                        placeholder="What do you want to learn?"
                        value={bookDescription}
                        onChange={(e) => setBookDescription(e.target.value)}
                        className="glass-input"
                        style={{ fontSize: '12px', minHeight: '60px', resize: 'vertical' }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Total Cost:</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Coins size={12} /> {creditsCost} CR
                      </span>
                    </div>

                    <button type="submit" disabled={bookingLoading} className="btn btn-secondary" style={{ width: '100%', padding: '10px 0' }}>
                      {bookingLoading ? 'Requesting...' : 'Request Swap Session'}
                    </button>
                  </form>
                </GlassCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
