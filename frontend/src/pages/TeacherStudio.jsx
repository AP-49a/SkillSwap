import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext.jsx';
import api from '../utils/api.js';
import Sidebar from '../components/Sidebar.jsx';
import GlassCard from '../components/GlassCard.jsx';
import Loader from '../components/Loader.jsx';
import TeacherCourseForm from '../components/TeacherCourseForm.jsx';
import {
  Plus,
  BookOpen,
  Edit,
  Trash2,
  Globe,
  FileText,
  Star,
  Coins,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';

// ─── Status Badge ────────────────────────────────────────────────────────────

const StatusBadge = ({ status }) => {
  const isDraft = status === 'draft';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: isDraft
          ? 'rgba(212, 175, 55, 0.12)'
          : 'rgba(16, 185, 129, 0.12)',
        color: isDraft ? 'var(--secondary)' : '#10b981',
        border: isDraft
          ? '1px solid rgba(212, 175, 55, 0.3)'
          : '1px solid rgba(16, 185, 129, 0.3)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {isDraft ? <FileText size={10} /> : <Globe size={10} />}
      {isDraft ? 'Draft' : 'Published'}
    </span>
  );
};

// ─── Course Card ──────────────────────────────────────────────────────────────

const TeacherCourseCard = ({ course, onPublish, onDelete, publishing, deleting }) => {
  const navigate = useNavigate();
  const courseId = course._id || course.id;
  const isDraft = course.status === 'draft';

  const ratingDisplay =
    typeof course.averageRating === 'number' && course.averageRating > 0
      ? course.averageRating.toFixed(1)
      : 'New';
  const reviewsCount = typeof course.reviewsCount === 'number' ? course.reviewsCount : 0;
  const createdDate = course.createdAt
    ? new Date(course.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : '';

  return (
    <GlassCard
      style={{
        padding: '0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Thumbnail Strip */}
      <div
        style={{
          height: '120px',
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
            alt={course.title || 'Course'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        ) : (
          <BookOpen size={32} color="var(--secondary)" style={{ opacity: 0.5 }} />
        )}

        {/* Status badge */}
        <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
          <StatusBadge status={course.status} />
        </div>

        {/* Category badge */}
        {course.category && (
          <span
            className="badge badge-gold"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              fontSize: '10px',
              borderRadius: '10px',
              padding: '3px 8px',
            }}
          >
            {course.category}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        <div>
          <h3
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: '1.3',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              marginBottom: '6px',
            }}
          >
            {course.title || 'Untitled Course'}
          </h3>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--secondary)', fontWeight: 600 }}>
              <Coins size={12} /> {course.credits} cr
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star size={12} fill={course.averageRating > 0 ? 'var(--secondary)' : 'none'} color="var(--secondary)" />
              <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{ratingDisplay}</span>
              {reviewsCount > 0 && (
                <span style={{ color: 'var(--text-muted)' }}>({reviewsCount})</span>
              )}
            </div>
            {createdDate && (
              <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Created {createdDate}</span>
            )}
          </div>
        </div>

        {/* Draft notice */}
        {isDraft && (
          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            Draft — not visible in the public catalog.
          </p>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            borderTop: '1px solid var(--glass-border)',
            paddingTop: '10px',
            marginTop: 'auto',
          }}
        >
          {/* Edit */}
          <button
            onClick={() => navigate(`/teacher/studio/courses/${courseId}/edit`)}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
          >
            <Edit size={12} /> Edit
          </button>

          {/* Publish (draft only) */}
          {isDraft && (
            <button
              onClick={() => onPublish(courseId)}
              disabled={publishing === courseId}
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                cursor: publishing === courseId ? 'wait' : 'pointer',
              }}
            >
              {publishing === courseId ? (
                'Publishing...'
              ) : (
                <><Globe size={12} /> Publish</>
              )}
            </button>
          )}

          {/* View (published only) */}
          {!isDraft && (
            <Link
              to={`/courses/${courseId}`}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', textDecoration: 'none' }}
            >
              <CheckCircle size={12} /> View
            </Link>
          )}

          {/* Delete */}
          <button
            onClick={() => onDelete(courseId, course.title || 'Untitled')}
            disabled={deleting === courseId}
            className="btn btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: '#ef4444',
              background: 'none',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              cursor: deleting === courseId ? 'wait' : 'pointer',
              padding: '4px 10px',
            }}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

// ─── Teacher Studio Dashboard ─────────────────────────────────────────────────

export const TeacherStudio = () => {
  const { showNotification } = useNotification();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [publishing, setPublishing] = useState(null); // courseId being published
  const [deleting, setDeleting] = useState(null);     // courseId being deleted

  const fetchMyCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/courses/mine');
      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      setCourses(list);
    } catch (err) {
      console.error('Failed to load teacher courses:', err);
      setError(err.message || 'Unable to load your courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyCourses();
  }, [fetchMyCourses]);

  const handlePublish = async (courseId) => {
    setPublishing(courseId);
    try {
      const res = await api.post(`/courses/${courseId}/publish`);
      const updated = res?.data;
      setCourses((prev) =>
        prev.map((c) => {
          const cId = c._id || c.id;
          if (String(cId) === String(courseId)) {
            return { ...c, status: 'published', ...(updated || {}) };
          }
          return c;
        })
      );
      showNotification('Course Published!', 'Your course is now live and visible to students.', 'success');
    } catch (err) {
      console.error('Publish error:', err);
      showNotification('Publish Failed', err.message || 'Could not publish course.', 'error');
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (courseId, courseTitle) => {
    const confirmed = window.confirm(
      `Delete "${courseTitle}"?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    setDeleting(courseId);
    try {
      await api.delete(`/courses/${courseId}`);
      setCourses((prev) => prev.filter((c) => String(c._id || c.id) !== String(courseId)));
      showNotification('Course Deleted', `"${courseTitle}" was deleted.`, 'info');
    } catch (err) {
      console.error('Delete error:', err);
      showNotification('Delete Failed', err.message || 'Could not delete course.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const draftCount = courses.filter((c) => c.status === 'draft').length;
  const publishedCount = courses.filter((c) => c.status === 'published').length;

  return (
    <div style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <style>{`
        @media (min-width: 992px) {
          .studio-layout { grid-template-columns: 240px 1fr !important; }
        }
      `}</style>

      <div className="studio-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
        <Sidebar />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Page Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)' }}>Teacher Studio</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
                Create and manage your courses.
              </p>
            </div>
            <Link
              to="/teacher/studio/courses/new"
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontSize: '14px' }}
            >
              <Plus size={16} /> Create Course
            </Link>
          </div>

          {/* Stats Bar */}
          {!loading && !error && courses.length > 0 && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <GlassCard style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '140px' }}>
                <BookOpen size={18} color="var(--secondary)" />
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{courses.length}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Total Courses</div>
                </div>
              </GlassCard>
              <GlassCard style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '140px' }}>
                <Globe size={18} color="#10b981" />
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>{publishedCount}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Published</div>
                </div>
              </GlassCard>
              <GlassCard style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '140px' }}>
                <FileText size={18} color="var(--secondary)" />
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--secondary)' }}>{draftCount}</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Drafts</div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px' }}>
              <Loader size={36} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading your courses...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <GlassCard style={{ padding: '36px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <AlertCircle size={42} color="#ef4444" />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Unable to Load Your Courses</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>{error}</p>
              </div>
              <button onClick={fetchMyCourses} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={14} /> Retry
              </button>
            </GlassCard>
          )}

          {/* Empty State */}
          {!loading && !error && courses.length === 0 && (
            <GlassCard style={{ padding: '56px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--secondary)',
                }}
              >
                <BookOpen size={36} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No Courses Yet</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '400px', lineHeight: '1.5' }}>
                  Create your first course and start teaching on SkillSwap. Share your knowledge and earn credits.
                </p>
              </div>
              <Link
                to="/teacher/studio/courses/new"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginTop: '8px', textDecoration: 'none' }}
              >
                <Plus size={16} /> Create Course
              </Link>
            </GlassCard>
          )}

          {/* Course Grid */}
          {!loading && !error && courses.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
              }}
            >
              {courses.map((course) => (
                <TeacherCourseCard
                  key={course._id || course.id}
                  course={course}
                  onPublish={handlePublish}
                  onDelete={handleDelete}
                  publishing={publishing}
                  deleting={deleting}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Create Course Page ───────────────────────────────────────────────────────

export const TeacherCourseCreate = () => {
  const navigate = useNavigate();

  return (
    <div style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <style>{`
        @media (min-width: 992px) {
          .studio-layout { grid-template-columns: 240px 1fr !important; }
        }
      `}</style>

      <div className="studio-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
        <Sidebar />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Breadcrumb */}
          <Link
            to="/teacher/studio"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '13px',
              width: 'fit-content',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft size={15} /> Teacher Studio
          </Link>

          <TeacherCourseForm
            mode="create"
            onSuccess={(course) => {
              const courseId = course?._id || course?.id;
              if (courseId) {
                navigate(`/teacher/studio/courses/${courseId}/edit`);
              } else {
                navigate('/teacher/studio');
              }
            }}
            onCancel={() => navigate('/teacher/studio')}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Edit Course Page ─────────────────────────────────────────────────────────

export const TeacherCourseEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCourse = async () => {
      setLoading(true);
      setError(null);
      try {
        // GET /api/courses/mine returns all courses (draft + published) owned by the user
        const res = await api.get('/courses/mine');
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        const found = list.find((c) => String(c._id || c.id) === String(id));
        if (!found) {
          setError('Course not found or you do not own this course.');
        } else {
          setCourse(found);
        }
      } catch (err) {
        console.error('Failed to load course for edit:', err);
        setError(err.message || 'Failed to load course. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) loadCourse();
  }, [id]);

  return (
    <div style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <style>{`
        @media (min-width: 992px) {
          .studio-layout { grid-template-columns: 240px 1fr !important; }
        }
      `}</style>

      <div className="studio-layout" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px', alignItems: 'start' }}>
        <Sidebar />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Breadcrumb */}
          <Link
            to="/teacher/studio"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '13px',
              width: 'fit-content',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <ArrowLeft size={15} /> Teacher Studio
          </Link>

          {loading && (
            <GlassCard style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <Loader size={36} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading course...</p>
            </GlassCard>
          )}

          {!loading && error && (
            <GlassCard style={{ padding: '36px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <AlertCircle size={40} color="#ef4444" />
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>Course Not Found</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px' }}>{error}</p>
              </div>
              <Link to="/teacher/studio" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                Back to Studio
              </Link>
            </GlassCard>
          )}

          {!loading && !error && course && (
            <>
              {/* Status badge row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <StatusBadge status={course.status} />
                {course.status === 'draft' && (
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Draft courses are not visible in the public course catalog.
                  </span>
                )}
              </div>

              <TeacherCourseForm
                mode="edit"
                course={course}
                onSuccess={(updated) => {
                  showNotification('Course saved!', 'Your changes have been saved.', 'success');
                  // Merge updates into local state
                  if (updated) setCourse((prev) => ({ ...prev, ...updated }));
                }}
                onCancel={() => navigate('/teacher/studio')}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherStudio;
