import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext.jsx';
import api from '../utils/api.js';
import GlassCard from './GlassCard.jsx';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

/**
 * TeacherCourseForm
 * Props:
 *   mode: 'create' | 'edit'
 *   course: existing course object (for edit mode)
 *   onSuccess: (course) => void
 *   onCancel: () => void
 */
export const TeacherCourseForm = ({ mode = 'create', course = null, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const isEdit = mode === 'edit';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [credits, setCredits] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (isEdit && course) {
      setTitle(course.title || '');
      setDescription(course.description || '');
      setCategory(course.category || '');
      setCredits(course.credits != null ? String(course.credits) : '');
      setThumbnail(course.thumbnail || '');
    }
  }, [isEdit, course]);

  const validate = () => {
    const errors = {};
    const trimTitle = title.trim();
    const trimDesc = description.trim();
    const trimCat = category.trim();
    const creditsNum = Number(credits);

    if (!trimTitle) errors.title = 'Course title is required.';
    else if (trimTitle.length > 150) errors.title = 'Title cannot exceed 150 characters.';

    if (!trimDesc) errors.description = 'Course description is required.';
    else if (trimDesc.length > 5000) errors.description = 'Description cannot exceed 5000 characters.';

    if (!trimCat) errors.category = 'Course category is required.';
    else if (trimCat.length > 100) errors.category = 'Category cannot exceed 100 characters.';

    if (credits === '' || credits === null) errors.credits = 'Credits are required.';
    else if (isNaN(creditsNum) || creditsNum < 1) errors.credits = 'Credits must be at least 1.';

    if (thumbnail.trim() && !/^https?:\/\/.+/.test(thumbnail.trim())) {
      errors.thumbnail = 'Thumbnail must be a valid URL starting with http:// or https://.';
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      credits: Number(credits),
    };
    if (thumbnail.trim()) payload.thumbnail = thumbnail.trim();

    try {
      let res;
      if (isEdit) {
        res = await api.put(`/courses/${course._id || course.id}`, payload);
      } else {
        res = await api.post('/courses', payload);
      }

      const savedCourse = res?.data || res;

      showNotification(
        isEdit ? 'Course Updated!' : 'Course Created!',
        isEdit
          ? `"${savedCourse?.title || payload.title}" has been saved.`
          : `"${savedCourse?.title || payload.title}" was created as a draft.`,
        'success'
      );

      if (typeof onSuccess === 'function') {
        onSuccess(savedCourse);
      } else {
        navigate('/teacher/studio');
      }
    } catch (err) {
      console.error('Course save error:', err);
      if (err?.data?.errors && Array.isArray(err.data.errors)) {
        const backendErrors = {};
        err.data.errors.forEach(({ field, message }) => {
          backendErrors[field] = message;
        });
        setFieldErrors(backendErrors);
      } else {
        setApiError(err.message || 'Failed to save course. Please try again.');
      }
      showNotification('Save Failed', err.message || 'Failed to save course.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    fontSize: '14px',
    border: hasError ? '1.5px solid rgba(239, 68, 68, 0.7)' : '1px solid var(--glass-border)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  });

  const labelStyle = {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '6px',
  };

  const errStyle = {
    fontSize: '12px',
    color: '#ef4444',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  };

  return (
    <GlassCard style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Course' : 'Create New Course'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {isEdit
              ? 'Update your course details below.'
              : 'Fill in the details. Your course will start as a draft.'}
          </p>
        </div>
        {typeof onCancel === 'function' && (
          <button
            type="button"
            onClick={onCancel}
            title="Cancel"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* API Error */}
      {apiError && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            fontSize: '13.5px',
            display: 'flex',
            gap: '8px',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{apiError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} noValidate>
        {/* Title */}
        <div>
          <label style={labelStyle} htmlFor="ts-title">Course Title *</label>
          <input
            id="ts-title"
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value.slice(0, 150)); setFieldErrors((p) => ({ ...p, title: undefined })); }}
            placeholder="e.g. Introduction to Python Programming"
            style={inputStyle(!!fieldErrors.title)}
            disabled={saving}
            maxLength={150}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            {fieldErrors.title
              ? <span style={errStyle}><AlertCircle size={12} /> {fieldErrors.title}</span>
              : <span />}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{title.length} / 150</span>
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={labelStyle} htmlFor="ts-desc">Description *</label>
          <textarea
            id="ts-desc"
            value={description}
            onChange={(e) => { setDescription(e.target.value.slice(0, 5000)); setFieldErrors((p) => ({ ...p, description: undefined })); }}
            placeholder="Describe what students will learn, prerequisites, and course structure..."
            rows={5}
            style={{ ...inputStyle(!!fieldErrors.description), resize: 'vertical', minHeight: '110px', lineHeight: '1.5' }}
            disabled={saving}
            maxLength={5000}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            {fieldErrors.description
              ? <span style={errStyle}><AlertCircle size={12} /> {fieldErrors.description}</span>
              : <span />}
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{description.length} / 5000</span>
          </div>
        </div>

        {/* Category + Credits */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <label style={labelStyle} htmlFor="ts-category">Category *</label>
            <input
              id="ts-category"
              type="text"
              value={category}
              onChange={(e) => { setCategory(e.target.value.slice(0, 100)); setFieldErrors((p) => ({ ...p, category: undefined })); }}
              placeholder="e.g. Programming, Design, Music"
              style={inputStyle(!!fieldErrors.category)}
              disabled={saving}
              maxLength={100}
            />
            {fieldErrors.category && (
              <span style={errStyle}><AlertCircle size={12} /> {fieldErrors.category}</span>
            )}
          </div>

          <div>
            <label style={labelStyle} htmlFor="ts-credits">Credits (Price) *</label>
            <input
              id="ts-credits"
              type="number"
              value={credits}
              onChange={(e) => { setCredits(e.target.value); setFieldErrors((p) => ({ ...p, credits: undefined })); }}
              placeholder="e.g. 5"
              min={1}
              step={1}
              style={inputStyle(!!fieldErrors.credits)}
              disabled={saving}
            />
            {fieldErrors.credits && (
              <span style={errStyle}><AlertCircle size={12} /> {fieldErrors.credits}</span>
            )}
          </div>
        </div>

        {/* Thumbnail URL */}
        <div>
          <label style={labelStyle} htmlFor="ts-thumbnail">
            Thumbnail URL <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(Optional)</span>
          </label>
          <input
            id="ts-thumbnail"
            type="url"
            value={thumbnail}
            onChange={(e) => { setThumbnail(e.target.value); setFieldErrors((p) => ({ ...p, thumbnail: undefined })); }}
            placeholder="https://example.com/thumbnail.jpg"
            style={inputStyle(!!fieldErrors.thumbnail)}
            disabled={saving}
          />
          {fieldErrors.thumbnail && (
            <span style={errStyle}><AlertCircle size={12} /> {fieldErrors.thumbnail}</span>
          )}
          {thumbnail && !fieldErrors.thumbnail && /^https?:\/\/.+/.test(thumbnail.trim()) && (
            <div style={{ marginTop: '8px' }}>
              <img
                src={thumbnail.trim()}
                alt="Thumbnail preview"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                style={{ maxWidth: '200px', maxHeight: '120px', borderRadius: '8px', border: '1px solid var(--glass-border)', objectFit: 'cover' }}
              />
            </div>
          )}
          <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Enter a direct image URL. File upload is not yet supported.
          </p>
        </div>

        {/* Draft note for create mode */}
        {!isEdit && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
            }}
          >
            <CheckCircle size={14} color="var(--secondary)" style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>
              Your course will be saved as a <strong>Draft</strong> and won&apos;t be visible to students until you publish it.
            </span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
          {typeof onCancel === 'function' && (
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="btn btn-outline"
              style={{ fontSize: '14px' }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              cursor: saving ? 'wait' : 'pointer',
              opacity: saving ? 0.8 : 1,
              minWidth: '140px',
              justifyContent: 'center',
            }}
          >
            {saving
              ? (isEdit ? 'Saving...' : 'Creating...')
              : (isEdit ? 'Save Changes' : 'Create Course')}
          </button>
        </div>
      </form>
    </GlassCard>
  );
};

export default TeacherCourseForm;
