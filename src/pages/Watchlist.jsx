import { useState } from 'react'
import { FiHeart, FiInfo, FiPlay, FiTrash2 } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import { useWatchlist } from '../context/WatchlistContext'
import { formatRating, getYear } from '../utils/helpers'

// Watchlist Page
const WatchlistPage = () => {
  const { 
    watchlist, 
    isLoading, 
    removeFromWatchlist, 
    clearWatchlist,
    sortWatchlist,
    exportWatchlist 
  } = useWatchlist()
  
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState('grid') // grid | list
  const [sortBy, setSortBy] = useState('addedAt')
  const [showClearModal, setShowClearModal] = useState(false)
  
  // Sort watchlist
  const sortedWatchlist = [...watchlist].sort((a, b) => {
    if (sortBy === 'addedAt') {
      return new Date(b.addedAt) - new Date(a.addedAt)
    }
    if (sortBy === 'rating') {
      return (b.vote_average || 0) - (a.vote_average || 0)
    }
    if (sortBy === 'title') {
      return (a.title || a.name).localeCompare(b.title || b.name)
    }
    return 0
  })
  
  // Handle clear watchlist
  const handleClearWatchlist = () => {
    clearWatchlist()
    setShowClearModal(false)
  }
  
  // Handle export
  const handleExport = () => {
    const data = exportWatchlist()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'watchlist.json'
    a.click()
    URL.revokeObjectURL(url)
  }
  
  if (isLoading) {
    return <LoadingState />
  }
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Watchlist</h1>
              <p className="text-gray-400">
                {watchlist.length} {watchlist.length === 1 ? 'title' : 'titles'} saved
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  sortWatchlist(e.target.value)
                }}
                className="px-4 py-2 bg-gray-800 text-white rounded-md border border-gray-700 focus:outline-none focus:border-netflix-red"
              >
                <option value="addedAt">Recently Added</option>
                <option value="rating">Highest Rated</option>
                <option value="title">Title (A-Z)</option>
              </select>
              
              {/* Export */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExport}
                disabled={watchlist.length === 0}
              >
                Export
              </Button>
              
              {/* Clear All */}
              {watchlist.length > 1 && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowClearModal(true)}
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Empty State */}
        {watchlist.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Grid/List View */}
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
              : 'space-y-4'
            }>
              {sortedWatchlist.map((item) => (
                <WatchlistItem
                  key={item.uniqueId || item.id}
                  item={item}
                  viewMode={viewMode}
                  onRemove={() => removeFromWatchlist(item.id)}
                  onPlay={() => navigate(`/watch-trailer/${item.media_type}/${item.id}`)}
                  onInfo={() => navigate(`/${item.media_type}/${item.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Clear Modal */}
      {showClearModal && (
        <ClearWatchlistModal
          isOpen={showClearModal}
          onClose={() => setShowClearModal(false)}
          onConfirm={handleClearWatchlist}
        />
      )}
    </div>
  )
}

// Watchlist Item Component
const WatchlistItem = ({ item, viewMode, onRemove, onPlay, onInfo }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  if (viewMode === 'grid') {
    return (
      <div
        className="relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link to={`/${item.media_type}/${item.id}`}>
          <div className="aspect-[2/3] rounded-lg overflow-hidden mb-3">
            <img
              src={item.poster_path 
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : 'https://via.placeholder.com/500x750?text=No+Image'
              }
              alt={item.title || item.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <h3 className="font-medium text-white text-sm line-clamp-1 group-hover:text-netflix-red transition-colors">
            {item.title || item.name}
          </h3>
          <p className="text-gray-400 text-xs mt-1">
            {getYear(item.release_date)} • {formatRating(item.vote_average)}
          </p>
        </Link>
        
        {/* Hover Actions */}
        {isHovered && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/70 rounded-lg transition-opacity">
            <button
              onClick={(e) => {
                e.preventDefault()
                onPlay()
              }}
              className="p-2 bg-netflix-red text-white rounded-full hover:bg-red-700 transition-colors"
              title="Watch Trailer"
            >
              <FiPlay size={18} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                onInfo()
              }}
              className="p-2 bg-gray-600 text-white rounded-full hover:bg-gray-500 transition-colors"
              title="More Info"
            >
              <FiInfo size={18} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                onRemove()
              }}
              className="p-2 bg-gray-600 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Remove"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        )}
      </div>
    )
  }
  
  // List View
  return (
    <div className="flex gap-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
      {/* Poster */}
      <Link to={`/${item.media_type}/${item.id}`} className="flex-shrink-0">
        <img
          src={item.poster_path 
            ? `https://image.tmdb.org/t/p/w200${item.poster_path}`
            : 'https://via.placeholder.com/200x300?text=No+Image'
          }
          alt={item.title || item.name}
          className="w-24 h-36 object-cover rounded-md"
        />
      </Link>
      
      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link to={`/${item.media_type}/${item.id}`}>
          <h3 className="text-lg font-bold text-white hover:text-netflix-red transition-colors">
            {item.title || item.name}
          </h3>
        </Link>
        <p className="text-gray-400 text-sm mt-1">
          {getYear(item.release_date)} • 
          <span className="capitalize ml-1">{item.media_type}</span> • 
          <span className="text-yellow-400 ml-1">{formatRating(item.vote_average)}</span>
        </p>
        <p className="text-gray-500 text-sm mt-2 line-clamp-2">
          {item.overview || 'No description available.'}
        </p>
        
        {/* Added Date */}
        <p className="text-gray-600 text-xs mt-2">
          Added on {new Date(item.addedAt).toLocaleDateString()}
        </p>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col gap-2 justify-center">
        <button
          onClick={onPlay}
          className="flex items-center gap-2 px-4 py-2 bg-netflix-red text-white rounded-md hover:bg-red-700 transition-colors text-sm"
        >
          <FiPlay size={16} />
          Trailer
        </button>
        <button
          onClick={onRemove}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
        >
          <FiTrash2 size={16} />
          Remove
        </button>
      </div>
    </div>
  )
}

// Loading State
const LoadingState = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin w-12 h-12 border-4 border-netflix-red border-t-transparent rounded-full mx-auto mb-4" />
      <p className="text-gray-400">Loading watchlist...</p>
    </div>
  </div>
)

// Empty State
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6">
      <FiHeart className="w-12 h-12 text-gray-600" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">Your watchlist is empty</h2>
    <p className="text-gray-400 mb-6 max-w-md">
      Start adding movies and TV shows to your watchlist to see them here.
    </p>
    <Link
      to="/browse"
      className="inline-flex items-center gap-2 px-6 py-3 bg-netflix-red text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
    >
      Browse Movies & Shows
    </Link>
  </div>
)

// Clear Modal
const ClearWatchlistModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold text-white mb-4">Clear Watchlist</h3>
        <p className="text-gray-400 mb-6">
          Are you sure you want to remove all items from your watchlist? 
          This action cannot be undone.
        </p>
        <div className="flex gap-4 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  )
}

export default WatchlistPage

