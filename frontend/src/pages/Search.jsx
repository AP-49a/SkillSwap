import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import GlassCard from '../components/GlassCard.jsx';
import Loader from '../components/Loader.jsx';
import api from '../utils/api.js';
import { Search as SearchIcon, Filter, MapPin, Globe, Star, Video, Users, CheckCircle } from 'lucide-react';

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search Inputs
  const [query, setQuery] = useState(searchParams.get('query') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [language, setLanguage] = useState(searchParams.get('language') || '');
  const [teachingMode, setTeachingMode] = useState(searchParams.get('teachingMode') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [availability, setAvailability] = useState(searchParams.get('availability') || '');

  const fetchFilteredProfiles = async () => {
    setLoading(true);
    try {
      // Build query string
      const params = {};
      if (query) params.query = query;
      if (location) params.location = location;
      if (language) params.language = language;
      if (teachingMode) params.teachingMode = teachingMode;
      if (minRating) params.minRating = minRating;
      if (availability) params.availability = availability;

      const queryString = new URLSearchParams(params).toString();
      const res = await api.get(`/profiles?${queryString}`);
      setProfiles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredProfiles();
  }, [searchParams]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (query) params.query = query;
    if (location) params.location = location;
    if (language) params.language = language;
    if (teachingMode) params.teachingMode = teachingMode;
    if (minRating) params.minRating = minRating;
    if (availability) params.availability = availability;
    setSearchParams(params);
  };

  const handleClearFilters = () => {
    setQuery('');
    setLocation('');
    setLanguage('');
    setTeachingMode('');
    setMinRating('');
    setAvailability('');
    setSearchParams({});
  };

  return (
    <div className="container" style={{ paddingTop: '20px' }}>
      <style>{`
        @media (min-width: 992px) {
          .search-page-layout {
            grid-template-columns: 240px 280px 1fr !important;
          }
        }
      `}</style>

      <div className="search-page-layout" style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '32px',
        alignItems: 'start',
      }}>
        {/* Left Nav */}
        <Sidebar />

        {/* Filters Sidebar */}
        <GlassCard style={{ padding: '20px', position: 'sticky', top: '100px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--glass-border)' }}>
            <span style={{ fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Filter size={16} /> Filters
            </span>
            <button
              onClick={handleClearFilters}
              style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
            >
              Clear all
            </button>
          </div>

          <form onSubmit={handleFilterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Search Keyword
              </label>
              <div style={{ position: 'relative' }}>
                <SearchIcon size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="React, cooking..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="glass-input"
                  style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Location
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="New York, Berlin..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="glass-input"
                  style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Language
              </label>
              <div style={{ position: 'relative' }}>
                <Globe size={14} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Spanish, German..."
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="glass-input"
                  style={{ paddingLeft: '36px', height: '38px', fontSize: '13px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Teaching Mode
              </label>
              <select
                value={teachingMode}
                onChange={(e) => setTeachingMode(e.target.value)}
                className="glass-input"
                style={{ height: '38px', fontSize: '13px', padding: '0 12px' }}
              >
                <option value="">Any Mode</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                Min Rating
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="glass-input"
                style={{ height: '38px', fontSize: '13px', padding: '0 12px' }}
              >
                <option value="">Any Rating</option>
                <option value="4.5">★ 4.5 & up</option>
                <option value="4.8">★ 4.8 & up</option>
                <option value="5.0">★ 5.0 (Perfect)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '10px 0', marginTop: '8px' }}>
              Apply Filters
            </button>
          </form>
        </GlassCard>

        {/* Results Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Exchange Mentors</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12.5px' }}>
              {loading ? 'Finding match partners...' : `Found ${profiles.length} specialists ready to swap`}
            </p>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-panel skeleton-loading" style={{ height: '220px', borderRadius: 'var(--radius-md)' }}></div>
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div style={{
              padding: '60px 24px',
              textAlign: 'center',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
            }}>
              <h3>No match partners found</h3>
              <p style={{ fontSize: '13px', marginTop: '6px' }}>Try widening your location or clearing filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {profiles.map((p) => (
                <GlassCard key={p._id} className="hover-lift" style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <img
                        src={p.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.user.username}`}
                        alt={p.user.name}
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div style={{ overflow: 'hidden' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.user.name}
                          {p.user.isVerified && <CheckCircle size={13} color="var(--accent)" fill="rgba(34,197,94,0.15)" />}
                        </h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>@{p.user.username}</span>
                      </div>
                    </div>

                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', minHeight: '36px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4' }}>
                      {p.bio}
                    </p>

                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>Skills Offered</div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {p.skillsOffered.map((s, i) => (
                          <span key={i} className="badge badge-gold" style={{ fontSize: '9px', textTransform: 'none', padding: '2px 6px' }}>
                            {s.skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--secondary)', fontWeight: 600 }}>
                      <Star size={12} fill="var(--secondary)" />
                      <span>{p.rating} ({p.totalRatingsCount})</span>
                    </div>
                    <Link to={`/u/${p.user.username}`} className="btn btn-primary btn-sm" style={{ padding: '6px 12px' }}>
                      View Swap Details
                    </Link>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;
