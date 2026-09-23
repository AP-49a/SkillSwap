const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();

const normalizeBaseUrl = (url) => {
  if (!url) return '/api';
  const clean = url.replace(/\/+$/, '');
  if (clean.endsWith('/api')) return clean;
  return `${clean}/api`;
};

export const API_BASE_URL = normalizeBaseUrl(rawApiUrl);

export const resolveUrl = (endpoint = '') => {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  if (API_BASE_URL.endsWith('/api') && cleanEndpoint.startsWith('/api/')) {
    return `${API_BASE_URL.slice(0, -4)}${cleanEndpoint}`;
  }
  return `${API_BASE_URL}${cleanEndpoint}`;
};

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.status = response.status;
    throw error;
  }
  return data;
};

export const api = {
  get: async (endpoint) => {
    const res = await fetch(resolveUrl(endpoint), {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
      cache: 'no-store',
    });
    return handleResponse(res);
  },

  post: async (endpoint, body) => {
    const res = await fetch(resolveUrl(endpoint), {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  put: async (endpoint, body) => {
    const res = await fetch(resolveUrl(endpoint), {
      method: 'PUT',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(body),
    });
    return handleResponse(res);
  },

  delete: async (endpoint) => {
    const res = await fetch(resolveUrl(endpoint), {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    return handleResponse(res);
  },
};
export default api;

