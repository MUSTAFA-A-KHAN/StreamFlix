// TMDB API Configuration
// Get your free API key from: https://www.themoviedb.org/settings/api

export const TMDB_CONFIG = {
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  API_KEY: import.meta.env.VITE_TMDB_API_KEY || 'YOUR_TMDB_API_KEY',
}

// Image sizes for TMDB
export const IMAGE_SIZES = {
  POSTER: {
    SMALL: '/w200',
    MEDIUM: '/w300',
    LARGE: '/w500',
    ORIGINAL: '/original',
  },
  BACKDROP: {
    SMALL: '/w300',
    MEDIUM: '/w780',
    LARGE: '/w1280',
    ORIGINAL: '/original',
  },
  PROFILE: {
    SMALL: '/w45',
    MEDIUM: '/w185',
    LARGE: '/w342',
    ORIGINAL: '/original',
  },
}

// Get full image URL
export const getImageUrl = (path, size = 'w500') => {
  if (!path) return 'https://via.placeholder.com/500x750?text=No+Image'
  return `${TMDB_CONFIG.IMAGE_BASE_URL}/${size}${path}`
}

// Get poster URL
export const getPosterUrl = (path, size = 'w500') => {
  return getImageUrl(path, size)
}

// Get backdrop URL
export const getBackdropUrl = (path, size = 'w780') => {
  return getImageUrl(path, size)
}

// API Endpoints
export const API_ENDPOINTS = {
  TRENDING: '/trending/all/week',
  POPULAR_MOVIES: '/movie/popular',
  TOP_RATED_MOVIES: '/movie/top_rated',
  UPCOMING_MOVIES: '/movie/upcoming',
  NOW_PLAYING_MOVIES: '/movie/now_playing',
  POPULAR_TV: '/tv/popular',
  TOP_RATED_TV: '/tv/top_rated',
  ON_THE_AIR_TV: '/tv/on_the_air',
  MOVIE_DETAILS: (id) => `/movie/${id}`,
  TV_DETAILS: (id) => `/tv/${id}`,
  MOVIE_CREDITS: (id) => `/movie/${id}/credits`,
  TV_CREDITS: (id) => `/tv/${id}/credits`,
  MOVIE_VIDEOS: (id) => `/movie/${id}/videos`,
  TV_VIDEOS: (id) => `/tv/${id}/videos`,
  MOVIE_WATCH_PROVIDERS: (id) => `/movie/${id}/watch/providers`,
  TV_WATCH_PROVIDERS: (id) => `/tv/${id}/watch/providers`,
  SEARCH_MOVIES: '/search/movie',
  SEARCH_MULTI: '/search/multi',
  DISCOVER_MOVIE: '/discover/movie',
  DISCOVER_TV: '/discover/tv',
  GENRE_MOVIES: '/genre/movie/list',
  GENRE_TV: '/genre/tv/list',
  MOVIE_RECOMMENDATIONS: (id) => `/movie/${id}/recommendations`,
  TV_RECOMMENDATIONS: (id) => `/tv/${id}/recommendations`,
  PERSON_DETAILS: (id) => `/person/${id}`,
  PERSON_MOVIE_CREDITS: (id) => `/person/${id}/movie_credits`,
  PERSON_TV_CREDITS: (id) => `/person/${id}/tv_credits`,
}

// Genre IDs
export const GENRES = {
  MOVIE: [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' },
    { id: 10770, name: 'TV Movie' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' },
  ],
  TV: [
    { id: 10759, name: 'Action & Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 10762, name: 'Kids' },
    { id: 9648, name: 'Mystery' },
    { id: 10763, name: 'News' },
    { id: 10764, name: 'Reality' },
    { id: 10765, name: 'Sci-Fi & Fantasy' },
    { id: 10766, name: 'Soap' },
    { id: 10767, name: 'Talk' },
    { id: 10768, name: 'War & Politics' },
    { id: 37, name: 'Western' },
  ],
}

// Media Types
export const MEDIA_TYPES = {
  ALL: 'all',
  MOVIE: 'movie',
  TV: 'tv',
  PERSON: 'person',
}

// Time Windows for Trending
export const TIME_WINDOWS = {
  DAY: 'day',
  WEEK: 'week',
}

// Rating thresholds
export const RATING_THRESHOLDS = {
  EXCELLENT: 8,
  GOOD: 7,
  AVERAGE: 6,
  POOR: 5,
}

// App Info
export const APP_INFO = {
  NAME: 'StreamFlix',
  TAGLINE: 'Your Ultimate Entertainment Platform',
  VERSION: '1.0.0',
  DESCRIPTION: 'Watch movies and TV shows online. StreamFlix is your destination for the best entertainment content.',
  DEVELOPER: 'StreamFlix Team',
}

// YouTube Embed URL
export const YOUTUBE_EMBED_URL = 'https://www.youtube.com/embed'
export const YOUTUBE_WATCH_URL = 'https://www.youtube.com/watch?v='

// vidsrcme.ru Streaming URL
export const VIDSRC_BASE_URL = 'https://vidsrcme.ru'
export const VIDSRC_EMBED_MOVIE = '/embed/movie'
export const VIDSRC_EMBED_TV = '/embed/tv'

// Streaming Provider Information
export const STREAMING_PROVIDERS = {
  // Free providers
  'tubitv': {
    name: 'Tubi',
    type: 'free',
    color: '#fa6900',
    logo: 'https://image.tmdb.org/t/p/original/p2fQlj6H171Z5IO9C7bW2nmV6w9.png',
  },
  'pluto': {
    name: 'Pluto TV',
    type: 'free',
    color: '#ffa31a',
    logo: 'https://image.tmdb.org/t/p/original/tnqtG50J5XbgVMR6OL18gojJz9z.png',
  },
  'crackle': {
    name: 'Crackle',
    type: 'free',
    color: '#00a5e0',
    logo: 'https://image.tmdb.org/t/p/original/1W0Ykq3VJ9jSgF1Y3F8L4N5M6P7.png',
  },
  'vudu': {
    name: 'Vudu',
    type: 'free',
    color: '#5c5c5c',
    logo: 'https://image.tmdb.org/t/p/original/8f0g7g6g7g8g9g0g1g2g3g4g5g6.png',
  },
  'peacock': {
    name: 'Peacock',
    type: 'free',
    color: '#000000',
    logo: 'https://image.tmdb.org/t/p/original/d7d16ee1e1g2h3i4j5k6l7m8n9o.png',
  },
  'youtube': {
    name: 'YouTube',
    type: 'free',
    color: '#ff0000',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  'plex': {
    name: 'Plex',
    type: 'free',
    color: '#c9c9c9',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  'kanopy': {
    name: 'Kanopy',
    type: 'free',
    color: '#1db954',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  
  // Subscription providers
  'netflix': {
    name: 'Netflix',
    type: 'subscription',
    color: '#e50914',
    logo: 'https://image.tmdb.org/t/p/original/tuya9l7l1l1l2l3l4l5l6l7l8l9.png',
  },
  'disney': {
    name: 'Disney+',
    type: 'subscription',
    color: '#113ccf',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  'hbo': {
    name: 'Max',
    type: 'subscription',
    color: '#5c3d9e',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  'hulu': {
    name: 'Hulu',
    type: 'subscription',
    color: '#1ce783',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  'prime': {
    name: 'Prime Video',
    type: 'subscription',
    color: '#00a8e1',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  'apple': {
    name: 'Apple TV+',
    type: 'subscription',
    color: '#000000',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  'paramount': {
    name: 'Paramount+',
    type: 'subscription',
    color: '#0064ff',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  'peacock': {
    name: 'Peacock',
    type: 'subscription',
    color: '#000000',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  
  // Rent/Buy
  'viddla': {
    name: 'Viddla',
    type: 'rent_buy',
    color: '#f50057',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  'amazone': {
    name: 'Amazon Video',
    type: 'rent_buy',
    color: '#00a8e1',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  'apple_tv': {
    name: 'Apple TV',
    type: 'rent_buy',
    color: '#000000',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  'google': {
    name: 'Google Play',
    type: 'rent_buy',
    color: '#4285f4',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  'microsoft': {
    name: 'Microsoft Store',
    type: 'rent_buy',
    color: '#00a4ef',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
  'youtube_premium': {
    name: 'YouTube Premium',
    type: 'subscription',
    color: '#ff0000',
    logo: 'https://image.tmdb.org/t/p/original/something.png',
  },
}

// Helper to get provider info
export const getProviderInfo = (providerId) => {
  // Provider ID to name mapping (common IDs)
  const providerMap = {
    2: 'netflix',
    3: 'prime',
    7: 'disney',
    119: 'hulu',
    1899: 'hbo',
    237: 'paramount',
    248: 'apple',
    346: 'peacock',
    1402: 'tubitv',
    228: 'pluto',
    103: 'crackle',
    426: 'vudu',
    613: 'apple_tv',
    2: 'viddla',
    192: 'youtube',
    330: 'plex',
    895: 'kanopy',
    311: 'google',
    478: 'microsoft',
    185: 'amazon_video',
  }
  
  const providerKey = providerMap[providerId]
  return providerKey ? STREAMING_PROVIDERS[providerKey] : null
}

// Streaming type labels
export const STREAMING_TYPES = {
  free: 'Free',
  subscription: 'Subscription',
  rent: 'Rent',
  buy: 'Buy',
}

