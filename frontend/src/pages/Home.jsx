import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Loader from '../components/Loader.jsx';
import api from '../utils/api.js';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Coins,
  GraduationCap,
  Search,
  Sparkles,
  Star,
  Video,
} from 'lucide-react';
import './Home.css';

const money = (value) => Number(value || 0).toLocaleString();

const formatSessionDate = (date) => {
  if (!date) return 'Time to be confirmed';
  return new Date(date).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const initials = (value = '') => value.slice(0, 2).toUpperCase() || 'SS';

export const Home = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [courses, setCourses] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadDashboard = async () => {
      const [dashboardResult, coursesResult, purchasesResult, walletResult] = await Promise.allSettled([
        api.get('/users/dashboard'),
        api.get('/courses'),
        api.get('/courses/purchased'),
        api.get('/wallet'),
      ]);

      if (!active) return;
      if (dashboardResult.status === 'fulfilled') setDashboard(dashboardResult.value.data);
      if (coursesResult.status === 'fulfilled') setCourses(coursesResult.value.data || []);
      if (purchasesResult.status === 'fulfilled') setPurchases(purchasesResult.value.data || []);
      if (walletResult.status === 'fulfilled') setTransactions(walletResult.value.data?.transactions || []);
      setLoading(false);
    };

    if (user) loadDashboard();
    return () => { active = false; };
  }, [user]);

  const completedSessions = (dashboard?.progress?.learned || 0) + (dashboard?.progress?.taught || 0);
  const upcomingSessions = dashboard?.upcomingSessions || [];
  const currentPurchase = purchases.find((purchase) => purchase.course) || null;
  const currentCourse = currentPurchase?.course;
  const nextSession = upcomingSessions[0];
  const nextSessionIsTeaching = String(nextSession?.instructor?._id || nextSession?.instructor) === String(user?._id);
  const sessionPartner = nextSessionIsTeaching ? nextSession?.learner : nextSession?.instructor;
  const recommendedCourses = useMemo(() => {
    const purchasedIds = new Set(purchases.map((purchase) => String(purchase.course?._id)));
    return courses.filter((course) => !purchasedIds.has(String(course._id))).slice(0, 4);
  }, [courses, purchases]);

  if (loading) return <Loader fullPage />;

  return (
    <div className="dashboard-shell">
      <Sidebar className="dashboard-sidebar" />

      <main className="dashboard-main">
        <section className="dashboard-welcome">
          <div>
            <div className="dashboard-eyebrow">
              {user?.role === 'admin' ? 'COMMUNITY ADMIN' : 'PEER LEARNER'}
              <span className="status-dot" />
              READY TO LEARN
            </div>
            <h1>Welcome back, {user?.username || 'learner'}</h1>
            <p>Pick up where you left off or exchange your skills for something new.</p>
          </div>
          <div className="welcome-actions">
            <Link className="dashboard-button dashboard-button-light" to="/bookings">
              <CalendarDays size={17} /> My schedule
            </Link>
            <Link className="dashboard-button dashboard-button-primary" to="/teacher/studio/courses/new">
              <Sparkles size={17} /> Teach a course
            </Link>
          </div>
        </section>

        <section className="dashboard-metrics" aria-label="Learning overview">
          <article className="metric-card">
            <div className="metric-topline"><span>SKILL BALANCE</span><span className="metric-icon metric-icon-green"><Coins size={18} /></span></div>
            <div className="metric-value">{money(dashboard?.credits)} <small>CR</small></div>
            <p className="metric-positive">Available to learn from peers</p>
          </article>
          <article className="metric-card">
            <div className="metric-topline"><span>SESSIONS LEARNED</span><span className="metric-icon"><GraduationCap size={18} /></span></div>
            <div className="metric-value">{money(dashboard?.progress?.learned)} <small>sessions</small></div>
            <p>Knowledge shared one session at a time</p>
          </article>
          <article className="metric-card">
            <div className="metric-topline"><span>SESSIONS TAUGHT</span><span className="metric-icon"><Video size={18} /></span></div>
            <div className="metric-value">{money(dashboard?.progress?.taught)} <small>sessions</small></div>
            <p>Every lesson helps the community grow</p>
          </article>
          <article className="metric-card">
            <div className="metric-topline"><span>UPCOMING</span><span className="metric-icon"><Clock3 size={18} /></span></div>
            <div className="metric-value">{money(upcomingSessions.length)} <small>sessions</small></div>
            <p>{completedSessions ? `${completedSessions} completed so far` : 'Your next learning moment awaits'}</p>
          </article>
        </section>

        <div className="dashboard-columns">
          <div className="dashboard-primary-column">
            <section className="learning-panel">
              <div className="learning-copy">
                <span className="state-pill"><span /> {currentCourse ? 'ENROLLED COURSE' : 'YOUR LEARNING SPACE'}</span>
                <div className="track-id">{currentCourse ? currentCourse.category || 'COURSE' : 'SKILLSWAP · LEARN TOGETHER'}</div>
                <h2>{currentCourse?.title || 'Make your next skill exchange count'}</h2>
                <p>
                  {currentCourse?.description || 'Explore a growing library of peer-led courses, or book a session with someone who knows what you want to learn.'}
                </p>
                <div className="learning-meta">
                  <span className="instructor-avatar">{initials(currentCourse?.teacher?.username || user?.username)}</span>
                  <span><strong>{currentCourse?.teacher?.username ? `@${currentCourse.teacher.username}` : `@${user?.username || 'learner'}`}</strong><small>{currentCourse ? 'Your course instructor' : 'Your learning journey starts here'}</small></span>
                  {currentCourse && <span className="enrolled-label"><CheckCircle2 size={15} /> Enrolled</span>}
                </div>
              </div>
              <div className="learning-actions">
                {currentCourse ? (
                  <Link className="dashboard-button dashboard-button-primary" to={`/courses/${currentCourse._id}/learn`}>
                    <BookOpen size={17} /> Continue learning
                  </Link>
                ) : (
                  <Link className="dashboard-button dashboard-button-primary" to="/search">
                    <Search size={17} /> Explore courses
                  </Link>
                )}
                <Link className="dashboard-button dashboard-button-muted" to={currentCourse ? `/courses/${currentCourse._id}` : '/teacher/studio'}>
                  {currentCourse ? 'View course details' : 'Share what you know'} <ArrowRight size={16} />
                </Link>
              </div>
            </section>

            <section className="recommended-section">
              <div className="section-heading">
                <div><h2>Recommended for you</h2><p>Peer-led courses to help you build your next skill.</p></div>
                <Link to="/search" className="text-link">Explore all <ArrowUpRight size={15} /></Link>
              </div>
              {recommendedCourses.length ? (
                <div className="recommended-grid">
                  {recommendedCourses.map((course) => (
                    <Link className="recommended-card" to={`/courses/${course._id}`} key={course._id}>
                      <div className="course-art">
                        {course.thumbnail ? <img src={course.thumbnail} alt="" /> : <BookOpen size={32} />}
                        <span className="course-price">{course.credits} credits</span>
                        {course.category && <span className="course-category">{course.category}</span>}
                      </div>
                      <div className="course-info">
                        <div className="course-rating"><Star size={14} fill="currentColor" /> <strong>{course.averageRating ? Number(course.averageRating).toFixed(1) : 'New'}</strong><span>{course.reviewsCount ? `· ${course.reviewsCount} reviews` : '· Be the first to review'}</span></div>
                        <h3>{course.title}</h3>
                        <p>{course.description}</p>
                        <div className="course-footer"><span className="teacher-chip">{initials(course.teacher?.username)} <span>@{course.teacher?.username || 'instructor'}</span></span><span className="course-link">View course <ArrowRight size={14} /></span></div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="empty-courses"><BookOpen size={24} /><p>No new courses to recommend right now.</p><Link to="/search">Browse all courses <ArrowRight size={14} /></Link></div>
              )}
            </section>
          </div>

          <aside className="dashboard-rail">
            <section className="rail-card next-session-card">
              <div className="rail-card-heading"><span>UP NEXT</span><span className={upcomingSessions.length ? 'live-pill' : 'quiet-pill'}>{upcomingSessions.length ? 'Scheduled' : 'Open'}</span></div>
              {upcomingSessions.length ? (
                <>
                  <h3>{nextSession.skill?.title || 'Peer learning session'}</h3>
                  <p className="rail-description">{nextSession.notes || 'Your next opportunity to learn and share.'}</p>
                  <div className="session-person"><span className="person-initials">{initials(sessionPartner?.username)}</span><span><strong>@{sessionPartner?.username || 'peer instructor'}</strong><small>{formatSessionDate(nextSession.date)}</small></span></div>
                  {nextSession.meetingLink && <a className="dashboard-button dashboard-button-primary rail-action" href={nextSession.meetingLink} target="_blank" rel="noreferrer"><Video size={16} /> Join session</a>}
                  <Link className="dashboard-button dashboard-button-muted rail-action" to="/bookings">View schedule <ArrowRight size={15} /></Link>
                </>
              ) : (
                <>
                  <h3>Your schedule is clear</h3>
                  <p className="rail-description">Find a peer instructor and set up your next skill exchange.</p>
                  <Link className="dashboard-button dashboard-button-primary rail-action" to="/search"><Search size={16} /> Find a session</Link>
                </>
              )}
            </section>

            <section className="rail-card activity-card">
              <div className="activity-heading"><h3>Wallet activity</h3><span>{dashboard?.credits != null ? `${money(dashboard.credits)} CR` : ''}</span></div>
              <p className="rail-description">Your latest credit exchanges.</p>
              {transactions.length ? (
                <ul className="activity-list">
                  {transactions.slice(0, 4).map((transaction) => (
                    <li key={transaction._id}>
                      <div><strong>{transaction.description}</strong><small>{new Date(transaction.date || transaction.createdAt).toLocaleDateString()}</small></div>
                      <span className={transaction.type === 'credit' ? 'amount-credit' : 'amount-debit'}>{transaction.type === 'credit' ? '+' : '−'}{money(transaction.amount)} CR</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="activity-empty">Your credit history will appear here as you learn and teach.</p>}
              <Link className="activity-link" to="/wallet">View wallet history <ArrowRight size={15} /></Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Home;
