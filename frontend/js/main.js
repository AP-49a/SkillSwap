// Global API utilities and session handling

// Dynamically determine base URL (works for local development and production)
const API_BASE = '';

// Helper to wrap standard fetch requests
async function apiFetch(url, options = {}) {
  options.headers = options.headers || {};
  
  // If request contains body and isn't a FormData object, serialize it
  if (options.body && !(options.body instanceof FormData)) {
    options.headers['Content-Type'] = 'application/json';
    if (typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
  }

  try {
    const res = await fetch(`http://localhost:5000${url}`, {
  ...options,
  credentials: 'include',
  cache: 'no-store'
  });
    
    // Parse response
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = { success: false, message: 'Response is not valid JSON' };
    }

    if (!res.ok) {
      // If unauthorized (expired token), redirect to login page (exclude auth pages)
      if (res.status === 401) {
        const path = window.location.pathname;
        if (!path.endsWith('login.html') && !path.endsWith('signup.html') && !path.endsWith('index.html') && path !== '/') {
          localStorage.removeItem('user');
          window.location.href = '/login.html';
        }
      }
      throw new Error(data.message || `HTTP error! status: ${res.status}`);
    }
    return data;
  } catch (error) {
    console.error('API Fetch Error:', error);
    throw error;
  }
}

// Toast notification module
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let emoji = 'ℹ️';
  if (type === 'success') emoji = '✅';
  if (type === 'error') emoji = '❌';

  toast.innerHTML = `
    <span class="toast-emoji">${emoji}</span>
    <div style="flex-grow: 1;">${message}</div>
    <button style="background: none; border: none; cursor: pointer; color: var(--secondary); font-weight: bold; margin-left: 8px;" onclick="this.parentElement.remove()">&times;</button>
  `;

  container.appendChild(toast);

  // Auto remove toast
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease-out reverse';
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, 4000);
}

// Loader Utilities
function showLoader(elementId) {
  const container = document.getElementById(elementId);
  if (container) {
    container.innerHTML = `
      <div class="loader-container">
        <div class="spinner"></div>
      </div>
    `;
  }
}

function hideLoader(elementId, contentHTML = '') {
  const container = document.getElementById(elementId);
  if (container) {
    container.innerHTML = contentHTML;
  }
}

// Render Global Navbar
async function renderNavbar() {
  const navContainer = document.getElementById('global-navbar');
  if (!navContainer) return;

  let user = null;
  try {
    // Check local storage cache first, then verify with backend
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      user = JSON.parse(cachedUser);
    }
    
    // Fetch profile validation from backend
    const res = await apiFetch('/api/auth/me');
    if (res.success && res.data) {
      user = res.data;
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      user = null;
      localStorage.removeItem('user');
    }
  } catch (err) {
    user = null;
    localStorage.removeItem('user');
  }

  const currentPath = window.location.pathname;

  let menuHTML = '';

  if (user) {
    // Check if user has notifications
    let notificationCount = 0;
    try {
      const notifRes = await apiFetch('/api/notifications');
      if (notifRes.success) {
        notificationCount = notifRes.data.filter(n => !n.isRead).length;
      }
    } catch (e) {
      console.warn('Could not fetch notifications count');
    }

    menuHTML = `
      <li><a href="/dashboard.html" class="nav-link ${currentPath.includes('dashboard') ? 'active' : ''}">Dashboard</a></li>
      <li><a href="/browse-skills.html" class="nav-link ${currentPath.includes('browse-skills') ? 'active' : ''}">Browse</a></li>
      <li><a href="/my-sessions.html" class="nav-link ${currentPath.includes('my-sessions') ? 'active' : ''}">Sessions</a></li>
      <li><a href="/wallet.html" class="nav-link ${currentPath.includes('wallet') ? 'active' : ''}">Wallet</a></li>
      <li>
        <a href="/notifications.html" class="nav-link ${currentPath.includes('notifications') ? 'active' : ''}">
          Inbox ${notificationCount > 0 ? `<span class="badge-count">${notificationCount}</span>` : ''}
        </a>
      </li>
      ${user.role === 'admin' ? `<li><a href="/admin-panel.html" class="nav-link ${currentPath.includes('admin') ? 'active' : ''}">Admin</a></li>` : ''}
      <li><a href="/profile.html?id=${user._id}" class="nav-link ${currentPath.includes('profile') && !currentPath.includes('edit') && !currentPath.includes('create') ? 'active' : ''}">Profile</a></li>
      <li><a href="/settings.html" class="nav-link ${currentPath.includes('settings') ? 'active' : ''}">Settings</a></li>
      <li><button onclick="handleLogout()" class="btn btn-secondary btn-sm">Logout</button></li>
    `;
  } else {
    menuHTML = `
      <li><a href="/about.html" class="nav-link ${currentPath.includes('about') ? 'active' : ''}">About</a></li>
      <li><a href="/contact.html" class="nav-link ${currentPath.includes('contact') ? 'active' : ''}">Contact</a></li>
      <li><a href="/login.html" class="nav-link ${currentPath.includes('login') ? 'active' : ''}">Login</a></li>
      <li><a href="/signup.html" class="btn btn-primary btn-sm">Join SkillSwap</a></li>
    `;
  }

  navContainer.innerHTML = `
    <nav class="navbar">
      <div class="container">
        <a href="/" class="logo">
          <img src="/assets/logo.png" alt="SkillSwap" class="logo-img">
          <span class="logo-skill">Skill<span class="logo-swap">Swap</span></span>
        </a>
        <ul class="nav-menu">
          ${menuHTML}
        </ul>
      </div>
    </nav>
  `;
}

// Render Global Footer
function renderFooter() {
  const footerContainer = document.getElementById('global-footer');
  if (!footerContainer) return;

  footerContainer.innerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="logo" style="margin-bottom: 16px;">🤝 Skill<span>Swap</span></div>
            <p style="color: var(--secondary); font-size: 14px; max-width: 280px;">
              Empowering people to share knowledge, swap skills, and grow together without currency restrictions.
            </p>
          </div>
          <div>
            <h4 class="footer-heading">Platform</h4>
            <ul class="footer-links">
              <li><a href="/browse-skills.html">Browse Skills</a></li>
              <li><a href="/about.html">How It Works</a></li>
              <li><a href="/signup.html">Join Today</a></li>
            </ul>
          </div>
          <div>
            <h4 class="footer-heading">Company</h4>
            <ul class="footer-links">
              <li><a href="/about.html">About Us</a></li>
              <li><a href="/contact.html">Contact Support</a></li>
            </ul>
          </div>
          <div>
            <h4 class="footer-heading">Legals</h4>
            <ul class="footer-links">
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} SkillSwap Inc. All rights reserved.</p>
          <p>Made with ❤️ for Skill Swappers</p>
        </div>
      </div>
    </footer>
  `;
}

// Logout handler
async function handleLogout() {
  try {
    const res = await apiFetch('/api/auth/logout', { method: 'POST' });
    if (res.success) {
      localStorage.removeItem('user');
      showToast('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    }
  } catch (err) {
    showToast(err.message || 'Logout failed', 'error');
  }
}

// Automatically trigger navigation renders when page loads
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
});
