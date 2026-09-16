import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import GlassCard from '../components/GlassCard.jsx';
import CourseCard from '../components/CourseCard.jsx';
import api from '../utils/api.js';
import { Search as SearchIcon, BookOpen, AlertCircle } from 'lucide-react';

const POPULAR_CATEGORIES = [
  'All Categories',
  'Programming',
  'AI & Machine Learning',
  'Design & UI/UX',
  'Business & Marketing',
  'Languages',
  'Music & Audio',
  'Photography & Video',
];

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Category states
  const initialSearch = searchParams.get('search') || searchParams.get('query') || '';
  const initialCategory = searchParams.get('category') || '';

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [categoryInput, setCategoryInput] = useState(initialCategory);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const currentSearch = searchParams.get('search') || searchParams.get('query');
      const currentCategory = searchParams.get('category');

      if (currentSearch && currentSearch.trim()) {
        params.append('search', currentSearch.trim());
      }
      if (currentCategory && currentCategory !== 'All Categories') {
        params.append('category', currentCategory.trim());
      }

      const queryString = params.toString();
      const endpoint = queryString ? `/courses?${queryString}` : '/courses';

      const res = await api.get(endpoint);
      if (res && res.success && Array.isArray(res.data)) {
        setCourses(res.data);
      } else if (Array.isArray(res)) {
        setCourses(res);
      } else {
        setCourses([]);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError(err.message || 'Unable to load courses. Please try again.');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [searchParams]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = {};
    if (searchInput.trim()) {
      newParams.search = searchInput.trim();
    }
    if (categoryInput && categoryInput !== 'All Categories') {
      newParams.category = categoryInput;
    }
    setSearchParams(newParams);
  };

  const handleCategorySelect = (selectedCat) => {
    const catValue = selectedCat === 'All Categories' ? '' : selectedCat;
    setCategoryInput(selectedCat);
    const newParams = {};
    if (searchInput.trim()) {
      newParams.search = searchInput.trim();
    }
    if (catValue) {
      newParams.category = catValue;
    }
    setSearchParams(newParams);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setCategoryInput('All Categories');
    setSearchParams({});
  };

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <style>{`
        @media (min-width: 992px) {
          .courses-page-layout {
            grid-template-columns: 240px 1fr !important;
          }
        }
      `}</style>

      <div
        className="courses-page-layout"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '32px',
          alignItems: 'start',
        }}
      >
        {/* Left Nav */}
        <Sidebar />

        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header */}
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Explore Courses
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px' }}>
              Learn directly from peer experts, watch private lessons, and get 1-on-1 doubt sessions.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <GlassCard style={{ padding: '16px 20px' }}>
            <form
              onSubmit={handleSearchSubmit}
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              {/* Search text input */}
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <SearchIcon
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '12px',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Search by course title or keywords..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="glass-input"
                  style={{
                    paddingLeft: '40px',
                    height: '40px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
              </div>

              {/* Category dropdown */}
              <div style={{ flex: '0 1 200px' }}>
                <select
                  value={categoryInput || 'All Categories'}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                  className="glass-input"
                  style={{
                    height: '40px',
                    fontSize: '13px',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0 12px',
                  }}
                >
                  {POPULAR_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="btn btn-secondary"
                style={{
                  height: '40px',
                  padding: '0 20px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                Search
              </button>

              {(searchParams.get('search') || searchParams.get('category')) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="btn btn-outline"
                  style={{
                    height: '40px',
                    fontSize: '12px',
                    padding: '0 14px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  Clear Filters
                </button>
              )}
            </form>
          </GlassCard>

          {/* Course Grid / States */}
          {loading ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="glass-panel skeleton-loading"
                  style={{
                    height: '300px',
                    borderRadius: 'var(--radius-md)',
                  }}
                ></div>
              ))}
            </div>
          ) : error ? (
            <GlassCard
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <AlertCircle size={36} color="var(--danger)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Failed to Load Courses</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '400px' }}>
                {error}
              </p>
              <button
                onClick={fetchCourses}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '8px' }}
              >
                Try Again
              </button>
            </GlassCard>
          ) : courses.length === 0 ? (
            <GlassCard
              style={{
                padding: '60px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <BookOpen size={42} color="var(--secondary)" />
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>No Courses Found</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px' }}>
                We couldn't find any published courses matching your criteria. Try adjusting your
                search keywords or exploring other categories.
              </p>
              {(searchParams.get('search') || searchParams.get('category')) && (
                <button
                  onClick={handleClearFilters}
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '8px' }}
                >
                  Clear All Filters
                </button>
              )}
            </GlassCard>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
              }}
            >
              {courses.map((course) => (
                <CourseCard key={course._id || course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
