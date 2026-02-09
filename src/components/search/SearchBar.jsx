import { useCallback, useEffect, useRef, useState } from 'react'
import { FiClock, FiFilm, FiLoader, FiMic, FiSearch, FiStar, FiTrendingUp, FiTv, FiUser, FiX } from 'react-icons/fi'
import { useNavigate, useSearchParams } from 'react-router-dom'
import * as tmdbService from '../../services/tmdb'
import { debounce } from '../../utils/helpers'

// Search Bar Component
export const SearchBar = ({ 
  onSearch,
  placeholder = 'Search movies, TV shows, actors...',
  showSuggestions = true,
  className = ''
}) => {
  const [query, setQuery] = useState('')
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsSuggestionsVisible(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Fetch real search suggestions from TMDB
  const fetchSuggestions = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSuggestions([])
      return
    }
    
    setLoading(true)
    try {
      const response = await tmdbService.searchMulti(searchQuery)
      const formattedSuggestions = response.results
        .filter(item => item.media_type === 'movie' || item.media_type === 'tv' || item.media_type === 'person')
        .slice(0, 6)
        .map(item => ({
          id: item.id,
          title: item.title || item.name,
          media_type: item.media_type,  // Use media_type for compatibility with MovieCard
          poster_path: item.poster_path,
          profile_path: item.profile_path,
          release_date: item.release_date || item.first_air_date,
          known_for: item.known_for ? item.known_for.slice(0, 2).map(k => k.title || k.name) : [],
        }))
      setSuggestions(formattedSuggestions)
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }
  
  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchQuery) => {
      fetchSuggestions(searchQuery)
    }, 300),
    []
  )
  
  const handleChange = (e) => {
    const value = e.target.value
    setQuery(value)
    if (showSuggestions && value.length >= 2) {
      debouncedSearch(value)
      setIsSuggestionsVisible(true)
    } else {
      setSuggestions([])
      if (value.length < 2) {
        setIsSuggestionsVisible(false)
      }
    }
  }
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/browse?q=${encodeURIComponent(query.trim())}`)
      setIsSuggestionsVisible(false)
      onSearch?.(query.trim())
    }
  }
  
  const handleClear = () => {
    setQuery('')
    setSuggestions([])
    setIsSuggestionsVisible(false)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }
  
  const handleSuggestionClick = (suggestion) => {
    if (suggestion.media_type === 'movie') {
      navigate(`/movie/${suggestion.id}`)
    } else if (suggestion.media_type === 'tv') {
      navigate(`/tv/${suggestion.id}`)
    } else if (suggestion.media_type === 'person') {
      navigate(`/person/${suggestion.id}`)
    }
    setIsSuggestionsVisible(false)
    setQuery('')
  }
  
  const handleInputFocus = () => {
    if (query.length >= 2 && suggestions.length > 0) {
      setIsSuggestionsVisible(true)
    }
  }
  
  // Get media type icon and color
  const getMediaTypeInfo = (mediaType) => {
    switch (mediaType) {
      case 'movie':
        return { icon: FiFilm, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Movie' }
      case 'tv':
        return { icon: FiTv, color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'TV Show' }
      case 'person':
        return { icon: FiUser, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Person' }
      default:
        return { icon: FiFilm, color: 'text-gray-400', bg: 'bg-gray-400/10', label: mediaType }
    }
  }
  
  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {/* Search Input Container */}
      <div className="relative group">
        {/* Left side - Search Icon */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
          <FiSearch 
            className="text-gray-400 group-focus-within:text-netflix-red transition-colors duration-200"
            size={20}
          />
        </div>
        
        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-12 pr-28 py-3.5
            bg-gray-800/80 backdrop-blur-sm
            text-white placeholder-gray-400
            border border-gray-700/50 rounded-full
            focus:border-netflix-red focus:outline-none focus:ring-2 focus:ring-red-500/20
            transition-all duration-200
            cursor-text
            text-base"
        />
        
        {/* Right side - Actions */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Voice Search Button (optional) */}
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all duration-200"
            title="Voice Search"
          >
            <FiMic size={18} />
          </button>
          
          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-full transition-all duration-200"
              title="Clear"
            >
              <FiX size={18} />
            </button>
          )}
        </div>
      </div>
      
      {/* Suggestions Dropdown */}
      {showSuggestions && isSuggestionsVisible && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          {/* Loading State */}
          {loading && (
            <div className="bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden p-4">
              <div className="flex items-center justify-center gap-3 text-gray-400">
                <FiLoader className="animate-spin" size={20} />
                <span className="text-sm">Searching...</span>
              </div>
            </div>
          )}
          
          {/* Suggestions List */}
          {!loading && suggestions.length > 0 && (
            <div className="bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden">
              <div className="py-2">
                {suggestions.map((suggestion) => {
                  const mediaInfo = getMediaTypeInfo(suggestion.media_type)
                  const Icon = mediaInfo.icon
                  const imagePath = suggestion.media_type === 'person' ? suggestion.profile_path : suggestion.poster_path
                  
                  return (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-700/70 transition-all duration-150 group"
                    >
                      {/* Thumbnail */}
                      {imagePath ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${imagePath}`}
                          alt={suggestion.title}
                          className="w-10 h-14 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-gray-700 rounded-lg flex items-center justify-center shadow-md">
                          <Icon className={mediaInfo.color} size={20} />
                        </div>
                      )}
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-white truncate block font-medium">
                          {suggestion.title}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {/* Media Type Badge */}
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${mediaInfo.bg} ${mediaInfo.color}`}>
                            <Icon size={10} />
                            {mediaInfo.label}
                          </span>
                          {/* Year */}
                          {suggestion.release_date && (
                            <span className="text-xs text-gray-500">
                              {suggestion.release_date.split('-')[0]}
                            </span>
                          )}
                          {/* Known for (for people) */}
                          {suggestion.media_type === 'person' && suggestion.known_for && suggestion.known_for.length > 0 && (
                            <span className="text-xs text-gray-500 truncate">
                              Known for: {suggestion.known_for.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Arrow Icon */}
                      <FiSearch className="text-gray-600 group-hover:text-netflix-red transition-colors duration-200" size={16} />
                    </button>
                  )
                })}
              </div>
              
              {/* Footer */}
              <div className="px-4 py-2 bg-gray-700/30 border-t border-gray-700/50">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    handleSubmit({ preventDefault: () => {} })
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-netflix-red hover:text-red-400 transition-colors font-medium"
                >
                  <FiSearch size={16} />
                  Search all results for "{query}"
                </button>
              </div>
            </div>
          )}
          
          {/* No Results */}
          {!loading && query.length >= 2 && suggestions.length === 0 && (
            <div className="bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden p-6">
              <div className="text-center">
                <FiSearch className="mx-auto text-gray-500 mb-3" size={32} />
                <p className="text-gray-400">No results found for "{query}"</p>
                <p className="text-gray-500 text-sm mt-1">Try searching for movies, TV shows, or actors</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Search Page Component
export const SearchPage = () => {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') || ''
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">
        Search Results for "{query}"
      </h1>
      <SearchBar showSuggestions={false} />
    </div>
  )
}

// Search Suggestions
export const SearchSuggestions = () => {
  const suggestions = [
    { icon: FiTrendingUp, label: 'Trending Now', query: 'trending' },
    { icon: FiClock, label: 'Coming Soon', query: 'upcoming' },
    { icon: FiStar, label: 'Top Rated', query: 'top_rated' },
  ]
  
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Quick Searches
      </h3>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((item) => (
          <button
            key={item.query}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors text-sm"
          >
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SearchBar

