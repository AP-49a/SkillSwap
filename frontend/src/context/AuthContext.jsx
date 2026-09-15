import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useNotification } from './NotificationContext.jsx';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (error) {
        if (error.status !== 401) console.error('Session restore failed:', error);
        setUser(null);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (emailOrUsername, password) => {
    try {
      const res = await api.post('/auth/login', { email: emailOrUsername, password });
      const userData = res.data;
      
      setUser(userData);

      showNotification('Welcome back!', `Logged in as @${userData.username}`, 'success');
      
      return userData;
    } catch (error) {
      showNotification('Login Failed', error.message, 'error');
      throw error;
    }
  };

  const signup = async (name, username, email, password) => {
    try {
      const res = await api.post('/auth/signup', { username, email, password });
      const userData = res.data;

      setUser(userData);
      showNotification('Registration successful', `Welcome to SkillSwap, @${userData.username}!`, 'success');
      return userData;
    } catch (error) {
      showNotification('Signup Failed', error.message, 'error');
      throw error;
    }
  };

  const updateProfileData = async (profileDetails) => {
    try {
      const res = await api.put('/profile', profileDetails);
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

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      if (error.status !== 401) console.error('Logout failed:', error);
    }
    setUser(null);
    showNotification('Logged Out', 'You have been safely logged out.', 'info');
  };

  // Function to refresh user profile metrics (XP, credits)
  const refreshUser = async () => {
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
        loading,
        login,
        signup,
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
