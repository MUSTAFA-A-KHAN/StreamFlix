import { useCallback, useEffect, useState } from 'react'
import * as tmdbService from '../services/tmdb'

// Hook for fetching movies with loading and error states
export const useMovies = (fetchFunction, deps = []) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetchFunction(page)
      setData(prev => page === 1 ? response.results : [...prev, ...response.results])
      setHasMore(page < response.total_pages)
    } catch (err) {
      setError(err.message || 'Failed to fetch movies')
      console.error('useMovies error:', err)
    } finally {
      setLoading(false)
    }
  }, [fetchFunction, page])

  useEffect(() => {
    fetchData()
  }, deps.length > 0 ? [...deps, page] : [page])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1)
    }
  }, [loading, hasMore])

  const refresh = useCallback(() => {
    setPage(1)
    setData([])
  }, [])

  return { data, loading, error, page, hasMore, loadMore, refresh }
}

// Hook for popular movies
export const usePopularMovies = (page = 1) => {
  return useMovies(
    () => tmdbService.getPopularMovies(page),
    [page]
  )
}

// Hook for top rated movies
export const useTopRatedMovies = (page = 1) => {
  return useMovies(
    () => tmdbService.getTopRatedMovies(page),
    [page]
  )
}

// Hook for upcoming movies
export const useUpcomingMovies = (page = 1) => {
  return useMovies(
    () => tmdbService.getUpcomingMovies(page),
    [page]
  )
}

// Hook for now playing movies
export const useNowPlayingMovies = (page = 1) => {
  return useMovies(
    () => tmdbService.getNowPlayingMovies(page),
    [page]
  )
}

// Hook for trending content
export const useTrending = (timeWindow = 'week', mediaType = 'all') => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await tmdbService.getTrending(timeWindow)
        // Filter by media type if specified
        const filtered = mediaType === 'all' 
          ? response.results 
          : response.results.filter(item => item.media_type === mediaType)
        setData(filtered)
      } catch (err) {
        setError(err.message || 'Failed to fetch trending')
        console.error('useTrending error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTrending()
  }, [timeWindow, mediaType])

  return { data, loading, error }
}

// Hook for TV shows
export const usePopularTV = (page = 1) => {
  return useMovies(
    () => tmdbService.getPopularTV(page),
    [page]
  )
}

export const useTopRatedTV = (page = 1) => {
  return useMovies(
    () => tmdbService.getTopRatedTV(page),
    [page]
  )
}

export const useOnTheAirTV = (page = 1) => {
  return useMovies(
    () => tmdbService.getOnTheAirTV(page),
    [page]
  )
}

// Hook for search functionality
export const useSearch = (query) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [queryParams, setQueryParams] = useState('')

  useEffect(() => {
    if (!query || query.trim() === '') {
      setData([])
      setQueryParams('')
      return
    }

    const search = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await tmdbService.searchMovies(query.trim())
        setData(response.results)
        setQueryParams(query.trim())
      } catch (err) {
        setError(err.message || 'Search failed')
        console.error('useSearch error:', err)
      } finally {
        setLoading(false)
      }
    }

    // Debounce search
    const timeoutId = setTimeout(search, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  return { data, loading, error, queryParams }
}

// Hook for discovering movies by filters
export const useDiscoverMovies = (filters = {}) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const discover = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await tmdbService.discoverMovies(filters)
        setData(response.results)
      } catch (err) {
        setError(err.message || 'Failed to discover movies')
        console.error('useDiscover error:', err)
      } finally {
        setLoading(false)
      }
    }

    discover()
  }, [JSON.stringify(filters)])

  return { data, loading, error }
}

// Hook for fetching multiple sections (for homepage)
export const useHomepageSections = () => {
  const [sections, setSections] = useState({
    trending: { data: [], loading: true, error: null },
    popular: { data: [], loading: true, error: null },
    topRated: { data: [], loading: true, error: null },
    upcoming: { data: [], loading: true, error: null },
    nowPlaying: { data: [], loading: true, error: null },
  })

  useEffect(() => {
    const fetchAllSections = async () => {
      try {
        // Fetch all data in parallel
        const [trending, popular, topRated, upcoming, nowPlaying] = await Promise.all([
          tmdbService.getTrending('week'),
          tmdbService.getPopularMovies(1),
          tmdbService.getTopRatedMovies(1),
          tmdbService.getUpcomingMovies(1),
          tmdbService.getNowPlayingMovies(1),
        ])

        setSections({
          trending: { data: trending.results, loading: false, error: null },
          popular: { data: popular.results, loading: false, error: null },
          topRated: { data: topRated.results, loading: false, error: null },
          upcoming: { data: upcoming.results, loading: false, error: null },
          nowPlaying: { data: nowPlaying.results, loading: false, error: null },
        })
      } catch (err) {
        console.error('useHomepageSections error:', err)
        setSections(prev => ({
          trending: { ...prev.trending, loading: false, error: err.message },
          popular: { ...prev.popular, loading: false, error: err.message },
          topRated: { ...prev.topRated, loading: false, error: err.message },
          upcoming: { ...prev.upcoming, loading: false, error: err.message },
          nowPlaying: { ...prev.nowPlaying, loading: false, error: err.message },
        }))
      }
    }

    fetchAllSections()
  }, [])

  return sections
}

export default useMovies

