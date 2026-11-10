import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GlassCard from '../components/GlassCard.jsx';
import { ChevronRight, ChevronLeft, Plus, X, Upload, Check } from 'lucide-react';

const makeAvatar = (skin, hair, shirt, background) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" rx="60" fill="${background}"/><path d="M21 120c2-24 17-36 39-36s37 12 39 36" fill="${shirt}"/><path d="M34 54c-4-22 8-39 27-39s31 16 27 39l-4 12H38z" fill="${hair}"/><ellipse cx="60" cy="57" rx="24" ry="29" fill="${skin}"/><path d="M35 49c1-24 12-36 28-36 18 0 28 14 26 36-9-2-18-9-23-18-7 10-18 16-31 18" fill="${hair}"/><circle cx="51" cy="57" r="2" fill="#253247"/><circle cx="69" cy="57" r="2" fill="#253247"/><path d="M54 70c4 3 8 3 12 0" fill="none" stroke="#9a4e48" stroke-width="2" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const avatarOptions = [
  { name: 'Ari', src: makeAvatar('#c98257', '#29212a', '#2563eb', '#eaf1ff') },
  { name: 'Sam', src: makeAvatar('#edc09c', '#5b3828', '#0f766e', '#e8f5f2') },
  { name: 'Noor', src: makeAvatar('#8f573e', '#171923', '#7c3aed', '#f1ebff') },
  { name: 'Lee', src: makeAvatar('#f0c8a3', '#a45d32', '#334155', '#edf1f5') },
  { name: 'Mika', src: makeAvatar('#b97554', '#22222a', '#be123c', '#fff0f2') },
  { name: 'Dev', src: makeAvatar('#e2ad83', '#403027', '#0f766e', '#eaf6f2') },
];

export const ProfileSetup = () => {
  const { user, updateProfileData } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Visuals & Bio
  const [avatar, setAvatar] = useState(user?.profile?.avatar || user?.avatar || avatarOptions[0].src);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarError, setAvatarError] = useState('');
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

  const [availability, setAvailability] = useState([]);

  useEffect(() => {
    if (!avatar.startsWith('blob:')) return undefined;
    return () => URL.revokeObjectURL(avatar);
  }, [avatar]);

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setAvatarError('Choose a JPG, PNG, WEBP, or GIF image.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Choose an image smaller than 5 MB.');
      event.target.value = '';
      return;
    }
    setAvatarError('');
    setAvatarFile(file);
    setAvatar(URL.createObjectURL(file));
  };

  const chooseAvatar = (option) => {
    setAvatar(option.src);
    setAvatarFile(null);
    setAvatarError('');
  };

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
        ...(!avatarFile && { avatar }),
        ...(avatarFile && { avatarFile }),
        skillsOffered: skillsOffered.map(({ skill }) => skill),
        skillsWanted: skillsWanted.map(({ skill }) => skill),
        experience: experienceLevel,
        languages: languages.split(',').map((l) => l.trim()),
        location,
        college: collegeOrCompany,
        linkedin,
        availability: availability.join(', '),
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

            <div className="profile-avatar-picker">
              <div className="profile-avatar-current">
                <img src={avatar} alt="Selected profile picture preview" onError={() => { setAvatarFile(null); setAvatar('/avatars/default.svg'); }} />
                <div><strong>Profile picture</strong><span>{avatarFile ? avatarFile.name : 'Choose a photo or use an avatar'}</span></div>
                <label className="btn btn-outline avatar-upload-button" htmlFor="profile-avatar-upload"><Upload size={15} /> Upload photo</label>
                <input id="profile-avatar-upload" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleAvatarUpload} />
              </div>
              {avatarError && <p className="avatar-error" role="alert">{avatarError}</p>}
              <fieldset className="avatar-options">
                <legend>Or choose an avatar</legend>
                <div>
                  {avatarOptions.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      className={`avatar-option ${avatar === option.src && !avatarFile ? 'selected' : ''}`}
                      onClick={() => chooseAvatar(option)}
                      role="radio"
                      aria-checked={avatar === option.src && !avatarFile}
                      aria-label={`Choose ${option.name}'s avatar`}
                    >
                      <img src={option.src} alt="" />
                      {avatar === option.src && !avatarFile && <span><Check size={13} /></span>}
                    </button>
                  ))}
                </div>
              </fieldset>
              <p className="avatar-help">JPG, PNG, WEBP, or GIF · Up to 5 MB</p>
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
