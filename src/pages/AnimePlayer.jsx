import Hls from 'hls.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  FiAlertCircle,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiFastForward,
  FiFilm,
  FiGrid,
  FiHeart,
  FiList,
  FiLoader,
  FiMaximize,
  FiMinimize,
  FiMonitor,
  FiPause,
  FiPlay,
  FiRewind,
  FiServer,
  FiSettings,
  FiSkipForward,
  FiVolume1,
  FiVolume2,
  FiVolumeX,
  FiZoomIn
} from 'react-icons/fi'

import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  getAnimeDetails,
  getEpisodes,
  getPosterUrl,
  getProxiedStreamUrl,
  getProxiedSubtitleUrl,
  getServers,
  getStreamLink
} from '../services/anime'

// Provider options
const PROVIDER_OPTIONS = [
  { id: 'hianime-scrap', label: 'HiAnime' },
  { id: 'animekai', label: 'AnimeKai' },
  { id: 'animepahe', label: 'AnimePahe' }
]

const AnimePlayerPage = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const urlEpisode = searchParams.get('ep')
  const urlProvider = searchParams.get('provider')
  const initialEpisode = urlEpisode ? parseInt(urlEpisode) : 1
  
  const [anime, setAnime] = useState(null)
  const [episodes, setEpisodes] = useState([])
  const [episodesList, setEpisodesList] = useState([])
  const [servers, setServers] = useState({ sub: [], dub: [], raw: [] })
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode)
  const [episodeData, setEpisodeData] = useState(null)
  const [streamData, setStreamData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingStream, setLoadingStream] = useState(false)
  const [selectedType, setSelectedType] = useState('sub')
  const [selectedServer, setSelectedServer] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState(urlProvider || 'hianime-scrap')
  const [videoUrl, setVideoUrl] = useState(null)
  const [showEpisodes, setShowEpisodes] = useState(false)
  const [showServers, setShowServers] = useState(false)

  // Fetch anime details and episodes - with proper cleanup to prevent duplicates
  useEffect(() => { 
    let isMounted = true;
    const controller = new AbortController();
    let episodesFetched = false;
    
    const fetchAnimeDetails = async () => {
      try {
        setLoading(true)
        const detailsData = await getAnimeDetails(id, { signal: controller.signal })
        
        if (!isMounted) return;
        setAnime(detailsData.data)
        
        // Only fetch episodes if we haven't already for this ID/provider
        if (episodesFetched) return;
        
        const episodesData = await getEpisodes(id, selectedProvider, { signal: controller.signal })
        
        if (!isMounted) return;
        episodesFetched = true;
        
        if (episodesData && episodesData.data) {
          setEpisodesList(episodesData.data)
          
          const eps = episodesData.data.map((ep, index) => ({
            number: ep.number || ep.episodeNumber || index + 1,
            id: ep.id,
            title: ep.title || ep.alternativeTitle || `Episode ${ep.number || ep.episodeNumber || index + 1}`,
            isFiller: ep.isFiller || false
          }))
          setEpisodes(eps)
        } else {
          const totalEps = detailsData.data?.episodes?.eps || 0
          if (totalEps > 0) {
            const eps = Array.from({ length: totalEps }, (_, i) => ({
              number: i + 1,
              id: `${id}::ep=${i + 1}`
            }))
            setEpisodes(eps)
          }
        }
      } catch (err) {
        if (err.message === 'Request cancelled' || !isMounted) return;
        setError(err.message || 'Failed to load anime')
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    
    fetchAnimeDetails()
    
    return () => {
      isMounted = false;
      controller.abort();
    }
  }, [id, selectedProvider])

  // Fetch servers - with proper cleanup to prevent duplicates
  useEffect(() => {
    if (!id || !currentEpisode || episodesList.length === 0) return

    let isMounted = true;
    const controller = new AbortController();
    let serversFetched = false;

    const fetchServers = async () => {
      if (serversFetched) return;
      
      try {
        const currentEpData = episodesList.find(ep => ep.number === currentEpisode)
        const episodeId = currentEpData?.id || `${id}::ep=${currentEpisode}`
        
        const serversData = await getServers(episodeId, { signal: controller.signal })
        
        if (!isMounted) return;
        serversFetched = true;
        
        if (serversData && serversData.data) {
          const serverData = serversData.data
          const newServers = {
            sub: serverData.sub || [],
            dub: serverData.dub || [],
            raw: serverData.raw || []
          }
          setServers(newServers)
          setEpisodeData({ episode: serverData.episode })

          const availableServers = newServers[selectedType] || newServers.sub || []
          if (availableServers.length > 0) {
            setSelectedServer(availableServers[0])
          }
        }
      } catch (err) {
        if (err.message === 'Request cancelled' || !isMounted) return;
        console.error('Error fetching servers:', err)
      }
    }

    fetchServers()

    return () => {
      isMounted = false;
      controller.abort();
    }
  }, [id, currentEpisode, selectedProvider, episodesList])

  // Fetch stream - with proper cleanup to prevent duplicates
  useEffect(() => {
    if (!id || !currentEpisode || !selectedServer || episodesList.length === 0) return

    let isMounted = true;
    const controller = new AbortController();
    let streamFetched = false;

    const fetchStream = async () => {
      if (streamFetched) return;
      
      setLoadingStream(true)
      try {
        const currentEpData = episodesList.find(ep => ep.number === currentEpisode)
        const episodeId = currentEpData?.id || `${id}::ep=${currentEpisode}`
        const serverName = selectedServer.name || selectedServer
        
        const streamResponse = await getStreamLink(episodeId, serverName, selectedType, selectedProvider, { signal: controller.signal })
        
        if (!isMounted) return;
        streamFetched = true;
        
        if (streamResponse && streamResponse.data) {
          setStreamData(streamResponse.data)
          const originalUrl = streamResponse.data.link?.file || streamResponse.data.link?.directUrl || streamResponse.data.streamingLink
          
          if (originalUrl) {
            const proxiedUrl = getProxiedStreamUrl(originalUrl)
            setVideoUrl(proxiedUrl)
          } else {
            setError('No stream URL available')
          }
        } else {
          setError('Failed to load stream data')
        }
      } catch (err) {
        if (err.message === 'Request cancelled' || !isMounted) return;
        setError(`Failed to load stream: ${err.message}`)
      } finally {
        if (isMounted) setLoadingStream(false)
      }
    }

    fetchStream()

    return () => {
      isMounted = false;
      controller.abort();
    }
  }, [id, currentEpisode, selectedType, selectedServer, episodesList])

  const handleEpisodeChange = (episodeNum) => {
    setCurrentEpisode(episodeNum)
    setEpisodeData(null)
    setVideoUrl(null)
    setStreamData(null)
    setShowEpisodes(false)
    navigate(`?ep=${episodeNum}&provider=${selectedProvider}`, { replace: true })
  }

  const handleServerChange = (server) => {
    setSelectedServer(server)
    setShowServers(false)
    setVideoUrl(null)
    setStreamData(null)
  }

  const handleTypeChange = (type) => {
    setSelectedType(type)
    const availableServers = servers[type] || []
    if (availableServers.length > 0) {
      setSelectedServer(availableServers[0])
    } else {
      setSelectedServer(null)
    }
    setVideoUrl(null)
    setStreamData(null)
  }

  const handleProviderChange = (provider) => {
    setSelectedProvider(provider)
    setSelectedServer(null)
    setEpisodeData(null)
    setVideoUrl(null)
    setStreamData(null)
    navigate(`?ep=${currentEpisode}&provider=${provider}`, { replace: true })
  }

  const handleNextEpisode = () => {
    if (currentEpisode < episodes.length) {
      handleEpisodeChange(currentEpisode + 1)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
      <div className="relative">
        <FiLoader className="animate-spin text-white text-5xl relative z-10" />
      </div>
      <p className="mt-8 text-gray-500 text-sm tracking-wide uppercase">Loading anime...</p>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900/80 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 max-w-md text-center shadow-2xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FiFilm className="text-red-400 text-2xl" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Failed to Load</h2>
        <p className="text-red-400/80 text-sm mb-8">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-all duration-200 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  )

  const posterUrl = getPosterUrl(anime?.poster)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 group touch-manipulation"
          >
            <FiArrowLeft size={16} className="sm:w-[18px] sm:h-[18px] text-gray-400 group-hover:text-white transition-colors" />
            <span className="text-xs sm:text-sm text-gray-400 group-hover:text-white transition-colors">Back</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 max-w-xs sm:max-w-md">
            {posterUrl && (
              <img
                src={posterUrl}
                alt={anime?.title}
                className="w-6 h-9 sm:w-8 sm:h-11 object-cover rounded-md shadow-lg hidden md:block"
              />
            )}
            <h1 className="font-semibold text-xs sm:text-sm md:text-base truncate max-w-[120px] sm:max-w-xs md:max-w-md text-white/90">
              {anime?.title}
            </h1>
          </div>

          <button className="p-1.5 sm:p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-red-400 transition-all duration-200 touch-manipulation">
            <FiHeart size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>

      <div className="pt-14">
        {/* Video Player */}
        <div className="relative bg-black aspect-video w-full">
          {loadingStream ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950">
              <div className="relative">
                <div className="absolute inset-0 bg-violet-500/20 blur-2xl rounded-full animate-pulse"></div>
                <FiLoader className="animate-spin text-violet-500 text-4xl relative z-10" />
              </div>
              <p className="mt-6 text-gray-500 text-sm tracking-wide uppercase">Loading stream...</p>
            </div>
          ) : videoUrl ? (
            <VideoPlayer 
              src={videoUrl} 
              poster={posterUrl}
              tracks={streamData?.tracks || []}
              animeId={id}
              episodeNumber={currentEpisode}
              onNextEpisode={handleNextEpisode}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-950">
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FiFilm size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-300 text-base font-medium">
                  {selectedServer ? 'Preparing your stream...' : 'Select a server to start watching'}
                </p>
                <p className="text-gray-500 text-sm mt-2">Choose from available servers below</p>
              </div>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="bg-gray-900/50 border-t border-white/5">
          <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
            {/* Episode Navigation */}
            <div className="flex items-center gap-2 bg-gray-900/80 rounded-xl p-1.5 border border-white/5">
              <button
                disabled={currentEpisode <= 1}
                onClick={() => handleEpisodeChange(currentEpisode - 1)}
                className="p-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <FiChevronLeft size={18} />
              </button>
              <div className="px-4 py-2 min-w-[100px] text-center">
                <span className="text-gray-500 text-[10px] uppercase tracking-wider block">Episode</span>
                <p className="font-semibold text-white text-sm">{currentEpisode} <span className="text-gray-500 font-normal">/ {episodes.length}</span></p>
              </div>
              <button 
                disabled={currentEpisode >= episodes.length}
                onClick={() => handleEpisodeChange(currentEpisode + 1)}
                className="p-2.5 bg-gray-800 hover:bg-violet-600 disabled:opacity-30 disabled:hover:bg-gray-800 rounded-lg transition-all duration-200"
              >
                <FiChevronRight size={18} />
              </button>
            </div>

            {/* Provider & Server Selection */}
            <div className="flex gap-1.5 sm:gap-2 flex-wrap">
              <div className="relative">
                <select
                  value={selectedProvider}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  className="px-2 sm:px-3 py-2 sm:py-2.5 bg-gray-900/80 border border-white/10 rounded-xl text-white text-xs sm:text-sm appearance-none pr-7 sm:pr-9 cursor-pointer hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:border-white/50 min-w-[100px] sm:min-w-[120px] touch-manipulation"
                >
                  {PROVIDER_OPTIONS.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.label}
                    </option>
                  ))}
                </select>
                <FiServer className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-3 h-3 sm:w-[14px] sm:h-[14px]" />
              </div>

              <button
                onClick={() => setShowEpisodes(!showEpisodes)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm font-medium border touch-manipulation ${
                  showEpisodes
                    ? 'bg-white border-white text-black'
                    : 'bg-gray-900/80 border-white/10 hover:bg-gray-800 text-gray-300'
                }`}
              >
                <FiGrid size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Episodes</span>
                <span className="xs:hidden">Eps</span>
              </button>

              <button
                onClick={() => setShowServers(!showServers)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all duration-200 text-xs sm:text-sm font-medium border touch-manipulation ${
                  showServers
                    ? 'bg-violet-600 border-violet-500 text-white'
                    : 'bg-gray-900/80 border-white/10 hover:bg-gray-800 text-gray-300'
                }`}
              >
                <FiSettings size={14} className="sm:w-4 sm:h-4" />
                <span>Server</span>
              </button>
            </div>
            
            {/* Type Selection */}
            <div className="flex bg-gray-900/80 rounded-xl p-1 border border-white/5">
              {['sub', 'dub', 'raw'].map(type => (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={`px-4 py-2 rounded-lg capitalize text-sm font-medium transition-all duration-200 ${
                    selectedType === type
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Episode Selector */}
          {showEpisodes && (
            <EpisodeSelector
              episodes={episodes}
              currentEpisode={currentEpisode}
              onSelect={handleEpisodeChange}
            />
          )}

          {/* Server Selector */}
          {showServers && (
            <ServerSelector
              servers={servers}
              selectedType={selectedType}
              selectedServer={selectedServer}
              onServerChange={handleServerChange}
              onTypeChange={handleTypeChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Enhanced Video Player Component
const VideoPlayer = ({ src, poster, tracks = [], animeId, episodeNumber, onNextEpisode }) => {
  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const containerRef = useRef(null)
  const controlsTimeoutRef = useRef(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchStartTime = useRef(0)
  const lastTapTime = useRef(0)
  
  // Basic states
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [progress, setProgress] = useState(0)
  const [bufferProgress, setBufferProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [error, setError] = useState(null)
  const [useDirectUrl, setUseDirectUrl] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  // Enhanced states
  const [playbackRate, setPlaybackRate] = useState(1)
  const [quality, setQuality] = useState('auto')
  const [availableQualities, setAvailableQualities] = useState([])
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true)
  const [theaterMode, setTheaterMode] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSkipOverlay, setShowSkipOverlay] = useState(false)
  const [autoPlayCountdown, setAutoPlayCountdown] = useState(null)
  const [isBuffering, setIsBuffering] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [convertedTracks, setConvertedTracks] = useState([])
  const [userTracks, setUserTracks] = useState([])
  const fileInputRef = useRef(null)
  const createdBlobUrlsRef = useRef(new Set())
  const [selectedSubtitleKey, setSelectedSubtitleKey] = useState('none')
  const [brightness, setBrightness] = useState(1)
  const [showFeedback, setShowFeedback] = useState(null)

  // Zoom states
  const [zoomMode, setZoomMode] = useState('fit') // 'fit', 'fill', 'stretch', 'zoom'
  const [pinchStartDistance, setPinchStartDistance] = useState(0)
  const [pinchStartZoom, setPinchStartZoom] = useState(1)
  const [currentZoom, setCurrentZoom] = useState(1)
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 })
  const [isZooming, setIsZooming] = useState(false)

  // Convert SRT to WebVTT format and remove image sprite references
  const convertSrtToVtt = (srtContent) => {
  const blocks = srtContent
    .replace(/\r/g, '')
    .split(/\n\s*\n/)

  let vtt = 'WEBVTT\n\n'

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
    if (lines.length < 2) continue

    let timeLineIndex = 0

    // If first line is index number, skip it
    if (/^\d+$/.test(lines[0])) {
      timeLineIndex = 1
    }

    const timeLine = lines[timeLineIndex]
    if (!timeLine || !timeLine.includes('-->')) continue

    // Convert SRT timestamp → VTT
    const vttTime = timeLine.replace(/,/g, '.')

    const dialogueLines = lines.slice(timeLineIndex + 1)

   const cleanedDialogue = dialogueLines
  .map(line => {
    return line
      .replace(/xywh=\d+,\d+,\d+,\d+/gi, '') // REMOVE xywh coords
      .replace(/^[^a-zA-Z0-9]*[a-z0-9_\-]{2,20}={1,3}/gi, '') // REMOVE prefix junk
      .replace(/{\\.*?}/g, '') // ASS tags
      .replace(/sprite-\d+\.[a-z]+/gi, '') // sprite refs
      .replace(/\b\d{3,4},\d{3,4},\d{3,4},\d{3,4}\b/g, '') // coordinate junk
      .replace(/={2,}/g, '') // extra ==
      .trim()
  })
  .filter(line => line.length > 0)


    if (!cleanedDialogue.length) continue

    vtt += vttTime + '\n'
    vtt += cleanedDialogue.join('\n') + '\n\n'
  }

  return vtt
}

  // Fetch and convert subtitle with fallback strategies
  const fetchAndConvertSubtitle = async (originalUrl) => {
    // Strategy 1: Try original URL directly (some servers have CORS enabled)
    try {
      console.log('[VideoPlayer] Trying direct subtitle fetch:', originalUrl)
      const response = await fetch(originalUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*, text/plain, application/octet-stream',
        },
      })
      if (response.ok) {
        const srtContent = await response.text()
        if (srtContent.length > 0 && !srtContent.includes('<!DOCTYPE')) {
          console.log('[VideoPlayer] Direct fetch successful, content length:', srtContent.length)
          const vttContent = convertSrtToVtt(srtContent)
          const blob = new Blob([vttContent], { type: 'text/vtt' })
          const blobUrl = URL.createObjectURL(blob)
          createdBlobUrlsRef.current.add(blobUrl)
          return blobUrl
        }
      }
    } catch (err) {
      console.log('[VideoPlayer] Direct subtitle fetch failed:', err.message)
    }

    // Strategy 2: Try proxied URL
    try {
      const proxiedUrl = getProxiedSubtitleUrl(originalUrl)
      console.log('[VideoPlayer] Trying proxied subtitle fetch:', proxiedUrl)
      const response = await fetch(proxiedUrl, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      })
      if (response.ok) {
        const srtContent = await response.text()
        if (srtContent.length > 0 && !srtContent.includes('<!DOCTYPE')) {
          console.log('[VideoPlayer] Proxied fetch successful, content length:', srtContent.length)
          const vttContent = convertSrtToVtt(srtContent)
          const blob = new Blob([vttContent], { type: 'text/vtt' })
          const blobUrl = URL.createObjectURL(blob)
          createdBlobUrlsRef.current.add(blobUrl)
          return blobUrl
        }
      } else {
        console.log('[VideoPlayer] Proxied fetch returned status:', response.status)
      }
    } catch (err) {
      console.log('[VideoPlayer] Proxied subtitle fetch failed:', err.message)
    }

    // Strategy 3: Return null if all failed
    console.log('[VideoPlayer] All subtitle fetch strategies failed for:', originalUrl)
    return null
  }

  // Get effective URL
  const getEffectiveUrl = () => {
    if (useDirectUrl) {
      try {
        const urlObj = new URL(src)
        const originalUrl = urlObj.searchParams.get('url')
        if (originalUrl) {
          return decodeURIComponent(originalUrl)
        }
      } catch (e) {
        console.error('Error parsing proxy URL:', e)
      }
      return src
    }
    return src
  }

  // Load watch progress
  useEffect(() => {
    if (animeId && episodeNumber) {
      const key = `watch-progress-${animeId}-${episodeNumber}`
      const saved = localStorage.getItem(key)
      if (saved) {
        const { time, timestamp } = JSON.parse(saved)
        const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24)
        if (daysSince < 30 && time > 10) {
          const video = videoRef.current
          if (video) {
            video.currentTime = time
            setCurrentTime(time)
          }
        }
      }
    }
  }, [animeId, episodeNumber])

  // Save watch progress
  useEffect(() => {
    if (!animeId || !episodeNumber || !currentTime) return
    
    const interval = setInterval(() => {
      const key = `watch-progress-${animeId}-${episodeNumber}`
      localStorage.setItem(key, JSON.stringify({
        time: currentTime,
        duration: duration,
        timestamp: Date.now()
      }))
    }, 5000)
    
    return () => clearInterval(interval)
  }, [animeId, episodeNumber, currentTime, duration])

  // Load saved preferences
  useEffect(() => {
    const savedVolume = localStorage.getItem('player-volume')
    const savedRate = localStorage.getItem('player-playback-rate')
    const savedQuality = localStorage.getItem('player-quality')
    const savedBrightness = localStorage.getItem('player-brightness')

    if (savedVolume) setVolume(parseFloat(savedVolume))
    if (savedRate) setPlaybackRate(parseFloat(savedRate))
    if (savedQuality) setQuality(savedQuality)
    if (savedBrightness) setBrightness(parseFloat(savedBrightness))
  }, [])

  // Initialize HLS player
  useEffect(() => {
    const video = videoRef.current
    const effectiveSrc = getEffectiveUrl()
    if (!video || !effectiveSrc) return

    setError(null)

    if (hlsRef.current) {
      hlsRef.current.detachMedia()
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    video.pause()
    video.removeAttribute('src')
    video.load()

    const isHLS = effectiveSrc.includes('.m3u8') || effectiveSrc.includes('playlist')

    if (isHLS && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
        maxBufferLength: 30,
        maxMaxBufferLength: 600,
        manifestLoadingTimeOut: 10000,
        manifestLoadingMaxRetry: 3,
        levelLoadingTimeOut: 10000,
        levelLoadingMaxRetry: 3,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 3,
        xhrSetup: function(xhr) {
          xhr.withCredentials = false
        }
      })

      hls.loadSource(effectiveSrc)
      hls.attachMedia(video)
      hlsRef.current = hls

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const qualities = data.levels.map((level, index) => ({
          index,
          height: level.height,
          width: level.width,
          bitrate: level.bitrate,
          label: level.height ? `${level.height}p` : `Quality ${index + 1}`
        })).sort((a, b) => (b.height || 0) - (a.height || 0))
        
        setAvailableQualities([{ index: -1, label: 'Auto' }, ...qualities])
        
        if (quality !== 'auto' && hls) {
          const targetQuality = qualities.find(q => q.label === quality)
          if (targetQuality) {
            hls.currentLevel = targetQuality.index
          }
        }
        
        video.play().catch(() => {})
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCount < 2) {
                setRetryCount(prev => prev + 1)
                hls.startLoad()
              } else if (!useDirectUrl) {
                setUseDirectUrl(true)
                setRetryCount(0)
              } else {
                setError('Network error: Unable to load stream.')
                hls.destroy()
              }
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError()
              break
            default:
              if (!useDirectUrl) {
                setUseDirectUrl(true)
              } else {
                setError('Failed to load video stream.')
                hls.destroy()
              }
              break
          }
        }
      })
    } else {
      video.src = effectiveSrc
      video.load()
      video.play().catch(() => {})
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.detachMedia()
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [src, useDirectUrl, retryCount])

  // Handle play/pause
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    if (isPlaying) {
      video.play().catch(err => {
        console.error('Play error:', err)
        setIsPlaying(false)
      })
    } else {
      video.pause()
    }
  }, [isPlaying])

  // Handle volume
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.volume = volume
    video.muted = isMuted || volume === 0
    localStorage.setItem('player-volume', volume.toString())
  }, [volume, isMuted])

  // Handle brightness
  useEffect(() => {
    localStorage.setItem('player-brightness', brightness.toString())
  }, [brightness])

  // Handle zoom mode
  useEffect(() => {
    localStorage.setItem('player-zoom-mode', zoomMode)
    // Reset zoom when changing modes
    setCurrentZoom(1)
    setZoomOffset({ x: 0, y: 0 })
  }, [zoomMode])

  // Handle playback rate
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.playbackRate = playbackRate
    localStorage.setItem('player-playback-rate', playbackRate.toString())
  }, [playbackRate])

  // Initialize and convert subtitles when tracks change
  useEffect(() => {
    const loadSubtitles = async () => {
      if (tracks.length === 0) {
        console.log('[VideoPlayer] No tracks available')
        setConvertedTracks([])
        return
      }
      
      console.log('[VideoPlayer] Converting tracks:', tracks.length, tracks)
      
      const converted = await Promise.all(
        tracks.map(async (track, index) => {
          // Use original URL, let fetchAndConvertSubtitle handle proxy fallback
          const vttUrl = await fetchAndConvertSubtitle(track.file)
          return {
            ...track,
            vttUrl,
            index
          }
        })
      )
      
      const successful = converted.filter(t => t.vttUrl !== null)
      console.log('[VideoPlayer] Successfully converted tracks:', successful.length, successful)
      setConvertedTracks(successful)
    }
    
    loadSubtitles()
    
    return () => {
      convertedTracks.forEach(track => {
        if (track.vttUrl && track.vttUrl.startsWith('blob:')) {
          URL.revokeObjectURL(track.vttUrl)
        }
      })
    }
  }, [tracks])

  // Initialize subtitles when video loads
  useEffect(() => {
    const video = videoRef.current
    if (!video || convertedTracks.length === 0) return
    
    console.log('[VideoPlayer] Setting up text tracks, converted:', convertedTracks.length)
    
    const handleLoadedMetadata = () => {
      console.log('[VideoPlayer] Metadata loaded, textTracks:', video.textTracks.length)
      const textTracks = video.textTracks
      for (let i = 0; i < textTracks.length; i++) {
        const track = textTracks[i]
        console.log(`[VideoPlayer] Track ${i}: kind=${track.kind}, mode=${track.mode}, label=${track.label}`)
        if (track.kind === 'subtitles' || track.kind === 'captions') {
          track.mode = subtitlesEnabled ? 'showing' : 'hidden'
          console.log(`[VideoPlayer] Set track ${i} mode to:`, track.mode)
        }
      }
    }
    
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    
    if (video.readyState >= 1) {
      handleLoadedMetadata()
    }
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [convertedTracks, subtitlesEnabled])

  // Ensure a sensible default selection when tracks change
  useEffect(() => {
    const cloudExists = convertedTracks && convertedTracks.length > 0
    const userExists = userTracks && userTracks.length > 0

    const keyExists = (key) => {
      if (!key || key === 'none') return false
      if (key.startsWith('user-')) {
        const idx = Number(key.split('-')[1])
        return !isNaN(idx) && userTracks[idx]
      }
      if (key.startsWith('cloud-')) {
        const idx = Number(key.split('-')[1])
        return !isNaN(idx) && convertedTracks[idx]
      }
      return false
    }

    if (!keyExists(selectedSubtitleKey)) {
      if (userExists) setSelectedSubtitleKey('user-0')
      else if (cloudExists) setSelectedSubtitleKey('cloud-0')
      else setSelectedSubtitleKey('none')
    }
  }, [convertedTracks, userTracks])

  // Cleanup any created blob URLs on unmount
  useEffect(() => {
    return () => {
      try {
        createdBlobUrlsRef.current.forEach((url) => {
          if (url && url.startsWith && url.startsWith('blob:')) {
            URL.revokeObjectURL(url)
          }
        })
      } catch (e) {
        // ignore
      }
      createdBlobUrlsRef.current.clear()
    }
  }, [])

  // Handle quality change
  const handleQualityChange = useCallback((newQuality) => {
    setQuality(newQuality)
    localStorage.setItem('player-quality', newQuality)
    
    if (hlsRef.current) {
      if (newQuality === 'auto') {
        hlsRef.current.currentLevel = -1
      } else {
        const target = availableQualities.find(q => q.label === newQuality)
        if (target && target.index >= 0) {
          hlsRef.current.currentLevel = target.index
        }
      }
    }
  }, [availableQualities])

  // Toggle subtitles
  const toggleSubtitles = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    
    const textTracks = video.textTracks
    const newEnabledState = !subtitlesEnabled
    
    for (let i = 0; i < textTracks.length; i++) {
      if (textTracks[i].kind === 'subtitles' || textTracks[i].kind === 'captions') {
        textTracks[i].mode = newEnabledState ? 'showing' : 'hidden'
      }
    }
    setSubtitlesEnabled(newEnabledState)
  }, [subtitlesEnabled])

  // Handle user subtitle file uploads (.srt or .vtt)
  const handleFileInputChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      let vttContent = text
      if (file.name.toLowerCase().endsWith('.srt')) {
        vttContent = convertSrtToVtt(text)
      } else if (!text.trim().startsWith('WEBVTT')) {
        vttContent = convertSrtToVtt(text)
      }
      const blob = new Blob([vttContent], { type: 'text/vtt' })
      const blobUrl = URL.createObjectURL(blob)
      createdBlobUrlsRef.current.add(blobUrl)
      const newTrack = {
        vttUrl: blobUrl,
        label: file.name,
        lang: 'en',
        index: `user-${Date.now()}`
      }
      setUserTracks(prev => {
        const next = [...prev, newTrack]
        setSelectedSubtitleKey(`user-${next.length - 1}`)
        return next
      })
      setSubtitlesEnabled(true)
    } catch (err) {
      console.error('Failed to load subtitle file', err)
    } finally {
      // reset input so same file can be uploaded again if needed
      if (e.target) e.target.value = ''
    }
  }

  const removeUserTrack = (index) => {
    const idx = Number(index)
    if (isNaN(idx)) return
    setUserTracks(prev => {
      const track = prev[idx]
      if (track && track.vttUrl && track.vttUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(track.vttUrl) } catch(e) {}
        createdBlobUrlsRef.current.delete(track.vttUrl)
      }
      const next = prev.filter((_, i) => i !== idx)
      // adjust selection
      if (selectedSubtitleKey === `user-${idx}`) {
        if (next.length > 0) setSelectedSubtitleKey(`user-0`)
        else if (convertedTracks.length > 0) setSelectedSubtitleKey(`cloud-0`)
        else setSelectedSubtitleKey('none')
      }
      return next
    })
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      
      const video = videoRef.current
      if (!video) return
      
      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault()
          setIsPlaying(prev => !prev)
          break
        case 'arrowleft':
        case 'j':
          e.preventDefault()
          video.currentTime = Math.max(0, video.currentTime - 10)
          showSkipFeedback('backward')
          break
        case 'arrowright':
        case 'l':
          e.preventDefault()
          video.currentTime = Math.min(video.duration, video.currentTime + 10)
          showSkipFeedback('forward')
          break
        case 'arrowup':
          e.preventDefault()
          setVolume(prev => Math.min(1, prev + 0.1))
          break
        case 'arrowdown':
          e.preventDefault()
          setVolume(prev => Math.max(0, prev - 0.1))
          break
        case 'f':
          e.preventDefault()
          handleFullscreen()
          break
        case 'm':
          e.preventDefault()
          setIsMuted(prev => !prev)
          break
        case 't':
          e.preventDefault()
          setTheaterMode(prev => !prev)
          break
        case 'z':
          e.preventDefault()
          cycleZoomMode()
          break
        case '0': case '1': case '2': case '3': case '4':
        case '5': case '6': case '7': case '8': case '9':
          e.preventDefault()
          const percent = parseInt(e.key) * 10
          video.currentTime = (percent / 100) * video.duration
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Touch gestures
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchStartTime.current = Date.now()

    // Handle pinch start for zoom
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      setPinchStartDistance(distance)
      setPinchStartZoom(currentZoom)
      setIsZooming(true)
    }
  }

  const handleTouchMove = (e) => {
    // Handle pinch zoom
    if (e.touches.length === 2 && pinchStartDistance > 0) {
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )

      const scale = distance / pinchStartDistance
      const newZoom = Math.max(0.5, Math.min(3, pinchStartZoom * scale))

      setCurrentZoom(newZoom)
      if (newZoom <= 1) {
        setZoomMode('fit') // Switch to fit when zoomed out
      } else {
        setZoomMode('zoom') // Switch to zoom mode when pinching in
      }
    }
  }

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX
    const touchEndY = e.changedTouches[0].clientY
    const touchDuration = Date.now() - touchStartTime.current
    const currentTime = Date.now()

    // Reset pinch state
    if (e.touches.length < 2) {
      setPinchStartDistance(0)
      setIsZooming(false)
    }

    // Only process single touch gestures if not zooming
    if (e.touches.length === 0 && !isZooming) {
      const deltaX = touchEndX - touchStartX.current
      const deltaY = touchEndY - touchStartY.current

      // Double tap detection - only for seeking on mobile
      if (touchDuration < 250 && touchDuration > 50 && Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
        // Check if this is a true double tap (within 300ms of last tap)
        if (lastTapTime.current && (currentTime - lastTapTime.current) < 300) {
          const video = videoRef.current
          if (video) {
            const rect = video.getBoundingClientRect()
            const touchX = touchStartX.current - rect.left

            if (touchX < rect.width / 2) {
              video.currentTime = Math.max(0, video.currentTime - 10)
              showSkipFeedback('backward')
            } else {
              video.currentTime = Math.min(video.duration, video.currentTime + 10)
              showSkipFeedback('forward')
            }
          }
          // Reset lastTapTime after successful double tap
          lastTapTime.current = 0
          return
        } else {
          // This is the first tap, store the time for potential double tap
          lastTapTime.current = currentTime
        }
      }

      // Gesture-based volume and brightness control
      // Only process if it's a clear vertical swipe (not horizontal)
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 50 && touchDuration > 100) {
        const screenWidth = window.innerWidth
        const startX = touchStartX.current

        // Determine side: left half = brightness, right half = volume
        const isLeftSide = startX < screenWidth / 2

        // Calculate change amount (scale sensitivity)
        const changeAmount = -(deltaY / window.innerHeight) * 0.5

        if (isLeftSide) {
          // Left side: Brightness control
          setBrightness(prev => {
            const newBrightness = Math.max(0.3, Math.min(2, prev + changeAmount))
            setShowFeedback({ type: 'brightness', value: Math.round(newBrightness * 100) })
            setTimeout(() => setShowFeedback(null), 1500)
            return newBrightness
          })
        } else {
          // Right side: Volume control
          setVolume(prev => {
            const newVolume = Math.max(0, Math.min(1, prev + changeAmount))
            setShowFeedback({ type: 'volume', value: Math.round(newVolume * 100) })
            setTimeout(() => setShowFeedback(null), 1500)
            return newVolume
          })
        }
      } else if (touchDuration < 250 && Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
        // Single tap - show controls and auto-hide after 4 seconds
        setShowControls(true)
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000)
      }
    }
  }

  // Show skip feedback
  const showSkipFeedback = (direction) => {
    setShowSkipOverlay(direction)
    setTimeout(() => setShowSkipOverlay(false), 800)
  }

  // Auto-play next episode
  useEffect(() => {
    if (!onNextEpisode || !duration) return
    
    const video = videoRef.current
    if (!video) return
    
    const checkAutoPlay = () => {
      const timeLeft = duration - video.currentTime
      if (timeLeft < 15 && timeLeft > 0 && !autoPlayCountdown) {
        setAutoPlayCountdown(Math.ceil(timeLeft))
      } else if (timeLeft <= 0 && autoPlayCountdown) {
        onNextEpisode()
      }
    }
    
    const interval = setInterval(checkAutoPlay, 1000)
    return () => clearInterval(interval)
  }, [duration, onNextEpisode, autoPlayCountdown])

  // Countdown timer
  useEffect(() => {
    if (autoPlayCountdown === null || autoPlayCountdown <= 0) return
    
    const timer = setTimeout(() => {
      setAutoPlayCountdown(prev => prev > 1 ? prev - 1 : 0)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [autoPlayCountdown])

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    
    setCurrentTime(video.currentTime)
    setDuration(video.duration)
    if (video.duration > 0) {
      setProgress((video.currentTime / video.duration) * 100)
    }
    
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1)
      setBufferProgress((bufferedEnd / video.duration) * 100)
    }
  }

  const handleWaiting = () => setIsBuffering(true)
  const handleCanPlay = () => setIsBuffering(false)

  const handleSeek = (e) => {
    const video = videoRef.current
    if (!video) return
    
    const time = (e.target.value / 100) * video.duration
    video.currentTime = time
    setProgress(e.target.value)
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleDoubleClick = (e) => {
    e.preventDefault()
    // Disable double-click skipping on touch devices to avoid conflicts with touch gestures
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return
    }

    const video = videoRef.current
    if (video) {
      const rect = video.getBoundingClientRect()
      const clickX = e.clientX - rect.left

      if (clickX < rect.width / 2) {
        video.currentTime = Math.max(0, video.currentTime - 10)
        showSkipFeedback('backward')
      } else {
        video.currentTime = Math.min(video.duration, video.currentTime + 10)
        showSkipFeedback('forward')
      }
    }
  }

  const skipForward = () => {
    const video = videoRef.current
    if (video) {
      video.currentTime = Math.min(video.duration, video.currentTime + 10)
      showSkipFeedback('forward')
    }
  }

  const skipBackward = () => {
    const video = videoRef.current
    if (video) {
      video.currentTime = Math.max(0, video.currentTime - 10)
      showSkipFeedback('backward')
    }
  }

  const cancelAutoPlay = () => {
    setAutoPlayCountdown(null)
  }

  // Cycle through zoom modes
  const cycleZoomMode = useCallback(() => {
    const modes = ['fit', 'fill', 'stretch', 'zoom']
    const currentIndex = modes.indexOf(zoomMode)
    const nextIndex = (currentIndex + 1) % modes.length
    const nextMode = modes[nextIndex]
    setZoomMode(nextMode)

    // Set default zoom level when entering zoom mode
    if (nextMode === 'zoom' && currentZoom <= 1) {
      setCurrentZoom(1.5)
    }
  }, [zoomMode, currentZoom])

  // Get zoom transform style
  const getZoomStyle = () => {
    switch (zoomMode) {
      case 'fit':
        return { objectFit: 'contain', transform: 'scale(1)', transformOrigin: 'center' }
      case 'fill':
        return { objectFit: 'cover', transform: 'scale(1)', transformOrigin: 'center' }
      case 'stretch':
        return { objectFit: 'fill', transform: 'scale(1)', transformOrigin: 'center' }
      case 'zoom':
        return {
          objectFit: 'cover',
          transform: `scale(${currentZoom}) translate(${zoomOffset.x}px, ${zoomOffset.y}px)`,
          transformOrigin: 'center',
          transition: isZooming ? 'none' : 'transform 0.3s ease-out'
        }
      default:
        return { objectFit: 'contain', transform: 'scale(1)', transformOrigin: 'center' }
    }
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      ref={containerRef}
      className={`relative group w-full bg-black overflow-hidden flex items-center justify-center transition-all duration-300 ${
        theaterMode ? 'h-[85vh]' : 'h-full'
      }`}
      onMouseMove={() => {
        setShowControls(true)
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
        if (isPlaying) {
          controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000)
        }
      }}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {error ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gray-900 text-red-500">
          <FiFilm size={48} className="mb-2" />
          <p>{error}</p>
          <div className="flex gap-2 mt-4">
            {!useDirectUrl && (
              <button
                onClick={() => {
                  setUseDirectUrl(true)
                  setError(null)
                  setRetryCount(0)
                }}
                className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700"
              >
                Try Direct URL
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 rounded text-white hover:bg-purple-700"
            >
              Reload Player
            </button>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full"
          poster={poster}
          onTimeUpdate={handleTimeUpdate}
          onWaiting={handleWaiting}
          onCanPlay={handleCanPlay}
          onClick={() => {
            setShowControls(true)
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000)
          }}
          muted={isMuted || volume === 0}
          playsInline
          crossOrigin="anonymous"
          style={{ filter: `brightness(${brightness})`, ...getZoomStyle() }}
        >
          {(() => {
            if (selectedSubtitleKey === 'none') return null
            let track = null
            if (selectedSubtitleKey.startsWith('user-')) {
              const idx = Number(selectedSubtitleKey.split('-')[1])
              track = userTracks[idx]
            } else if (selectedSubtitleKey.startsWith('cloud-')) {
              const idx = Number(selectedSubtitleKey.split('-')[1])
              track = convertedTracks[idx]
            }
            if (!track) return null
            return (
              <track
                key={`track-${track.index}`}
                kind="subtitles"
                src={track.vttUrl}
                srclang={track.lang || 'en'}
                label={track.label || 'English'}
                default={true}
              />
            )
          })()}
        </video>
      )}

      {/* Buffering Indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 pointer-events-none">
          <div className="relative">
            <FiLoader className="animate-spin text-white text-4xl relative z-10" />
          </div>
        </div>
      )}

      {/* Skip Feedback Overlay */}
      {showSkipOverlay && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl px-8 py-6 transform transition-all duration-300">
            {showSkipOverlay === 'forward' ? (
              <div className="flex items-center gap-3 text-white">
                <FiFastForward size={32} className="text-white" />
                <span className="text-xl font-semibold">+10s</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-white">
                <FiRewind size={32} className="text-white" />
                <span className="text-xl font-semibold">-10s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Volume/Brightness Feedback Overlay */}
      {showFeedback && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          <div className="bg-black/80 backdrop-blur-md rounded-2xl px-6 py-4 transform transition-all duration-300">
            <div className="flex items-center gap-3 text-white">
              {showFeedback.type === 'volume' ? (
                <>
                  <FiVolume2 size={24} className="text-white" />
                  <span className="text-lg font-semibold">{showFeedback.value}%</span>
                </>
              ) : (
                <>
                  <FiZoomIn size={24} className="text-white" />
                  <span className="text-lg font-semibold">{showFeedback.value}%</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auto-play Countdown Overlay */}
      {autoPlayCountdown !== null && onNextEpisode && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-30">
          <div className="text-center">
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-4">Next episode in</p>
            <div className="text-5xl font-bold text-white mb-8">{autoPlayCountdown}</div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={cancelAutoPlay}
                className="px-5 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm font-medium transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={onNextEpisode}
                className="px-5 py-2 bg-white hover:bg-gray-200 rounded-lg text-black text-sm font-medium transition-all duration-200 flex items-center gap-2"
              >
                <FiSkipForward size={16} /> Play Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Controls Overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-between transition-opacity duration-300 ${
          showControls || !isPlaying || showSettings ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with title and theater mode */}
        <div className="p-4 sm:p-6 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="flex items-center gap-3">
            {poster && (
              <img src={poster} alt="" className="w-10 h-14 object-cover rounded-lg shadow-lg hidden sm:block opacity-80" />
            )}
            <div>
              <p className="text-white/90 font-medium text-sm sm:text-base line-clamp-1">
                Episode {episodeNumber}
              </p>
              <p className="text-white/40 text-xs mt-0.5">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheaterMode(!theaterMode)}
              className={`p-2 rounded-lg transition-all duration-200 group relative ${theaterMode ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'}`}
              onMouseEnter={() => setActiveTooltip('theater')}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <FiZoomIn size={18} />
              {activeTooltip === 'theater' && (
                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900/90 text-white text-xs rounded-md whitespace-nowrap border border-white/10">
                  Theater Mode (T)
                </span>
              )}
            </button>

            <button
              onClick={cycleZoomMode}
              className={`p-2 rounded-lg transition-all duration-200 group relative bg-white/10 hover:bg-white/20 text-white/80 hover:text-white`}
              onMouseEnter={() => setActiveTooltip('zoom')}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              <FiZoomIn size={18} />
              {activeTooltip === 'zoom' && (
                <span className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900/90 text-white text-xs rounded-md whitespace-nowrap border border-white/10">
                  Zoom: {zoomMode.charAt(0).toUpperCase() + zoomMode.slice(1)} (Z)
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Center play button */}
        <div className="flex-1 flex items-center justify-center">
          {!isPlaying && !isBuffering && (
            <button
              onClick={() => setIsPlaying(true)}
              className="p-4 sm:p-6 bg-white rounded-full text-black transform transition-all duration-200 hover:scale-110 group touch-manipulation"
            >
              <FiPlay size={24} className="sm:w-8 sm:h-8 ml-0.5 sm:ml-1 group-hover:scale-105 transition-transform" />
            </button>
          )}
        </div>

        {/* Bottom controls */}
        <div className="p-4 sm:p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
          {/* Progress bar with buffer indicator */}
          <div className="relative mb-4 group">
            <div 
              className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 bg-gray-600/50 rounded-full pointer-events-none"
              style={{ width: `${bufferProgress}%` }}
            />
            <input
              type="range"
              className="relative z-10 w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer transition-all"
              min="0"
              max="100"
              value={progress || 0}
              onChange={handleSeek}
              style={{
                background: `linear-gradient(to right, #ffffff 0%, #ffffff ${progress}%, transparent ${progress}%, transparent 100%)`
              }}
            />
            <div className="absolute -top-8 left-0 bg-gray-900/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {formatTime(currentTime)}
            </div>
          </div>
          
          {/* Control buttons row */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            {/* Left controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110 group relative"
                onMouseEnter={() => setActiveTooltip('play')}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
                {activeTooltip === 'play' && (
                  <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap">
                    {isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  </span>
                )}
              </button>
              
              <button
                onClick={skipBackward}
                className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110 group relative hidden sm:block"
                onMouseEnter={() => setActiveTooltip('back')}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <FiRewind size={18} />
                {activeTooltip === 'back' && (
                  <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap">
                    -10s (←)
                  </span>
                )}
              </button>

              <button
                onClick={skipForward}
                className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 hover:scale-110 group relative hidden sm:block"
                onMouseEnter={() => setActiveTooltip('forward')}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <FiFastForward size={18} />
                {activeTooltip === 'forward' && (
                  <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap">
                    +10s (→)
                  </span>
                )}
              </button>
              
              <div 
                className="flex items-center gap-2 bg-white/10 rounded-full p-1.5 sm:p-2 hover:bg-white/20 transition-all group/volume"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-1 rounded-full hover:bg-white/10 transition-all"
                >
                  {isMuted || volume === 0 ? <FiVolumeX size={18} /> : volume < 0.5 ? <FiVolume1 size={18} /> : <FiVolume2 size={18} />}
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 ${showVolumeSlider ? 'w-24 opacity-100' : 'w-0 opacity-0'}`}>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="bg-gray-900/60 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/10 hidden sm:block">
                <span className="text-sm font-mono text-gray-300">
                  <span className="text-white font-semibold">{formatTime(currentTime)}</span>
                  <span className="mx-1 text-gray-500">/</span>
                  <span className="text-gray-400">{formatTime(duration)}</span>
                </span>
              </div>
            </div>
            
            {/* Right controls */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
              {/* Settings button */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 sm:p-2.5 rounded-full transition-all duration-300 group relative touch-manipulation ${showSettings ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                  onMouseEnter={() => setActiveTooltip('settings')}
                  onMouseLeave={() => setActiveTooltip(null)}
                >
                  <FiSettings size={18} className="sm:w-5 sm:h-5" />
                  {activeTooltip === 'settings' && (
                    <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap">
                      Settings
                    </span>
                  )}
                </button>

                {/* Settings menu */}
                {showSettings && (
                  <div className="absolute bottom-full mb-2 right-0 w-44 sm:w-48 bg-gray-900/95 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl p-2 sm:p-3 z-50">
                    <div className="space-y-2 sm:space-y-3">
                      {/* Playback speed */}
                      <div>
                        <p className="text-xs text-gray-400 mb-1 sm:mb-1.5">Speed</p>
                        <select
                          value={playbackRate}
                          onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                          className="w-full px-2 py-1.5 bg-gray-800 rounded-lg text-sm text-white border border-white/10 focus:outline-none focus:border-white/50 touch-manipulation"
                        >
                          <option value={0.5}>0.5x</option>
                          <option value={0.75}>0.75x</option>
                          <option value={1}>1x</option>
                          <option value={1.25}>1.25x</option>
                          <option value={1.5}>1.5x</option>
                          <option value={2}>2x</option>
                        </select>
                      </div>

                      {/* Quality selector */}
                      {availableQualities.length > 1 && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1 sm:mb-1.5">Quality</p>
                          <select
                            value={quality}
                            onChange={(e) => handleQualityChange(e.target.value)}
                            className="w-full px-2 py-1.5 bg-gray-800 rounded-lg text-sm text-white border border-white/10 focus:outline-none focus:border-purple-500 touch-manipulation"
                          >
                            {availableQualities.map((q) => (
                              <option key={q.label} value={q.label}>
                                {q.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Subtitle toggle */}
                      {(tracks.length > 0 || userTracks.length > 0) && (
                        <button
                          onClick={toggleSubtitles}
                          className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-800 rounded-lg text-sm text-white hover:bg-gray-700 transition-all touch-manipulation"
                        >
                          <span>Subtitles</span>
                          <span className={`w-7 sm:w-8 h-3.5 sm:h-4 rounded-full relative transition-colors ${subtitlesEnabled ? 'bg-white' : 'bg-gray-600'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-2.5 sm:w-3 h-2.5 sm:h-3 bg-black rounded-full transition-transform ${subtitlesEnabled ? 'translate-x-3 sm:translate-x-4' : 'translate-x-0'}`}></span>
                          </span>
                        </button>
                      )}

                      {/* Subtitle selection + Upload/Delete UI */}
                      <div className="mt-2 space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="text/plain,text/vtt,.srt,.vtt"
                          className="hidden"
                          onChange={handleFileInputChange}
                        />

                        <div className="flex gap-2 min-w-0 items-center">
                          <select
                            value={selectedSubtitleKey}
                            onChange={(e) => setSelectedSubtitleKey(e.target.value)}
                            className="flex-1 min-w-0 px-2 py-1.5 bg-gray-800 rounded-lg text-sm text-white border border-white/10 focus:outline-none truncate"
                          >
                            <option value="none">No Subtitles</option>
                            {convertedTracks.map((t, i) => (
                              <option key={`cloud-${i}`} value={`cloud-${i}`}>
                                {`Cloud: ${t.label || t.lang || 'Subtitle ' + (i+1)}`}
                              </option>
                            ))}
                            {userTracks.map((t, i) => (
                              <option key={`user-${i}`} value={`user-${i}`}>
                                {`Uploaded: ${t.label || 'File ' + (i+1)}`}
                              </option>
                            ))}
                          </select>

                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-gray-800 rounded-lg text-sm text-white hover:bg-gray-700 flex-shrink-0"
                          >
                            Upload
                          </button>
                        </div>

                        {selectedSubtitleKey.startsWith('user-') && (
                          <div className="flex gap-2 min-w-0">
                            <button
                              onClick={() => removeUserTrack(selectedSubtitleKey.split('-')[1])}
                              className="flex-1 px-3 py-1.5 bg-red-700 rounded-lg text-sm text-white hover:bg-red-600 min-w-0"
                            >
                              Delete Uploaded
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen button */}
              <button
                onClick={handleFullscreen}
                className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 group relative touch-manipulation"
                onMouseEnter={() => setActiveTooltip('fullscreen')}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                {isFullscreen ? <FiMinimize size={18} className="sm:w-5 sm:h-5" /> : <FiMaximize size={18} className="sm:w-5 sm:h-5" />}
                {activeTooltip === 'fullscreen' && (
                  <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap">
                    Fullscreen (F)
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Episode Selector Component
const EpisodeSelector = ({ episodes, currentEpisode, onSelect }) => {
  const fillerCount = episodes.filter(ep => ep.isFiller).length;

  return (
    <div className="mt-4 bg-gray-900/40 rounded-xl p-5 border border-white/5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h3 className="text-base font-semibold flex items-center gap-2 text-white/90">
            <FiList className="text-white" size={18} /> Select Episode
          </h3>
        <div className="flex items-center gap-3 text-xs">
          <div className="text-gray-500">{episodes.length} Episodes</div>
          {fillerCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-400/80 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
              <FiAlertCircle size={12} />
              <span className="font-medium">{fillerCount} Filler</span>
            </div>
          )}
        </div>
      </div>
      
      {fillerCount > 0 && (
        <div className="mb-4 p-2.5 bg-amber-400/5 border border-amber-400/10 rounded-lg flex items-start gap-2 text-xs text-amber-200/70">
          <FiAlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>Filler episodes marked in <span className="text-amber-400 font-medium">amber</span></span>
        </div>
      )}
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {episodes.map(ep => {
          const isCurrent = currentEpisode === ep.number;
          const isFiller = ep.isFiller;
          
          return (
            <button
              key={ep.number}
              onClick={() => onSelect(ep.number)}
              className={`
                group relative p-2.5 rounded-lg text-left transition-all duration-200 border
                ${isCurrent 
                  ? 'bg-violet-600 border-violet-500 shadow-lg shadow-violet-600/20' 
                  : isFiller
                    ? 'bg-amber-950/30 border-amber-800/30 hover:bg-amber-950/50 hover:border-amber-700/40'
                    : 'bg-gray-800/50 border-white/5 hover:bg-gray-800 hover:border-white/10'
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`
                  text-xs font-semibold
                  ${isCurrent 
                    ? 'text-white' 
                    : isFiller
                      ? 'text-amber-400/80'
                      : 'text-gray-400'
                  }
                `}>
                  EP {ep.number}
                </span>
                
                {isCurrent && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </div>
              
              {isFiller && (
                <span className="inline-block text-[9px] font-medium text-amber-500/90 uppercase tracking-wider">
                  Filler
                </span>
              )}
              
              <p className={`
                text-[11px] font-medium line-clamp-1 leading-tight mt-0.5
                ${isCurrent ? 'text-white/90' : isFiller ? 'text-amber-200/60' : 'text-gray-500'}
              `}>
                {ep.title || `Episode ${ep.number}`}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Server Selector Component
const ServerSelector = ({ servers, selectedType, selectedServer, onServerChange, onTypeChange }) => {
  const availableServers = servers[selectedType] || []

  return (
    <div className="mt-3 sm:mt-4 bg-gray-900/40 rounded-xl p-3 sm:p-4 md:p-5 border border-white/5">
      <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 flex-wrap">
        {['sub', 'dub', 'raw'].map(type => (
          <button
            key={type}
            onClick={() => onTypeChange(type)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg capitalize transition-all duration-200 text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 touch-manipulation ${
              selectedType === type
                ? 'bg-violet-600 text-white'
                : 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 border border-white/5'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${selectedType === type ? 'bg-white' : 'bg-gray-500'}`}></span>
            {type}
            <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full ${selectedType === type ? 'bg-white/20' : 'bg-gray-700'}`}>
              {servers[type]?.length || 0}
            </span>
          </button>
        ))}
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2 uppercase tracking-wider">
          <FiMonitor size={12} className="sm:w-[14px] sm:h-[14px] text-white" /> Available Servers
        </p>
        {availableServers.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {availableServers.map((server, index) => (
              <button
                key={server.name || index}
                onClick={() => onServerChange(server)}
                className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-all duration-200 font-medium flex items-center gap-1.5 sm:gap-2 touch-manipulation ${
                  selectedServer?.name === server.name
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border border-white/5 hover:border-white/10'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${selectedServer?.name === server.name ? 'bg-white' : 'bg-gray-500'}`}></span>
                {server.name || `Server ${index + 1}`}
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800/30 rounded-lg p-3 sm:p-4 text-center border border-white/5">
            <p className="text-gray-500 text-xs sm:text-sm">No servers available for {selectedType}</p>
            <p className="text-gray-600 text-xs mt-1">Try switching to a different type</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnimePlayerPage
