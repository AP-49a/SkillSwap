import React, { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Activity, ArrowUpRight, BookOpen, CalendarDays, ChartNoAxesColumnIncreasing,
  ChevronLeft, ChevronRight, Coins, LayoutDashboard, RefreshCw, ShieldCheck,
  Trash2, Users, Star, Search, Check, X, Ban, RotateCcw, Menu, Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import Loader from '../components/Loader.jsx';
import api from '../utils/api.js';
import './AdminPanel.css';

const groups = [
  { title: 'Overview', items: [{ id: 'overview', label: 'Dashboard', icon: LayoutDashboard }, { id: 'analytics', label: 'Analytics', icon: ChartNoAxesColumnIncreasing }] },
  { title: 'Management', items: [{ id: 'members', label: 'Members', icon: Users }, { id: 'courses', label: 'Courses', icon: BookOpen }, { id: 'credits', label: 'Credits & Transactions', icon: Coins }, { id: 'sessions', label: 'Sessions', icon: CalendarDays }] },
  { title: 'Moderation', items: [{ id: 'reports', label: 'Reports & Complaints', icon: ShieldCheck }, { id: 'reviews', label: 'Reviews & Ratings', icon: Star }] },
  { title: 'System', items: [{ id: 'logs', label: 'Activity Logs', icon: Activity }, { id: 'settings', label: 'Settings', icon: Settings }] },
];
const dateLabel = (value, time = false) => value ? new Date(value).toLocaleString(undefined, time ? { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' } : { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const queryString = (values) => { const params = new URLSearchParams(); Object.entries(values).forEach(([key, value]) => { if (value !== '' && value != null) params.set(key, value); }); return params.toString(); };

export const AdminPanel = () => {
  const { user, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const [section, setSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [records, setRecords] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [platformSettings, setPlatformSettings] = useState({ signupCredits: 10, updatedAt: null });
  const [settingsDraft, setSettingsDraft] = useState('10');
  const [summary, setSummary] = useState(null);
  const [memberOptions, setMemberOptions] = useState([]);
  const [adminOptions, setAdminOptions] = useState([]);
  const [courseFilters, setCourseFilters] = useState({ categories: [], instructors: [] });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [txnType, setTxnType] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseInstructor, setCourseInstructor] = useState('');
  const [adminFilter, setAdminFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [adjustForm, setAdjustForm] = useState({ userId: '', amount: '', reason: '' });

  const loadSection = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    setError('');
    try {
      let result;
      if (section === 'overview') {
        result = await api.get('/admin/dashboard');
        setDashboard(result.data);
      } else if (section === 'analytics') {
        result = await api.get('/admin/analytics?months=12');
        setAnalytics(result.data);
      } else if (section === 'settings') {
        result = await api.get('/admin/settings');
        setPlatformSettings(result.data);
        setSettingsDraft(String(result.data.signupCredits));
      } else {
        const query = { page, limit: 12 };
        if (['members', 'courses', 'credits', 'sessions', 'reviews', 'logs'].includes(section)) query.search = search.trim();
        if (section === 'members') { query.role = roleFilter; query.status = statusFilter; }
        if (section === 'courses') { query.status = statusFilter; query.category = courseCategory; query.instructor = courseInstructor; }
        if (section === 'credits') query.type = txnType;
        if (section === 'sessions') query.status = statusFilter;
        if (section === 'reports') query.status = statusFilter;
        if (section === 'reviews') query.rating = ratingFilter;
        if (section === 'logs') query.admin = adminFilter;
        if (['credits', 'sessions', 'logs'].includes(section)) { query.from = dateFrom; query.to = dateTo; }
        const endpoint = { members: 'users', courses: 'courses', credits: 'transactions', sessions: 'bookings', reports: 'reports', reviews: 'reviews', logs: 'activity-logs' }[section];
        result = await api.get(`/admin/${endpoint}?${queryString(query)}`);
        setRecords(result.data || []);
        setPagination(result.pagination || { page: 1, pages: 1, total: (result.data || []).length });
        setSummary(result.summary || null);
        if (section === 'courses') setCourseFilters(result.filters || { categories: [], instructors: [] });
        if (section === 'credits') {
          const memberResult = await api.get('/admin/users?limit=100');
          setMemberOptions(memberResult.data || []);
        }
        if (section === 'logs') {
          const adminResult = await api.get('/admin/users?role=admin&limit=100');
          setAdminOptions(adminResult.data || []);
        }
      }
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'We couldn’t load this section. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user, section, page, search, roleFilter, statusFilter, ratingFilter, txnType, courseCategory, courseInstructor, adminFilter, dateFrom, dateTo]);

  useEffect(() => { loadSection(); }, [loadSection]);
  useEffect(() => { setPage(1); setSearch(''); setRoleFilter(''); setStatusFilter(''); setRatingFilter(''); setTxnType(''); setCourseCategory(''); setCourseInstructor(''); setAdminFilter(''); setDateFrom(''); setDateTo(''); }, [section]);

  const changeSection = (id) => { setSection(id); setPage(1); };
  const handleMemberStatus = async (member, status) => {
    const reason = status === 'suspended' ? window.prompt(`Why are you suspending @${member.username}?`) : '';
    if (status === 'suspended' && (!reason || reason.trim().length < 3)) return;
    setBusyId(member._id);
    try {
      await api.patch(`/admin/users/${member._id}/status`, { status, reason });
      showNotification(status === 'suspended' ? 'Account suspended' : 'Account restored', `@${member.username} has been ${status}.`, 'success');
      await loadSection();
    } catch (err) { showNotification('Could not update account', err.message, 'error'); }
    finally { setBusyId(''); }
  };

  const handleDeleteUser = async (member) => {
    if (!window.confirm(`Permanently delete @${member.username} and their associated courses, sessions, messages, wallet, and account data? This cannot be undone.`)) return;
    setBusyId(member._id);
    try {
      const result = await api.delete(`/admin/users/${member._id}`);
      showNotification('Member deleted', result.message, 'success');
      await loadSection();
    } catch (err) { showNotification('Could not delete member', err.message, 'error'); }
    finally { setBusyId(''); }
  };

  const updateCourse = async (course, status) => {
    let reason = '';
    if (status === 'rejected') {
      reason = window.prompt(`Add a reason for rejecting “${course.title}” (shown to the instructor):`) || '';
      if (reason.trim().length < 3) return;
    } else if (!window.confirm(`${status === 'published' ? 'Approve and publish' : 'Unpublish'} “${course.title}”?`)) return;
    setBusyId(course._id);
    try {
      const result = await api.patch(`/admin/courses/${course._id}/status`, { status, reason });
      showNotification('Course updated', result.message, 'success');
      await loadSection();
    } catch (err) { showNotification('Could not update course', err.message, 'error'); }
    finally { setBusyId(''); }
  };

  const deleteReview = async (review) => {
    if (!window.confirm('Remove this review? The course rating will be recalculated.')) return;
    setBusyId(review._id);
    try {
      const result = await api.delete(`/admin/reviews/${review._id}`);
      showNotification('Review removed', result.message, 'success');
      await loadSection();
    } catch (err) { showNotification('Could not remove review', err.message, 'error'); }
    finally { setBusyId(''); }
  };

  const handleReportUpdate = async (report, status) => {
    const suppliedNotes = window.prompt('Add investigation notes (optional):', report.investigationNotes || '');
    if (suppliedNotes === null) return;
    const investigationNotes = suppliedNotes.trim();
    const resolution = ['resolved', 'dismissed'].includes(status)
      ? window.prompt(status === 'resolved' ? 'How was this report resolved?' : 'Why is this report being dismissed?') || ''
      : report.resolution || '';
    if (['resolved', 'dismissed'].includes(status) && resolution.trim().length < 3) return;
    setBusyId(report._id);
    try {
      const result = await api.patch(`/admin/reports/${report._id}`, { status, investigationNotes, resolution });
      showNotification('Report updated', result.message, 'success');
      await loadSection();
    } catch (err) { showNotification('Could not update report', err.message, 'error'); }
    finally { setBusyId(''); }
  };

  const adjustCredits = async (event) => {
    event.preventDefault();
    const amount = Number(adjustForm.amount);
    if (!adjustForm.userId || !Number.isInteger(amount) || amount === 0 || !adjustForm.reason.trim()) return;
    if (!window.confirm(`${amount > 0 ? 'Add' : 'Deduct'} ${Math.abs(amount)} credits? This will be written to the transaction history.`)) return;
    try {
      const result = await api.post('/admin/credits/adjust', { ...adjustForm, amount });
      showNotification('Credit adjustment recorded', result.message, 'success');
      setAdjustForm({ userId: '', amount: '', reason: '' });
      await loadSection();
    } catch (err) { showNotification('Adjustment failed', err.message, 'error'); }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    const signupCredits = Number(settingsDraft);
    if (!Number.isInteger(signupCredits) || signupCredits < 0 || signupCredits > 1000) return;
    if (!window.confirm(`Set the default signup credit grant to ${signupCredits} for new accounts? Existing wallets will not change.`)) return;
    try {
      const result = await api.patch('/admin/settings', { signupCredits });
      setPlatformSettings(result.data);
      showNotification('Settings saved', result.message, 'success');
    } catch (err) { showNotification('Could not save setting', err.message, 'error'); }
  };

  const paginationControls = pagination.pages > 1 && <div className="admin-pagination"><span>Page {pagination.page} of {pagination.pages} · {pagination.total} records</span><div><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button><button type="button" disabled={page >= pagination.pages || loading} onClick={() => setPage((value) => value + 1)} aria-label="Next page"><ChevronRight size={16} /></button></div></div>;
  const searchControl = ['members', 'courses', 'credits', 'sessions', 'reviews', 'logs'].includes(section) && <label className="admin-search"><Search size={16} /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={{ members: 'Search name, email or ID', courses: 'Search courses', credits: 'Search user, reference or transaction', sessions: 'Search course or member', reviews: 'Search review text', logs: 'Search action or description' }[section]} /></label>;
  const dateControls = ['credits', 'sessions', 'logs'].includes(section) && <><label className="admin-date-filter">From<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><label className="admin-date-filter">To<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label></>;
  const filterSelect = (value, onChange, options, label) => <select aria-label={label} className="admin-filter" value={value} onChange={(event) => { onChange(event.target.value); setPage(1); }}>{options.map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select>;

  if (authLoading) return <Loader fullPage />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const metrics = dashboard?.metrics;
  const statCards = section === 'credits' ? [
    ['Credits held by members', summary?.creditsHeld ?? '—', Coins], ['Credits earned', summary?.creditsEarned ?? '—', Check], ['Credits spent', summary?.creditsSpent ?? '—', Activity], ['Recorded transactions', summary?.transactionCount ?? '—', Activity], ['Signup credits distributed', summary?.signupCreditsDistributed ?? '—', Users],
  ] : [
    ['Members', metrics?.totalUsers ?? '—', Users], ['Teachers', metrics?.teachers ?? '—', BookOpen], ['Students with course unlocks', metrics?.students ?? '—', Users], ['Published courses', metrics?.publishedCourses ?? '—', BookOpen], ['Awaiting course review', metrics?.pendingCourses ?? '—', ShieldCheck], ['Course unlocks', metrics?.courseUnlocks ?? '—', Activity], ['Credit transactions', metrics?.creditTransactions ?? '—', Coins], ['Completed sessions', metrics?.completedSessions ?? '—', CalendarDays], ['Pending reports', metrics?.pendingReports ?? '—', ShieldCheck], ['Credits in circulation', metrics?.creditsInCirculation ?? '—', Coins],
  ];

  return <div className="admin-page">
    <header className="admin-heading"><div><span className="admin-eyebrow"><ShieldCheck size={14} /> SKILLSWAP ADMIN</span><h1>Good to see you, {user.name?.split(' ')[0] || user.username || 'Admin'}.</h1><p>Manage the SkillSwap community and keep learning moving forward.</p></div><div className="admin-heading-actions"><small>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</small><button className="admin-refresh" type="button" onClick={loadSection} disabled={loading}><RefreshCw size={15} className={loading ? 'admin-spinning' : ''} /> Refresh</button></div></header>
    <div className={`admin-layout ${sidebarCollapsed ? 'is-collapsed' : ''}`}>
      <aside className="admin-menu" aria-label="Admin sections"><button className="admin-collapse-button" type="button" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'} title={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}><Menu size={18} /></button>{groups.map((group) => <div className="admin-nav-group" key={group.title}><span className="admin-menu-title">{group.title}</span>{group.items.map(({ id, label, icon: Icon }) => <button key={id} type="button" title={sidebarCollapsed ? label : undefined} aria-label={label} className={`admin-menu-item ${section === id ? 'is-active' : ''}`} onClick={() => changeSection(id)}><Icon size={16} /><span>{label}</span></button>)}</div>)}<div className="admin-menu-note"><ShieldCheck size={16} /><span>Administrator access and changes are recorded.</span></div></aside>
      <main className="admin-main">
        {error && <div className="admin-error" role="alert">{error}<button type="button" onClick={loadSection}>Try again</button></div>}

        {section === 'overview' && <>
          <div className="admin-section-title"><div><h2>Platform overview</h2><p>Live totals from the existing SkillSwap records.</p></div></div>
          <div className="admin-metrics">{statCards.map(([label, value, Icon]) => <article className="admin-metric" key={label}><div className="admin-metric-icon"><Icon size={19} /></div><span>{label}</span><strong>{loading ? '…' : Number(value).toLocaleString()}</strong></article>)}</div>
          <div className="admin-overview-grid"><section className="admin-card"><div className="admin-card-heading"><div><h3>Recent registrations</h3><p>Newest member accounts.</p></div><Users size={18} /></div>{dashboard?.recentUsers?.length ? <div className="admin-simple-list">{dashboard.recentUsers.map((member) => <div key={member._id}><div><Link className="admin-member-link" to={`/u/${member.username}`}>@{member.username}</Link><small>{member.email}</small></div><time>{dateLabel(member.createdAt)}</time></div>)}</div> : <div className="admin-empty">{loading ? 'Loading recent registrations…' : 'No member registrations yet.'}</div>}</section>
            <section className="admin-card"><div className="admin-card-heading"><div><h3>Most unlocked courses</h3><p>Based on recorded course purchases.</p></div><BookOpen size={18} /></div>{dashboard?.popularCourses?.length ? <div className="admin-simple-list">{dashboard.popularCourses.map((course) => <div key={course._id}><div><strong>{course.title}</strong><small>{Number(course.rating || 0).toFixed(1)} ★ rating</small></div><b>{course.unlocks} unlocks</b></div>)}</div> : <div className="admin-empty">{loading ? 'Loading course activity…' : 'No course unlocks recorded yet.'}</div>}</section></div>
          <section className="admin-card"><div className="admin-card-heading"><div><h3>Session activity</h3><p>Current status across peer sessions.</p></div><CalendarDays size={18} /></div><div className="admin-session-stats"><div><span className="admin-dot upcoming" />Upcoming<strong>{loading ? '…' : dashboard?.sessions?.upcoming ?? 0}</strong></div><div><span className="admin-dot completed" />Completed<strong>{loading ? '…' : dashboard?.sessions?.completed ?? 0}</strong></div><div><span className="admin-dot cancelled" />Cancelled<strong>{loading ? '…' : dashboard?.sessions?.cancelled ?? 0}</strong></div></div></section>
          <section className="admin-card"><div className="admin-card-heading"><div><h3>Recent admin activity</h3><p>Actions recorded by administrators.</p></div><Activity size={18} /></div>{dashboard?.recentActivity?.length ? <div className="admin-simple-list">{dashboard.recentActivity.map((log) => <div key={log._id}><div><strong>{log.description}</strong><small>{log.admin?.username || 'Admin'} · {log.action}</small></div><time>{dateLabel(log.createdAt, true)}</time></div>)}</div> : <div className="admin-empty">{loading ? 'Loading admin activity…' : 'No administrator actions recorded yet.'}</div>}</section>
        </>}

        {section === 'analytics' && <><div className="admin-section-title"><div><h2>Platform analytics</h2><p>Monthly trends calculated from stored account activity.</p></div></div>{loading ? <div className="admin-loading">Gathering platform trends…</div> : <><div className="admin-overview-grid">{[['Registrations', analytics?.registrations], ['Course creations', analytics?.courseCreations], ['Course unlocks', analytics?.unlocks], ['Completed sessions', analytics?.sessions]].map(([title, points]) => <section className="admin-card" key={title}><h3>{title}</h3><div className="admin-bar-chart">{(points || []).length ? points.map((point) => <div key={point._id} title={`${point._id}: ${point.count}`}><span style={{ height: `${Math.max(5, (point.count / Math.max(...points.map((entry) => entry.count))) * 100)}%` }} /><small>{point._id.slice(5)}</small></div>) : <p>No activity recorded for this period.</p>}</div></section>)}</div><section className="admin-card"><h3>Credit transaction activity</h3><p className="admin-muted-copy">Recorded transactions and total credits moved by month.</p><div className="admin-bar-chart">{(analytics?.creditActivity || []).length ? analytics.creditActivity.map((point) => <div key={point._id} title={`${point._id}: ${point.transactions} transactions · ${point.credits} credits`}><span style={{ height: `${Math.max(5, (point.transactions / Math.max(...analytics.creditActivity.map((entry) => entry.transactions))) * 100)}%` }} /><small>{point._id.slice(5)}</small></div>) : <p>No credit activity recorded for this period.</p>}</div></section><section className="admin-card"><div className="admin-card-heading"><div><h3>Popular subjects</h3><p>Courses grouped by their saved category.</p></div></div>{analytics?.subjects?.length ? <div className="admin-category-list">{analytics.subjects.map((item) => <div key={item._id}><span>{item._id}</span><strong>{item.courses} courses · {Number(item.averageRating || 0).toFixed(1)} ★</strong></div>)}</div> : <div className="admin-empty">No course categories are available.</div>}</section><section className="admin-card"><div className="admin-card-heading"><div><h3>Teacher performance</h3><p>Course ratings and course counts.</p></div></div>{analytics?.topTeachers?.length ? <div className="admin-simple-list">{analytics.topTeachers.map((teacher) => <div key={teacher._id}><div><strong>@{teacher.username}</strong><small>{teacher.email}</small></div><b>{Number(teacher.averageRating || 0).toFixed(1)} ★ · {teacher.courses} courses</b></div>)}</div> : <div className="admin-empty">No teacher course data available.</div>}</section></>}</>}

        {section === 'members' && <section className="admin-card admin-table-card"><div className="admin-section-title"><div><h2>Members</h2><p>Search, review, suspend, restore, or remove accounts.</p></div><span className="admin-count">{pagination.total ?? 0} total</span></div><div className="admin-toolbar">{searchControl}{filterSelect(roleFilter, setRoleFilter, [['','All roles'],['user','Member'],['admin','Admin']], 'Filter members by role')}{filterSelect(statusFilter, setStatusFilter, [['','All statuses'],['active','Active'],['suspended','Suspended']], 'Filter members by status')}</div>{loading ? <div className="admin-loading">Loading members…</div> : records.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Member</th><th>Email</th><th>Role</th><th>Credits</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>{records.map((member) => { const self = String(user._id) === String(member._id); return <tr key={member._id}><td><div className="admin-user-cell">{member.profile?.avatar ? <img src={member.profile.avatar} alt="" /> : <span>{member.username?.[0]?.toUpperCase() || '?'}</span>}<Link className="admin-member-link" to={`/u/${member.username}`}>@{member.username}</Link></div></td><td>{member.email}</td><td><span className="admin-tag">{member.role}</span></td><td>{Number(member.credits || 0).toLocaleString()}</td><td><span className={`admin-tag ${member.accountStatus === 'suspended' ? 'status-cancelled' : 'status-completed'}`}>{member.accountStatus || 'active'}</span></td><td>{dateLabel(member.createdAt)}</td><td><div className="admin-row-actions"><button disabled={self || busyId === member._id || member.role === 'admin'} title={self ? 'Cannot suspend your current account' : member.role === 'admin' ? 'Admin accounts are protected' : ''} className="admin-action-button" type="button" onClick={() => handleMemberStatus(member, member.accountStatus === 'suspended' ? 'active' : 'suspended')}>{member.accountStatus === 'suspended' ? <RotateCcw size={14} /> : <Ban size={14} />}{member.accountStatus === 'suspended' ? 'Restore' : 'Suspend'}</button><button disabled={self || busyId === member._id} className="admin-delete-button" type="button" onClick={() => handleDeleteUser(member)}><Trash2 size={14} />Delete</button></div></td></tr>; })}</tbody></table></div> : <div className="admin-empty">No members match those filters.</div>}{paginationControls}</section>}

        {section === 'courses' && <section className="admin-card admin-table-card"><div className="admin-section-title"><div><h2>Courses</h2><p>Review submitted courses and manage published listings.</p></div><span className="admin-count">{pagination.total ?? 0} total</span></div><div className="admin-toolbar">{searchControl}{filterSelect(statusFilter, setStatusFilter, [['','All statuses'],['draft','Draft'],['pending','Pending review'],['published','Published'],['rejected','Rejected'],['unpublished','Unpublished']], 'Filter courses by status')}{filterSelect(courseCategory, setCourseCategory, [['','All subjects'], ...courseFilters.categories.map((category) => [category, category])], 'Filter courses by subject')}{filterSelect(courseInstructor, setCourseInstructor, [['','All instructors'], ...courseFilters.instructors.map((instructor) => [instructor._id, `@${instructor.username}`])], 'Filter courses by instructor')}</div>{loading ? <div className="admin-loading">Loading courses…</div> : records.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Course</th><th>Instructor</th><th>Credits</th><th>Unlocks</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead><tbody>{records.map((course) => <tr key={course._id}><td><div className="admin-course-cell">{course.thumbnail && <img src={course.thumbnail} alt="" />}<div><strong>{course.title}</strong><small>{course.category}</small></div></div></td><td>{course.teacher?.username || '—'}</td><td>{course.credits}</td><td>{course.unlocks}</td><td>{Number(course.rating || 0).toFixed(1)} ★ ({course.reviewCount || 0})</td><td><span className={`admin-tag status-${course.status}`}>{course.status === 'pending' ? 'Pending review' : course.status}</span></td><td><div className="admin-row-actions">{course.status === 'pending' && <><button disabled={busyId === course._id} className="admin-action-button success" type="button" onClick={() => updateCourse(course,'published')}><Check size={14} />Approve</button><button disabled={busyId === course._id} className="admin-delete-button" type="button" onClick={() => updateCourse(course,'rejected')}><X size={14} />Reject</button></>}{course.status === 'published' && <button disabled={busyId === course._id} className="admin-action-button" type="button" onClick={() => updateCourse(course,'unpublished')}>Unpublish</button>}</div></td></tr>)}</tbody></table></div> : <div className="admin-empty">No courses match those filters.</div>}{paginationControls}</section>}

        {section === 'credits' && <><div className="admin-section-title"><div><h2>Credits & transactions</h2><p>Wallet history is preserved with every adjustment.</p></div></div><div className="admin-metrics admin-credit-metrics">{statCards.map(([label,value,Icon]) => <article className="admin-metric" key={label}><div className="admin-metric-icon"><Icon size={18}/></div><span>{label}</span><strong>{loading ? '…' : Number(value).toLocaleString()}</strong></article>)}</div><section className="admin-card"><div className="admin-card-heading"><div><h3>Manual credit adjustment</h3><p>Use a positive number to add credits or a negative number to deduct them. Every change records its reason and before and after balances.</p></div></div><form className="admin-adjust-form" onSubmit={adjustCredits}><label>Member<select required value={adjustForm.userId} onChange={(e) => setAdjustForm((f) => ({...f,userId:e.target.value}))}><option value="">Select a member</option>{memberOptions.map((item) => <option key={item._id} value={item._id}>{item.username} · {item.email}</option>)}</select></label><label>Credits (+/-)<input type="number" step="1" required value={adjustForm.amount} onChange={(e) => setAdjustForm((f) => ({...f,amount:e.target.value}))} placeholder="e.g. 25 or -10" /></label><label>Reason<input required minLength="3" maxLength="500" value={adjustForm.reason} onChange={(e) => setAdjustForm((f) => ({...f,reason:e.target.value}))} placeholder="Why is this adjustment needed?" /></label><button type="submit" className="btn btn-primary">Record adjustment</button></form></section><section className="admin-card admin-table-card"><div className="admin-section-title"><div><h2>Transaction history</h2><p>Immutable wallet transaction records.</p></div><span className="admin-count">{pagination.total ?? 0} entries</span></div><div className="admin-toolbar">{searchControl}{filterSelect(txnType,setTxnType,[['','All types'],['credit','Credits in'],['debit','Credits out']],'Filter by transaction type')}{dateControls}</div>{loading ? <div className="admin-loading">Loading transactions…</div> : records.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Reference</th><th>Member</th><th>Type</th><th>Credits</th><th>Balance after</th><th>Reason</th><th>Date</th></tr></thead><tbody>{records.map((txn) => <tr key={txn._id}><td>{txn.reference || txn._id}</td><td>{txn.user?.username || '—'}</td><td><span className={`admin-tag ${txn.type === 'credit' ? 'status-completed' : ''}`}>{txn.type}</span></td><td>{txn.type === 'debit' ? '−' : '+'}{txn.amount}</td><td>{txn.newBalance ?? '—'}</td><td>{txn.reason || txn.description}</td><td>{dateLabel(txn.date,true)}</td></tr>)}</tbody></table></div> : <div className="admin-empty">No transactions match those filters.</div>}{paginationControls}</section></>}

        {section === 'sessions' && <section className="admin-card admin-table-card"><div className="admin-section-title"><div><h2>Sessions</h2><p>Review peer learning bookings, dates, and status.</p></div><span className="admin-count">Latest 500</span></div><div className="admin-toolbar">{searchControl}{filterSelect(statusFilter,setStatusFilter,[['','All statuses'],['upcoming','Upcoming'],['completed','Completed'],['cancelled','Cancelled']],'Filter sessions by status')}{dateControls}</div>{loading ? <div className="admin-loading">Loading sessions…</div> : records.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Session</th><th>Course</th><th>Instructor</th><th>Learner</th><th>Scheduled</th><th>Credits</th><th>Status</th></tr></thead><tbody>{records.map((item) => <tr key={item._id}><td>{item._id.slice(-8)}</td><td>{item.skill?.title || 'Course unavailable'}</td><td>{item.instructor?.username || '—'}</td><td>{item.learner?.username || '—'}</td><td>{dateLabel(item.date)} · {item.timeSlot}</td><td>{item.credits}</td><td><span className={`admin-tag status-${item.status}`}>{item.status}</span></td></tr>)}</tbody></table></div> : <div className="admin-empty">No sessions match those filters.</div>}</section>}

        {section === 'reports' && <section className="admin-card admin-table-card"><div className="admin-section-title"><div><h2>Reports & complaints</h2><p>Review member reports, record findings, and close each case with a reason.</p></div><span className="admin-count">{pagination.total ?? 0} reports</span></div><div className="admin-toolbar">{filterSelect(statusFilter,setStatusFilter,[['','All statuses'],['pending','Pending'],['under_review','Under review'],['resolved','Resolved'],['dismissed','Dismissed']],'Filter reports by status')}</div>{loading ? <div className="admin-loading">Loading reports…</div> : records.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Submitted</th><th>Reporter</th><th>Reported item</th><th>Category</th><th>Details</th><th>Status</th><th>Actions</th></tr></thead><tbody>{records.map((report) => { const target = report.targetType === 'course' ? report.target?.title : report.targetType === 'user' ? `@${report.target?.username || 'deleted member'}` : report.targetType === 'session' ? report.target?.skill?.title || 'Session' : report.target?.course?.title || report.target?.skill?.title || 'Review'; return <tr key={report._id}><td>{dateLabel(report.createdAt,true)}</td><td>{report.reporter?.username || '—'}</td><td><strong>{target || 'Content unavailable'}</strong><small>{report.targetType}</small></td><td>{report.category.replaceAll('_',' ')}</td><td className="admin-review-text">{report.details}</td><td><span className={`admin-tag status-${report.status}`}>{report.status.replaceAll('_',' ')}</span></td><td><div className="admin-row-actions">{report.status === 'pending' && <button className="admin-action-button" disabled={busyId === report._id} type="button" onClick={() => handleReportUpdate(report,'under_review')}>Review</button>}{['pending','under_review'].includes(report.status) && <><button className="admin-action-button success" disabled={busyId === report._id} type="button" onClick={() => handleReportUpdate(report,'resolved')}><Check size={14}/>Resolve</button><button className="admin-delete-button" disabled={busyId === report._id} type="button" onClick={() => handleReportUpdate(report,'dismissed')}><X size={14}/>Dismiss</button></>}</div>{report.resolution && <small>{report.resolution}</small>}</td></tr>; })}</tbody></table></div> : <div className="admin-empty">No reports match those filters.</div>}{paginationControls}</section>}

        {section === 'reviews' && <section className="admin-card admin-table-card"><div className="admin-section-title"><div><h2>Reviews & ratings</h2><p>Course and skill reviews; ratings recalculate from remaining feedback.</p></div></div><div className="admin-toolbar">{searchControl}{filterSelect(ratingFilter,setRatingFilter,[['','All ratings'],['5','5 stars'],['4','4 stars'],['3','3 stars'],['2','2 stars'],['1','1 star']],'Filter reviews by rating')}</div>{loading ? <div className="admin-loading">Loading reviews…</div> : records.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Reviewer</th><th>Course / Skill</th><th>Instructor</th><th>Rating</th><th>Review</th><th>Submitted</th><th>Action</th></tr></thead><tbody>{records.map((review) => <tr key={review._id}><td>{review.student?.username || '—'}</td><td>{review.course?.title || 'Course removed'}<small>{review.source === 'skill' ? 'Skill listing' : 'Course'}</small></td><td>{review.teacher?.username || '—'}</td><td>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</td><td className="admin-review-text">{review.comment}</td><td>{dateLabel(review.createdAt)}</td><td><button className="admin-delete-button" type="button" disabled={busyId === review._id} onClick={() => deleteReview(review)}><Trash2 size={14}/>Remove</button></td></tr>)}</tbody></table></div> : <div className="admin-empty">No reviews match those filters.</div>}</section>}

        {section === 'settings' && <section className="admin-card"><div className="admin-section-title"><div><h2>Platform settings</h2><p>Manage platform defaults used by core account flows.</p></div></div>{loading ? <div className="admin-loading">Loading settings…</div> : <form className="admin-settings-form" onSubmit={saveSettings}><label htmlFor="signup-credit-setting">New account signup credits</label><p>Credits granted to each newly registered account. This change applies to new wallets only; existing member balances stay the same.</p><div className="admin-settings-row"><input id="signup-credit-setting" type="number" min="0" max="1000" step="1" required value={settingsDraft} onChange={(event) => setSettingsDraft(event.target.value)} /><span>credits</span><button type="submit" className="btn btn-primary">Save setting</button></div><small>Current saved value: {platformSettings.signupCredits} credits{platformSettings.updatedAt ? ` · Updated ${dateLabel(platformSettings.updatedAt,true)}` : ' · Default value'}</small></form>}</section>}

        {section === 'logs' && <section className="admin-card admin-table-card"><div className="admin-section-title"><div><h2>Administrative activity</h2><p>Append-only record of changes made through admin controls.</p></div><span className="admin-count">{pagination.total ?? 0} logs</span></div><div className="admin-toolbar">{searchControl}{filterSelect(adminFilter, setAdminFilter, [['','All administrators'], ...adminOptions.map((admin) => [admin._id, admin.username])], 'Filter by administrator')}{dateControls}</div>{loading ? <div className="admin-loading">Loading activity logs…</div> : records.length ? <div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Date</th><th>Administrator</th><th>Action</th><th>Resource</th><th>Description</th><th>Reference</th></tr></thead><tbody>{records.map((log) => <tr key={log._id}><td>{dateLabel(log.createdAt,true)}</td><td>{log.admin?.username || '—'}</td><td><span className="admin-tag">{log.action}</span></td><td>{log.resourceType}</td><td>{log.description}</td><td>{log.resourceId || '—'}</td></tr>)}</tbody></table></div> : <div className="admin-empty">No administrative actions recorded yet.</div>}{paginationControls}</section>}

        {section !== 'overview' && section !== 'analytics' && section !== 'credits' && <div className="admin-footnote"><ArrowUpRight size={14} /> Admin information is available only to authorized SkillSwap administrators.</div>}
      </main>
    </div>
  </div>;
};

export default AdminPanel;
