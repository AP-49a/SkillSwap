import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GlassCard from '../components/GlassCard.jsx';
import { ChevronRight, ChevronLeft, Plus, X, Globe, Compass } from 'lucide-react';

export const ProfileSetup = () => {
  const { user, updateProfileData } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Visuals & Bio
  const [avatar, setAvatar] = useState(user?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user?.username || 'user'}`);
  const [coverImage, setCoverImage] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80');
  const [bio, setBio] = useState('');
  const [about, setAbout] = useState('');

  // Step 2: Skills & Mode
  const [skillsOffered, setSkillsOffered] = useState([]);
  const [offeredInput, setOfferedInput] = useState('');
  const [offeredLevel, setOfferedLevel] = useState('Intermediate');

  const [skillsWanted, setSkillsWanted] = useState([]);
  const [wantedInput, setWantedInput] = useState('');
  const [wantedPriority, setWantedPriority] = useState('Medium');

  const [preferredLearningMode, setPreferredLearningMode] = useState('Online');
  const [experienceLevel, setExperienceLevel] = useState('Junior Professional');

  // Step 3: Details & Availability
  const [location, setLocation] = useState('');
  const [collegeOrCompany, setCollegeOrCompany] = useState('');
  const [languages, setLanguages] = useState('English');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [website, setWebsite] = useState('');

  const [availability, setAvailability] = useState([]);

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['Morning', 'Afternoon', 'Evening'];

  const toggleAvailability = (day, time) => {
    const slot = `${day} ${time}`;
    setAvailability((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  };

  const addOfferedSkill = () => {
    if (!offeredInput.trim()) return;
    if (skillsOffered.some((s) => s.skill.toLowerCase() === offeredInput.toLowerCase())) return;
    setSkillsOffered([...skillsOffered, { skill: offeredInput.trim(), level: offeredLevel }]);
    setOfferedInput('');
  };

  const removeOfferedSkill = (index) => {
    setSkillsOffered(skillsOffered.filter((_, i) => i !== index));
  };

  const addWantedSkill = () => {
    if (!wantedInput.trim()) return;
    if (skillsWanted.some((s) => s.skill.toLowerCase() === wantedInput.toLowerCase())) return;
    setSkillsWanted([...skillsWanted, { skill: wantedInput.trim(), priority: wantedPriority }]);
    setWantedInput('');
  };

  const removeWantedSkill = (index) => {
    setSkillsWanted(skillsWanted.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        bio,
        about,
        avatar,
        coverImage,
        skillsOffered,
        skillsWanted,
        experienceLevel,
        languages: languages.split(',').map((l) => l.trim()),
        location,
        collegeOrCompany,
        portfolioLinks: { linkedin, github, website },
        availabilityCalendar: availability,
        preferredLearningMode,
      };

      await updateProfileData(payload);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '40px auto', padding: '0 16px' }}>
      {/* Step Progress Indicators */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              textAlign: 'center',
              paddingBottom: '8px',
              borderBottom: `3px solid ${step >= s ? 'var(--secondary)' : 'var(--glass-border)'}`,
              fontWeight: 600,
              fontSize: '13px',
              color: step >= s ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'var(--transition)',
            }}
          >
            Step {s}: {s === 1 ? 'About You' : s === 2 ? 'Skills' : 'Preferences'}
          </div>
        ))}
      </div>

      <GlassCard className="hover-lift">
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Create Your Exchange Profile</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '-12px' }}>
              Let the community get to know you. Upload an avatar and write a short bio.
            </p>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <img
                src={avatar}
                alt="avatar"
                style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--secondary)' }}
              />
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Avatar Seed (Dicebear Seed)
                </label>
                <input
                  type="text"
                  placeholder="Enter name to change seed"
                  className="glass-input"
                  onChange={(e) => setAvatar(`https://api.dicebear.com/7.x/adventurer/svg?seed=${e.target.value}`)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                One-Sentence Headline (Bio)
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Frontend Dev looking to learn Spanish"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="glass-input"
                maxLength={160}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                About Me (Full Description)
              </label>
              <textarea
                placeholder="Share your background, what you love teaching, and what your goals are on SkillSwap."
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="glass-input"
                style={{ minHeight: '120px', resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Configure Your Swap Core</h3>
            
            {/* Skills Offered */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Skills You Can Teach (Skills Offered)
              </label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="e.g. React, Python, Cooking, Guitar"
                  value={offeredInput}
                  onChange={(e) => setOfferedInput(e.target.value)}
                  className="glass-input"
                />
                <select
                  value={offeredLevel}
                  onChange={(e) => setOfferedLevel(e.target.value)}
                  className="glass-input"
                  style={{ width: '150px' }}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Expert">Expert</option>
                </select>
                <button type="button" onClick={addOfferedSkill} className="btn btn-primary" style={{ padding: '0 16px' }}>
                  <Plus size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {skillsOffered.map((s, index) => (
                  <span key={index} className="badge badge-gold" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textTransform: 'none', padding: '6px 10px', borderRadius: '20px' }}>
                    {s.skill} ({s.level})
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeOfferedSkill(index)} />
                  </span>
                ))}
              </div>
            </div>

            {/* Skills Wanted */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                Skills You Want to Learn (Skills Wanted)
              </label>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="e.g. UI/UX Design, Public Speaking, Spanish"
                  value={wantedInput}
                  onChange={(e) => setWantedInput(e.target.value)}
                  className="glass-input"
                />
                <select
                  value={wantedPriority}
                  onChange={(e) => setWantedPriority(e.target.value)}
                  className="glass-input"
                  style={{ width: '150px' }}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>
                <button type="button" onClick={addWantedSkill} className="btn btn-primary" style={{ padding: '0 16px' }}>
                  <Plus size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {skillsWanted.map((s, index) => (
                  <span key={index} className="badge badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textTransform: 'none', padding: '6px 10px', borderRadius: '20px' }}>
                    {s.skill} ({s.priority})
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => removeWantedSkill(index)} />
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Preferred Learning Mode
                </label>
                <select
                  value={preferredLearningMode}
                  onChange={(e) => setPreferredLearningMode(e.target.value)}
                  className="glass-input"
                >
                  <option value="Online">Online Sessions</option>
                  <option value="Offline">In-Person (Offline)</option>
                  <option value="Hybrid">Hybrid Mode</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Experience Level
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="glass-input"
                >
                  <option value="Student">Student</option>
                  <option value="Junior Professional">Junior Professional</option>
                  <option value="Senior Professional">Senior Professional</option>
                  <option value="Veteran Educator">Veteran Educator</option>
                  <option value="Hobbies Specialist">Hobbies Specialist</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 600 }}>Location & Availability Details</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Location (City, Country)
                </label>
                <input
                  type="text"
                  placeholder="New York, USA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  College or Current Company
                </label>
                <input
                  type="text"
                  placeholder="MIT or Google"
                  value={collegeOrCompany}
                  onChange={(e) => setCollegeOrCompany(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Languages (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="English, Spanish"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                  Portfolio / LinkedIn Links
                </label>
                <input
                  type="text"
                  placeholder="linkedin.com/in/username"
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>

            {/* Availability Slots Grid */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                Select Availability Time Slots
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                {weekdays.map((day) => (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '6px', borderBottom: '1px solid rgba(17,17,17,0.03)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, width: '90px' }}>{day}</span>
                    <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
                      {times.map((time) => {
                        const slot = `${day} ${time}`;
                        const active = availability.includes(slot);
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => toggleAvailability(day, time)}
                            style={{
                              flex: 1,
                              padding: '4px 8px',
                              fontSize: '10px',
                              borderRadius: '4px',
                              border: active ? '1px solid var(--secondary)' : '1px solid var(--glass-border)',
                              backgroundColor: active ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                              color: active ? '#cda21b' : 'var(--text-secondary)',
                              cursor: 'pointer',
                              fontWeight: active ? 600 : 400,
                              transition: 'var(--transition)',
                            }}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
          {step > 1 ? (
            <button type="button" onClick={() => setStep(step - 1)} className="btn btn-outline">
              <ChevronLeft size={16} /> Back
            </button>
          ) : (
            <div></div>
          )}

          {step < 3 ? (
            <button type="button" onClick={() => setStep(step + 1)} className="btn btn-primary">
              Continue <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" disabled={loading} onClick={handleSubmit} className="btn btn-secondary">
              {loading ? 'Completing Setup...' : 'Finish Profile Setup'}
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default ProfileSetup;
