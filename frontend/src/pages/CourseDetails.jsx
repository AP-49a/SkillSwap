import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import api from '../utils/api.js';
import GlassCard from '../components/GlassCard.jsx';
import StarRating from '../components/StarRating.jsx';
import Loader from '../components/Loader.jsx';
import DoubtSessionsSection from '../components/DoubtSessionsSection.jsx';
import {
  ArrowLeft,
  BookOpen,
  Coins,
  Star,
  CheckCircle,
  AlertCircle,
  MapPin,
  ShieldCheck,
  Video,
  MessageSquare,
  Play,
  Send,
  MessageCircle,
  Award,
} from 'lucide-react';

export const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { showNotification } = useNotification();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [purchased, setPurchased] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);

  // Completion state
  const [completed, setCompleted] = useState(false);
  const [_completedAt, setCompletedAt] = useState(null);

  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState(null);

  // Review Form states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchCourseData = async () => {
      setLoading(true);
      setError(null);
      setPurchaseError(null);
      setReviewsLoading(true);
      setReviewsError(null);

      try {
        // 1. Fetch course details (Public)
        const courseRes = await api.get(`/courses/${id}`);
        if (!isMounted) return;

        const courseData = courseRes.data || courseRes;
        setCourse(courseData);

        // 2. Fetch public reviews for this course
        try {
          const reviewsRes = await api.get(`/courses/${id}/reviews`);
          if (isMounted) {
            const revList = Array.isArray(reviewsRes?.data)
              ? reviewsRes.data
              : Array.isArray(reviewsRes)
                ? reviewsRes
                : [];
            setReviews(revList);
          }
        } catch (revErr) {
          console.warn('Could not fetch reviews:', revErr);
          if (isMounted) setReviewsError('Failed to load reviews.');
        } finally {
          if (isMounted) setReviewsLoading(false);
        }

        // 3. If user is authenticated, check purchase status & completion
        if (user) {
          try {
            const purchaseRes = await api.get(`/courses/${id}/purchase`);
            if (isMounted && purchaseRes?.data?.purchased) {
              setPurchased(true);

              // Check completion status
              try {
                const compRes = await api.get(`/courses/${id}/completion`);
                if (isMounted && compRes?.data?.completed) {
                  setCompleted(true);
                  setCompletedAt(compRes.data.completedAt);
                }
              } catch {
                if (isMounted) setCompleted(false);
              }
            }
          } catch {
            if (isMounted) {
              setPurchased(false);
              setCompleted(false);
            }
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching course details:', err);
        setError(err.message || 'Course not found or unavailable');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCourseData();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  const teacherId =
    typeof course?.teacher === 'object' && course?.teacher !== null
      ? course.teacher._id || course.teacher.id
      : course?.teacher;

  const currentUserId = user?._id || user?.id;
  const isTeacher = Boolean(
    currentUserId && teacherId && String(currentUserId) === String(teacherId)
  );

  const existingUserReview = reviews.find(
    (r) => r.student?.username && user?.username && r.student.username === user.username
  );

  const isEligibleToReview = Boolean(
    user && !isTeacher && purchased && completed && !existingUserReview && !reviewSubmitted
  );

  const handlePurchase = async () => {
    if (!user) {
      navigate(`/login?redirect=/courses/${id}`);
      return;
    }

    setPurchaseLoading(true);
    setPurchaseError(null);

    try {
      const res = await api.post(`/courses/${id}/purchase`, {});
      if (res.success || res.data) {
        setPurchased(true);
        if (typeof refreshUser === 'function') {
          refreshUser();
        }
        if (typeof showNotification === 'function') {
          showNotification(
            'Enrollment Successful!',
            `You have enrolled in "${course.title}".`,
            'success'
          );
        }
      }
    } catch (err) {
      console.error('Purchase error:', err);
      const errMsg = err.message || 'Failed to complete purchase';
      setPurchaseError(errMsg);
      if (typeof showNotification === 'function') {
        showNotification('Purchase Failed', errMsg, 'error');
      }
    } finally {
      setPurchaseLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isEligibleToReview) return;

    const trimmedComment = reviewComment.trim();
    if (!trimmedComment) {
      setReviewSubmitError('Please enter your review comment.');
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setReviewSubmitError('Rating must be between 1 and 5 stars.');
      return;
    }

    setSubmittingReview(true);
    setReviewSubmitError(null);

    try {
      const res = await api.post(`/courses/${id}/reviews`, {
        rating: reviewRating,
        comment: trimmedComment,
      });

      if (res.success || res.data) {
        setReviewSubmitted(true);
        setReviewComment('');
        if (typeof showNotification === 'function') {
          showNotification(
            'Review Submitted!',
            'Thank you for your rating and review.',
            'success'
          );
        }

        // Refresh course for updated authoritative averageRating and reviewsCount
        try {
          const courseRes = await api.get(`/courses/${id}`);
          setCourse(courseRes.data || courseRes);
        } catch {
          // Ignore
        }

        // Refresh reviews list
        try {
          const reviewsRes = await api.get(`/courses/${id}/reviews`);
          const revList = Array.isArray(reviewsRes?.data)
            ? reviewsRes.data
            : Array.isArray(reviewsRes)
              ? reviewsRes
              : [];
          setReviews(revList);
        } catch {
          // Ignore
        }
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      const errMsg = err.message || 'Failed to submit review';
      setReviewSubmitError(errMsg);
      if (typeof showNotification === 'function') {
        showNotification('Review Error', errMsg, 'error');
      }
    } finally {
      setSubmittingReview(false);
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
          minHeight: '50vh',
          gap: '16px',
        }}
      >
        <Loader size={40} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading course details...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={{ padding: '32px 0', maxWidth: '800px', margin: '0 auto' }}>
        <Link
          to="/search"
          className="btn btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}
        >
          <ArrowLeft size={16} /> Back to Courses
        </Link>
        <GlassCard style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
            Course Not Found
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            {error || 'The requested course does not exist or is not published.'}
          </p>
          <Link to="/search" className="btn btn-primary">
            Explore Available Courses
          </Link>
        </GlassCard>
      </div>
    );
  }

  const teacherUsername =
    typeof course.teacher === 'object' && course.teacher !== null
      ? course.teacher.username || 'Instructor'
      : 'Instructor';

  const teacherAvatar =
    typeof course.teacher === 'object' && course.teacher !== null
      ? course.teacher.profile?.avatar ||
        `https://api.dicebear.com/7.x/adventurer/svg?seed=${course.teacher.username || 'instructor'}`
      : `https://api.dicebear.com/7.x/adventurer/svg?seed=instructor`;

  const teacherAbout =
    typeof course.teacher === 'object' && course.teacher !== null
      ? course.teacher.profile?.about
      : null;

  const teacherLocation =
    typeof course.teacher === 'object' && course.teacher !== null
      ? course.teacher.profile?.location
      : null;

  const ratingDisplay =
    typeof course.averageRating === 'number' && course.averageRating > 0
      ? course.averageRating.toFixed(1)
      : 'New';

  const reviewsCount =
    typeof course.reviewsCount === 'number' ? course.reviewsCount : 0;

  return (
    <div style={{ padding: '24px 0 60px 0', maxWidth: '1140px', margin: '0 auto' }}>
      {/* Back Button */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/search"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            textDecoration: 'none',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
        >
          <ArrowLeft size={16} /> Back to Courses
        </Link>
      </div>

      {/* Main Course Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: '32px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Course Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Thumbnail / Header Hero */}
          <GlassCard style={{ padding: '0', overflow: 'hidden' }}>
            <div
              style={{
                width: '100%',
                height: '280px',
                backgroundColor: 'var(--bg-secondary)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid var(--glass-border)',
              }}
            >
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <BookOpen size={64} color="var(--secondary)" />
                  <span style={{ fontSize: '14px' }}>Course Overview</span>
                </div>
              )}

              {/* Category Badge */}
              {course.category && (
                <span
                  className="badge badge-gold"
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    fontSize: '12px',
                    borderRadius: '16px',
                    padding: '6px 14px',
                  }}
                >
                  {course.category}
                </span>
              )}
            </div>

            {/* Course Title and Rating Header */}
            <div style={{ padding: '24px' }}>
              <h1
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: '1.3',
                  marginBottom: '14px',
                }}
              >
                {course.title}
              </h1>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}
              >
                {/* Rating */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--secondary)',
                    fontWeight: 700,
                  }}
                >
                  <Star size={16} fill="var(--secondary)" />
                  <span>{ratingDisplay}</span>
                  {reviewsCount > 0 && (
                    <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>
                      ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
                    </span>
                  )}
                </div>

                <span>•</span>

                {/* Instructor name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>Taught by</span>
                  <strong style={{ color: 'var(--text-primary)' }}>@{teacherUsername}</strong>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Description Section */}
          <GlassCard style={{ padding: '24px' }}>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px',
              }}
            >
              About This Course
            </h2>
            <div
              style={{
                fontSize: '14.5px',
                lineHeight: '1.7',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-line',
              }}
            >
              {course.description || 'No description provided.'}
            </div>
          </GlassCard>

          {/* Instructor Bio Section */}
          <GlassCard style={{ padding: '24px' }}>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px',
              }}
            >
              About the Instructor
            </h2>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <img
                src={teacherAvatar}
                alt={teacherUsername}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--glass-border)',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  @{teacherUsername}
                </h3>
                {teacherLocation && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <MapPin size={13} />
                    <span>{teacherLocation}</span>
                  </div>
                )}
                <p
                  style={{
                    fontSize: '13.5px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5',
                    marginTop: '4px',
                  }}
                >
                  {teacherAbout || 'Peer instructor on SkillSwap.'}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* Doubt Sessions Section (For purchased students & instructors) */}
          <DoubtSessionsSection
            courseId={id}
            isTeacher={isTeacher}
            purchased={purchased}
            teacherUsername={teacherUsername}
          />

          {/* Student Reviews & Rating Submission Section */}
          <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Student Reviews
                </h2>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'} from verified learners
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StarRating readOnly={true} rating={course.averageRating || 0} size={18} />
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--secondary)' }}>
                  {ratingDisplay}
                </span>
              </div>
            </div>

            {/* Review Submission Form / User Review State */}
            {existingUserReview ? (
              // Case A: User already submitted a review
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(212, 175, 55, 0.06)',
                  border: '1px solid rgba(212, 175, 55, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle size={15} color="#10b981" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Your Review
                    </span>
                  </div>
                  <StarRating readOnly={true} rating={existingUserReview.rating} size={14} />
                </div>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                  "{existingUserReview.comment}"
                </p>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Reviewed on {new Date(existingUserReview.createdAt).toLocaleDateString()}
                </span>
              </div>
            ) : isEligibleToReview ? (
              // Case B: Completed student eligible to submit a review
              <form
                onSubmit={handleSubmitReview}
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
                    Leave a Course Review
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Your Rating:</span>
                    <StarRating rating={reviewRating} onRatingChange={setReviewRating} size={20} />
                  </div>
                </div>

                {reviewSubmitError && (
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
                    <span>{reviewSubmitError}</span>
                  </div>
                )}

                <div style={{ position: 'relative' }}>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value.slice(0, 2000))}
                    placeholder="Share your experience learning with this course and instructor..."
                    rows={4}
                    className="glass-input"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      lineHeight: '1.5',
                      resize: 'vertical',
                      minHeight: '90px',
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      marginTop: '4px',
                    }}
                  >
                    {reviewComment.length} / 2000
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={submittingReview || !reviewComment.trim()}
                    className="btn btn-primary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: submittingReview || !reviewComment.trim() ? 'not-allowed' : 'pointer',
                      opacity: submittingReview || !reviewComment.trim() ? 0.7 : 1,
                    }}
                  >
                    {submittingReview ? (
                      'Submitting...'
                    ) : (
                      <>
                        <Send size={14} /> Submit Review
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : user && purchased && !completed && !isTeacher ? (
              // Case C: Enrolled but not completed yet
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Award size={18} color="var(--secondary)" />
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Complete this course to unlock review submission.
                  </span>
                </div>
                <Link
                  to={`/courses/${id}/learn`}
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <Play size={13} fill="currentColor" /> Course Player
                </Link>
              </div>
            ) : null}

            {/* Public Reviews List */}
            {reviewsError ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444', fontSize: '13px' }}>
                <AlertCircle size={24} style={{ margin: '0 auto 8px auto' }} />
                <p>{reviewsError}</p>
              </div>
            ) : reviewsLoading ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <Loader size={28} />
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px' }}>
                  Loading reviews...
                </p>
              </div>
            ) : reviews.length === 0 ? (
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
                <MessageCircle size={32} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No reviews yet.</p>
                <span style={{ fontSize: '12px' }}>
                  Be the first student to review this course after completing it!
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reviews.map((rev) => {
                  const studentUsername = rev.student?.username || 'Student';
                  const studentAvatar =
                    rev.student?.avatar ||
                    `https://api.dicebear.com/7.x/adventurer/svg?seed=${studentUsername}`;

                  return (
                    <div
                      key={rev.id || rev._id}
                      style={{
                        padding: '16px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={studentAvatar}
                            alt={studentUsername}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid var(--glass-border)',
                            }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                              @{studentUsername}
                            </span>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              {new Date(rev.createdAt).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        <StarRating readOnly={true} rating={rev.rating} size={14} />
                      </div>

                      <p
                        style={{
                          fontSize: '13.5px',
                          lineHeight: '1.5',
                          color: 'var(--text-secondary)',
                          whiteSpace: 'pre-line',
                          margin: 0,
                        }}
                      >
                        {rev.comment}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column: Pricing & Enrollment Action Sidebar */}
        <div style={{ position: 'sticky', top: '90px' }}>
          <GlassCard
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Price Tag */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: 'var(--secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Coins size={28} fill="var(--secondary)" />
                {course.credits}
              </span>
              <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Credits
              </span>
            </div>

            {/* Error Message */}
            {purchaseError && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{purchaseError}</span>
              </div>
            )}

            {/* CTA State Actions */}
            <div>
              {!user ? (
                // State 1: Logged out
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Link
                    to={`/login?redirect=/courses/${id}`}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: '12px',
                      fontSize: '15px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      textDecoration: 'none',
                    }}
                  >
                    Log in to Purchase
                  </Link>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      lineHeight: '1.4',
                    }}
                  >
                    Get 10 free credits when you sign up to start learning.
                  </p>
                </div>
              ) : isTeacher ? (
                // State 2: Course Teacher
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--glass-border)',
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: '13px',
                    }}
                  >
                    Your Course (Instructor)
                  </div>
                  <Link
                    to={`/courses/${id}/learn`}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px',
                      fontSize: '15px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      textDecoration: 'none',
                    }}
                  >
                    <Play size={16} fill="currentColor" /> Open Course Player
                  </Link>
                </div>
              ) : purchased ? (
                // State 3: Already Purchased / Enrolled
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    <CheckCircle size={16} /> Enrolled
                  </div>
                  <Link
                    to={`/courses/${id}/learn`}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px',
                      fontSize: '15px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      textDecoration: 'none',
                    }}
                  >
                    <Play size={16} fill="currentColor" /> Continue Learning
                  </Link>
                </div>
              ) : (
                // State 4: Logged in & can buy
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    className="btn btn-primary"
                    onClick={handlePurchase}
                    disabled={purchaseLoading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '15px',
                      fontWeight: 700,
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: purchaseLoading ? 'wait' : 'pointer',
                    }}
                  >
                    {purchaseLoading ? (
                      'Processing...'
                    ) : (
                      <>
                        <Coins size={16} /> Buy for {course.credits} Credits
                      </>
                    )}
                  </button>
                  <p
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                    }}
                  >
                    Instant unlock using your credits.
                  </p>
                </div>
              )}
            </div>

            {/* Course Features List */}
            <div
              style={{
                borderTop: '1px solid var(--glass-border)',
                paddingTop: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={16} color="var(--secondary)" />
                <span>Full Lifetime Access</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Video size={16} color="var(--secondary)" />
                <span>Private Video Lessons</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquare size={16} color="var(--secondary)" />
                <span>Free 1-on-1 Doubt Sessions</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
