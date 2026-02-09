import { useState } from 'react'
import { FiHeart, FiInfo, FiPlay, FiPlus, FiStar } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { useWatchlist } from '../../context/WatchlistContext'
import { getPosterUrl } from '../../services/anime'
import Button from '../ui/Button'

// Anime Card Component
export const AnimeCard = ({ anime, showInfoOnHover = true, size = 'md' }) => {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const navigate = useNavigate()
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()
  
  const inWatchlist = isInWatchlist(anime.id)
  
  const posterWidth = {
    sm: 'w-32 sm:w-40',
    md: 'w-40 sm:w-48',
    lg: 'w-48 sm:w-56',
    xl: 'w-56 sm:w-64',
  }[size]

  const posterHeight = {
    sm: 'h-48 sm:h-60',
    md: 'h-60 sm:h-72',
    lg: 'h-72 sm:h-84',
    xl: 'h-84 sm:h-96',
  }[size]
  
  const handleWatchlistClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (inWatchlist) {
      removeFromWatchlist(anime.id)
    } else {
      addToWatchlist({
        id: anime.id,
        title: anime.title,
        poster_path: anime.poster,
        vote_average: anime.rating || anime.score || 0,
        media_type: 'anime',
      })
    }
  }
  
  const handlePlayClick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/watch/anime/${encodeURIComponent(anime.id)}?ep=1`)
  }
  
  // Format rating/score
  const formatRating = (rating) => {
    if (!rating) return 'N/A'
    return typeof rating === 'number' ? rating.toFixed(1) : rating
  }
  
  return (
    <div 
      className="relative group flex-shrink-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        to={`/anime/${encodeURIComponent(anime.id)}`}
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
              src={getPosterUrl(anime.poster)}
              alt={anime.title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          )}
          
          {/* Episode Count Badge */}
          {anime.episodes && (
            <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs px-2 py-1 rounded font-medium">
              {anime.episodes.eps || anime.episodes.sub || anime.episodes.dub || 0} eps
            </div>
          )}
          
          {/* Type Badge */}
          {anime.type && (
            <div className="absolute top-2 left-2 bg-gray-900/80 text-gray-300 text-xs px-2 py-1 rounded font-medium">
              {anime.type}
            </div>
          )}
          
          {/* Hover Overlay */}
          {isHovered && showInfoOnHover && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-4 transition-opacity duration-300">
              {/* Title */}
              <h3 className="font-bold text-white text-lg mb-1 line-clamp-2">
                {anime.title}
              </h3>
              
              {/* Meta Info */}
              <div className="flex items-center gap-2 text-sm text-gray-300 mb-3 flex-wrap">
                {anime.rating && (
                  <span className="text-yellow-400 flex items-center gap-1">
                    <FiStar size={12} />
                    {formatRating(anime.rating)}
                  </span>
                )}
                {anime.type && (
                  <>
                    <span>•</span>
                    <span>{anime.type}</span>
                  </>
                )}
                {anime.rank && (
                  <>
                    <span>•</span>
                    <span className="text-purple-400">#{anime.rank}</span>
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
                  Watch
                </Button>
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
                  to={`/anime/${encodeURIComponent(anime.id)}`}
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
            <h3 className="font-medium text-white text-sm line-clamp-1 hover:text-purple-400 transition-colors">
              {anime.title}
            </h3>
            {anime.alternativeTitle && (
              <p className="text-gray-500 text-xs mt-0.5 truncate">
                {anime.alternativeTitle}
              </p>
            )}
          </div>
        )}
      </Link>
    </div>
  )
}

// Anime Card with backdrop (hero style)
export const AnimeBackdropCard = ({ anime }) => {
  const [imageError, setImageError] = useState(false)
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()
  const inWatchlist = isInWatchlist(anime.id)
  
  const handleWatchlistClick = (e) => {
    e.preventDefault()
    if (inWatchlist) {
      removeFromWatchlist(anime.id)
    } else {
      addToWatchlist({
        id: anime.id,
        title: anime.title,
        poster_path: anime.poster,
        vote_average: anime.rating || anime.score || 0,
        media_type: 'anime',
      })
    }
  }
  
  // Format rating
  const formatRating = (rating) => {
    if (!rating) return 'N/A'
    return typeof rating === 'number' ? rating.toFixed(1) : rating
  }
  
  return (
    <Link 
      to={`/anime/${encodeURIComponent(anime.id)}`}
      className="block relative h-[60vh] md:h-[70vh] w-full"
    >
      {/* Backdrop Image */}
      <div className="absolute inset-0">
        {imageError ? (
          <div className="w-full h-full bg-gray-800" />
        ) : (
          <img
            src={getPosterUrl(anime.poster)}
            alt={anime.title}
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
          {/* Badge */}
          <div className="flex items-center gap-3">
            <span className="text-purple-500 font-bold tracking-wider uppercase text-sm">
              Featured Anime
            </span>
            {anime.rank && (
              <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded font-medium">
                #{anime.rank}
              </span>
            )}
          </div>
          
          {/* Title */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {anime.title}
          </h1>
          
          {/* Meta */}
          <div className="flex items-center gap-4 text-sm md:text-base">
            {anime.rating && (
              <span className="text-yellow-400 font-bold flex items-center gap-1">
                <FiStar size={16} />
                {formatRating(anime.rating)} Rating
              </span>
            )}
            {anime.type && <span className="text-gray-300">{anime.type}</span>}
            {anime.episodes && (
              <span className="text-gray-300">
                {anime.episodes.eps || anime.episodes.sub || anime.episodes.dub || '?'} Episodes
              </span>
            )}
          </div>
          
          {/* Overview */}
          <p className="text-gray-300 line-clamp-3 md:line-clamp-4 text-sm md:text-base">
            {anime.description || anime.synopsis || 'No description available.'}
          </p>
          
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link
              to={`/watch/anime/${encodeURIComponent(anime.id)}?ep=1`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors"
            >
              <FiPlay size={20} />
              Watch Now
            </Link>
            
            <Link
              to={`/anime/${encodeURIComponent(anime.id)}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700/80 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors"
            >
              <FiInfo size={20} />
              More Info
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

export default AnimeCard
