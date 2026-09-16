import React from 'react';
import { Link } from 'react-router-dom';
import GlassCard from './GlassCard.jsx';
import { Star, Coins, BookOpen } from 'lucide-react';

export const CourseCard = ({ course }) => {
  if (!course || typeof course !== 'object') {
    return null;
  }

  const courseId = course._id || course.id;

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

  return (
    <Link
      to={`/courses/${courseId}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}
    >
      <GlassCard
        className="hover-lift"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '0',
          overflow: 'hidden',
          height: '100%',
          cursor: 'pointer',
        }}
      >
      {/* Course Header / Thumbnail */}
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

        {/* Price Tag */}
        <span
          className="badge badge-gold"
          style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(17, 17, 17, 0.85)',
            color: 'var(--secondary)',
            borderRadius: '12px',
            padding: '4px 10px',
          }}
        >
          <Coins size={13} fill="var(--secondary)" />
          {course.credits} Credits
        </span>
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
          <h3
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
            }}
          >
            {course.title || 'Untitled Course'}
          </h3>

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
            marginTop: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
          }}
        >
          {/* Teacher preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
            <img
              src={teacherAvatar}
              alt={teacherUsername}
              style={{
                width: '26px',
                height: '26px',
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
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>
                ({reviewsCount})
              </span>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  </Link>
);
};

export default CourseCard;
