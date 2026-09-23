import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNotification } from '../context/NotificationContext.jsx';
import GlassCard from './GlassCard.jsx';
import Loader from './Loader.jsx';
import {
  Upload,
  Trash2,
  Edit,
  Check,
  X,
  Video,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Play,
} from 'lucide-react';

import { resolveUrl } from '../utils/api.js';

// Allowed video extensions (matches backend videoUpload.js)
const ALLOWED_EXTENSIONS = ['.mp4', '.webm', '.ogg'];
const ALLOWED_ACCEPT = 'video/mp4,video/webm,video/ogg,.mp4,.webm,.ogg';
// Backend default max = 500 MB (COURSE_VIDEO_MAX_SIZE_MB env, default 500)
const MAX_SIZE_MB = 500;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// ─── Utility ─────────────────────────────────────────────────────────────────

const sortVideos = (videos) =>
  [...videos].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: '5px',
};

const inputStyle = (hasError) => ({
  width: '100%',
  padding: '9px 12px',
  borderRadius: '8px',
  fontSize: '13.5px',
  border: hasError ? '1.5px solid rgba(239,68,68,0.7)' : '1px solid var(--glass-border)',
  backgroundColor: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  outline: 'none',
  boxSizing: 'border-box',
});

const errStyle = {
  fontSize: '11.5px',
  color: '#ef4444',
  marginTop: '3px',
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
};

// ─── Inline Edit Form for an existing lesson ─────────────────────────────────

const LessonEditForm = ({ video, courseId, onSaved, onCancel }) => {
  const { showNotification } = useNotification();
  const [title, setTitle] = useState(video.title || '');
  const [description, setDescription] = useState(video.description || '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Title is required.';
    else if (title.trim().length > 150) e.title = 'Max 150 characters.';
    if (description.trim().length > 5000) e.description = 'Max 5000 characters.';
    return e;
  };

  const handleSave = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch(
        resolveUrl(`/courses/${courseId}/videos/${video.id}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim(),
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to update lesson.');
      showNotification('Lesson Updated', `"${title.trim()}" saved.`, 'success');
      onSaved(data.data || data);
    } catch (err) {
      showNotification('Update Failed', err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
      <div>
        <label style={labelStyle}>Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value.slice(0, 150)); setErrors((p) => ({ ...p, title: undefined })); }}
          style={inputStyle(!!errors.title)}
          disabled={saving}
          maxLength={150}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          {errors.title
            ? <span style={errStyle}><AlertCircle size={11} /> {errors.title}</span>
            : <span />}
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{title.length}/150</span>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Description <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span></label>
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value.slice(0, 5000)); setErrors((p) => ({ ...p, description: undefined })); }}
          rows={3}
          style={{ ...inputStyle(!!errors.description), resize: 'vertical', minHeight: '70px', lineHeight: '1.5' }}
          disabled={saving}
          maxLength={5000}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
          {errors.description
            ? <span style={errStyle}><AlertCircle size={11} /> {errors.description}</span>
            : <span />}
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{description.length}/5000</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="btn btn-outline btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
        >
          <X size={12} /> Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', minWidth: '80px', justifyContent: 'center' }}
        >
          {saving ? 'Saving...' : <><Check size={12} /> Save</>}
        </button>
      </div>
    </div>
  );
};

// ─── Single Lesson Row ────────────────────────────────────────────────────────

const LessonRow = ({ video, index, courseId, onDeleted, onUpdated }) => {
  const { showNotification } = useNotification();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete lesson "${video.title}"?\n\nThis cannot be undone. The video file will be permanently removed.`
    );
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(
        resolveUrl(`/courses/${courseId}/videos/${video.id}`),
        { method: 'DELETE', credentials: 'include' }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to delete lesson.');
      showNotification('Lesson Deleted', `"${video.title}" was removed.`, 'info');
      onDeleted(video.id);
    } catch (err) {
      showNotification('Delete Failed', err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{
        border: '1px solid var(--glass-border)',
        borderRadius: '10px',
        backgroundColor: 'var(--bg-secondary)',
        overflow: 'hidden',
      }}
    >
      {/* Row Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 14px',
          flexWrap: 'wrap',
        }}
      >
        {/* Lesson number */}
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'rgba(212,175,55,0.12)',
            color: 'var(--secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {index + 1}
        </div>

        {/* Title + Description snippet */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {video.title}
          </div>
          {video.description && !editing && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
              {video.description}
            </div>
          )}
        </div>

        {/* Order badge */}
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
          Order {video.order}
        </span>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {/* Preview */}
          <button
            type="button"
            title="Preview video (authenticated stream)"
            onClick={() => setExpanded((p) => !p)}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px' }}
          >
            <Play size={11} />
            {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {/* Edit */}
          <button
            type="button"
            onClick={() => { setEditing((p) => !p); setExpanded(false); }}
            className="btn btn-outline btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '4px 8px' }}
          >
            <Edit size={11} /> Edit
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              padding: '4px 8px',
              color: '#ef4444',
              background: 'none',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 'var(--radius-sm, 6px)',
              cursor: deleting ? 'wait' : 'pointer',
            }}
          >
            <Trash2 size={11} /> {deleting ? '…' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div style={{ borderTop: '1px solid var(--glass-border)', padding: '14px' }}>
          <LessonEditForm
            video={video}
            courseId={courseId}
            onSaved={(updated) => {
              onUpdated(updated);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {/* Inline player (authenticated stream) */}
      {expanded && !editing && (
        <div style={{ borderTop: '1px solid var(--glass-border)', padding: '14px' }}>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Preview (authenticated stream — private, not a public URL):
          </p>
          <video
            controls
            crossOrigin="use-credentials"
            style={{ width: '100%', maxHeight: '320px', borderRadius: '8px', backgroundColor: '#000' }}
            src={resolveUrl(`/courses/${courseId}/videos/${video.id}/stream`)}
          >
            Your browser does not support the video element.
          </video>
        </div>
      )}
    </div>
  );
};

// ─── Upload Lesson Form ───────────────────────────────────────────────────────

const UploadLessonForm = ({ courseId, nextOrder, onUploaded, onCancel }) => {
  const { showNotification } = useNotification();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0); // 0-100 via XHR
  const [errors, setErrors] = useState({});

  const validateFile = (f) => {
    if (!f) return 'A video file is required.';
    const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Only MP4, WebM, and Ogg files are supported.`;
    }
    if (f.size > MAX_SIZE_BYTES) {
      return `File exceeds the maximum upload size of ${MAX_SIZE_MB} MB.`;
    }
    return null;
  };

  const validate = () => {
    const e = {};
    if (!title.trim()) e.title = 'Lesson title is required.';
    else if (title.trim().length > 150) e.title = 'Max 150 characters.';
    if (description.trim().length > 5000) e.description = 'Max 5000 characters.';
    const fileErr = validateFile(file);
    if (fileErr) e.file = fileErr;
    return e;
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setErrors((p) => ({ ...p, file: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title.trim());
    if (description.trim()) formData.append('description', description.trim());
    formData.append('order', String(nextOrder));

    // Use XHR for upload progress; do NOT manually set Content-Type (browser adds boundary)
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.withCredentials = true;

      xhr.upload.addEventListener('progress', (ev) => {
        if (ev.lengthComputable) {
          setProgress(Math.round((ev.loaded / ev.total) * 100));
        }
      });

      xhr.addEventListener('load', () => {
        let data = {};
        try { data = JSON.parse(xhr.responseText); } catch { /* ignore parse error */ }
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data.message || `Upload failed (HTTP ${xhr.status})`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Network error during upload.')));
      xhr.addEventListener('abort', () => reject(new Error('Upload was aborted.')));

      xhr.open('POST', resolveUrl(`/courses/${courseId}/videos`));
      xhr.send(formData);
    })
      .then((data) => {
        showNotification('Lesson Uploaded!', `"${title.trim()}" is now part of your course.`, 'success');
        onUploaded(data.data || data);
      })
      .catch((err) => {
        showNotification('Upload Failed', err.message, 'error');
        setErrors((p) => ({ ...p, file: err.message }));
      })
      .finally(() => {
        setUploading(false);
        setProgress(0);
      });
  };

  return (
    <GlassCard style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Add Lesson
        </h3>
        {typeof onCancel === 'function' && (
          <button
            type="button"
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Title */}
        <div>
          <label style={labelStyle} htmlFor="lesson-title">Lesson Title *</label>
          <input
            id="lesson-title"
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value.slice(0, 150)); setErrors((p) => ({ ...p, title: undefined })); }}
            placeholder="e.g. Introduction to Variables"
            style={inputStyle(!!errors.title)}
            disabled={uploading}
            maxLength={150}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            {errors.title ? <span style={errStyle}><AlertCircle size={11} /> {errors.title}</span> : <span />}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{title.length}/150</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle} htmlFor="lesson-desc">
            Description <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
          </label>
          <textarea
            id="lesson-desc"
            value={description}
            onChange={(e) => { setDescription(e.target.value.slice(0, 5000)); setErrors((p) => ({ ...p, description: undefined })); }}
            placeholder="Describe what this lesson covers..."
            rows={3}
            style={{ ...inputStyle(!!errors.description), resize: 'vertical', minHeight: '70px', lineHeight: '1.5' }}
            disabled={uploading}
            maxLength={5000}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
            {errors.description ? <span style={errStyle}><AlertCircle size={11} /> {errors.description}</span> : <span />}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{description.length}/5000</span>
          </div>
        </div>

        {/* File picker */}
        <div>
          <label style={labelStyle}>Video File *</label>
          <div
            style={{
              border: errors.file ? '1.5px dashed rgba(239,68,68,0.6)' : '1.5px dashed var(--glass-border)',
              borderRadius: '8px',
              padding: '18px',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              backgroundColor: 'var(--bg-secondary)',
              transition: 'border-color 0.2s',
            }}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (uploading) return;
              const f = e.dataTransfer.files?.[0];
              if (f) { setFile(f); setErrors((p) => ({ ...p, file: undefined })); }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_ACCEPT}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={uploading}
            />
            {file ? (
              <div>
                <Video size={20} color="var(--secondary)" style={{ marginBottom: '6px' }} />
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{file.name}</p>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div>
                <Upload size={22} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  Click or drag &amp; drop a video file here
                </p>
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  MP4, WebM, Ogg — up to {MAX_SIZE_MB} MB
                </p>
              </div>
            )}
          </div>
          {errors.file && (
            <span style={errStyle}><AlertCircle size={11} /> {errors.file}</span>
          )}
        </div>

        {/* Progress bar (upload in progress) */}
        {uploading && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Uploading…</span>
              <span>{progress}%</span>
            </div>
            <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'var(--glass-border)', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  backgroundColor: 'var(--secondary)',
                  borderRadius: '3px',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid var(--glass-border)' }}>
          {typeof onCancel === 'function' && (
            <button type="button" onClick={onCancel} disabled={uploading} className="btn btn-outline btn-sm" style={{ fontSize: '13px' }}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={uploading}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', minWidth: '130px', justifyContent: 'center', cursor: uploading ? 'wait' : 'pointer', opacity: uploading ? 0.8 : 1 }}
          >
            {uploading ? `Uploading ${progress}%…` : <><Upload size={13} /> Upload Lesson</>}
          </button>
        </div>
      </form>
    </GlassCard>
  );
};

// ─── Course Content Section (main export) ────────────────────────────────────

/**
 * CourseContentSection
 * Props:
 *   courseId: string
 *   courseStatus: 'draft' | 'published'
 *   onPublished: () => void — called after successful publish
 */
const CourseContentSection = ({ courseId, courseStatus, onPublished, onVideosLoaded }) => {
  const { showNotification } = useNotification();

  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [videoError, setVideoError] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // ── Fetch videos ────────────────────────────────────────────────────────────
  const fetchVideos = useCallback(async () => {
    setLoadingVideos(true);
    setVideoError(null);
    try {
      const res = await fetch(resolveUrl(`/courses/${courseId}/videos`), {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to load lessons.');
      const list = Array.isArray(data.data) ? data.data : [];
      const sorted = sortVideos(list);
      setVideos(sorted);
      if (typeof onVideosLoaded === 'function') onVideosLoaded(sorted.length);
    } catch (err) {
      setVideoError(err.message || 'Unable to load lessons.');
      if (typeof onVideosLoaded === 'function') onVideosLoaded(0);
    } finally {
      setLoadingVideos(false);
    }
  }, [courseId, onVideosLoaded]);

  useEffect(() => {
    if (courseId) fetchVideos();
  }, [courseId, fetchVideos]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleUploaded = (newVideo) => {
    setVideos((prev) => {
      const sorted = sortVideos([...prev, newVideo]);
      if (typeof onVideosLoaded === 'function') onVideosLoaded(sorted.length);
      return sorted;
    });
    setShowUploadForm(false);
  };

  const handleDeleted = (videoId) => {
    setVideos((prev) => {
      const filtered = prev.filter((v) => String(v.id) !== String(videoId));
      if (typeof onVideosLoaded === 'function') onVideosLoaded(filtered.length);
      return filtered;
    });
  };

  const handleUpdated = (updatedVideo) => {
    setVideos((prev) =>
      sortVideos(prev.map((v) => (String(v.id) === String(updatedVideo.id) ? updatedVideo : v)))
    );
  };

  const handlePublish = async () => {
    const confirmed = window.confirm(
      'Publish this course?\n\nOnce published, the course will be discoverable in the public course catalog. You can continue to edit course details and lessons after publishing.'
    );
    if (!confirmed) return;

    setPublishing(true);
    try {
      const res = await fetch(resolveUrl(`/courses/${courseId}/publish`), {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to publish course.');
      showNotification('Course Published!', 'Your course is now live and visible to students.', 'success');
      if (typeof onPublished === 'function') onPublished(data.data);
    } catch (err) {
      showNotification('Publish Failed', err.message, 'error');
    } finally {
      setPublishing(false);
    }
  };

  // Next order for new lesson
  const nextOrder = videos.length > 0 ? Math.max(...videos.map((v) => v.order)) + 1 : 0;

  const isDraft = courseStatus === 'draft';

  return (
    <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>Course Content</h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {videos.length} lesson{videos.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Add Lesson */}
          {!showUploadForm && (
            <button
              type="button"
              onClick={() => setShowUploadForm(true)}
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Upload size={13} /> Add Lesson
            </button>
          )}
        </div>
      </div>

      {/* Upload form */}
      {showUploadForm && (
        <UploadLessonForm
          courseId={courseId}
          nextOrder={nextOrder}
          onUploaded={handleUploaded}
          onCancel={() => setShowUploadForm(false)}
        />
      )}

      {/* Lessons list */}
      {loadingVideos && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', gap: '12px' }}>
          <Loader size={28} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading lessons…</span>
        </div>
      )}

      {!loadingVideos && videoError && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '24px', textAlign: 'center' }}>
          <AlertCircle size={32} color="#ef4444" />
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>{videoError}</p>
          <button onClick={fetchVideos} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={13} /> Retry
          </button>
        </div>
      )}

      {!loadingVideos && !videoError && videos.length === 0 && !showUploadForm && (
        <div style={{ textAlign: 'center', padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={26} color="var(--secondary)" />
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>No lessons yet</p>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
              Add your first lesson by clicking &quot;Add Lesson&quot; above.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadForm(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <Upload size={13} /> Add Lesson
          </button>
        </div>
      )}

      {!loadingVideos && !videoError && videos.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {videos.map((v, idx) => (
            <LessonRow
              key={v.id}
              video={v}
              index={idx}
              courseId={courseId}
              onDeleted={handleDeleted}
              onUpdated={handleUpdated}
            />
          ))}
        </div>
      )}

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Publish action (draft only) */}
        {isDraft && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(212,175,55,0.06)',
              border: '1px solid rgba(212,175,55,0.25)',
            }}
          >
            <div>
              <p style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Ready to go live?
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                Publishing makes your course discoverable in the public catalog. You can keep editing after publishing.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13.5px',
                cursor: publishing ? 'wait' : 'pointer',
                opacity: publishing ? 0.8 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {publishing ? 'Publishing…' : '🚀 Publish Course'}
            </button>
          </div>
        )}

        {/* Published state info */}
        {!isDraft && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(16,185,129,0.06)',
              border: '1px solid rgba(16,185,129,0.25)',
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
            }}
          >
            <span style={{ fontSize: '16px' }}>✅</span>
            <span>
              <strong style={{ color: '#10b981' }}>Published</strong> — this course is live in the public catalog.
              Lessons and details can still be edited.
            </span>
          </div>
        )}

        {/* Preview action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', margin: 0 }}>
            {isDraft
              ? 'Public preview is not available for draft courses.'
              : 'View the public course page as students see it.'}
          </p>
          {isDraft ? (
            <span
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-muted)',
                cursor: 'default',
              }}
            >
              Publish to preview →
            </span>
          ) : (
            <a
              href={`/courses/${courseId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              Preview Course →
            </a>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default CourseContentSection;
