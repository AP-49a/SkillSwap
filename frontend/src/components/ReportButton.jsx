import React, { useState } from 'react';
import { Flag } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import api from '../utils/api.js';

const categories = [
  ['inappropriate_content', 'Inappropriate content'],
  ['fake_profile', 'Fake profile'],
  ['misleading_information', 'Misleading information'],
  ['harassment', 'Harassment or misconduct'],
  ['inappropriate_review', 'Inappropriate review'],
  ['copyright', 'Copyright concern'],
  ['session_issue', 'Session issue'],
  ['other', 'Other'],
];

export const ReportButton = ({ targetType, target, label = 'Report' }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('inappropriate_content');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (!user || !target) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (details.trim().length < 10) return;
    setSubmitting(true);
    try {
      const result = await api.post('/reports', { targetType, target, category, details: details.trim() });
      showNotification('Report submitted', result.message, 'success');
      setOpen(false);
      setDetails('');
    } catch (error) {
      showNotification('Could not submit report', error.message, 'error');
    } finally { setSubmitting(false); }
  };

  return <>
    <button type="button" className="admin-action-button" onClick={() => setOpen(true)}><Flag size={14} />{label}</button>
    {open && <div className="report-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className="report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <div className="report-dialog-heading"><div><h2 id="report-title">Report this {targetType}</h2><p>Your report will be reviewed by the SkillSwap moderation team.</p></div><button type="button" aria-label="Close report form" onClick={() => setOpen(false)}>×</button></div>
        <form onSubmit={submit}>
          <label>What is the concern?<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>
          <label>Tell us what happened<textarea required minLength={10} maxLength={2000} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Add details that will help us review this report…" /></label>
          <small>{details.length}/2000 characters · Please don’t include passwords or payment details.</small>
          <div className="report-dialog-actions"><button type="button" className="admin-action-button" onClick={() => setOpen(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={submitting || details.trim().length < 10}>{submitting ? 'Submitting…' : 'Submit report'}</button></div>
        </form>
      </section>
    </div>}
  </>;
};

export default ReportButton;
