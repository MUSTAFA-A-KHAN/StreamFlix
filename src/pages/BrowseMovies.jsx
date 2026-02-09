import { useCallback, useEffect, useState } from 'react'
import { FiGrid, FiList } from 'react-icons/fi'
import { useSearchParams } from 'react-router-dom'
import { MovieCard } from '../components/movie/MovieCard'
import { GenreFilter, RatingFilter, SortOptions, YearFilter } from '../components/search/GenreFilter'
import { SearchBar } from '../components/search/SearchBar'
import { SkeletonCard } from '../components/ui/Skeleton'
import * as tmdbService from '../services/tmdb'
import { GENRES } from '../utils/constants'

// Browse Movies Page
const BrowseMoviesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [movies, setMovies] = useState([])
  const [tvShows, setTvShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // grid | list
  const [searchType, setSearchType] = useState('all') // all | movie | tv
  
  // Filter states
  const query = searchParams.get('q') || ''
  const mediaType = searchParams.get('type') || 'movie'
  const genreId = searchParams.get('genre') ? parseInt(searchParams.get('genre')) : null
  const sortBy = searchParams.get('sort') || 'popularity.desc'
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')) : null
  const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')) : null
  
  // Fetch movies
  const fetchMovies = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      let response
      
      if (query) {
        // Search mode - search both movies and TV shows
        const [movieResults, multiResults] = await Promise.all([
          tmdbService.searchMovies(query),
          tmdbService.searchMulti(query)
        ])
        
        if (searchType === 'movie') {
          setMovies(movieResults.results || [])
          setTvShows([])
        } else if (searchType === 'tv') {
          // For TV shows, filter from multi search results and fetch detailed info
          const tvResultsFromMulti = multiResults.results?.filter(item => item.media_type === 'tv') || []
          
          // Fetch detailed TV show info using /tv/{id} endpoint for each TV show
          const tvDetailsPromises = tvResultsFromMulti.map(tv => tmdbService.searchTVShow(tv.id))
          const tvDetails = await Promise.all(tvDetailsPromises)
          
          // Merge detailed info with search results
          const enrichedTvShows = tvResultsFromMulti.map((tv, index) => ({
            ...tv,
            ...tvDetails[index], // Complete TV show data from /tv/{id}
            media_type: 'tv', // Ensure media_type is set correctly
          }))
          
          setMovies([])
          setTvShows(enrichedTvShows)
        } else {
          // All - combine results from both APIs
          const allMovies = movieResults.results || []
          const allTvFromMulti = multiResults.results?.filter(item => item.media_type === 'tv') || []
          
          // Fetch detailed TV show info using /tv/{id} endpoint
          const tvDetailsPromises = allTvFromMulti.map(tv => tmdbService.searchTVShow(tv.id))
          const tvDetails = await Promise.all(tvDetailsPromises)
          
          const enrichedTvShows = allTvFromMulti.map((tv, index) => ({
            ...tv,
            ...tvDetails[index],
            media_type: 'tv',
          }))
          
          // Merge and sort by popularity
          const combined = [...allMovies, ...enrichedTvShows]
            .sort((a, b) => b.popularity - a.popularity)
          
          setMovies(combined)
          setTvShows([])
        }
      } else {
        // Discovery mode with filters
        const params = {
          page: 1,
          sort_by: sortBy,
          include_adult: false,
          language: 'en-US',
        }
        
        if (genreId) {
          params.with_genres = genreId
        }
        if (year) {
          params.primary_release_year = year
        }
        if (rating) {
          params.vote_average_gte = rating
        }
        
        // Fetch based on searchType
        if (searchType === 'tv') {
          // Fetch TV shows using discover TV API
          const tvResponse = await tmdbService.discoverTV(params)
          // Add media_type to each TV show item for proper navigation
          const tvShowsWithType = (tvResponse.results || []).map(tv => ({
            ...tv,
            media_type: 'tv'
          }))
          setMovies([])
          setTvShows(tvShowsWithType)
        } else if (searchType === 'movie') {
          // Fetch movies using discover movies API
          const movieResponse = await tmdbService.discoverMovies(params)
          setMovies(movieResponse.results || [])
          setTvShows([])
        } else {
          // All - fetch both in parallel
          const [movieResponse, tvResponse] = await Promise.all([
            tmdbService.discoverMovies(params),
            tmdbService.discoverTV(params)
          ])
          
          // Combine results and sort by popularity
          const combined = [
            ...(movieResponse.results || []).map(m => ({ ...m, media_type: 'movie' })),
            ...(tvResponse.results || []).map(t => ({ ...t, media_type: 'tv' }))
          ].sort((a, b) => b.popularity - a.popularity)
          
          setMovies(combined)
          setTvShows([])
        }
      }
    } catch (err) {
      console.error('Error fetching movies:', err)
      setError(err.message || 'Failed to load movies')
    } finally {
      setLoading(false)
    }
  }, [query, genreId, sortBy, year, rating, searchType])
  
  useEffect(() => {
    fetchMovies()
  }, [fetchMovies])
  
  // Update URL with filters
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams)
    if (value === null || value === '' || (key === 'genre' && value === null)) {
      newParams.delete(key)
    } else {
      newParams.set(key, value)
    }
    setSearchParams(newParams)
  }
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-800">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          {/* Title */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-4 sm:mb-6">
            {query ? `Search Results for "${query}"` : 'Browse Movies & TV Shows'}
          </h1>

          {/* Search */}
          <div className="mb-4 sm:mb-6">
            <SearchBar />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
            {/* Media Type Filter */}
            <div className="flex items-center bg-gray-700 rounded-lg p-0.5 sm:p-1">
              <button
                onClick={() => setSearchType('all')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors touch-manipulation ${
                  searchType === 'all'
                    ? 'bg-netflix-red text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSearchType('movie')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors touch-manipulation ${
                  searchType === 'movie'
                    ? 'bg-netflix-red text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => setSearchType('tv')}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors touch-manipulation ${
                  searchType === 'tv'
                    ? 'bg-netflix-red text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                TV Shows
              </button>
            </div>

            <GenreFilter
              mediaType={searchType}
              selectedGenre={genreId}
              onGenreChange={(id) => updateFilter('genre', id)}
            />

            <SortOptions
              selectedOption={sortBy}
              onSortChange={(id) => updateFilter('sort', id)}
            />

            <YearFilter
              selectedYear={year}
              onYearChange={(y) => updateFilter('year', y)}
            />

            <RatingFilter
              selectedRating={rating}
              onRatingChange={(r) => updateFilter('rating', r)}
            />

            <div className="flex items-center gap-1 sm:gap-2 ml-auto">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors touch-manipulation ${
                  viewMode === 'grid'
                    ? 'bg-netflix-red text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <FiGrid size={16} className="sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 sm:p-2 rounded-md transition-colors touch-manipulation ${
                  viewMode === 'list'
                    ? 'bg-netflix-red text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <FiList size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {(genreId || year || rating) && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {genreId && (
                <button
                  onClick={() => updateFilter('genre', null)}
                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-netflix-red text-white text-xs sm:text-sm rounded-full hover:bg-red-700 transition-colors touch-manipulation"
                >
                  {(searchType === 'tv' ? GENRES.TV : GENRES.MOVIE).find(g => g.id === genreId)?.name}
                  <span className="ml-1">×</span>
                </button>
              )}
              {year && (
                <button
                  onClick={() => updateFilter('year', null)}
                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-netflix-red text-white text-xs sm:text-sm rounded-full hover:bg-red-700 transition-colors touch-manipulation"
                >
                  {year}
                  <span className="ml-1">×</span>
                </button>
              )}
              {rating && (
                <button
                  onClick={() => updateFilter('rating', null)}
                  className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-netflix-red text-white text-xs sm:text-sm rounded-full hover:bg-red-700 transition-colors touch-manipulation"
                >
                  {rating}+ Rating
                  <span className="ml-1">×</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-2 sm:px-4 py-8">
        {/* Results Count */}
        <p className="text-gray-400 mb-6">
          {loading ? 'Loading...' : 
            searchType === 'tv' ? `${tvShows.length} TV shows found` :
            searchType === 'all' ? `${movies.length} results found` :
            `${movies.length} movies found`
          }
        </p>
        
        {/* Loading State */}
        {loading && (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
            : 'space-y-4'
          }>
            {[...Array(12)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}
        
        {/* Error State */}
        {!loading && error && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-netflix-red text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {!loading && !error && 
          ((searchType === 'tv' && tvShows.length === 0) || 
           (searchType !== 'tv' && movies.length === 0)) && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-4">
                {searchType === 'tv' ? 'No TV shows found' : 'No movies found'}
              </p>
              <p className="text-gray-500 text-sm">Try adjusting your filters</p>
            </div>
          </div>
        )}
        
        {/* Movies Grid/List */}
        {!loading && !error &&
          ((searchType === 'tv' && tvShows.length > 0) ||
           (searchType !== 'tv' && movies.length > 0)) && (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4'
            : 'space-y-4'
          }>
            {(searchType === 'tv' ? tvShows : movies).map((item) => (
              <MovieCard
                key={item.id}
                movie={item}
                size={viewMode === 'grid' ? 'md' : 'lg'}
                showInfoOnHover={viewMode === 'grid'}
              />
            ))}
          </div>
        )}
        
        {/* Load More */}
        {!loading && 
          ((searchType === 'tv' && tvShows.length > 0 && tvShows.length >= 20) || 
           (searchType !== 'tv' && movies.length > 0 && movies.length >= 20)) && (
          <div className="flex justify-center mt-8">
            <button
              className="px-8 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BrowseMoviesPage

