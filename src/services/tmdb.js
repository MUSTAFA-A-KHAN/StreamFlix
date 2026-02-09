import axios from 'axios'
import { API_ENDPOINTS, TMDB_CONFIG } from '../utils/constants'

// Create axios instance for TMDB
const tmdbApi = axios.create({
  baseURL: TMDB_CONFIG.BASE_URL,
  params: {
    api_key: TMDB_CONFIG.API_KEY,
    language: 'en-US',
  },
})

// Request interceptor for logging
tmdbApi.interceptors.request.use(
  (config) => {
    console.log(`TMDB API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('TMDB API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
tmdbApi.interceptors.response.use(
  (response) => {
    console.log(`TMDB API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('TMDB API Response Error:', error.response?.data || error.message)
    
    // Handle specific error codes
    if (error.response?.status === 401) {
      console.error('TMDB API Key is invalid or expired')
    } else if (error.response?.status === 404) {
      console.error('TMDB Resource not found')
    } else if (error.response?.status >= 500) {
      console.error('TMDB Server error')
    }
    
    return Promise.reject(error)
  }
)

// Generic fetch function with error handling
const fetchFromTMDB = async (endpoint, params = {}) => {
  try {
    const response = await tmdbApi.get(endpoint, { params })
    return response.data
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error)
    throw error
  }
}

// ============ MOVIE APIs ============

// Get trending movies and TV shows
export const getTrending = async (timeWindow = 'week', mediaType = 'all') => {
  return fetchFromTMDB(API_ENDPOINTS.TRENDING, {
    time_window: timeWindow,
  })
}

// Get popular movies
export const getPopularMovies = async (page = 1) => {
  return fetchFromTMDB(API_ENDPOINTS.POPULAR_MOVIES, { page })
}

// Get top rated movies
export const getTopRatedMovies = async (page = 1) => {
  return fetchFromTMDB(API_ENDPOINTS.TOP_RATED_MOVIES, { page })
}

// Get upcoming movies
export const getUpcomingMovies = async (page = 1) => {
  return fetchFromTMDB(API_ENDPOINTS.UPCOMING_MOVIES, { page })
}

// Get now playing movies
export const getNowPlayingMovies = async (page = 1) => {
  return fetchFromTMDB(API_ENDPOINTS.NOW_PLAYING_MOVIES, { page })
}

// Get movie details
export const getMovieDetails = async (movieId) => {
  return fetchFromTMDB(API_ENDPOINTS.MOVIE_DETAILS(movieId))
}

// Get movie credits (cast and crew)
export const getMovieCredits = async (movieId) => {
  return fetchFromTMDB(API_ENDPOINTS.MOVIE_CREDITS(movieId))
}

// Get movie videos (trailers, teasers, etc.)
export const getMovieVideos = async (movieId) => {
  return fetchFromTMDB(API_ENDPOINTS.MOVIE_VIDEOS(movieId))
}

// Get movie recommendations
export const getMovieRecommendations = async (movieId, page = 1) => {
  return fetchFromTMDB(API_ENDPOINTS.MOVIE_RECOMMENDATIONS(movieId), { page })
}

// ============ TV SHOW APIs ============

// Get popular TV shows
export const getPopularTV = async (page = 1) => {
  return fetchFromTMDB(API_ENDPOINTS.POPULAR_TV, { page })
}

// Get top rated TV shows
export const getTopRatedTV = async (page = 1) => {
  return fetchFromTMDB(API_ENDPOINTS.TOP_RATED_TV, { page })
}

// Get TV shows on the air
export const getOnTheAirTV = async (page = 1) => {
  return fetchFromTMDB(API_ENDPOINTS.ON_THE_AIR_TV, { page })
}

// Get TV show details
export const getTVDetails = async (tvId) => {
  return fetchFromTMDB(API_ENDPOINTS.TV_DETAILS(tvId))
}

// Get TV credits
export const getTVCredits = async (tvId) => {
  return fetchFromTMDB(API_ENDPOINTS.TV_CREDITS(tvId))
}

// Get TV videos
export const getTVVideos = async (tvId) => {
  return fetchFromTMDB(API_ENDPOINTS.TV_VIDEOS(tvId))
}

// Get TV recommendations
export const getTVRecommendations = async (tvId, page = 1) => {
  return fetchFromTMDB(API_ENDPOINTS.TV_RECOMMENDATIONS(tvId), { page })
}

// ============ SEARCH APIs ============

// Search movies
export const searchMovies = async (query, page = 1) => {
  if (!query || query.trim() === '') return { results: [], total_results: 0 }
  return fetchFromTMDB(API_ENDPOINTS.SEARCH_MOVIES, {
    query: query.trim(),
    page,
    include_adult: false,
  })
}

// Search multi (movies, TV shows, people)
export const searchMulti = async (query, page = 1) => {
  if (!query || query.trim() === '') return { results: [], total_results: 0 }
  return fetchFromTMDB(API_ENDPOINTS.SEARCH_MULTI, {
    query: query.trim(),
    page,
    include_adult: false,
  })
}

// Search TV show by ID for detailed info (uses /tv/{id} endpoint)
export const searchTVShow = async (tvId) => {
  return fetchFromTMDB(API_ENDPOINTS.TV_DETAILS(tvId))
}

// ============ DISCOVER APIs ============

// Discover movies by genre, year, rating, etc.
export const discoverMovies = async (params = {}) => {
  const defaultParams = {
    page: 1,
    sort_by: 'popularity.desc',
    include_adult: false,
    language: 'en-US',
  }
  return fetchFromTMDB(API_ENDPOINTS.DISCOVER_MOVIE, { ...defaultParams, ...params })
}

// Discover TV shows
export const discoverTV = async (params = {}) => {
  const defaultParams = {
    page: 1,
    sort_by: 'popularity.desc',
    include_adult: false,
    language: 'en-US',
  }
  return fetchFromTMDB(API_ENDPOINTS.DISCOVER_TV, { ...defaultParams, ...params })
}

// ============ GENRE APIs ============

// Get movie genres
export const getMovieGenres = async () => {
  return fetchFromTMDB(API_ENDPOINTS.GENRE_MOVIES)
}

// Get TV genres
export const getTVGenres = async () => {
  return fetchFromTMDB(API_ENDPOINTS.GENRE_TV)
}

// ============ PERSON APIs ============

// Get person details
export const getPersonDetails = async (personId) => {
  return fetchFromTMDB(API_ENDPOINTS.PERSON_DETAILS(personId))
}

// Get person movie credits
export const getPersonMovieCredits = async (personId) => {
  return fetchFromTMDB(API_ENDPOINTS.PERSON_MOVIE_CREDITS(personId))
}

// Get person TV credits
export const getPersonTVCredits = async (personId) => {
  return fetchFromTMDB(API_ENDPOINTS.PERSON_TV_CREDITS(personId))
}

// ============ HELPER FUNCTIONS ============

// Get media details based on type
export const getMediaDetails = async (id, type) => {
  if (type === 'tv') {
    return getTVDetails(id)
  }
  return getMovieDetails(id)
}

// Get media credits
export const getMediaCredits = async (id, type) => {
  if (type === 'tv') {
    return getTVCredits(id)
  }
  return getMovieCredits(id)
}

// Get media videos (filter for trailer)
export const getMediaVideos = async (id, type) => {
  const videos = type === 'tv' ? await getTVVideos(id) : await getMovieVideos(id)
  
  // Filter for trailer and prioritize official trailer
  const trailer = videos.results.find(
    video => video.type === 'Trailer' && video.site === 'YouTube'
  ) || videos.results.find(
    video => video.type === 'Teaser' && video.site === 'YouTube'
  ) || videos.results[0]
  
  return trailer
}

// Get multiple pages of results
export const getMultiplePages = async (fetchFunction, totalPages = 5) => {
  const results = []
  for (let page = 1; page <= totalPages; page++) {
    try {
      const data = await fetchFunction(page)
      results.push(...data.results)
    } catch (error) {
      console.error(`Error fetching page ${page}:`, error)
      break
    }
  }
  return results
}

// ============ WATCH PROVIDERS APIs ============

// Get movie watch providers (where to watch)
export const getMovieWatchProviders = async (movieId) => {
  return fetchFromTMDB(API_ENDPOINTS.MOVIE_WATCH_PROVIDERS(movieId))
}

// Get TV show watch providers
export const getTVWatchProviders = async (tvId) => {
  return fetchFromTMDB(API_ENDPOINTS.TV_WATCH_PROVIDERS(tvId))
}

// Get watch providers and filter for free options
export const getFreeWatchProviders = async (id, type) => {
  try {
    const providers = type === 'tv' 
      ? await getTVWatchProviders(id)
      : await getMovieWatchProviders(id)
    
    // Get US providers (most complete)
    const usProviders = providers.results?.US
    
    if (!usProviders) {
      return {
        flatrate: null,
        rent: null,
        buy: null,
        free: null,
        link: null,
      }
    }
    
    // Free streaming providers
    const freeProviders = usProviders.free || null
    
    // Flatrate (subscription)
    const flatrate = usProviders.flatrate || null
    
    // Rent options
    const rent = usProviders.rent || null
    
    // Buy options
    const buy = usProviders.buy || null
    
    // Get link to watch on TMDB
    const link = providers.results?.link || null
    
    return {
      flatrate,
      rent,
      buy,
      free: freeProviders,
      link,
      all: {
        ...(freeProviders && { free: freeProviders }),
        ...(flatrate && { flatrate }),
        ...(rent && { rent }),
        ...(buy && { buy }),
      },
    }
  } catch (error) {
    console.error('Error fetching watch providers:', error)
    return {
      flatrate: null,
      rent: null,
      buy: null,
      free: null,
      link: null,
    }
  }
}

// Get embeddable video for a movie/show
export const getEmbeddableVideo = async (id, type) => {
  try {
    // Get all videos
    const videos = type === 'tv' 
      ? await getTVVideos(id)
      : await getMovieVideos(id)
    
    // Look for trailer or teaser
    const trailer = videos.results?.find(
      v => v.type === 'Trailer' && v.site === 'YouTube'
    ) || videos.results?.find(
      v => v.type === 'Teaser' && v.site === 'YouTube'
    )
    
    return trailer || null
  } catch (error) {
    console.error('Error fetching embeddable video:', error)
    return null
  }
}

// Export the API instance for custom requests
export { tmdbApi }

