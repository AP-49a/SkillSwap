import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import GlassCard from '../components/GlassCard.jsx';
import Loader from '../components/Loader.jsx';
import api from '../utils/api.js';
import {
  Calendar,
  Video,
  XCircle,
  Check,
  VideoOff,
  Mic,
  MicOff,
  Sparkles,
  Award,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';

export const Bookings = () => {
  const { user, refreshUser } = useAuth();
  const { showNotification } = useNotification();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Video Room Simulator modal state
  const [activeVideoSession, setActiveVideoSession] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [notepadText, setNotepadText] = useState('');
  const [aiSummaryResult, setAiSummaryResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Review Modal State
  const [activeReviewSession, setActiveReviewSession] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/sessions/my-sessions');
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleAccept = async (id) => {
    try {
      await api.put(`/sessions/${id}/accept`);
      showNotification('Session Approved', 'You accepted the teaching booking.', 'success');
      fetchSessions();
    } catch (err) {
      showNotification('Error', err.message, 'error');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/sessions/${id}/reject`);
      showNotification('Session Declined', 'You declined the booking request.', 'info');
      fetchSessions();
    } catch (err) {
      showNotification('Error', err.message, 'error');
    }
  };

  const handleCancel = async (id) => {
    try {
      await api.put(`/sessions/${id}/cancel`);
      showNotification('Session Cancelled', 'The booking has been successfully cancelled.', 'info');
      fetchSessions();
    } catch (err) {
      showNotification('Error', err.message, 'error');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/sessions/${id}/complete`);
      showNotification('Exchange Complete!', 'Credits transferred. You earned XP!', 'success');
      refreshUser();
      fetchSessions();
    } catch (err) {
      showNotification('Error', err.message, 'error');
    }
  };

  // Video Notepad AI summary generator
  const triggerAISessionSummary = async () => {
    if (!notepadText.trim()) {
      showNotification('Notepad Empty', 'Please type some notes to summarize.', 'error');
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post('/ai/session-summary', {
        sessionId: activeVideoSession._id,
        sessionNotes: notepadText,
      });
      setAiSummaryResult(res.data.fullSummary);
      showNotification('AI Analysis Complete', 'Summary and action items generated.', 'success');
    } catch (err) {
      showNotification('AI Error', err.message, 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    setReviewLoading(true);
    try {
      await api.post(`/sessions/${activeReviewSession._id}/review`, {
        rating,
        reviewText,
        wouldRecommend,
      });
      showNotification('Review Submitted!', 'Your feedback was added to the teacher profile. +20 XP!', 'success');
      setActiveReviewSession(null);
      setReviewText('');
      setRating(5);
      fetchSessions();
    } catch (err) {
      showNotification('Error', err.message, 'error');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return <Loader fullPage={true} />;

  // Filter lists
  const teachingRequests = sessions.filter((s) => s.teacher._id === user?._id && s.status === 'pending');
  const activeTeaching = sessions.filter((s) => s.teacher._id === user?._id && (s.status === 'accepted'));
  const activeLearning = sessions.filter((s) => s.learner._id === user?._id && (s.status === 'pending' || s.status === 'accepted'));
  const historySessions = sessions.filter((s) => s.status === 'completed' || s.status === 'rejected' || s.status === 'cancelled');

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <style>{`
        @media (min-width: 992px) {
          .bookings-grid-layout {
            grid-template-columns: 240px 1fr !important;
          }
        }
      `}</style>

      <div className="bookings-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
        <Sidebar />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700 }}>Exchange Scheduler</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
              Approve requests, launch video swaps, and finalize credit exchanges.
            </p>
          </div>

          {/* Pending Requests on You (Teaching Request list) */}
          {teachingRequests.length > 0 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--secondary)' }}>Pending Teaching Requests</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {teachingRequests.map((s) => (
                  <GlassCard key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <span className="badge badge-gold" style={{ fontSize: '9px', padding: '2px 6px' }}>Incoming teaching request</span>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>{s.skill} for {s.learner.name}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.description}</p>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                        📅 {new Date(s.date).toLocaleDateString()} at {s.timeSlot} ({s.durationHours} hr) &bull; 💰 Value: {s.creditCost} credits
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleReject(s._id)} className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }}><XCircle size={14} /> Decline</button>
                      <button onClick={() => handleAccept(s._id)} className="btn btn-secondary btn-sm"><Check size={14} /> Accept Request</button>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}

          {/* Active Bookings (You Teaching and You Learning lists combined for clean scheduler dashboard) */}
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>Active Swap Calendar</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Teaching Classes */}
              {activeTeaching.length === 0 && activeLearning.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No active scheduled classes found.
                </div>
              ) : (
                <>
                  {activeTeaching.map((s) => (
                    <GlassCard key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--accent)' }}>
                      <div>
                        <span className="badge badge-accent" style={{ fontSize: '9px', padding: '2px 6px' }}>teaching class</span>
                        <h4 style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>{s.skill} with {s.learner.name}</h4>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          📅 {new Date(s.date).toLocaleDateString()} at {s.timeSlot} ({s.durationHours} hr) &bull; 💰 Value: +{s.creditCost} credits
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setActiveVideoSession(s)} className="btn btn-outline btn-sm"><Video size={14} /> Launch Meeting</button>
                        <button onClick={() => handleComplete(s._id)} className="btn btn-accent btn-sm">Complete Exchange</button>
                      </div>
                    </GlassCard>
                  ))}

                  {/* Learning Classes */}
                  {activeLearning.map((s) => {
                    const isPending = s.status === 'pending';
                    return (
                      <GlassCard key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid var(--secondary)' }}>
                        <div>
                          <span className="badge badge-gold" style={{ fontSize: '9px', padding: '2px 6px' }}>{s.status} learning</span>
                          <h4 style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>{s.skill} with {s.teacher.name}</h4>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            📅 {new Date(s.date).toLocaleDateString()} at {s.timeSlot} ({s.durationHours} hr) &bull; 💰 Cost: {s.creditCost} credits
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          {isPending ? (
                            <button onClick={() => handleCancel(s._id)} className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }}><XCircle size={14} /> Cancel Request</button>
                          ) : (
                            <>
                              <button onClick={() => setActiveVideoSession(s)} className="btn btn-outline btn-sm"><Video size={14} /> Launch Meeting</button>
                              <button onClick={() => handleComplete(s._id)} className="btn btn-accent btn-sm">Complete Swap</button>
                            </>
                          )}
                        </div>
                      </GlassCard>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Swap History */}
          {historySessions.length > 0 && (
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-muted)' }}>Swap History Ledger</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {historySessions.map((s) => {
                  const isTeacher = s.teacher._id === user?._id;
                  const partner = isTeacher ? s.learner : s.teacher;
                  const displayCost = isTeacher ? `+${s.creditCost}` : `-${s.creditCost}`;
                  const isCompleted = s.status === 'completed';
                  return (
                    <GlassCard key={s._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.8, padding: '14px 20px' }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: s.status === 'completed' ? 'var(--accent)' : 'var(--danger)' }}>
                          {s.status.toUpperCase()}
                        </span>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>{s.skill} with {partner.name}</h4>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>📅 {new Date(s.date).toLocaleDateString()} at {s.timeSlot}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontWeight: 700, fontSize: '13px', color: isTeacher ? 'var(--accent)' : 'var(--danger)' }}>
                          {displayCost} CR
                        </span>
                        {isCompleted && !isTeacher && !s.learnerReviewed && (
                          <button onClick={() => setActiveReviewSession(s)} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }}>
                            Leave Review
                          </button>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Video Call Simulator Overlay Modal */}
      {activeVideoSession && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.95)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1000px',
            height: '90vh',
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr',
            backgroundColor: '#111111',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #333',
          }}>
            {/* Visual Stream Area */}
            <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', borderRight: '1px solid #222' }}>
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1c1c1c',
                margin: '16px',
                borderRadius: '12px',
                position: 'relative',
              }}>
                {cameraOn ? (
                  <div style={{ textAlign: 'center', color: '#888' }}>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--secondary)' }}>Active Meeting Room</div>
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>Virtual Meeting Room ID: #{activeVideoSession._id.substring(18).toUpperCase()}</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <VideoOff size={40} color="#666" />
                    <span style={{ fontSize: '13px', color: '#666' }}>Camera is Turned Off</span>
                  </div>
                )}

                {/* Sub corner camera mock */}
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  width: '120px',
                  height: '90px',
                  backgroundColor: '#333',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #555',
                }}>
                  <span style={{ fontSize: '9px', color: '#aaa' }}>Your Stream</span>
                </div>
              </div>

              {/* Video control hotbar */}
              <div style={{
                height: '72px',
                backgroundColor: '#151515',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '16px',
              }}>
                <button onClick={() => setMicOn(!micOn)} style={{ background: micOn ? '#292929' : 'var(--danger)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                  {micOn ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
                <button onClick={() => setCameraOn(!cameraOn)} style={{ background: cameraOn ? '#292929' : 'var(--danger)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}>
                  {cameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                </button>
                <button onClick={() => { setActiveVideoSession(null); setNotepadText(''); setAiSummaryResult(''); }} className="btn btn-danger btn-sm" style={{ padding: '8px 20px', borderRadius: '20px' }}>
                  Leave Room
                </button>
              </div>
            </div>

            {/* Notepad & AI Summarizer panel */}
            <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', backgroundColor: '#141414', overflowY: 'auto' }}>
              <h4 style={{ color: 'white', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <ClipboardList size={16} color="var(--secondary)" /> Lesson Notes Notepad
              </h4>
              <textarea
                placeholder="Type lesson summaries, key definitions, or student questions here..."
                value={notepadText}
                onChange={(e) => setNotepadText(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: '#1c1c1c',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#e5e5e5',
                  fontSize: '13px',
                  resize: 'none',
                  outline: 'none',
                  minHeight: '150px',
                }}
              />

              <button
                type="button"
                onClick={triggerAISessionSummary}
                disabled={aiLoading}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', padding: '10px', marginTop: '12px' }}
              >
                <Sparkles size={14} fill="#111" /> {aiLoading ? 'AI Summarizing...' : 'Generate AI Summary'}
              </button>

              {aiSummaryResult && (
                <div style={{
                  marginTop: '16px',
                  backgroundColor: '#201d10',
                  border: '1px solid rgba(212,175,55,0.25)',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#ddd',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-wrap',
                }}>
                  <strong style={{ color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                    <Sparkles size={12} fill="var(--secondary)" /> AI Session Summary:
                  </strong>
                  {aiSummaryResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal Form overlay */}
      {activeReviewSession && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '16px',
        }}>
          <GlassCard style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Leave Session Review</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              How was your exchange class with <strong>{activeReviewSession.teacher.name}</strong>?
            </p>

            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Star Rating select */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Overall Rating
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Star size={24} fill={rating >= star ? 'var(--secondary)' : 'none'} color="var(--secondary)" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                  Feedback Review Text
                </label>
                <textarea
                  placeholder="Share details of your experience (e.g. teaching style, material covered)"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="glass-input"
                  style={{ minHeight: '80px', fontSize: '12.5px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="recommend"
                  checked={wouldRecommend}
                  onChange={(e) => setWouldRecommend(e.target.checked)}
                  style={{ accentColor: 'var(--secondary)' }}
                />
                <label htmlFor="recommend" style={{ fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  I would recommend this teacher to others
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setActiveReviewSession(null)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={reviewLoading} className="btn btn-secondary" style={{ flex: 1 }}>
                  {reviewLoading ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default Bookings;
