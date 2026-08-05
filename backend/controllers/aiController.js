import { GoogleGenAI } from '@google/generative-ai';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import Session from '../models/Session.js';

// Initialize Gemini if API key is provided
let aiEnabled = false;
let genAI = null;

if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    aiEnabled = true;
    console.log('Gemini AI Engine Initialized for SkillSwap');
  } catch (error) {
    console.warn('Failed to initialize Gemini API:', error.message);
  }
}

// @desc    Get AI Skill Recommendations based on current offering/wanted skills
// @route   POST /api/ai/recommend-skills
// @access  Private
export const getSkillRecommendations = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const offered = profile.skillsOffered.map(s => s.skill).join(', ') || 'none';
    const wanted = profile.skillsWanted.map(s => s.skill).join(', ') || 'none';

    if (aiEnabled && genAI) {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are the SkillSwap AI recommendation assistant.
      The user offers these skills: [${offered}].
      The user wants to learn: [${wanted}].
      Recommend 5 complementary skills they should consider learning or offering, and briefly explain why (1 sentence each).
      Return the output as a valid JSON array of objects, like this:
      [
        {"skill": "Skill Name", "reason": "Reason why"}
      ]`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      // Clean code fences if any
      const cleaned = text.replace(/```json|```/g, '').trim();
      const json = JSON.parse(cleaned);

      return res.json({ success: true, source: 'gemini', data: json });
    }

    // Mock Fallback
    const mockRecommendations = [
      { skill: 'UI/UX Design', reason: 'Since you offer Frontend Development, learning UI/UX will make you a complete product builder.' },
      { skill: 'Prompt Engineering', reason: 'To level up your Programming skills, learning how to leverage AI tools will multiply your productivity.' },
      { skill: 'Public Speaking', reason: 'Teaching requires communication. Enhancing your public speaking will earn you higher ratings in your swaps.' },
      { skill: 'Digital Marketing', reason: 'Good for promoting your skills and projects to attract potential learn swaps.' },
      { skill: 'Data Structures & Algorithms', reason: 'Highly requested core skill. Offering this will guarantee a high volume of credit bookings.' }
    ];

    res.json({ success: true, source: 'mock', data: mockRecommendations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate learning path roadmap for a specific skill
// @route   POST /api/ai/learning-path
// @access  Private
export const getLearningPath = async (req, res) => {
  const { skill } = req.body;

  if (!skill) {
    return res.status(400).json({ success: false, message: 'Please provide a skill' });
  }

  try {
    if (aiEnabled && genAI) {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `You are a professional educational planner. 
      Generate a comprehensive 4-step learning path roadmap for a beginner wanting to master "${skill}".
      For each of the 4 steps, provide:
      1. Step Title
      2. Key Concepts to learn
      3. Practical Project to build
      4. Estimated Hours to complete
      Return the response as a valid JSON object in this format:
      {
        "skill": "${skill}",
        "steps": [
          { "stepNumber": 1, "title": "...", "concepts": ["...", "..."], "project": "...", "hours": 10 }
        ]
      }`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json|```/g, '').trim();
      const json = JSON.parse(cleaned);

      return res.json({ success: true, source: 'gemini', data: json });
    }

    // Mock Fallback
    const mockRoadmap = {
      skill,
      steps: [
        {
          stepNumber: 1,
          title: 'Fundamentals & Setup',
          concepts: [`Core principles of ${skill}`, 'Tools of the trade', 'Basic configurations'],
          project: 'Set up your local workspace environment and run a basic initial experiment.',
          hours: 8,
        },
        {
          stepNumber: 2,
          title: 'Intermediate Concepts & Flow',
          concepts: ['Best practices', 'Standard structures', 'Error Handling & Debugging'],
          project: 'Build a small-scale prototype applying common structures.',
          hours: 15,
        },
        {
          stepNumber: 3,
          title: 'Advanced Features & Integration',
          concepts: ['Performance optimization', 'API integrations', 'Security configurations'],
          project: 'Deploy a fully integrated dashboard/system demonstrating optimization techniques.',
          hours: 20,
        },
        {
          stepNumber: 4,
          title: 'Real-world Deployment & Analytics',
          concepts: ['Testing suites', 'Monitoring', 'Future roadmap'],
          project: 'Publish a public-facing repository/portfolio project with docs.',
          hours: 12,
        },
      ],
    };

    res.json({ success: true, source: 'mock', data: mockRoadmap });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Summarize a session notes
// @route   POST /api/ai/session-summary
// @access  Private
export const getSessionSummary = async (req, res) => {
  const { sessionId, sessionNotes } = req.body;

  if (!sessionId || !sessionNotes) {
    return res.status(400).json({ success: false, message: 'Session ID and notes are required' });
  }

  try {
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    let summaryText = '';
    let actionItems = [];

    if (aiEnabled && genAI) {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Summarize the following notes from a SkillSwap session about ${session.skill}:
      Notes: "${sessionNotes}"
      Provide a clean summary paragraph (under 3 sentences) and a list of 3 concrete next action items for the student.
      Return the response in JSON format:
      {
        "summary": "...",
        "actionItems": ["item 1", "item 2", "item 3"]
      }`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json|```/g, '').trim();
      const json = JSON.parse(cleaned);
      summaryText = json.summary;
      actionItems = json.actionItems;
    } else {
      // Mock Fallback
      summaryText = `In this session, you covered the main concepts of ${session.skill}. The lesson went through building active code blocks, configuring developer tools, and solving basic setup bugs.`;
      actionItems = [
        'Review the key commands covered in the shared workspace.',
        'Complete the practice exercise: write a clean modular module.',
        'Set up the next calendar booking for a code review review.',
      ];
    }

    // Save summary to session database
    session.aiSummary = `${summaryText}\n\nKey Action Items:\n${actionItems.map(item => `• ${item}`).join('\n')}`;
    await session.save();

    res.json({
      success: true,
      source: aiEnabled ? 'gemini' : 'mock',
      data: {
        summary: summaryText,
        actionItems,
        fullSummary: session.aiSummary,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get AI profile improvement suggestion list
// @route   GET /api/ai/profile-suggestions
// @access  Private
export const getProfileSuggestions = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', 'name');
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (aiEnabled && genAI) {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Review the following profile info for ${profile.user.name}:
      Bio: "${profile.bio}"
      About: "${profile.about}"
      Skills Offered: [${profile.skillsOffered.map(s => s.skill).join(', ')}]
      Skills Wanted: [${profile.skillsWanted.map(s => s.skill).join(', ')}]
      Location: "${profile.location}"
      College/Company: "${profile.collegeOrCompany}"
      
      Give 3 constructive suggestions to improve this profile to get more booking requests.
      Return the output as a valid JSON array of strings:
      ["Suggestion 1", "Suggestion 2", "Suggestion 3"]`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json|```/g, '').trim();
      const json = JSON.parse(cleaned);

      return res.json({ success: true, source: 'gemini', data: json });
    }

    // Mock Fallback
    const suggestions = [];
    if (!profile.bio || profile.bio.length < 20) {
      suggestions.push('Make your short bio more catchy! List your primary expertise front and center.');
    }
    if (!profile.about || profile.about.length < 50) {
      suggestions.push('Add a brief background history to your "About" section detailing your teaching philosophy.');
    }
    if (profile.skillsOffered.length < 2) {
      suggestions.push('Add at least 2 or 3 distinct skills you offer. Many users look for niche sub-skills.');
    }
    if (profile.projects.length === 0) {
      suggestions.push('Create a mini "Projects" listing to showcase proof of work.');
    }
    if (suggestions.length === 0) {
      suggestions.push('Your profile looks excellent! Consider specifying hourly slots in your availability calendar.');
      suggestions.push('Add links to your social profiles (GitHub, LinkedIn) to build community trust.');
    } else {
      suggestions.push('Ensure your availability calendar outlines exact time periods to ease user bookings.');
    }

    res.json({ success: true, source: 'mock', data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
