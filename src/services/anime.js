/**
 * Enhanced Anime API Service with Request Deduplication
 * All API calls go through this service to prevent multiple requests
 * Uses centralized deduplication from apiCache.js
 * Includes configurable retry logic for proxy-related API calls
 */

// Import our cache utility
import {
  cancelRequest,
  clearCache,
  getCachedResponse,
  getOrCreateRequest,
  setCacheResponse
} from '../utils/apiCache';

// API Configuration
const API_LOCAL = 'https://hianimeapi-6uju.onrender.com/api/v1';
const API_EXTERNAL = 'https://hianimeapi-6uju.onrender.com/api/v1';
const API_ROOT = API_LOCAL;
const PROXY_BASE = 'https://hianimeapi-6uju.onrender.com/api/v1';

// ==================== RETRY CONFIGURATION ====================

/**
 * Retry configuration for API calls
 * Customize retry behavior for proxy-related requests
 */
export const retryConfig = {
  // Maximum number of retry attempts for failed requests
  maxRetries: 1,
  
  // Base delay in milliseconds between retries (exponential backoff)
  baseDelay: 1000,
  
  // Maximum delay cap in milliseconds
  maxDelay: 10000,
  
  // Jitter factor (0-1) to add randomness to retry delays
  jitterFactor: 0.3,
  
  // HTTP status codes that should trigger a retry
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
  
  // Error types that should trigger a retry
  retryErrorTypes: ['network-error', 'fetch-error', 'timeout'],
  
  // Whether to enable retry for proxied requests only
  proxyOnly: true,
  
  // Custom retry predicate function (return true to retry)
  shouldRetry: null, // function(error, attempt, config) - return true to retry
  
  // Callback on retry attempt
  onRetry: null, // function(error, attempt, delay, config) - called before retry
};

/**
 * Set retry configuration
 * @param {Object} config - Partial retry configuration
 */
export function setRetryConfig(config) {
  Object.assign(retryConfig, config);
}

/**
 * Get current retry configuration
 * @returns {Object} Current retry configuration
 */
export function getRetryConfig() {
  return { ...retryConfig };
}

/**
 * Calculate delay with exponential backoff and jitter
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {Object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
function calculateRetryDelay(attempt, config = retryConfig) {
  const exponentialDelay = Math.min(
    config.baseDelay * Math.pow(2, attempt),
    config.maxDelay
  );
  
  // Add jitter (randomness) to prevent thundering herd
  const jitter = exponentialDelay * config.jitterFactor * Math.random();
  
  return Math.floor(exponentialDelay + jitter);
}

/**
 * Sleep utility for delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic
 * Implements exponential backoff with jitter
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} retryOptions - Override retry configuration
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithRetry(url, options = {}, retryOptions = {}) {
  const config = { ...retryConfig, ...retryOptions };
  let lastError;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);
      
      const response = await fetch(url, {
        ...options,
        signal: options.signal || controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Check if we should retry based on status code
      if (!response.ok && config.retryStatusCodes.includes(response.status)) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Return successful response
      return response;
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const isRetryable = isErrorRetryable(error, config, attempt, config.maxRetries);
      
      // Call onRetry callback if provided
      if (config.onRetry && isRetryable) {
        const delay = calculateRetryDelay(attempt, config);
        config.onRetry(error, attempt, delay, config);
      }
      
      // If not retryable or max attempts reached, throw
      if (!isRetryable || attempt >= config.maxRetries) {
        console.error(`[anime.js] Fetch failed after ${attempt + 1} attempts: ${url}`, error);
        throw error;
      }
      
      // Calculate and wait for delay
      const delay = calculateRetryDelay(attempt, config);
      console.log(`[anime.js] Retry attempt ${attempt + 1}/${config.maxRetries} for ${url} after ${delay}ms`);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Check if an error is retryable
 * @param {Error} error - The error that occurred
 * @param {Object} config - Retry configuration
 * @param {number} currentAttempt - Current attempt number
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {boolean} Whether the error is retryable
 */
function isErrorRetryable(error, config, currentAttempt, maxRetries) {
  // If custom predicate provided, use it
  if (config.shouldRetry) {
    return config.shouldRetry(error, currentAttempt, config);
  }
  
  // Don't retry if already at max attempts
  if (currentAttempt >= maxRetries) {
    return false;
  }
  
  // Don't retry on abort
  if (error.name === 'AbortError') {
    return false;
  }
  
  // Don't retry if custom shouldRetry returns false
  if (config.shouldRetry && !config.shouldRetry(error, currentAttempt, config)) {
    return false;
  }
  
  // Check error message for retryable status codes
  const errorMessage = error.message || '';
  for (const statusCode of config.retryStatusCodes) {
    if (errorMessage.includes(String(statusCode))) {
      return true;
    }
  }
  
  // Check error type
  const errorType = error.type || '';
  for (const retryType of config.retryErrorTypes) {
    if (errorType.includes(retryType)) {
      return true;
    }
  }
  
  // Retry on network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  // Retry on timeout
  if (error.message && error.message.includes('timeout')) {
    return true;
  }
  
  return false;
}

/**
 * Create a retry-enabled fetcher for getOrCreateRequest
 * @param {Object} retryOptions - Override retry configuration
 * @returns {Function} Fetcher function with retry
 */
export function createRetryFetcher(retryOptions = {}) {
  return async function fetcherWithRetry(url, options = {}) {
    return fetchWithRetry(url, options, retryOptions);
  };
}

// Provider configuration
const PROVIDERS = {
  animekai: {
    templates: {
      search: '/anime/animekai/{query}',
      info: '/anime/animekai/info?id={id}',
      episodes: '/anime/animekai/episodes/{id}',
      watch: '/anime/animekai/watch/{episodeId}'
    }
  },
  animepahe: {
    templates: {
      search: '/anime/animepahe/{query}',
      info: '/anime/animepahe/info/{id}',
      episodes: '/anime/animepahe/episodes/{id}',
      watch: '/anime/animepahe/watch?episodeId={episodeId}'
    }
  },
  'hianime-scrap': {
    templates: {
      search: '/search?keyword={query}&page=1',
      info: '/anime/{id}',
      episodes: '/episodes/{id}',
      servers: '/servers?id={id}',
      stream: '/stream?id={id}&type={type}&server={server}'
    }
  }
};

const DEFAULT_PROVIDER = 'hianime-scrap';

/**
 * Generate a unique request ID to prevent automatic retries
 */
function generateRequestId(endpoint, params = {}) {
  return `anime_${endpoint}_${JSON.stringify(params)}`.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Generate a unique cache key for request tracking
 */
function generateRequestKey(endpoint, params = {}) {
  return `${endpoint}::${JSON.stringify(params)}`;
}

/**
 * Build URL from provider template
 */
export function buildUrl(providerKey, templateKey, params = {}) {
  const provider = PROVIDERS[providerKey];
  const template = provider?.templates[templateKey];
  if (!template) return '';

  let url = template;
  Object.keys(params).forEach(key => {
    const value = encodeURIComponent(String(params[key] || ''));
    url = url.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  });
  return url;
}

/**
 * Enhanced fetch with abort signal and deduplication
 * This is the core fetch function used by all API calls
 */
async function trackedFetch(url, options = {}) {
  const { signal, cacheKey, timeout = 30000 } = options;
  
  // Check cache first (only for GET requests)
  const cachedData = getCachedResponse(cacheKey || url);
  if (cachedData && options.method !== 'POST') {
    console.log(`[anime.js] Cache hit for: ${url}`);
    return cachedData;
  }

  // Create fetch promise with timeout
  const controller = new AbortController();
  const abortSignal = signal || controller.signal;
  
  const fetchPromise = fetch(url, {
    ...options,
    headers: {
      ...options.headers,
    },
    signal: abortSignal,
  });

  // Timeout handler
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timeout: ${url}`));
    }, timeout);
  });

  try {
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Cache the response
    if (cacheKey || url) {
      setCacheResponse(cacheKey || url, data);
    }
    
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`[anime.js] Request aborted: ${url}`);
      throw new Error('Request cancelled');
    }
    console.error(`[anime.js] Fetch error for ${url}:`, error);
    throw error;
  }
}

// ==================== HOME & DISCOVERY ====================

export const getHomeData = async (options = {}) => {
  const endpoint = '/home';
  const cacheKey = `anime_home_${generateRequestId(endpoint)}`;
  const requestId = generateRequestId(endpoint);

  // Use centralized deduplication - this prevents multiple API calls
  // Note: We don't abort here because getOrCreateRequest will handle deduplication
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      const data = await trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });
      return data;
    },
    5 * 60 * 1000 // 5 minute cache TTL
  ).catch(error => {
    // Don't retry on cancellation
    if (error.message === 'Request cancelled') {
      return { data: null };
    }
    throw error;
  });
};

export const getSpotlight = async (options = {}) => {
  const endpoint = '/spotlight';
  const cacheKey = `anime_spotlight_${generateRequestId(endpoint)}`;
  
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      return trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });
    },
    5 * 60 * 1000
  );
};

export const getTopTen = async (options = {}) => {
  const endpoint = '/topten';
  const cacheKey = `anime_topten_${generateRequestId(endpoint)}`;
  
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      return trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });
    },
    5 * 60 * 1000
  );
};

export const getMetaInfo = async (options = {}) => {
  const endpoint = '/meta';
  const cacheKey = `anime_meta_${generateRequestId(endpoint)}`;
  
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      return trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });
    },
    5 * 60 * 1000
  );
};

// ==================== SEARCH ====================

export const searchAnime = async (keyword, page = 1, provider = DEFAULT_PROVIDER, options = {}) => {
  const endpoint = buildUrl(provider, 'search', { query: keyword });
  const searchUrl = `${PROXY_BASE}${endpoint}`;
  const cacheKey = `anime_search_${generateRequestKey('search', { keyword, page, provider })}`;

  // Use centralized deduplication - getOrCreateRequest handles preventing duplicate calls
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      const data = await trackedFetch(searchUrl, {
        ...options,
        signal,
        cacheKey,
      });

      // Process results
      let results = [];
      if (data && data.data && data.data.response && Array.isArray(data.data.response)) {
        results = data.data.response;
      } else if (Array.isArray(data)) {
        results = data;
      } else if (data && data.results && Array.isArray(data.results)) {
        results = data.results;
      } else if (data && data.anime && Array.isArray(data.anime)) {
        results = data.anime;
      } else if (data && data.data && Array.isArray(data.data)) {
        results = data.data;
      }

      return { data: { response: results } };
    },
    2 * 60 * 1000 // 2 minute cache for search
  ).catch(error => {
    if (error.message === 'Request cancelled') {
      return { data: { response: [] } };
    }
    throw error;
  });
};

export const getSuggestions = async (keyword, options = {}) => {
  const endpoint = `/suggestion?keyword=${encodeURIComponent(keyword)}`;
  const cacheKey = `anime_suggestion_${generateRequestKey('suggestion', { keyword })}`;
  
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      return trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });
    },
    5 * 60 * 1000
  );
};

// ==================== ANIME DETAILS ====================

export const getAnimeDetails = async (id, options = {}) => {
  const endpoint = `/anime/${encodeURIComponent(id)}`;
  const cacheKey = `anime_details_${generateRequestKey('details', { id })}`;

  // Use centralized deduplication
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      const data = await trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });
      return data;
    },
    5 * 60 * 1000
  ).catch(error => {
    if (error.message === 'Request cancelled') {
      return { data: null };
    }
    throw error;
  });
};

export const getRandomAnime = async (options = {}) => {
  const endpoint = '/anime/random';
  const cacheKey = `anime_random_${generateRequestId(endpoint)}`;
  
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      return trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });
    },
    5 * 60 * 1000
  );
};

// ==================== EPISODES ====================

export const getEpisodes = async (id, provider = DEFAULT_PROVIDER, options = {}) => {
  const endpoint = buildUrl(provider, 'episodes', { id });
  const cacheKey = `anime_episodes_${generateRequestKey('episodes', { id, provider })}`;

  // Use centralized deduplication
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      const data = await trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });

      const episodes = extractEpisodes(data, provider);
      return { data: episodes };
    },
    5 * 60 * 1000
  ).catch(error => {
    if (error.message === 'Request cancelled') {
      return { data: [] };
    }
    throw error;
  });
};

// ==================== SERVERS ====================

export const getServers = async (id, options = {}) => {
  // Use the provider-specific template for servers
  let endpoint = buildUrl('hianime-scrap', 'servers', { id });
  endpoint = endpoint.replace("?", "/");
  const cacheKey = `anime_servers_${generateRequestKey('servers', { id })}`;

  // Use centralized deduplication
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      const data = await trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });
      return data;
    },
    2 * 60 * 1000 // 2 minute cache for servers
  ).catch(error => {
    if (error.message === 'Request cancelled') {
      return { data: null };
    }
    throw error;
  });
};

// ==================== STREAM ====================

export const getStreamLink = async (streamId, server = 'hd-1', type = 'sub', provider = DEFAULT_PROVIDER, options = {}) => {
  const endpoint = buildUrl(provider, provider === 'hianime-scrap' ? 'stream' : 'watch', { 
    id: streamId, 
    episodeId: streamId,
    type, 
    server 
  });

  // For stream endpoints, use the internal URL construction
  const isStreamEndpoint = endpoint.includes("stream");
  const url = isStreamEndpoint 
    ? `${"https://hianimeapi-6uju.onrender.com/api/v1"}${endpoint}`
    : `${API_ROOT}${endpoint}`;
    
  const cacheKey = `anime_stream_${generateRequestKey('stream', { streamId, server, type, provider })}`;

  // Use centralized deduplication
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      const data = await trackedFetch(url, {
        ...options,
        signal,
        cacheKey,
        timeout: 15000, // Shorter timeout for stream links
      });
      return data;
    },
    1 * 60 * 1000 // 1 minute cache for streams
  ).catch(error => {
    if (error.message === 'Request cancelled') {
      return { data: null };
    }
    throw error;
  });
};

// ==================== ABORT MANAGER ====================

/**
 * Abort controller manager for browse operations
 */
const browseAbortManager = {
  controllers: new Map(),
  
  register(key, controller) {
    this.abort(key);
    this.controllers.set(key, controller);
  },
  
  abort(key) {
    if (this.controllers.has(key)) {
      try {
        this.controllers.get(key).abort();
      } catch (e) {
        // Ignore abort errors
      }
      this.controllers.delete(key);
    }
  },
  
  cleanup(key) {
    this.controllers.delete(key);
  },
  
  abortAll() {
    for (const [key, controller] of this.controllers.entries()) {
      try {
        controller.abort();
      } catch (e) {
        // Ignore abort errors
      }
    }
    this.controllers.clear();
  }
};

const RENDER_PROXY = 'https://rust-proxy-fy7g.onrender.com';

export const getProxiedStreamUrl = (originalUrl, referer = 'https://megacloud.tv') => {
  if (!originalUrl) return null;
  const proxyUrl = `${RENDER_PROXY}/?url=${encodeURIComponent(originalUrl)}&referer=${encodeURIComponent(referer)}`;
  console.log('[anime.js] Proxied Stream URL (Render):', proxyUrl);
  return proxyUrl;
};

export const getProxiedSubtitleUrl = (originalUrl, referer = 'https://hianime.to') => {
  if (!originalUrl) return null;
  
  if (originalUrl.startsWith('blob:') || originalUrl.startsWith('data:')) {
    return originalUrl;
  }
  
  if (originalUrl.includes('localhost') || originalUrl.includes('127.0.0.1')) {
    return originalUrl;
  }
  
  const proxyUrl = `${RENDER_PROXY}/proxy?url=${encodeURIComponent(originalUrl)}&referer=${encodeURIComponent(referer)}`;
  console.log('[anime.js] Proxied Subtitle URL (Render):', proxyUrl);
  return proxyUrl;
};

export const fetchSubtitleContent = async (url, options = {}) => {
  const { 
    retryOnFailure = true, 
    maxRetries = retryConfig.maxRetries,
    timeout = 15000 
  } = options;

  // Strategy 1: Try original URL directly with retry
  if (retryOnFailure) {
    try {
      console.log(`[anime.js] Fetching subtitle (attempt 1/${maxRetries + 1}):`, url);
      const directResponse = await fetchWithRetry(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*, text/plain, application/octet-stream',
        },
        timeout,
      }, { maxRetries, proxyOnly: false });
      
      if (directResponse.ok) {
        const content = await directResponse.text();
        if (content.length > 0 && !content.includes('<!DOCTYPE')) {
          console.log('[anime.js] Direct subtitle fetch successful');
          return { success: true, content, source: 'direct' };
        }
      }
    } catch (err) {
      console.log('[anime.js] Direct subtitle fetch failed:', err.message);
    }
  } else {
    // No retry mode for direct fetch
    try {
      const directResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*, text/plain, application/octet-stream',
        },
        signal: AbortSignal.timeout(timeout),
      });
      
      if (directResponse.ok) {
        const content = await directResponse.text();
        if (content.length > 0 && !content.includes('<!DOCTYPE')) {
          return { success: true, content, source: 'direct' };
        }
      }
    } catch (err) {
      console.log('[anime.js] Direct subtitle fetch failed:', err.message);
    }
  }
  
  // Strategy 2: Try proxied URL with retry
  const proxiedUrl = getProxiedSubtitleUrl(url);
  if (!proxiedUrl) {
    return { success: false, error: 'Invalid subtitle URL' };
  }
  
  if (retryOnFailure) {
    try {
      console.log(`[anime.js] Fetching proxied subtitle (attempt 1/${maxRetries + 1}):`, proxiedUrl);
      const proxyResponse = await fetchWithRetry(proxiedUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
        timeout,
      }, { maxRetries, proxyOnly: true });
      
      if (proxyResponse.ok) {
        const content = await proxyResponse.text();
        if (content.length > 0 && !content.includes('<!DOCTYPE')) {
          console.log('[anime.js] Proxied subtitle fetch successful');
          return { success: true, content, source: 'proxy' };
        }
      }
      
      console.log('[anime.js] Proxied subtitle fetch returned empty or invalid content');
    } catch (err) {
      console.error('[anime.js] Both subtitle fetch methods failed:', err);
      return { success: false, error: err.message };
    }
  } else {
    // No retry mode for proxied fetch
    try {
      const proxyResponse = await fetch(proxiedUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
        signal: AbortSignal.timeout(timeout),
      });
      
      if (proxyResponse.ok) {
        const content = await proxyResponse.text();
        if (content.length > 0 && !content.includes('<!DOCTYPE')) {
          return { success: true, content, source: 'proxy' };
        }
      }
    } catch (err) {
      console.error('[anime.js] Both subtitle fetch methods failed:', err);
      return { success: false, error: err.message };
    }
  }
  
  return { success: false, error: 'Failed to fetch subtitle' };
};

export const getDirectStreamUrl = (originalUrl) => {
  if (!originalUrl) return null;
  console.log('[anime.js] Direct Stream URL (fallback):', originalUrl);
  return originalUrl;
};

// ==================== BROWSE CATEGORY ====================

export const browseByQuery = async (query, page = 1, options = {}) => {
  const validQueries = [
    'top-airing', 'most-popular', 'most-favorite', 
    'completed', 'recently-added', 'recently-updated',
    'top-upcoming', 'subbed-anime', 'dubbed-anime',
    'movie', 'tv', 'ova', 'ona', 'special'
  ];
  
  if (!validQueries.includes(query)) {
    throw new Error(`Invalid query: ${query}`);
  }

  const endpoint = `/${query}?page=${page}`;
  const cacheKey = `anime_browse_${generateRequestKey('browse', { query, page })}`;

  // Use centralized deduplication
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      const data = await trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });
      return data;
    },
    5 * 60 * 1000
  ).catch(error => {
    if (error.message === 'Request cancelled') {
      return { data: { response: [] } };
    }
    throw error;
  });
};

export const browseByGenre = async (genre, page = 1, options = {}) => {
  const validGenres = [
    'action', 'adventure', 'cars', 'comedy', 'dementia', 'demons',
    'drama', 'ecchi', 'fantasy', 'game', 'harem', 'historical',
    'horror', 'isekai', 'josei', 'kids', 'magic', 'martial-arts',
    'mecha', 'military', 'music', 'mystery', 'parody', 'police',
    'psychological', 'romance', 'samurai', 'school', 'sci-fi',
    'seinen', 'shoujo', 'shoujo-ai', 'shounen', 'shounen-ai',
    'slice-of-life', 'space', 'sports', 'super-power', 'supernatural',
    'thriller', 'vampire'
  ];
  
  const normalizedGenre = genre.toLowerCase().replace(/\s+/g, '-');
  
  if (!validGenres.includes(normalizedGenre)) {
    throw new Error(`Invalid genre: ${genre}`);
  }

  const endpoint = `/genre/${normalizedGenre}?page=${page}`;
  const cacheKey = `anime_genre_${generateRequestKey('genre', { genre: normalizedGenre, page })}`;

  browseAbortManager.abort(normalizedGenre);

  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      const controller = new AbortController();
      browseAbortManager.register(normalizedGenre, controller);

      try {
        const data = await trackedFetch(`${API_ROOT}${endpoint}`, {
          ...options,
          signal: controller.signal,
          cacheKey,
        });
        return data;
      } finally {
        browseAbortManager.cleanup(normalizedGenre);
      }
    },
    5 * 60 * 1000
  );
};

export const browseByLetter = async (letter, page = 1, options = {}) => {
  const validLetters = [
    'all', 'other', '0-9',
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
    'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'
  ];
  
  const normalizedLetter = letter.toLowerCase();
  
  if (!validLetters.includes(normalizedLetter)) {
    throw new Error(`Invalid letter: ${letter}`);
  }

  const endpoint = `/az-list/${normalizedLetter}?page=${page}`;
  const cacheKey = `anime_letter_${generateRequestKey('letter', { letter: normalizedLetter, page })}`;

  browseAbortManager.abort(normalizedLetter);

  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      const controller = new AbortController();
      browseAbortManager.register(normalizedLetter, controller);

      try {
        const data = await trackedFetch(`${API_ROOT}${endpoint}`, {
          ...options,
          signal,
          cacheKey,
        });
        return data;
      } finally {
        browseAbortManager.cleanup(normalizedLetter);
      }
    },
    5 * 60 * 1000
  );
};

export const browseByProducer = async (producerId, page = 1, options = {}) => {
  const endpoint = `/producer/${encodeURIComponent(producerId)}?page=${page}`;
  const cacheKey = `anime_producer_${generateRequestKey('producer', { producerId, page })}`;

  browseAbortManager.abort(producerId);

  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      const controller = new AbortController();
      browseAbortManager.register(producerId, controller);

      try {
        const data = await trackedFetch(`${API_ROOT}${endpoint}`, {
          ...options,
          signal,
          cacheKey,
        });
        return data;
      } finally {
        browseAbortManager.cleanup(producerId);
      }
    },
    5 * 60 * 1000
  );
};

export const filterAnime = async (params = {}, options = {}) => {
  const {
    keyword = '',
    type = 'all',
    status = 'all',
    rated = 'all',
    score = 'all',
    season = 'all',
    language = 'all',
    sort = 'default',
    genres = '',
    page = 1
  } = params;
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
  });
  
  if (keyword) queryParams.append('keyword', keyword);
  if (type !== 'all') queryParams.append('type', type);
  if (status !== 'all') queryParams.append('status', status);
  if (rated !== 'all') queryParams.append('rated', rated);
  if (score !== 'all') queryParams.append('score', score);
  if (season !== 'all') queryParams.append('season', season);
  if (language !== 'all') queryParams.append('language', language);
  if (sort !== 'default') queryParams.append('sort', sort);
  if (genres) queryParams.append('genres', genres);
  
  const endpoint = `/filter?${queryParams.toString()}`;
  const cacheKey = `anime_filter_${generateRequestKey('filter', params)}`;

  browseAbortManager.abort('filter');

  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      const controller = new AbortController();
      browseAbortManager.register('filter', controller);

      try {
        const data = await trackedFetch(`${API_ROOT}${endpoint}`, {
          ...options,
          signal: controller.signal,
          cacheKey,
        });
        return data;
      } finally {
        browseAbortManager.cleanup('filter');
      }
    },
    5 * 60 * 1000
  );
};

// ==================== SCHEDULE ====================

export const getSchedule = async (date, options = {}) => {
  const endpoint = `/schedule?date=${encodeURIComponent(date)}`;
  const cacheKey = `anime_schedule_${generateRequestKey('schedule', { date })}`;
  
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      return trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });
    },
    5 * 60 * 1000
  );
};

export const getNextEpisode = async (animeId, options = {}) => {
  const endpoint = `/schedule/next/${encodeURIComponent(animeId)}`;
  const cacheKey = `anime_next_ep_${generateRequestKey('nextEpisode', { animeId })}`;
  
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      return trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });
    },
    5 * 60 * 1000
  );
};

// ==================== CHARACTERS ====================

export const getCharacters = async (id, page = 1, options = {}) => {
  const endpoint = `/characters/${encodeURIComponent(id)}?page=${page}`;
  const cacheKey = `anime_characters_${generateRequestKey('characters', { id, page })}`;
  
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      return trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });
    },
    10 * 60 * 1000 // 10 minute cache for characters
  );
};

export const getCharacterDetails = async (characterId, options = {}) => {
  const endpoint = `/character/${encodeURIComponent(characterId)}`;
  const cacheKey = `anime_character_${generateRequestKey('character', { characterId })}`;
  
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      return trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });
    },
    10 * 60 * 1000
  );
};

export const getActorDetails = async (actorId, options = {}) => {
  const endpoint = `/actor/${encodeURIComponent(actorId)}`;
  const cacheKey = `anime_actor_${generateRequestKey('actor', { actorId })}`;
  
  return getOrCreateRequest(
    cacheKey,
    async ({ signal }) => {
      return trackedFetch(`${API_ROOT}${endpoint}`, {
        ...options,
        signal,
        cacheKey,
      });
    },
    10 * 60 * 1000
  );
};

// ==================== UTILITY FUNCTIONS ====================

export function extractEpisodes(data, provider) {
  if (!data) return [];

  // Handle hianime-scrap format
  if (provider === 'hianime-scrap' && data && data.data && Array.isArray(data.data)) {
    return data.data.map((ep, index) => ({
      id: ep.id || `${index + 1}`,
      number: ep.episodeNumber || ep.number || index + 1,
      title: ep.title || ep.alternativeTitle || `Episode ${ep.episodeNumber || ep.number || index + 1}`,
      isFiller: ep.isFiller || false
    }));
  }

  if (Array.isArray(data)) {
    return data.map((ep, index) => ({
      id: ep.id || ep.episodeId || `${index + 1}`,
      number: ep.number || ep.episode || ep.ep || ep.episodeNumber || index + 1,
      title: ep.title || ep.name || `Episode ${index + 1}`
    }));
  }

  if (data.episodes && Array.isArray(data.episodes)) {
    return data.episodes.map((ep, index) => ({
      id: ep.id || ep.episodeId || `${index + 1}`,
      number: ep.number || ep.episode || ep.ep || ep.episodeNumber || index + 1,
      title: ep.title || ep.name || `Episode ${index + 1}`
    }));
  }

  if (data.data && Array.isArray(data.data)) {
    return data.data.map((ep, index) => ({
      id: ep.id || ep.episodeId || `${index + 1}`,
      number: ep.number || ep.episode || ep.ep || ep.episodeNumber || index + 1,
      title: ep.title || ep.name || `Episode ${index + 1}`
    }));
  }

  return [];
}

export function normalizeAnimeData(data, id, provider) {
  if (data && data.data && provider === 'hianime-scrap') {
    return {
      ...data.data,
      id: data.data.id || id,
      title: data.data.title,
      poster: data.data.poster,
      image: data.data.poster,
      type: data.data.type,
      status: data.data.status,
      genres: data.data.genres || [],
      description: data.data.description || data.data.synopsis || '',
      totalEpisodes: data.data.episodes?.eps || data.data.episodes?.sub || data.data.episodes?.dub || 'Unknown'
    };
  }

  if (Array.isArray(data)) {
    const match = data.find(item => item && item.id === id) || data[0];
    if (match) return { ...match, id: match.id || id };
    return { id, episodes: [] };
  }

  if (data && data.results && Array.isArray(data.results)) {
    const match = data.results.find(item => item && item.id === id) || data.results[0];
    if (match) return { ...match, id: match.id || id };
    return { ...data, id: data.id || id };
  }

  if (data && data.data) {
    return { ...data.data, id: data.data.id || id };
  }

  if (data && (data.title || data.name || data.englishName)) {
    return { ...data, id: data.id || id };
  }

  return { id, ...(data || {}) };
}

export const getPosterUrl = (poster) => {
  if (!poster) return 'https://via.placeholder.com/300x450?text=No+Image';
  if (poster.startsWith('http')) return poster;
  return poster;
};

export const parseAnimeId = (id) => {
  if (id.includes('::ep=')) {
    const [animeId, episodePart] = id.split('::ep=');
    return {
      animeId,
      episodeNumber: parseInt(episodePart, 10)
    };
  }
  return { animeId: id, episodeNumber: null };
};

export const buildEpisodeId = (animeId, episodeNumber) => {
  return `${animeId}::ep=${episodeNumber}`;
};

// Export cache utilities for debugging
export { cancelRequest, clearCache, getCachedResponse, setCacheResponse };

// ==================== EXPORT ====================

export default {
  // Home & Discovery
  getHomeData,
  getSpotlight,
  getTopTen,
  getMetaInfo,
  
  // Search
  searchAnime,
  getSuggestions,
  
  // Details
  getAnimeDetails,
  getRandomAnime,
  
  // Episodes
  getEpisodes,
  getServers,
  getStreamLink,
  getProxiedStreamUrl,
  getProxiedSubtitleUrl,
  
  // Browse
  browseByQuery,
  browseByGenre,
  browseByLetter,
  browseByProducer,
  filterAnime,
  
  // Schedule
  getSchedule,
  getNextEpisode,
  
  // Characters
  getCharacters,
  getCharacterDetails,
  getActorDetails,
  
  // Utilities
  getPosterUrl,
  parseAnimeId,
  buildEpisodeId,
  buildUrl,
  extractEpisodes,
  normalizeAnimeData,
  
  // Retry Configuration
  retryConfig,
  setRetryConfig,
  getRetryConfig,
  fetchWithRetry,
};

