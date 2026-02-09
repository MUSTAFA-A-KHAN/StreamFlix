import { useState } from 'react'
import { FiMaximize2, FiMinimize2, FiSettings, FiVolume2, FiVolumeX, FiX } from 'react-icons/fi'
import ReactPlayer from 'react-player'
import { getYouTubeVideoId } from '../../utils/helpers'

// Trailer Player Component
export const TrailerPlayer = ({ videoId, title, onClose }) => {
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  
  const toggleMute = () => {
    setMuted(!muted)
    setVolume(muted ? 1 : 0)
  }
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }
  
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setMuted(newVolume === 0)
  }
  
  // Get YouTube video ID if full URL provided
  const youtubeId = getYouTubeVideoId(videoId) || videoId
  
  if (!youtubeId) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-800 rounded-lg">
        <p className="text-gray-400">No trailer available</p>
      </div>
    )
  }
  
  return (
    <div 
      className="relative bg-black rounded-lg overflow-hidden group"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
        >
          <FiX size={24} />
        </button>
      )}
      
      {/* Player */}
      <div className="aspect-video">
        <ReactPlayer
          url={`https://www.youtube.com/watch?v=${youtubeId}`}
          width="100%"
          height="100%"
          playing={isPlaying}
          volume={volume}
          muted={muted}
          controls={false}
          config={{
            youtube: {
              playerVars: {
                autoplay: 1,
                modestbranding: 1,
                rel: 0,
                fs: 0,
              }
            }
          }}
        />
      </div>
      
      {/* Custom Controls Overlay */}
      <div 
        className={`
          absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4
          transition-opacity duration-300
          ${showControls ? 'opacity-100' : 'opacity-0'}
        `}
      >
        {/* Progress Bar */}
        <div className="w-full h-1 bg-gray-600 rounded-full mb-4 cursor-pointer">
          <div className="h-full bg-netflix-red rounded-full" style={{ width: '0%' }} />
        </div>
        
        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play/Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white hover:text-netflix-red transition-colors"
            >
              {isPlaying ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            
            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-white hover:text-netflix-red transition-colors"
              >
                {muted || volume === 0 ? (
                  <FiVolumeX size={20} />
                ) : (
                  <FiVolume2 size={20} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20 accent-netflix-red"
              />
            </div>
            
            {/* Title */}
            <span className="text-white font-medium hidden md:block">
              {title || 'Trailer'}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Settings */}
            <button className="text-white hover:text-netflix-red transition-colors hidden md:block">
              <FiSettings size={20} />
            </button>
            
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-netflix-red transition-colors"
            >
              {isFullscreen ? (
                <FiMinimize2 size={20} />
              ) : (
                <FiMaximize2 size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Full Page Trailer
export const WatchTrailerPage = ({ videoId, title }) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <TrailerPlayer videoId={videoId} title={title} />
      </div>
    </div>
  )
}

// Embedded Trailer
export const EmbeddedTrailer = ({ videoId, title, autoplay = true }) => {
  const youtubeId = getYouTubeVideoId(videoId) || videoId
  
  return (
    <div className="aspect-video rounded-lg overflow-hidden">
      <iframe
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${autoplay ? 1 : 0}&rel=0`}
        title={title || 'Trailer'}
        className="w-full h-full"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

export default TrailerPlayer

