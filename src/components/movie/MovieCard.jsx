import { useState } from 'react'
import { FiHeart, FiInfo, FiPlay, FiPlus } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { useWatchlist } from '../../context/WatchlistContext'
import { formatRating, getImageUrl, getYear } from '../../utils/helpers'
import Button from '../ui/Button'

// Movie Card Component
export const MovieCard = ({ movie, showInfoOnHover = true, size = 'md' }) => {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const navigate = useNavigate()
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()
  
  const inWatchlist = isInWatchlist(movie.id)
  const mediaType = movie.media_type || 'movie'
  
  const posterWidth = {
    sm: 'w-28 sm:w-32 md:w-40',
    md: 'w-32 sm:w-40 md:w-48',
    lg: 'w-40 sm:w-48 md:w-56',
    xl: 'w-48 sm:w-56 md:w-64',
  }[size]

  const posterHeight = {
    sm: 'h-42 sm:h-48 md:h-60',
    md: 'h-48 sm:h-60 md:h-72',
    lg: 'h-60 sm:h-72 md:h-84',
    xl: 'h-72 sm:h-84 md:h-96',
  }[size]
  
  const handleWatchlistClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (inWatchlist) {
      removeFromWatchlist(movie.id)
    } else {
      addToWatchlist({
        id: movie.id,
        title: movie.title || movie.name,
        poster_path: movie.poster_path,
        backdrop_path: movie.backdrop_path,
        vote_average: movie.vote_average,
        release_date: movie.release_date || movie.first_air_date,
        media_type: mediaType,
      })
    }
  }
  
  const handlePlayClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // Navigate to movie player page with default season/episode for TV shows
    if (mediaType === 'tv') {
      navigate(`/watch/${mediaType}/${movie.id}?season=1&episode=1`)
    } else {
      navigate(`/watch/${mediaType}/${movie.id}`)
    }
  }
  
  return (
    <div 
      className="relative group flex-shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        to={`/${mediaType}/${movie.id}`}
        className="block"
      >
        {/* Poster Image */}
        <div 
          className={`
            ${posterWidth} ${posterHeight} 
            rounded-lg overflow-hidden
            transition-all duration-300
            ${isHovered && showInfoOnHover ? 'scale-105 shadow-2xl' : ''}
            movie-card
          `}
        >
          {imageError ? (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No Image</span>
            </div>
          ) : (
            <img
              src={getImageUrl(movie.poster_path, 'w500')}
              alt={movie.title || movie.name}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          )}
          
          {/* Hover Overlay */}
          {isHovered && showInfoOnHover && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-4 transition-opacity duration-300">
              {/* Title */}
              <h3 className="font-bold text-white text-lg mb-1 line-clamp-2">
                {movie.title || movie.name}
              </h3>
              
              {/* Meta Info */}
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                <span>{getYear(movie.release_date || movie.first_air_date)}</span>
                <span>•</span>
                <span className="text-yellow-400">{formatRating(movie.vote_average)}</span>
                {movie.adult && (
                  <>
                    <span>•</span>
                    <span className="text-red-500">18+</span>
                  </>
                )}
              </div>
              
              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handlePlayClick}
                  leftIcon={<FiPlay size={14} />}
                  className="flex-1"
                >
                  {mediaType === 'tv' ? 'Watch' : 'Play'}
                </Button>
                {/* Play for Free - vidsrc button for TV shows */}
                {mediaType === 'tv' && movie.imdb_id && (
                  <a
                    href={`https://vidsrcme.ru/embed/tv?imdb=${movie.imdb_id.startsWith('tt') ? movie.imdb_id : `tt${movie.imdb_id}`}&season=1&episode=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
                    title="Play for Free - vidsrc"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FiPlay size={16} />
                  </a>
                )}
                <button
                  onClick={handleWatchlistClick}
                  className={`
                    p-2 rounded-full transition-colors
                    ${inWatchlist 
                      ? 'bg-netflix-red text-white' 
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                    }
                  `}
                  title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                >
                  {inWatchlist ? <FiHeart size={16} fill="currentColor" /> : <FiPlus size={16} />}
                </button>
                <Link
                  to={`/${mediaType}/${movie.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                  title="More Info"
                >
                  <FiInfo size={16} />
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {/* Info below poster (always visible) */}
        {!showInfoOnHover && (
          <div className="mt-2">
            <h3 className="font-medium text-white text-sm line-clamp-1 hover:text-netflix-red transition-colors">
              {movie.title || movie.name}
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              {getYear(movie.release_date || movie.first_air_date)}
            </p>
          </div>
        )}
      </Link>
    </div>
  )
}

// Movie Card with backdrop (hero style)
export const BackdropCard = ({ movie }) => {
  const [imageError, setImageError] = useState(false)
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()
  const inWatchlist = isInWatchlist(movie.id)
  
  const handleWatchlistClick = (e) => {
    e.preventDefault()
    if (inWatchlist) {
      removeFromWatchlist(movie.id)
    } else {
      addToWatchlist(movie)
    }
  }
  
  return (
    <Link 
      to={`/${movie.media_type || 'movie'}/${movie.id}`}
      className="block relative h-[60vh] md:h-[70vh] w-full"
    >
      {/* Backdrop Image */}
      <div className="absolute inset-0">
        {imageError ? (
          <div className="w-full h-full bg-gray-800" />
        ) : (
          <img
            src={getImageUrl(movie.backdrop_path, 'w1280')}
            alt={movie.title || movie.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative h-full flex items-center px-8 md:px-16 lg:px-24">
        <div className="max-w-xl space-y-4">
          {/* Title */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {movie.title || movie.name}
          </h1>
          
          {/* Meta */}
          <div className="flex items-center gap-4 text-sm md:text-base">
            <span className="text-yellow-400 font-bold">{formatRating(movie.vote_average)} Rating</span>
            <span className="text-gray-300">{getYear(movie.release_date || movie.first_air_date)}</span>
            {movie.adult && (
              <span className="border border-gray-500 px-1 text-xs">18+</span>
            )}
          </div>
          
          {/* Overview */}
          <p className="text-gray-300 line-clamp-3 md:line-clamp-4 text-sm md:text-base">
            {movie.overview || 'No description available.'}
          </p>
          
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link
              to={movie.media_type === 'tv' ? `/watch/${movie.media_type}/${movie.id}?season=1&episode=1` : `/watch/${movie.media_type || 'movie'}/${movie.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-netflix-red text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
            >
              <FiPlay size={20} />
              {movie.media_type === 'tv' ? 'Watch' : 'Watch Now'}
            </Link>
            
            <Link
              to={`/watch-trailer/${movie.media_type || 'movie'}/${movie.id}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700/80 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors"
            >
              <FiPlay size={20} />
              Trailer
            </Link>
            
            <button
              onClick={handleWatchlistClick}
              className={`
                inline-flex items-center gap-2 px-6 py-3 rounded-md font-semibold transition-colors
                ${inWatchlist 
                  ? 'bg-netflix-red text-white' 
                  : 'bg-gray-700/80 text-white hover:bg-gray-600'
                }
              `}
            >
              {inWatchlist ? (
                <><FiHeart size={20} fill="currentColor" /> In Watchlist</>
              ) : (
                <><FiPlus size={20} /> Add to Watchlist</>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default MovieCard

