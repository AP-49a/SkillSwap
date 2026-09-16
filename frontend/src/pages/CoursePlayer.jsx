import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import api from '../utils/api.js';
import GlassCard from '../components/GlassCard.jsx';
import Loader from '../components/Loader.jsx';
import {
  ArrowLeft,
  Play,
  Video as VideoIcon,
  AlertCircle,
  Lock,
  RefreshCw,
  BookOpen,
  CheckCircle,
  Award,
} from 'lucide-react';

export const CoursePlayer = () => {
  const { id: courseId } = useParams();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [course, setCourse] = useState(null);
  const [videos, setVideos] = useState([]);
  const [activeVideo, setActiveVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [videoPlaybackError, setVideoPlaybackError] = useState(false);

  // Completion states
  const [completed, setCompleted] = useState(false);
  const [_completedAt, setCompletedAt] = useState(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [completionError, setCompletionError] = useState(null);

  const fetchCourseAndVideos = async () => {
    setLoading(true);
    setError(null);
    setIsUnauthorized(false);
    setVideoPlaybackError(false);
    setCompletionError(null);

    try {
      // 1. Fetch public course details for header metadata
      let courseData = null;
      try {
        const courseRes = await api.get(`/courses/${courseId}`);
        courseData = courseRes.data || courseRes;
        setCourse(courseData);
      } catch (cErr) {
        console.warn('Could not fetch course metadata:', cErr);
      }

      // 2. Fetch authenticated course videos
      const videosRes = await api.get(`/courses/${courseId}/videos`);
      const videoList = Array.isArray(videosRes?.data)
        ? videosRes.data
        : Array.isArray(videosRes)
          ? videosRes
          : [];

      setVideos(videoList);

      if (videoList.length > 0) {
        setActiveVideo(videoList[0]);
      }

      // 3. Fetch completion status for enrolled students (teachers don't have student completion status)
      const teacherId =
        typeof courseData?.teacher === 'object' && courseData?.teacher !== null
          ? courseData.teacher._id || courseData.teacher.id
          : courseData?.teacher;
      const currentUserId = user?._id || user?.id;
      const isTeacher = Boolean(
        currentUserId && teacherId && String(currentUserId) === String(teacherId)
      );

      if (!isTeacher) {
        try {
          const compRes = await api.get(`/courses/${courseId}/completion`);
          if (compRes?.data?.completed) {
            setCompleted(true);
            setCompletedAt(compRes.data.completedAt);
          } else {
            setCompleted(false);
          }
        } catch (compErr) {
          // If 400 (teacher) or 403 (not enrolled), ignore
          if (compErr.status !== 400 && compErr.status !== 403) {
            console.warn('Could not check completion status:', compErr);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load course player:', err);
      if (err.status === 403) {
        setIsUnauthorized(true);
        setError('You need to purchase this course to access the video player.');
      } else if (err.status === 404) {
        setError('Course or videos not found.');
      } else {
        setError(err.message || 'Failed to load course player. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseAndVideos();
  }, [courseId, user]);

  const handleSelectVideo = (video) => {
    setActiveVideo(video);
    setVideoPlaybackError(false);
  };

  const handleMarkComplete = async () => {
    setMarkingComplete(true);
    setCompletionError(null);

    try {
      const res = await api.post(`/courses/${courseId}/complete`, {});
      if (res?.data?.completed) {
        setCompleted(true);
        setCompletedAt(res.data.completedAt || new Date().toISOString());
        if (typeof showNotification === 'function') {
          showNotification(
            'Course Completed!',
            'Congratulations on completing this course! You can now leave a rating and review on the course details page.',
            'success'
          );
        }
      }
    } catch (err) {
      console.error('Failed to mark course complete:', err);
      const errMsg = err.message || 'Failed to mark course complete';
      setCompletionError(errMsg);
      if (typeof showNotification === 'function') {
        showNotification('Completion Failed', errMsg, 'error');
      }
    } finally {
      setMarkingComplete(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '16px',
        }}
      >
        <Loader size={40} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          Loading course player...
        </p>
      </div>
    );
  }

  // Unauthorized Access State (Not purchased and not teacher)
  if (isUnauthorized) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto', padding: '0 16px' }}>
        <GlassCard
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '18px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ef4444',
            }}
          >
            <Lock size={30} />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Enrollment Required
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.5' }}>
              This course video player is private. You must purchase this course with your credits or
              be the course instructor to stream these lessons.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to={`/courses/${courseId}`} className="btn btn-primary">
              View Course Details & Enroll
            </Link>
            <Link to="/my-courses" className="btn btn-outline">
              Back to My Courses
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  // General Error State
  if (error && (!videos || videos.length === 0)) {
    return (
      <div style={{ maxWidth: '640px', margin: '40px auto', padding: '0 16px' }}>
        <GlassCard
          style={{
            padding: '40px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '18px',
          }}
        >
          <AlertCircle size={44} color="#ef4444" />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              Unable to Load Course
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{error}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={fetchCourseAndVideos}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={14} /> Retry
            </button>
            <Link to="/my-courses" className="btn btn-outline">
              Back to My Courses
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  const activeVideoId = activeVideo?.id || activeVideo?._id;
  const streamUrl = activeVideo?.videoUrl || `/api/courses/${courseId}/videos/${activeVideoId}/stream`;

  const teacherUsername =
    typeof course?.teacher === 'object' && course?.teacher !== null
      ? course.teacher.username || 'Instructor'
      : 'Instructor';

  const teacherId =
    typeof course?.teacher === 'object' && course?.teacher !== null
      ? course.teacher._id || course.teacher.id
      : course?.teacher;

  const currentUserId = user?._id || user?.id;
  const isTeacher = Boolean(
    currentUserId && teacherId && String(currentUserId) === String(teacherId)
  );

  return (
    <div style={{ padding: '16px 0 60px 0', maxWidth: '1240px', margin: '0 auto' }}>
      <style>{`
        @media (min-width: 992px) {
          .player-grid-layout {
            grid-template-columns: minmax(0, 1fr) 360px !important;
          }
        }
      `}</style>

      {/* Top Header & Breadcrumb */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/my-courses"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              fontSize: '13.5px',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft size={16} /> My Courses
          </Link>
          <span style={{ color: 'var(--glass-border)' }}>|</span>
          <Link
            to={`/courses/${courseId}`}
            style={{
              color: 'var(--text-secondary)',
              fontSize: '13.5px',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--secondary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            Course Overview
          </Link>
        </div>

        {/* Header Right Actions (Instructor Info + Completion Action) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {course && (
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              Instructor: <strong style={{ color: 'var(--text-primary)' }}>@{teacherUsername}</strong>
            </span>
          )}

          {/* Completion Status / Action for Students */}
          {!isTeacher && (
            <div>
              {completed ? (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#10b981',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle size={15} /> Course Completed
                </div>
              ) : (
                <button
                  onClick={handleMarkComplete}
                  disabled={markingComplete}
                  className="btn btn-primary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: markingComplete ? 'wait' : 'pointer',
                  }}
                >
                  {markingComplete ? (
                    'Marking Complete...'
                  ) : (
                    <>
                      <CheckCircle size={15} /> Mark Course Complete
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Completion Error Alert */}
      {completionError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <AlertCircle size={16} />
          <span>{completionError}</span>
        </div>
      )}

      {/* Course Main Player Layout */}
      <div
        className="player-grid-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Video Player & Current Lesson Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Video Player Box */}
          <GlassCard style={{ padding: '0', overflow: 'hidden', backgroundColor: '#000000' }}>
            {activeVideo ? (
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#050505' }}>
                <video
                  key={activeVideoId}
                  src={streamUrl}
                  controls
                  crossOrigin="use-credentials"
                  playsInline
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#000000',
                  }}
                  onError={(e) => {
                    console.error('Video playback error:', e);
                    setVideoPlaybackError(true);
                  }}
                >
                  Your browser does not support HTML5 video playback.
                </video>

                {videoPlaybackError && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.85)',
                      color: '#ffffff',
                      padding: '20px',
                      textAlign: 'center',
                      gap: '12px',
                    }}
                  >
                    <AlertCircle size={36} color="#ef4444" />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '15px' }}>Playback Error</p>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
                        Unable to stream this video file. Ensure you have an active session and proper enrollment.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  height: '360px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '16px',
                  color: 'var(--text-muted)',
                  backgroundColor: 'var(--bg-secondary)',
                }}
              >
                <VideoIcon size={48} color="var(--secondary)" />
                <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                  No video lessons uploaded for this course yet.
                </p>
              </div>
            )}
          </GlassCard>

          {/* Current Lesson Metadata */}
          {activeVideo && (
            <GlassCard style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--secondary)',
                      textTransform: 'uppercase',
                      marginBottom: '8px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    <span>Lesson {videos.findIndex((v) => (v.id || v._id) === activeVideoId) + 1} of {videos.length}</span>
                  </div>
                  <h1
                    style={{
                      fontSize: '22px',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      lineHeight: '1.3',
                      marginBottom: '12px',
                    }}
                  >
                    {activeVideo.title}
                  </h1>
                </div>

                {course?.title && (
                  <span
                    className="badge badge-gold"
                    style={{
                      fontSize: '11px',
                      borderRadius: '12px',
                      padding: '4px 10px',
                    }}
                  >
                    {course.title}
                  </span>
                )}
              </div>

              {activeVideo.description && (
                <div
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: 'var(--text-secondary)',
                    marginTop: '12px',
                    whiteSpace: 'pre-line',
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '16px',
                  }}
                >
                  {activeVideo.description}
                </div>
              )}
            </GlassCard>
          )}
        </div>

        {/* Right Column: Lessons Playlist & Completion Banner Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Completion Callout for Students */}
          {!isTeacher && (
            <GlassCard style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: completed
                      ? 'rgba(16, 185, 129, 0.15)'
                      : 'rgba(212, 175, 55, 0.15)',
                    color: completed ? '#10b981' : 'var(--secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Award size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {completed ? 'Course Completed!' : 'Course Progress'}
                  </h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {completed
                      ? 'You have finished this course. Visit the Course Overview to leave a review.'
                      : 'Finished all video lessons? Mark the course complete to leave a review and unlock doubt sessions.'}
                  </p>

                  <div style={{ marginTop: '8px' }}>
                    {completed ? (
                      <Link
                        to={`/courses/${courseId}`}
                        className="btn btn-outline btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                        }}
                      >
                        Leave a Review
                      </Link>
                    ) : (
                      <button
                        onClick={handleMarkComplete}
                        disabled={markingComplete}
                        className="btn btn-primary btn-sm"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                        }}
                      >
                        <CheckCircle size={14} /> Mark as Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Lessons Playlist */}
          <GlassCard
            style={{
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: 'calc(100vh - 140px)',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid var(--glass-border)',
                paddingBottom: '14px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Course Content
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {videos.length} {videos.length === 1 ? 'lesson' : 'lessons'}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: 'var(--secondary)',
                }}
              >
                <BookOpen size={14} />
              </div>
            </div>

            {/* Lessons List */}
            {videos.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                }}
              >
                No video lessons currently available.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {videos.map((video, idx) => {
                  const vId = video.id || video._id;
                  const isCurrent = vId === activeVideoId;

                  return (
                    <div
                      key={vId || idx}
                      onClick={() => handleSelectVideo(video)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        backgroundColor: isCurrent
                          ? 'rgba(212, 175, 55, 0.12)'
                          : 'rgba(255, 255, 255, 0.02)',
                        border: isCurrent
                          ? '1px solid rgba(212, 175, 55, 0.4)'
                          : '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        transition: 'all 0.2s',
                      }}
                      className="hover-lift"
                    >
                      {/* Play/Index Icon */}
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: isCurrent
                            ? 'var(--secondary)'
                            : 'var(--bg-secondary)',
                          color: isCurrent ? '#111111' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {isCurrent ? <Play size={13} fill="#111111" /> : idx + 1}
                      </div>

                      {/* Lesson title and preview */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: isCurrent ? 700 : 500,
                            color: isCurrent ? 'var(--secondary)' : 'var(--text-primary)',
                            lineHeight: '1.3',
                            wordBreak: 'break-word',
                          }}
                        >
                          {video.title}
                        </span>
                        {video.description && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {video.description}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
