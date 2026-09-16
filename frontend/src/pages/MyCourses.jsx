import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import GlassCard from '../components/GlassCard.jsx';
import Loader from '../components/Loader.jsx';
import api from '../utils/api.js';
import {
  BookOpen,
  Play,
  Star,
  Compass,
  AlertCircle,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

export const MyCourses = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPurchasedCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/courses/purchased');
      if (res && res.success && Array.isArray(res.data)) {
        setPurchases(res.data);
      } else if (Array.isArray(res)) {
        setPurchases(res);
      } else {
        setPurchases([]);
      }
    } catch (err) {
      console.error('Failed to fetch purchased courses:', err);
      setError(err.message || 'Unable to load your enrolled courses. Please try again.');
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasedCourses();
  }, []);

  return (
    <div
      style={{
        paddingTop: '20px',
        paddingBottom: '60px',
      }}
    >
      <style>{`
        @media (min-width: 992px) {
          .my-courses-layout {
            grid-template-columns: 240px 1fr !important;
          }
        }
      `}</style>

      <div
        className="my-courses-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '32px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Sidebar Navigation */}
        <Sidebar />

        {/* Right Column: Enrolled Courses Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                My Courses
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
                Access and continue learning all your enrolled courses.
              </p>
            </div>

            <Link
              to="/search"
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Compass size={15} /> Explore More Courses
            </Link>
          </div>

          {/* Loading State */}
          {loading && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                gap: '16px',
              }}
            >
              <Loader size={36} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Loading your enrolled courses...
              </p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <GlassCard
              style={{
                padding: '36px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <AlertCircle size={42} color="#ef4444" />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>
                  Error Loading Courses
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>{error}</p>
              </div>
              <button
                onClick={fetchPurchasedCourses}
                className="btn btn-primary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <RefreshCw size={14} /> Retry
              </button>
            </GlassCard>
          )}

          {/* Empty State */}
          {!loading && !error && purchases.length === 0 && (
            <GlassCard
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--secondary)',
                }}
              >
                <BookOpen size={32} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
                  No Courses Yet
                </h2>
                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '14px',
                    maxWidth: '420px',
                    lineHeight: '1.5',
                  }}
                >
                  You haven't enrolled in any courses yet. Explore our course catalog to find topics
                  you'd like to master with your credits.
                </p>
              </div>
              <Link
                to="/search"
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px',
                }}
              >
                <Compass size={16} /> Explore Courses
              </Link>
            </GlassCard>
          )}

          {/* Purchased Courses Grid */}
          {!loading && !error && purchases.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
              }}
            >
              {purchases.map((item) => {
                const course = item.course || item;
                const courseId = course?._id || course?.id;

                if (!course || !courseId) return null;

                const teacherUsername =
                  typeof course.teacher === 'object' && course.teacher !== null
                    ? course.teacher.username || 'Instructor'
                    : 'Instructor';

                const teacherAvatar =
                  typeof course.teacher === 'object' && course.teacher !== null
                    ? course.teacher.profile?.avatar ||
                      `https://api.dicebear.com/7.x/adventurer/svg?seed=${course.teacher.username || 'instructor'}`
                    : `https://api.dicebear.com/7.x/adventurer/svg?seed=instructor`;

                const ratingDisplay =
                  typeof course.averageRating === 'number' && course.averageRating > 0
                    ? course.averageRating.toFixed(1)
                    : 'New';

                const reviewsCount =
                  typeof course.reviewsCount === 'number' ? course.reviewsCount : 0;

                const isCompleted = Boolean(item.completedAt);

                return (
                  <GlassCard
                    key={item._id || courseId}
                    className="hover-lift"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '0',
                      overflow: 'hidden',
                      height: '100%',
                    }}
                  >
                    {/* Course Header Thumbnail */}
                    <div
                      style={{
                        height: '140px',
                        width: '100%',
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
                          alt={course.title || 'Course thumbnail'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          <BookOpen size={36} color="var(--secondary)" />
                        </div>
                      )}

                      {/* Category Pill Tag */}
                      {course.category && (
                        <span
                          className="badge badge-gold"
                          style={{
                            position: 'absolute',
                            top: '12px',
                            left: '12px',
                            fontSize: '10px',
                            textTransform: 'none',
                            borderRadius: '12px',
                            padding: '4px 10px',
                          }}
                        >
                          {course.category}
                        </span>
                      )}

                      {/* Completed indicator if present in purchase document */}
                      {isCompleted && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            backgroundColor: 'rgba(16, 185, 129, 0.9)',
                            color: '#ffffff',
                            borderRadius: '12px',
                            padding: '3px 8px',
                          }}
                        >
                          <CheckCircle size={12} /> Completed
                        </span>
                      )}
                    </div>

                    {/* Course Details Body */}
                    <div
                      style={{
                        padding: '18px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        flex: 1,
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <Link
                          to={`/courses/${courseId}`}
                          style={{
                            fontSize: '16px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            lineHeight: '1.3',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            textDecoration: 'none',
                          }}
                        >
                          {course.title || 'Untitled Course'}
                        </Link>

                        <p
                          style={{
                            fontSize: '12.5px',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.45',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            minHeight: '36px',
                          }}
                        >
                          {course.description || 'No description provided.'}
                        </p>
                      </div>

                      {/* Instructor Info & Rating */}
                      <div
                        style={{
                          borderTop: '1px solid var(--glass-border)',
                          paddingTop: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12px',
                        }}
                      >
                        {/* Teacher preview */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={teacherAvatar}
                            alt={teacherUsername}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid var(--glass-border)',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '11.5px',
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '110px',
                            }}
                          >
                            @{teacherUsername}
                          </span>
                        </div>

                        {/* Rating */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--secondary)',
                            fontWeight: 600,
                            fontSize: '12px',
                          }}
                        >
                          <Star size={13} fill="var(--secondary)" />
                          <span>{ratingDisplay}</span>
                          {reviewsCount > 0 && (
                            <span
                              style={{
                                fontSize: '10px',
                                color: 'var(--text-muted)',
                                fontWeight: 400,
                              }}
                            >
                              ({reviewsCount})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Continue Learning Action CTA */}
                      <div style={{ marginTop: '8px' }}>
                        <Link
                          to={`/courses/${courseId}/learn`}
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '10px',
                            fontSize: '13.5px',
                            fontWeight: 700,
                            borderRadius: '8px',
                            textDecoration: 'none',
                          }}
                        >
                          <Play size={15} fill="currentColor" /> Continue Learning
                        </Link>
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyCourses;
