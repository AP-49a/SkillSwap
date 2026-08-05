import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useNotification } from './NotificationContext.jsx';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
        } catch (error) {
          console.error('Session restore failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (emailOrUsername, password, rememberMe) => {
    try {
      const res = await api.post('/auth/login', { emailOrUsername, password });
      const userData = res.data;
      
      setUser(userData);
      setToken(userData.token);
      
      if (rememberMe) {
        localStorage.setItem('token', userData.token);
      } else {
        sessionStorage.setItem('token', userData.token);
        localStorage.setItem('token', userData.token); // For simplicity across tabs, standard dev storage
      }

      showNotification('Welcome back!', `Logged in as @${userData.username}`, 'success');
      
      if (userData.streak > 1) {
        showNotification(
          `Streak: Day ${userData.streak}!`,
          `Streak active! Earned bonus credits.`,
          'achievement'
        );
      }
      return userData;
    } catch (error) {
      showNotification('Login Failed', error.message, 'error');
      throw error;
    }
  };

  const signup = async (name, username, email, password, referralCode) => {
    try {
      const res = await api.post('/auth/register', { name, username, email, password, referralCode });
      const userData = res.data;

      setUser(userData);
      setToken(userData.token);
      localStorage.setItem('token', userData.token);

      showNotification('Registration successful', 'Welcome to SkillSwap! Let\'s verify your email.', 'success');
      return userData; // Contains verification token for dev simulator
    } catch (error) {
      showNotification('Signup Failed', error.message, 'error');
      throw error;
    }
  };

  const verifyUserEmail = async (code) => {
    try {
      const res = await api.post('/auth/verify-email', { userId: user._id, token: code });
      setUser((prev) => ({ ...prev, isVerified: true }));
      showNotification('Email Verified!', 'Your account has been fully activated. +50 XP!', 'success');
      return res;
    } catch (error) {
      showNotification('Verification Failed', error.message, 'error');
      throw error;
    }
  };

  const updateProfileData = async (profileDetails) => {
    try {
      const res = await api.put('/profiles/me', profileDetails);
      // Synchronize credits or level updates if changed
      if (res.data && res.data.user) {
        setUser(res.data.user);
      }
      showNotification('Profile Saved', 'Your profile details have been updated.', 'success');
      return res.data;
    } catch (error) {
      showNotification('Profile Update Failed', error.message, 'error');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    showNotification('Logged Out', 'You have been safely logged out.', 'info');
  };

  // Function to refresh user profile metrics (XP, credits)
  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        verifyUserEmail,
        updateProfileData,
        logout,
        refreshUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
