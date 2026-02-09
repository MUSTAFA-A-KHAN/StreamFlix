/**
 * API Request Cache and Deduplication Utility
 * Prevents multiple API calls for the same endpoint
 */

// In-memory cache with TTL
const apiCache = new Map();
const inFlightRequests = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

/**
 * Generate a unique cache key from URL and options
 */
function generateCacheKey(url, options = {}) {
  const relevantOptions = {
    method: options.method || 'GET',
    body: options.body,
  };
  return `${url}::${JSON.stringify(relevantOptions)}`;
}

/**
 * Clean expired cache entries
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of apiCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      apiCache.delete(key);
    }
  }
}

// Cleanup cache every 10 minutes
setInterval(cleanupCache, 10 * 60 * 1000);

/**
 * Get cached response if available and not expired
 */
export function getCachedResponse(cacheKey) {
  const entry = apiCache.get(cacheKey);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    apiCache.delete(cacheKey);
    return null;
  }
  
  return entry.data;
}

/**
 * Store response in cache
 */
export function setCacheResponse(cacheKey, data) {
  apiCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Get or create a promise for an in-flight request
 * This prevents duplicate requests to the same endpoint
 */
export function getOrCreateRequest(cacheKey, fetcher, ttl = CACHE_TTL) {
  const existingRequest = inFlightRequests.get(cacheKey);
  if (existingRequest) {
    console.log(`[API Dedupe] Reusing in-flight request for: ${cacheKey}`);
    return existingRequest;
  }

  const controller = new AbortController();
  
  const promise = fetcher({ 
    signal: controller.signal,
    cacheKey 
  })
    .then((data) => {
      setCacheResponse(cacheKey, data);
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
      // Clear cache after TTL
      setTimeout(() => {
        const entry = apiCache.get(cacheKey);
        if (entry && Date.now() - entry.timestamp > ttl) {
          apiCache.delete(cacheKey);
        }
      }, ttl);
    });

  inFlightRequests.set(cacheKey, promise);
  console.log(`[API Dedupe] Created new request for: ${cacheKey}`);
  
  // Attach abort method to promise for convenience
  promise.abort = () => controller.abort();
  
  return promise;
}

/**
 * Cancel all in-flight requests
 */
export function cancelAllRequests() {
  for (const [key, promise] of inFlightRequests.entries()) {
    if (promise.abort) {
      promise.abort();
    }
    inFlightRequests.delete(key);
    console.log(`[API Dedupe] Cancelled request: ${key}`);
  }
}

/**
 * Cancel specific request by cache key
 */
export function cancelRequest(cacheKey) {
  const promise = inFlightRequests.get(cacheKey);
  if (promise && promise.abort) {
    promise.abort();
    inFlightRequests.delete(cacheKey);
    console.log(`[API Dedupe] Cancelled specific request: ${cacheKey}`);
  }
}

/**
 * Clear all cache
 */
export function clearCache() {
  apiCache.clear();
  console.log('[API Dedupe] Cache cleared');
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats() {
  return {
    cacheSize: apiCache.size,
    inFlightCount: inFlightRequests.size,
    ttl: CACHE_TTL,
  };
}

/**
 * Abort controller manager for React components
 */
export function createAbortControllerManager() {
  const controllers = new Map();
  
  return {
    register: (key, controller) => {
      // Cancel previous controller for same key
      if (controllers.has(key)) {
        controllers.get(key).abort();
      }
      controllers.set(key, controller);
    },
    abort: (key) => {
      if (controllers.has(key)) {
        controllers.get(key).abort();
        controllers.delete(key);
      }
    },
    abortAll: () => {
      for (const [key, controller] of controllers.entries()) {
        controller.abort();
      }
      controllers.clear();
    },
    cleanup: (key) => {
      if (controllers.has(key)) {
        controllers.delete(key);
      }
    },
  };
}

export default {
  getCachedResponse,
  setCacheResponse,
  getOrCreateRequest,
  cancelAllRequests,
  cancelRequest,
  clearCache,
  getCacheStats,
  createAbortControllerManager,
};

