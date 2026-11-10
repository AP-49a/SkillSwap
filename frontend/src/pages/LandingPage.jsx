import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, BriefcaseBusiness, Code2, Languages, Music2, Palette, Search, Sparkles } from 'lucide-react';
import CourseCard from '../components/CourseCard.jsx';
import api from '../utils/api.js';
import './LandingPage.css';

const categories = [
  { label: 'Technology', query: 'Technology', icon: Code2 },
  { label: 'Design', query: 'Design', icon: Palette },
  { label: 'Languages', query: 'Language', icon: Languages },
  { label: 'Business', query: 'Business', icon: BriefcaseBusiness },
  { label: 'Music', query: 'Music', icon: Music2 },
];

export const LandingPage = () => {
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    api.get('/courses')
      .then((result) => { if (active) setCourses((result.data || []).slice(0, 3)); })
      .catch(() => { if (active) setCourses([]); });
    return () => { active = false; };
  }, []);

  const search = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/search?query=${encodeURIComponent(value)}` : '/search');
  };

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <span className="landing-kicker">LEARN TOGETHER. SHARE WHAT YOU KNOW.</span>
          <h1>Good skills are better when they’re shared.</h1>
          <p>Meet people who can teach what you want to learn. Share your own experience and earn credits for your next class.</p>
          <div className="landing-actions">
            <Link to="/signup" className="btn btn-primary">Create your free account <ArrowRight size={16} /></Link>
            <Link to="/search" className="landing-secondary-link">Browse courses</Link>
          </div>
          <form className="landing-search" onSubmit={search} role="search">
            <Search size={18} aria-hidden="true" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What would you like to learn?" aria-label="Search courses and skills" />
            <button type="submit" aria-label="Search"><ArrowRight size={17} /></button>
          </form>
        </div>
        <div className="landing-hero-aside" aria-label="How SkillSwap works">
          <div className="hero-aside-top"><span className="hero-aside-mark"><BookOpen size={18} /></span><span>Knowledge goes both ways</span></div>
          <div className="exchange-steps">
            <div><span>01</span><p><strong>Find your person</strong><small>Choose a course or a peer instructor.</small></p></div>
            <div><span>02</span><p><strong>Learn at your pace</strong><small>Book time that works for both of you.</small></p></div>
            <div><span>03</span><p><strong>Pass it forward</strong><small>Teach something you know and earn credits.</small></p></div>
          </div>
          <div className="hero-aside-note"><Sparkles size={15} /> No cash changes hands between learners.</div>
        </div>
      </section>

      <section className="landing-category-section" aria-labelledby="browse-heading">
        <div className="landing-section-heading"><div><span className="landing-kicker">START WITH A SUBJECT</span><h2 id="browse-heading">What are you curious about?</h2></div><Link to="/search">See all subjects <ArrowRight size={15} /></Link></div>
        <div className="landing-categories">
          {categories.map(({ label, query: categoryQuery, icon: Icon }) => (
            <button key={label} type="button" onClick={() => navigate(`/search?category=${encodeURIComponent(categoryQuery)}`)}>
              <Icon size={19} /><span>{label}</span><ArrowRight className="category-arrow" size={15} />
            </button>
          ))}
        </div>
      </section>

      <section className="landing-courses-section" aria-labelledby="featured-heading">
        <div className="landing-section-heading"><div><span className="landing-kicker">FROM THE COMMUNITY</span><h2 id="featured-heading">Courses worth exploring</h2><p>Learn from people who have put their skills into practice.</p></div><Link to="/search">Browse all courses <ArrowRight size={15} /></Link></div>
        {courses.length ? <div className="landing-course-grid">{courses.map((course) => <CourseCard key={course._id} course={course} />)}</div> : <div className="landing-empty"><BookOpen size={20} /><span>New courses are being added. Browse the directory to find a peer instructor.</span><Link to="/search">Explore skills</Link></div>}
      </section>

      <section className="landing-bottom-cta">
        <div><span className="landing-kicker">A COMMUNITY BUILT ON SHARED KNOWLEDGE</span><h2>Bring one skill. Leave with another.</h2><p>Set up a profile, tell the community what you can offer, and find your next learning partner.</p></div>
        <Link to="/signup" className="btn btn-primary">Join SkillSwap <ArrowRight size={16} /></Link>
      </section>
    </div>
  );
};

export default LandingPage;
