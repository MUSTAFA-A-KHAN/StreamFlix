import { RATING_THRESHOLDS, TMDB_CONFIG } from './constants'

// Format date to readable string
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Get TMDB image URL
export const getImageUrl = (path, size = 'w500') => {
  if (!path) return null
  return `${TMDB_CONFIG.IMAGE_BASE_URL}/${size}${path}`
}

// Format year from date string
export const getYear = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).getFullYear()
}

// Format runtime to hours and minutes
export const formatRuntime = (minutes) => {
  if (!minutes) return 'N/A'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

// Format rating to one decimal place
export const formatRating = (rating) => {
  if (!rating) return '0.0'
  return rating.toFixed(1)
}

// Get rating color based on score
export const getRatingColor = (rating) => {
  if (rating >= RATING_THRESHOLDS.EXCELLENT) return 'text-green-500'
  if (rating >= RATING_THRESHOLDS.GOOD) return 'text-yellow-500'
  if (rating >= RATING_THRESHOLDS.AVERAGE) return 'text-orange-500'
  return 'text-red-500'
}

// Get rating badge color
export const getRatingBadgeColor = (rating) => {
  if (rating >= RATING_THRESHOLDS.EXCELLENT) return 'bg-green-600'
  if (rating >= RATING_THRESHOLDS.GOOD) return 'bg-yellow-600'
  if (rating >= RATING_THRESHOLDS.AVERAGE) return 'bg-orange-600'
  return 'bg-red-600'
}

// Truncate text to specified length
export const truncateText = (text, maxLength = 150) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

// Get genre names from genre IDs
export const getGenreNames = (genreIds, genresList) => {
  if (!genreIds || !genresList) return []
  return genreIds
    .map(id => genresList.find(g => g.id === id))
    .filter(Boolean)
    .map(g => g.name)
}

// Format number with K, M, B suffixes
export const formatNumber = (num) => {
  if (!num) return '0'
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B'
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

// Get initials from name
export const getInitials = (name) => {
  if (!name) return ''
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Slugify text
export const slugify = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Debounce function
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Check if element is in viewport
export const isInViewport = (element) => {
  if (!element) return false
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Sleep function for testing
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Parse query string
export const parseQueryString = (queryString) => {
  const params = new URLSearchParams(queryString)
  const result = {}
  for (const [key, value] of params) {
    result[key] = value
  }
  return result
}

// Build query string
export const buildQueryString = (params) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value)
    }
  })
  return searchParams.toString()
}

// Get media type from URL or context
export const getMediaTypeFromUrl = (path) => {
  if (!path) return 'movie'
  if (path.includes('/tv/')) return 'tv'
  return 'movie'
}

// Validate YouTube URL
export const isValidYouTubeUrl = (url) => {
  if (!url) return false
  const regExp = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
  return regExp.test(url)
}

// Extract YouTube video ID
export const getYouTubeVideoId = (url) => {
  if (!url) return null
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  return (match && match[2].length === 11) ? match[2] : null
}

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Check if array includes value
export const includes = (arr, value) => {
  if (!Array.isArray(arr)) return false
  return arr.includes(value)
}

// Remove duplicates from array
export const unique = (arr, key) => {
  if (!Array.isArray(arr)) return []
  const seen = new Set()
  return arr.filter(item => {
    const val = key ? item[key] : item
    if (seen.has(val)) return false
    seen.add(val)
    return true
  })
}

// Sort array by key
export const sortBy = (arr, key, order = 'desc') => {
  if (!Array.isArray(arr)) return []
  return [...arr].sort((a, b) => {
    if (order === 'desc') {
      return b[key] - a[key]
    }
    return a[key] - b[key]
  })
}

// Group array by key
export const groupBy = (arr, key) => {
  if (!Array.isArray(arr)) return {}
  return arr.reduce((groups, item) => {
    const group = item[key]
    groups[group] = groups[group] || []
    groups[group].push(item)
    return groups
  }, {})
}

// Get provider logo URL
export const getProviderLogo = (logoPath, size = 'original') => {
  if (!logoPath) return null
  return `${TMDB_CONFIG.IMAGE_BASE_URL}/${size}${logoPath}`
}

// Format price for rent/buy
export const formatPrice = (price) => {
  if (!price) return null
  return `$${price.toFixed(2)}`
}

// vidsrc embed URL generator
export const getVidsrcEmbedUrl = (imdbId, type = 'movie', season = 1, episode = 1) => {
  if (!imdbId) return null
  
  // Ensure IMDB ID format (tt + numbers)
  const formattedId = imdbId.startsWith('tt') ? imdbId : `tt${imdbId}`
  const unformattedId = imdbId.replace("tt","")
  
  if (type === 'tv') {
    return `https://vidsrc-embed.ru/embed/tv?tmdb=${unformattedId}&season=${season}&episode=${episode}`
  }
  return `https://vidsrc-embed.ru/embed/movie?imdb=${formattedId}`
}

