import { useCallback, useEffect, useState } from 'react'
import {
  FiAlertCircle,
  FiArrowLeft,
  FiHeart, FiInfo, FiList, FiLoader,
  FiPlay,
  FiStar, FiUsers
} from 'react-icons/fi'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  getAnimeDetails,
  getCharacters,
  getEpisodes,
  getNextEpisode,
  getPosterUrl,
  getServers,
  getStreamLink,
  normalizeAnimeData
} from '../services/anime'

const AnimeDetailsPage = () => {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const provider = searchParams.get('provider') || 'hianime-scrap'

  // --- State Management ---
  const [details, setDetails] = useState(null)
  const [characters, setCharacters] = useState([])
  const [episodes, setEpisodes] = useState([])
  const [servers, setServers] = useState({ sub: [], dub: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingStream, setLoadingStream] = useState(false)
  const [selectedEpisode, setSelectedEpisode] = useState(1)
  const [selectedType, setSelectedType] = useState('sub')
  const [selectedServer, setSelectedServer] = useState(null)
  const [activeTab, setActiveTab] = useState('episodes')
  const [showServers, setShowServers] = useState(false)
  const [nextEpisodeTime, setNextEpisodeTime] = useState(null)
  const [expandedDescription, setExpandedDescription] = useState(false)

  // --- Fetch Anime Data ---
  const fetchDetails = useCallback(async (signal) => {
    setLoading(true)
    setError(null)
    try {
      const detailsData = await getAnimeDetails(id, { signal })
      
      // Normalize anime data structure
      let animeData = normalizeAnimeData(detailsData, id, provider);
      animeData.__provider = provider;
      setDetails(animeData);

      // Always fetch episodes separately to get real episode IDs
      try {
        const episodesResponse = await getEpisodes(id, provider, { signal });
        const extractedEpisodes = episodesResponse.data || [];
        
        setEpisodes(extractedEpisodes);
        if (extractedEpisodes.length > 0) {
          setSelectedEpisode(extractedEpisodes[0].number);
        }
      } catch (epError) {
        console.warn('Could not fetch episodes:', epError);
        // Fallback: create episodes from total count
        const totalEps = animeData.totalEpisodes || animeData.episodes?.eps || 0;
        if (totalEps > 0) {
          const fallbackEpisodes = Array.from({ length: totalEps }, (_, i) => ({
            number: i + 1,
            id: `${id}::ep=${i + 1}`
          }));
          setEpisodes(fallbackEpisodes);
          setSelectedEpisode(1);
        }
      }

      // Parallel fetch for secondary info (non-blocking)
      getCharacters(id, 1).then(res => {
        if (res.data?.response) {
          setCharacters(res.data.response);
        }
      }).catch(() => {/* Ignore character errors */});
      
      getNextEpisode(id).then(res => {
        if (res.data?.time) {
          setNextEpisodeTime(res.data.time);
        }
      }).catch(() => {/* Ignore next episode errors */});
      
    } catch (err) {
      if (err.message === 'Request cancelled') return;
      setError(err.message || 'Failed to load anime details')
    } finally {
      setLoading(false)
    }
  }, [id, provider])

  // --- Fetch Streaming Links ---
  const fetchStream = useCallback(async (signal) => {
    if (!id || !selectedEpisode || episodes.length === 0) return
    setLoadingStream(true)
    try {
      // Get real episode ID from episodes list
      const currentEpData = episodes.find(ep => ep.number === selectedEpisode)
      const episodeId = currentEpData?.id || `${id}::ep=${selectedEpisode}`

      if (provider === 'hianime-scrap') {
        const serversResponse = await getServers(episodeId, { signal })
        const serversData = serversResponse.data || serversResponse

        if (serversData) {
          setServers({ sub: serversData.sub || [], dub: serversData.dub || [] })
          const available = serversData[selectedType] || serversData.sub || []
          if (available.length > 0) {
            setSelectedServer(available[0])
            await getStreamLink(episodeId, available[0].name, selectedType, provider, { signal })
          }
        }
      } else {
        // For animekai and animepahe, get stream directly
        const streamResponse = await getStreamLink(episodeId, '', selectedType, provider, { signal })
        if (streamResponse.data) {
          setServers({ sub: streamResponse.data.sources || [], dub: [] })
          const available = streamResponse.data.sources || []
          if (available.length > 0) {
            setSelectedServer(available[0])
          }
        }
      }
    } catch (err) {
      if (err.message === 'Request cancelled') return;
      console.error('Stream error:', err)
    } finally {
      setLoadingStream(false)
    }
  }, [id, selectedEpisode, selectedType, provider, episodes])

  // --- Effects with proper cleanup ---
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    let detailsFetched = false;

    const loadDetails = async () => {
      if (detailsFetched) return;
      detailsFetched = true;
      await fetchDetails(controller.signal);
    };

    loadDetails();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [fetchDetails]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    const loadStream = async () => {
      if (!details) return;
      await fetchStream(controller.signal);
    };

    // Debounce stream loading
    const timeoutId = setTimeout(loadStream, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [fetchStream, details, selectedEpisode]);

  const navigate = useNavigate()

  // --- UI Handlers ---
  const handleEpisodeChange = (num) => {
    navigate(`/watch/anime/${id}?ep=${num}&provider=${provider}`)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <FiLoader className="animate-spin text-purple-500 text-4xl" />
    </div>
  )

  if (error || !details) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-red-500 mb-4">{error || 'Anime not found'}</p>
        <Link to="/anime" className="bg-gray-800 px-6 py-2 rounded-lg text-white inline-flex items-center gap-2">
          <FiArrowLeft /> Back
        </Link>
      </div>
    </div>
  )

  const posterSrc = getPosterUrl(details.poster)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 h-[60vh]">
          <img src={posterSrc} className="w-full h-full object-cover opacity-20" alt="backdrop" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900" />
        </div>

        <div className="relative z-10 container mx-auto px-3 sm:px-4 pt-6 sm:pt-8 pb-8 sm:pb-12">
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
            {/* Sidebar Poster */}
            <div className="w-full lg:w-72 flex-shrink-0">
              <img src={posterSrc} className="w-full rounded-2xl shadow-2xl border border-gray-700" alt={details.title} />
              <div className="mt-4 sm:mt-6 flex flex-col gap-2 sm:gap-3">
                <Link to={`/watch/anime/${id}?ep=${selectedEpisode}`} className="bg-purple-600 hover:bg-purple-700 py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 font-bold transition text-sm sm:text-base touch-manipulation">
                  <FiPlay size={16} className="sm:w-5 sm:h-5" /> WATCH NOW
                </Link>
                <button className="bg-gray-800 hover:bg-gray-700 py-2.5 sm:py-3 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 transition text-sm sm:text-base touch-manipulation">
                  <FiHeart size={16} className="sm:w-5 sm:h-5" /> WATCHLIST
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2">{details.title}</h1>
              <p className="text-gray-400 text-lg sm:text-xl mb-4 sm:mb-6 italic">{details.japanese}</p>

              <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                <span className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 px-2 sm:px-3 py-1 rounded-lg border border-yellow-500/20 text-sm">
                  <FiStar size={12} className="sm:w-[14px] sm:h-[14px]" /> {details.rating}
                </span>
                <span className="bg-purple-500/10 text-purple-400 px-2 sm:px-3 py-1 rounded-lg border border-purple-500/20 text-sm">{details.type}</span>
                <span className="bg-gray-800 px-2 sm:px-3 py-1 rounded-lg text-sm">{details.status}</span>
              </div>

              <div className="mb-6 sm:mb-8">
                <h3 className="flex items-center gap-1.5 sm:gap-2 text-gray-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-2">
                  <FiInfo size={12} className="sm:w-[14px] sm:h-[14px]" /> Synopsis
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
                  {expandedDescription ? details.synopsis : `${details.synopsis?.slice(0, 350)}...`}
                  <button onClick={() => setExpandedDescription(!expandedDescription)} className="text-purple-400 ml-2 font-bold text-sm sm:text-base touch-manipulation">
                    {expandedDescription ? 'Show Less' : 'Read More'}
                  </button>
                </p>
              </div>

              {/* Episode Grid */}
              <div className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-xl font-bold flex items-center gap-2"><FiList /> Episodes</h2>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-gray-400">{episodes.length} Episodes Total</div>
                    {episodes.some(ep => ep.isFiller) && (
                      <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                        <FiAlertCircle className="w-4 h-4" />
                        <span className="font-medium">{episodes.filter(ep => ep.isFiller).length} Filler</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Filler Info */}
                {episodes.some(ep => ep.isFiller) && (
                  <div className="mb-4 p-3 bg-amber-400/5 border border-amber-400/10 rounded-lg flex items-start gap-2 text-sm text-amber-200/80">
                    <FiAlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Filler episodes are marked in <span className="text-amber-400 font-medium">amber</span>. These episodes may not follow the main storyline.</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {episodes.map(ep => {
                    const isSelected = selectedEpisode === ep.number;
                    const isFiller = ep.isFiller;
                    
                    return (
                      <button
                        key={ep.number}
                        onClick={() => handleEpisodeChange(ep.number)}
                        className={`
                          group relative p-3 rounded-xl text-left transition-all duration-200 border
                          ${isSelected 
                            ? 'bg-purple-600 border-purple-500 shadow-lg shadow-purple-600/25 scale-[1.02]' 
                            : isFiller
                              ? 'bg-amber-900/20 border-amber-700/30 hover:bg-amber-900/30 hover:border-amber-600/50'
                              : 'bg-gray-700/50 border-gray-600/30 hover:bg-gray-700 hover:border-gray-500/50'
                          }
                        `}
                      >
                        {/* Episode Number Badge */}
                        <div className={`
                          inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold mb-2
                          ${isSelected 
                            ? 'bg-white/20 text-white' 
                            : isFiller
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-gray-600/50 text-gray-300'
                          }
                        `}>
                          {ep.number}
                        </div>
                        
                        {/* Filler Badge */}
                        {isFiller && (
                          <div className="absolute top-2 right-2">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-amber-950 uppercase tracking-wider">
                              Filler
                            </span>
                          </div>
                        )}
                        
                        {/* Episode Title */}
                        <div className="space-y-1">
                          <p className={`
                            text-xs font-medium line-clamp-2 leading-relaxed
                            ${isSelected ? 'text-white' : isFiller ? 'text-amber-200/70' : 'text-gray-400'}
                          `}>
                            {ep.title || `Episode ${ep.number}`}
                          </p>
                        </div>
                        
                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="absolute bottom-2 right-2">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Characters */}
      {characters.length > 0 && (
        <div className="container mx-auto px-4 py-12 border-t border-gray-800">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2"><FiUsers /> Cast</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {characters.slice(0, 10).map((char, i) => (
              <div key={i} className="bg-gray-800/30 rounded-xl overflow-hidden flex items-center gap-4 p-2 border border-gray-800">
                <img src={char.imageUrl} className="w-16 h-16 object-cover rounded-lg" alt={char.name} />
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{char.name}</p>
                  <p className="text-xs text-purple-400 truncate">{char.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AnimeDetailsPage

