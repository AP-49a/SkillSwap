import React from 'react';
import GlassCard from './GlassCard.jsx';
import { CheckCircle, AlertCircle, Globe, FileText, Info } from 'lucide-react';

/**
 * CourseReadinessPanel
 *
 * Informational-only panel showing whether a course has the key fields
 * configured. Does NOT enforce any business rules — the backend publish
 * endpoint is the final authority on what is required to publish.
 *
 * Props:
 *   course      — course object from GET /api/courses/mine
 *   videoCount  — number of uploaded lessons (integer)
 */
const CourseReadinessPanel = ({ course, videoCount }) => {
  if (!course) return null;

  const isPublished = course.status === 'published';

  // ── Checks ────────────────────────────────────────────────────────────────
  const checks = [
    {
      label: 'Title',
      ok: Boolean(course.title?.trim()),
      hint: 'Give your course a descriptive title.',
    },
    {
      label: 'Description',
      ok: Boolean(course.description?.trim()),
      hint: 'Describe what students will learn.',
    },
    {
      label: 'Category',
      ok: Boolean(course.category?.trim()),
      hint: 'Assign a category so students can find your course.',
    },
    {
      label: 'Credits (price)',
      ok: typeof course.credits === 'number' && course.credits >= 1,
      hint: 'Set how many credits students pay to enroll.',
    },
    {
      label: 'Thumbnail',
      ok: Boolean(course.thumbnail?.trim()),
      hint: 'A thumbnail makes your course stand out.',
      optional: true,
    },
    {
      label: 'At least one lesson',
      ok: typeof videoCount === 'number' ? videoCount >= 1 : false,
      value:
        typeof videoCount === 'number'
          ? `${videoCount} lesson${videoCount !== 1 ? 's' : ''} uploaded`
          : 'Loading…',
      hint: 'Add video lessons so students have content to watch.',
    },
  ];

  const requiredChecks = checks.filter((c) => !c.optional);
  const allRequiredDone = requiredChecks.every((c) => c.ok);
  const allDone = checks.every((c) => c.ok);

  // ── Styles ─────────────────────────────────────────────────────────────────
  const rowStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    padding: '10px 0',
    borderBottom: '1px solid var(--glass-border)',
  };

  const iconStyle = (ok) => ({
    flexShrink: 0,
    marginTop: '1px',
    color: ok ? '#10b981' : 'rgba(212,175,55,0.8)',
  });

  return (
    <GlassCard style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
            Course Readiness
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
            Informational overview — publishing is controlled by the backend.
          </p>
        </div>

        {/* Status chip */}
        {isPublished ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '11.5px',
              fontWeight: 700,
              backgroundColor: 'rgba(16,185,129,0.12)',
              color: '#10b981',
              border: '1px solid rgba(16,185,129,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            <Globe size={11} /> Published
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '11.5px',
              fontWeight: 700,
              backgroundColor: 'rgba(212,175,55,0.12)',
              color: 'var(--secondary)',
              border: '1px solid rgba(212,175,55,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            <FileText size={11} /> Draft
          </span>
        )}
      </div>

      {/* Disclaimer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: 'rgba(96,165,250,0.07)',
          border: '1px solid rgba(96,165,250,0.2)',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
        }}
      >
        <Info size={14} color="#60a5fa" style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          The checklist below is <strong>informational only</strong>. The backend
          publish endpoint is the final authority on what is required. Items marked
          optional will not block publishing.
        </span>
      </div>

      {/* Checklist */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {checks.map((check) => (
          <div key={check.label} style={rowStyle}>
            {check.ok ? (
              <CheckCircle size={16} style={iconStyle(true)} />
            ) : (
              <AlertCircle size={16} style={iconStyle(false)} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {check.label}
                </span>
                {check.optional && (
                  <span
                    style={{
                      fontSize: '10.5px',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '8px',
                      padding: '1px 7px',
                    }}
                  >
                    optional
                  </span>
                )}
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    color: check.ok ? '#10b981' : 'rgba(212,175,55,0.9)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {check.ok ? (check.value || 'Ready') : (check.value || 'Missing')}
                </span>
              </div>
              {!check.ok && (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {check.hint}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: '10px',
          backgroundColor: allRequiredDone
            ? 'rgba(16,185,129,0.06)'
            : 'rgba(212,175,55,0.06)',
          border: allRequiredDone
            ? '1px solid rgba(16,185,129,0.2)'
            : '1px solid rgba(212,175,55,0.2)',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: '1.5',
        }}
      >
        {allDone ? (
          <span>
            ✅ All items are configured. Your course looks ready to publish from this checklist — use the{' '}
            <strong>Content &amp; Publish</strong> tab to publish it.
          </span>
        ) : allRequiredDone ? (
          <span>
            ✅ All required items are done.{' '}
            {checks.filter((c) => !c.ok && c.optional).length > 0 && (
              <>Optional items ({checks.filter((c) => !c.ok && c.optional).map((c) => c.label).join(', ')}) are missing but won&apos;t block publishing.</>
            )}
          </span>
        ) : (
          <span>
            ⚠ {requiredChecks.filter((c) => !c.ok).length} required item
            {requiredChecks.filter((c) => !c.ok).length !== 1 ? 's' : ''} still
            missing: {requiredChecks.filter((c) => !c.ok).map((c) => c.label).join(', ')}.
          </span>
        )}
      </div>
    </GlassCard>
  );
};

export default CourseReadinessPanel;
