import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import api from '../utils/api.js';
import GlassCard from './GlassCard.jsx';
import Loader from './Loader.jsx';
import {
  Video,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  ExternalLink,
  MessageSquare,
  Send,
  X,
} from 'lucide-react';

export const DoubtSessionsSection = ({
  courseId,
  isTeacher,
  purchased,
  teacherUsername = 'Instructor',
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student Request Form states
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestDate, setRequestDate] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState(null);

  // Teacher Accept Form states
  const [acceptingSessionId, setAcceptingSessionId] = useState(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [submittingAccept, setSubmittingAccept] = useState(false);
  const [acceptError, setAcceptError] = useState(null);

  // Action in progress (cancel / complete / join)
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchSessions = async () => {
    if (!user || (!purchased && !isTeacher)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/courses/${courseId}/doubt-sessions`);
      const sessionList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      setSessions(sessionList);
    } catch (err) {
      // 403 means user is not eligible / not purchased
      if (err.status !== 403) {
        console.warn('Failed to load doubt sessions:', err);
        setError(err.message || 'Failed to load doubt sessions.');
      }
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [courseId, user, purchased, isTeacher]);

  // Don't render doubt sessions section for unauthenticated or non-purchased visitors
  if (!user || (!purchased && !isTeacher)) {
    return null;
  }

  // Student creates a new doubt session request
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    const trimmedMessage = requestMessage.trim();

    if (!trimmedMessage) {
      setRequestError('Please provide a message describing your doubt.');
      return;
    }

    if (trimmedMessage.length > 500) {
      setRequestError('Message cannot exceed 500 characters.');
      return;
    }

    setSubmittingRequest(true);
    setRequestError(null);

    try {
      const payload = {
        message: trimmedMessage,
      };

      if (requestDate) {
        payload.date = new Date(requestDate).toISOString();
      }

      const res = await api.post(`/courses/${courseId}/doubt-sessions`, payload);
      if (res.success || res.data) {
        setShowRequestForm(false);
        setRequestMessage('');
        setRequestDate('');
        if (typeof showNotification === 'function') {
          showNotification(
            'Doubt Session Requested!',
            'Your instructor has been notified of your doubt session request.',
            'success'
          );
        }
        fetchSessions();
      }
    } catch (err) {
      console.error('Create doubt session error:', err);
      const errMsg = err.message || 'Failed to request doubt session';
      setRequestError(errMsg);
      if (typeof showNotification === 'function') {
        showNotification('Request Failed', errMsg, 'error');
      }
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Teacher accepts a doubt session and provides a Google Meet link
  const handleAcceptSession = async (sessionId) => {
    const trimmedLink = meetingLink.trim();

    if (!trimmedLink) {
      setAcceptError('Please provide a valid Google Meet link.');
      return;
    }

    setSubmittingAccept(true);
    setAcceptError(null);

    try {
      const res = await api.put(`/courses/${courseId}/doubt-sessions/${sessionId}/accept`, {
        meetingLink: trimmedLink,
      });

      if (res.success || res.data) {
        setAcceptingSessionId(null);
        setMeetingLink('');
        if (typeof showNotification === 'function') {
          showNotification(
            'Session Accepted!',
            'Google Meet link set successfully.',
            'success'
          );
        }
        fetchSessions();
      }
    } catch (err) {
      console.error('Accept session error:', err);
      const errMsg = err.message || 'Failed to accept session';
      setAcceptError(errMsg);
      if (typeof showNotification === 'function') {
        showNotification('Acceptance Failed', errMsg, 'error');
      }
    } finally {
      setSubmittingAccept(false);
    }
  };

  // Student or Teacher joins the Google Meet session
  const handleJoinSession = async (sessionId) => {
    setActionLoadingId(sessionId);
    try {
      const res = await api.get(`/courses/${courseId}/doubt-sessions/${sessionId}/join`);
      const link = res?.data?.joinLink;

      if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        throw new Error('Meeting link not found in response');
      }
    } catch (err) {
      console.error('Join session error:', err);
      if (typeof showNotification === 'function') {
        showNotification('Join Error', err.message || 'Could not open meeting link', 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Student or Teacher cancels a session
  const handleCancelSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to cancel this doubt session?')) return;

    setActionLoadingId(sessionId);
    try {
      const res = await api.put(`/courses/${courseId}/doubt-sessions/${sessionId}/cancel`);
      if (res.success || res.data) {
        if (typeof showNotification === 'function') {
          showNotification('Session Cancelled', 'The doubt session has been cancelled.', 'info');
        }
        fetchSessions();
      }
    } catch (err) {
      console.error('Cancel session error:', err);
      if (typeof showNotification === 'function') {
        showNotification('Cancel Failed', err.message || 'Could not cancel session', 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  // Student or Teacher marks an accepted session completed
  const handleCompleteSession = async (sessionId) => {
    setActionLoadingId(sessionId);
    try {
      const res = await api.put(`/courses/${courseId}/doubt-sessions/${sessionId}/complete`);
      if (res.success || res.data) {
        if (typeof showNotification === 'function') {
          showNotification(
            'Session Completed!',
            'The doubt session was marked as completed.',
            'success'
          );
        }
        fetchSessions();
      }
    } catch (err) {
      console.error('Complete session error:', err);
      if (typeof showNotification === 'function') {
        showNotification('Complete Failed', err.message || 'Could not complete session', 'error');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const hasPendingSession = sessions.some((s) => s.status === 'pending');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'rgba(212, 175, 55, 0.15)',
              color: 'var(--secondary)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
            }}
          >
            <Clock size={12} /> Pending
          </span>
        );
      case 'accepted':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <CheckCircle size={12} /> Accepted
          </span>
        );
      case 'completed':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <CheckCircle size={12} /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <XCircle size={12} /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--glass-border)',
          paddingBottom: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={18} color="var(--secondary)" /> Course Doubt Sessions
          </h2>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {isTeacher
              ? 'Manage 1-on-1 Google Meet doubt sessions requested by your students'
              : `Free 1-on-1 Google Meet doubt sessions with @${teacherUsername}`}
          </span>
        </div>

        {/* Student Request Button */}
        {!isTeacher && !showRequestForm && (
          <button
            onClick={() => setShowRequestForm(true)}
            disabled={hasPendingSession}
            className="btn btn-primary btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              opacity: hasPendingSession ? 0.6 : 1,
              cursor: hasPendingSession ? 'not-allowed' : 'pointer',
            }}
            title={hasPendingSession ? 'You already have a pending request' : 'Request Doubt Session'}
          >
            <Plus size={14} /> Request Doubt Session
          </button>
        )}
      </div>

      {/* Student Request Form */}
      {!isTeacher && showRequestForm && (
        <form
          onSubmit={handleCreateRequest}
          style={{
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              New Doubt Session Request
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowRequestForm(false);
                setRequestError(null);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {requestError && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '12.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} />
              <span>{requestError}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Describe Your Doubt * (Max 500 characters)
            </label>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value.slice(0, 500))}
              placeholder="What specific topic or lesson would you like help with?"
              rows={3}
              className="glass-input"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '13.5px',
                resize: 'vertical',
              }}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {requestMessage.length} / 500
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Preferred Date & Time (Optional)
            </label>
            <input
              type="datetime-local"
              value={requestDate}
              onChange={(e) => setRequestDate(e.target.value)}
              className="glass-input"
              style={{
                width: '100%',
                maxWidth: '300px',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setShowRequestForm(false);
                setRequestError(null);
              }}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingRequest || !requestMessage.trim()}
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: submittingRequest ? 'wait' : 'pointer',
              }}
            >
              {submittingRequest ? (
                'Submitting...'
              ) : (
                <>
                  <Send size={14} /> Send Request
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center' }}>
          <Loader size={28} />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
            Loading doubt sessions...
          </p>
        </div>
      ) : error ? (
        <div style={{ padding: '16px', textAlign: 'center', color: '#ef4444', fontSize: '13px' }}>
          <AlertCircle size={24} style={{ margin: '0 auto 8px auto' }} />
          <p>{error}</p>
        </div>
      ) : sessions.length === 0 ? (
        /* Empty State */
        <div
          style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <MessageSquare size={32} color="var(--text-muted)" style={{ opacity: 0.5 }} />
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {isTeacher ? 'No doubt session requests from students yet.' : 'No doubt sessions requested yet.'}
          </p>
          <span style={{ fontSize: '12px' }}>
            {isTeacher
              ? 'When students submit doubt session requests, they will appear here for acceptance.'
              : 'Stuck on a concept? Request a free 1-on-1 Google Meet session with your instructor.'}
          </span>
        </div>
      ) : (
        /* Sessions List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sessions.map((session) => {
            const isSessionLoading = actionLoadingId === session.id;
            const studentUsername = session.student?.username || 'Student';
            const studentAvatar =
              session.student?.avatar ||
              `https://api.dicebear.com/7.x/adventurer/svg?seed=${studentUsername}`;

            const teacherName = session.teacher?.username || teacherUsername;

            const isAcceptingThis = acceptingSessionId === session.id;

            return (
              <div
                key={session.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Header Row: User Info & Status */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isTeacher ? (
                      <>
                        <img
                          src={studentAvatar}
                          alt={studentUsername}
                          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Student: @{studentUsername}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Requested {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          Instructor: @{teacherName}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Requested {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>{getStatusBadge(session.status)}</div>
                </div>

                {/* Message Body */}
                <p
                  style={{
                    fontSize: '13.5px',
                    lineHeight: '1.5',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    backgroundColor: 'var(--bg-secondary)',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  "{session.message}"
                </p>

                {/* Optional Preferred Date */}
                {session.date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <Calendar size={13} />
                    <span>
                      Preferred Date: {new Date(session.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                )}

                {/* Teacher Accept Inline Form */}
                {isTeacher && isAcceptingThis && (
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(212, 175, 55, 0.05)',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Enter Google Meet Link *
                    </label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/abc-defg-hij"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      className="glass-input"
                      style={{ padding: '8px 12px', borderRadius: '6px', fontSize: '13px' }}
                    />
                    {acceptError && (
                      <span style={{ fontSize: '12px', color: '#ef4444' }}>{acceptError}</span>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setAcceptingSessionId(null);
                          setMeetingLink('');
                          setAcceptError(null);
                        }}
                        className="btn btn-outline btn-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAcceptSession(session.id)}
                        disabled={submittingAccept || !meetingLink.trim()}
                        className="btn btn-primary btn-sm"
                      >
                        {submittingAccept ? 'Saving...' : 'Confirm & Accept'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Session Actions Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    flexWrap: 'wrap',
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '10px',
                    marginTop: '4px',
                  }}
                >
                  {/* PENDING ACTIONS */}
                  {session.status === 'pending' && (
                    <>
                      {isTeacher ? (
                        <>
                          <button
                            onClick={() => handleCancelSession(session.id)}
                            disabled={isSessionLoading}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: '12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          >
                            Decline
                          </button>
                          {!isAcceptingThis && (
                            <button
                              onClick={() => {
                                setAcceptingSessionId(session.id);
                                setMeetingLink('');
                                setAcceptError(null);
                              }}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '12px' }}
                            >
                              Accept with Meet Link
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleCancelSession(session.id)}
                          disabled={isSessionLoading}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                        >
                          Cancel Request
                        </button>
                      )}
                    </>
                  )}

                  {/* ACCEPTED ACTIONS */}
                  {session.status === 'accepted' && (
                    <>
                      <button
                        onClick={() => handleJoinSession(session.id)}
                        disabled={isSessionLoading}
                        className="btn btn-primary btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          backgroundColor: '#10b981',
                          borderColor: '#10b981',
                        }}
                      >
                        <ExternalLink size={13} /> Join Google Meet
                      </button>

                      <button
                        onClick={() => handleCompleteSession(session.id)}
                        disabled={isSessionLoading}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '12px' }}
                      >
                        Mark Completed
                      </button>

                      <button
                        onClick={() => handleCancelSession(session.id)}
                        disabled={isSessionLoading}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '12px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {/* COMPLETED ACTIONS: None (read only) */}
                  {session.status === 'completed' && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Session finished
                    </span>
                  )}

                  {/* CANCELLED ACTIONS: None (read only) */}
                  {session.status === 'cancelled' && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Session cancelled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};

export default DoubtSessionsSection;
