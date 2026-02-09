import { useCallback, useEffect, useState } from 'react'
import * as tmdbService from '../services/tmdb'

// Hook for fetching movie details
export const useMovieDetails = (movieId) => {
  const [details, setDetails] = useState(null)
  const [credits, setCredits] = useState(null)
  const [videos, setVideos] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!movieId) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch all data in parallel
        const [detailsData, creditsData, videosData, recommendationsData] = await Promise.all([
          tmdbService.getMovieDetails(movieId),
          tmdbService.getMovieCredits(movieId),
          tmdbService.getMovieVideos(movieId),
          tmdbService.getMovieRecommendations(movieId),
        ])

        setDetails(detailsData)
        setCredits(creditsData)
        setVideos(videosData)
        setRecommendations(recommendationsData.results)
      } catch (err) {
        setError(err.message || 'Failed to fetch movie details')
        console.error('useMovieDetails error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [movieId])

  // Find trailer video
  const getTrailer = useCallback(() => {
    if (!videos) return null
    
    // Look for official trailer first
    const trailer = videos.results.find(
      video => video.type === 'Trailer' && video.site === 'YouTube' && video.official
    )
    
    // Fallback to any trailer
    return trailer || videos.results.find(
      video => video.type === 'Trailer' && video.site === 'YouTube'
    ) || videos.results[0]
  }, [videos])

  // Get director from crew
  const getDirector = useCallback(() => {
    if (!credits?.crew) return []
    return credits.crew.filter(person => person.job === 'Director')
  }, [credits])

  // Get cast members
  const getCast = useCallback(() => {
    if (!credits?.cast) return []
    return credits.cast.slice(0, 10) // Top 10 cast members
  }, [credits])

  return {
    details,
    credits,
    videos,
    recommendations,
    loading,
    error,
    getTrailer,
    getDirector,
    getCast,
  }
}

// Hook for fetching TV show details
export const useTVDetails = (tvId) => {
  const [details, setDetails] = useState(null)
  const [credits, setCredits] = useState(null)
  const [videos, setVideos] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!tvId) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [detailsData, creditsData, videosData, recommendationsData] = await Promise.all([
          tmdbService.getTVDetails(tvId),
          tmdbService.getTVCredits(tvId),
          tmdbService.getTVVideos(tvId),
          tmdbService.getTVRecommendations(tvId),
        ])

        setDetails(detailsData)
        setCredits(creditsData)
        setVideos(videosData)
        setRecommendations(recommendationsData.results)
      } catch (err) {
        setError(err.message || 'Failed to fetch TV show details')
        console.error('useTVDetails error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tvId])

  // Find trailer or teaser
  const getTrailer = useCallback(() => {
    if (!videos) return null
    
    const trailer = videos.results.find(
      video => video.type === 'Trailer' && video.site === 'YouTube' && video.official
    )
    
    return trailer || videos.results.find(
      video => video.type === 'Trailer' && video.site === 'YouTube'
    ) || videos.results[0]
  }, [videos])

  // Get creators/showrunners
  const getCreators = useCallback(() => {
    if (!credits?.crew) return []
    return credits.crew.filter(person => 
      person.job === 'Creator' || person.job === 'Executive Producer'
    )
  }, [credits])

  // Get cast members
  const getCast = useCallback(() => {
    if (!credits?.cast) return []
    return credits.cast.slice(0, 10)
  }, [credits])

  return {
    details,
    credits,
    videos,
    recommendations,
    loading,
    error,
    getTrailer,
    getCreators,
    getCast,
  }
}

// Generic hook for media details (movie or TV)
export const useMediaDetails = (id, type = 'movie') => {
  const isMovie = type === 'movie'
  
  const movieData = useMovieDetails(id)
  const tvData = useTVDetails(id)

  // Return appropriate data based on type
  if (isMovie) {
    return {
      ...movieData,
      type: 'movie',
    }
  }

  return {
    ...tvData,
    type: 'tv',
  }
}

// Hook for person/actor details
export const usePersonDetails = (personId) => {
  const [details, setDetails] = useState(null)
  const [movieCredits, setMovieCredits] = useState(null)
  const [tvCredits, setTvCredits] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!personId) return

    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const [personData, movieData, tvData] = await Promise.all([
          tmdbService.getPersonDetails(personId),
          tmdbService.getPersonMovieCredits(personId),
          tmdbService.getPersonTVCredits(personId),
        ])

        setDetails(personData)
        setMovieCredits(movieData)
        setTvCredits(tvData)
      } catch (err) {
        setError(err.message || 'Failed to fetch person details')
        console.error('usePersonDetails error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [personId])

  // Get known for movies
  const getKnownFor = useCallback(() => {
    if (!details?.known_for) return []
    return details.known_for.slice(0, 6)
  }, [details])

  // Get all credits combined and sorted by popularity
  const getAllCredits = useCallback(() => {
    const movieCast = movieCredits?.cast || []
    const tvCast = tvCredits?.cast || []
    
    // Combine and remove duplicates
    const combined = [...movieCast, ...tvCast]
    const seen = new Set()
    return combined
      .filter(item => {
        const key = `${item.media_type}-${item.id}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => b.popularity - a.popularity)
  }, [movieCredits, tvCredits])

  return {
    details,
    movieCredits,
    tvCredits,
    loading,
    error,
    getKnownFor,
    getAllCredits,
  }
}

export default useMovieDetails

