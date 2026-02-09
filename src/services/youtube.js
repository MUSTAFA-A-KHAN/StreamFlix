import { YOUTUBE_EMBED_URL, YOUTUBE_WATCH_URL } from '../utils/constants'

// YouTube API Configuration
// For advanced features, you may need a YouTube Data API key from:
// https://console.cloud.google.com/

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || ''

// Build YouTube embed URL
export const getYouTubeEmbedUrl = (videoId, autoplay = true) => {
  if (!videoId) return null
  const params = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    modestbranding: '1',
    rel: '0',
    iv_load_policy: '3',
    cc_load_policy: '0',
    fs: '1',
    enablejsapi: '1',
  })
  return `${YOUTUBE_EMBED_URL}/${videoId}?${params.toString()}`
}

// Get YouTube watch URL
export const getYouTubeWatchUrl = (videoId) => {
  if (!videoId) return null
  return `${YOUTUBE_WATCH_URL}${videoId}`
}

// Extract video ID from various YouTube URL formats
export const extractYouTubeVideoId = (url) => {
  if (!url) return null
  
  // Regular YouTube URLs
  const regExp1 = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match1 = url.match(regExp1)
  if (match1 && match1[2].length === 11) {
    return match1[2]
  }
  
  // Short youtu.be URLs
  const regExp2 = /^.*youtu.be\/([^#&?]*).*/
  const match2 = url.match(regExp2)
  if (match2 && match2[1].length === 11) {
    return match2[1]
  }
  
  return null
}

// Validate YouTube URL
export const isValidYouTubeUrl = (url) => {
  if (!url) return false
  const regExp = /^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
  return regExp.test(url)
}

// Check if URL is a YouTube video
export const isYouTubeVideo = (url) => {
  if (!url) return false
  return extractYouTubeVideoId(url) !== null
}

// Get thumbnail URL
export const getYouTubeThumbnail = (videoId, quality = 'high') => {
  if (!videoId) return null
  
  const thumbnails = {
    high: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    medium: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
    low: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
  }
  
  return thumbnails[quality] || thumbnails.high
}

// Search YouTube videos (requires API key)
export const searchYouTubeVideos = async (query, maxResults = 10) => {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured')
    return []
  }
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`
    )
    
    if (!response.ok) {
      throw new Error('YouTube API request failed')
    }
    
    const data = await response.json()
    
    return data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
    }))
  } catch (error) {
    console.error('YouTube search error:', error)
    return []
  }
}

// Get video details (requires API key)
export const getYouTubeVideoDetails = async (videoId) => {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not configured')
    return null
  }
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${YOUTUBE_API_KEY}`
    )
    
    if (!response.ok) {
      throw new Error('YouTube API request failed')
    }
    
    const data = await response.json()
    
    if (data.items && data.items.length > 0) {
      const item = data.items[0]
      return {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        viewCount: item.statistics?.viewCount || 0,
        likeCount: item.statistics?.likeCount || 0,
      }
    }
    
    return null
  } catch (error) {
    console.error('YouTube video details error:', error)
    return null
  }
}

// Player configuration for React Player
export const playerConfig = {
  youtube: {
    playerVars: {
      autoplay: 1,
      modestbranding: 1,
      rel: 0,
      iv_load_policy: 3,
      cc_load_policy: 0,
      fs: 1,
      enablejsapi: 1,
      origin: window.location.origin,
    },
    preload: true,
  },
  vimeo: {
    playerOptions: {
      autoplay: true,
      byline: false,
      portrait: false,
      title: false,
    },
  },
}

// Format view count
export const formatViewCount = (count) => {
  if (!count) return '0'
  if (count >= 1000000000) return (count / 1000000000).toFixed(1) + 'B views'
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M views'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K views'
  return count + ' views'
}

// Format like count
export const formatLikeCount = (count) => {
  if (!count) return '0'
  if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M'
  if (count >= 1000) return (count / 1000).toFixed(1) + 'K'
  return count.toString()
}

