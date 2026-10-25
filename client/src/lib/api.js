import axios from 'axios';

// Smart resolution for backend API
const defaultProductionApi = 'https://imovies-ticket-booking-xrmv.onrender.com/api';
const baseURL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? defaultProductionApi : 'http://localhost:5001/api');

const api = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30000, // 30s timeout to prevent zombie connections on mobile
  headers: {
    'Content-Type': 'application/json',
  },
});

// High-speed persistent client cache for read-heavy GET requests
const CACHE_PREFIX = 'imovies_api_cache_';
const memoryCache = new Map();

function getCacheKey(url, params) {
  return `${url}:${params ? JSON.stringify(params) : ''}`;
}

function getStoredCache(key) {
  // 1. Try memory cache first (sub-millisecond)
  const mem = memoryCache.get(key);
  if (mem && Date.now() < mem.expiresAt) {
    return mem.data;
  }

  // 2. Try persistent localStorage (instant across page reloads on mobile)
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + key);
      if (raw) {
        const item = JSON.parse(raw);
        if (item && Date.now() < item.expiresAt) {
          memoryCache.set(key, item);
          return item.data;
        }
        localStorage.removeItem(CACHE_PREFIX + key);
      }
    } catch {
      // localStorage disabled or full
    }
  }
  return null;
}

function setStoredCache(key, data, ttlMs = 15 * 60 * 1000) {
  const record = {
    data,
    expiresAt: Date.now() + ttlMs,
  };
  memoryCache.set(key, record);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(record));
    } catch {
      // Quota exceeded or private browsing
    }
  }
}

// Request interceptor: return cached response immediately (0ms)
api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();

  // Any mutation (POST, PUT, DELETE, PATCH) flushes cache
  if (method !== 'get') {
    api.clearCache();
    return config;
  }

  // Real-time seat lock state must NEVER be cached
  const isSeatEndpoint = config.url && config.url.includes('/seats');
  if (config.noCache || isSeatEndpoint) {
    return config;
  }

  // Cache safe public GET endpoints (movies, cities, movie details, shows)
  const isCacheable = config.url && config.url.startsWith('/public/');
  if (isCacheable) {
    const key = getCacheKey(config.url, config.params);
    const cachedData = getStoredCache(key);

    if (cachedData) {
      config.adapter = () => {
        return Promise.resolve({
          data: cachedData,
          status: 200,
          statusText: 'OK (Persistent Cache)',
          headers: {},
          config,
          request: {},
        });
      };
    }
  }

  return config;
});

// Response interceptor to store in cache & normalize errors
api.interceptors.response.use(
  (response) => {
    const config = response.config;
    const method = (config.method || 'get').toLowerCase();

    if (method === 'get' && config.url && config.url.startsWith('/public/') && !config.url.includes('/seats')) {
      const key = getCacheKey(config.url, config.params);
      // Movies and cities cache for 30 minutes; shows cache for 3 minutes
      const isShows = config.url.includes('/shows');
      const ttl = isShows ? 3 * 60 * 1000 : 30 * 60 * 1000;
      setStoredCache(key, response.data, ttl);
    }

    return response;
  },
  (error) => {
    const customError = {
      message: error.response?.data?.error || error.message || 'Something went wrong',
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      status: error.response?.status || 500,
      details: error.response?.data?.details,
    };
    return Promise.reject(customError);
  }
);

api.clearCache = () => {
  memoryCache.clear();
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
  }
};

export default api;
