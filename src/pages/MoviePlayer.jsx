import { useEffect, useState } from 'react'
import { FiArrowLeft, FiExternalLink, FiMonitor, FiPlay } from 'react-icons/fi'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Skeleton } from '../components/ui/Skeleton'
import * as tmdbService from '../services/tmdb'
import { STREAMING_TYPES } from '../utils/constants'
import { getImageUrl, getVidsrcEmbedUrl, getYear } from '../utils/helpers'

// vidsrc-embed.ru provider info
const VIDSRCEMBED_PROVIDER = {
  provider_id: 999999,
  provider_name: 'vidsrc-embed.ru',
  logo_path: null,
  type: 'free',
  link: null,
}

// Manual IMDB provider for shows without IMDB ID
const MANUAL_IMDB_PROVIDER = {
  provider_id: 999998,
  provider_name: 'Manual IMDB',
  logo_path: null,
  type: 'free',
  link: null,
}

// Movie Player Page - Watch full movies with streaming options
const MoviePlayerPage = () => {
  const location  = useLocation()
  const { type=location.pathname.split("/")[[1]], id } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // Get season and episode from URL params
  const urlSeason = searchParams.get('season')
  const urlEpisode = searchParams.get('episode')
  
  const [movie, setMovie] = useState(null)
  const [providers, setProviders] = useState(null)
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [vidsrcSeason, setVidsrcSeason] = useState(() => urlSeason ? Number(urlSeason) : 1)
  const [vidsrcEpisode, setVidsrcEpisode] = useState(() => urlEpisode ? Number(urlEpisode) : 1)
  const [watchError, setWatchError] = useState(null)
  const [manualImdbId, setManualImdbId] = useState(id)
  const [showManualInput, setShowManualInput] = useState(false)
  
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        setWatchError(null)
        
        // Fetch movie details and providers in parallel
        const [movieData, providersData] = await Promise.all([
          location.pathname.includes('tv') ? tmdbService.getTVDetails(id) : tmdbService.getMovieDetails(id),
          tmdbService.getFreeWatchProviders(id, type),
        ])
        
        setMovie(movieData)
        setProviders(providersData)
        
        // Set default season/episode for TV shows
        if (location.pathname.includes('tv')) {
          // Use URL params if available, otherwise find first valid season
          const seasonParam = searchParams.get('season')
          const episodeParam = searchParams.get('episode')
          
          if (seasonParam) {
            setVidsrcSeason(Number(seasonParam))
          } else {
            // Try to find the first season with episodes
            const firstValidSeason = movieData.seasons?.find(s => s.season_number > 0 && s.episode_count > 0)
            if (firstValidSeason) {
              setVidsrcSeason(firstValidSeason.season_number)
            }
          }
          
          if (episodeParam) {
            setVidsrcEpisode(Number(episodeParam))
          }
        }
        
        // Auto-select first free provider if available
        if (providersData?.free?.length > 0) {
          setSelectedProvider(providersData.free[0])
        }
      } catch (err) {
        console.error('Error fetching data:', err)
        setError(err.message || 'Failed to load movie')
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchData()
    }
  }, [id, type, searchParams])
  
  // Get vidsrcme.ru embed URL
  const getVidsrcUrl = () => {
    if (!movie?.imdb_id) {
      setWatchError('IMDB ID not found for this content')
      return null
    }
    const url = getVidsrcEmbedUrl(movie.imdb_id, type, vidsrcSeason, vidsrcEpisode)
    if (!url) {
      setWatchError('Failed to generate streaming URL')
    }
    return url
  }
  
  // Handle watching on a provider
  const handleWatch = (provider) => {
    setSelectedProvider(provider)
    setShowPlayer(true)
  }
  
  // Handle vidsrc - show in iframe
  const handleWatchVidsrc = () => {
    setSelectedProvider(VIDSRCEMBED_PROVIDER)
    setShowPlayer(true)
  }
  
  // Handle manual IMDB ID input - show in iframe
  const handleManualImdb = (e) => {
    e.preventDefault()
    if (manualImdbId.trim()) {
      const formattedId = manualImdbId.trim().startsWith('tt') ? manualImdbId.trim() : `tt${manualImdbId.trim()}`
      // Store the manual IMDB ID and show in iframe
      setMovie(prev => ({ ...prev, manual_imdb_id: formattedId }))
      setSelectedProvider(MANUAL_IMDB_PROVIDER)
      setShowPlayer(true)
    }
  }
  
  // Get vidsrc URL with manual IMDB support
  const getManualVidsrcUrl = () => {
    const imdbId = movie?.manual_imdb_id || manualImdbId
    if (!imdbId) {
      setWatchError('IMDB ID is required')
      return null
    }
    return getVidsrcEmbedUrl(imdbId, type, vidsrcSeason, vidsrcEpisode)
  }
  
  // Handle external link
  const handleExternalLink = () => {
    if (selectedProvider && selectedProvider.link) {
      window.open(selectedProvider.link, '_blank')
    }
  }
  
  // Go back
  const handleBack = () => {
    if (showPlayer) {
      setShowPlayer(false)
    } else {
      navigate(-1)
    }
  }
  
  if (loading) {
    return <LoadingState />
  }
  
  if (error || !movie) {
    return <ErrorState error={error} onBack={handleBack} />
  }
  
  return (
    <div className="min-h-screen bg-black">
      {/* Back Button */}
      <div className="fixed top-20 left-4 z-50">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-md transition-colors"
        >
          <FiArrowLeft size={20} />
          <span className="hidden sm:inline">{showPlayer ? 'Back to Options' : 'Back'}</span>
        </button>
      </div>
      
      {showPlayer && selectedProvider ? (
        // Full Screen Player View
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            {/* Embedded Player */}
            <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-6">
              {selectedProvider.provider_id === 999999 ? (
                // vidsrc-embed.ru iframe
                watchError ? (
                  <PlayerError error={watchError} />
                ) : (
                  <iframe
                    src={getVidsrcUrl()}
                    title={movie.title || movie.name}
                    style={{ width: '100%', height: '100%' }}
                    frameBorder="0"
                    referrerPolicy="no-referrer"
  allow="autoplay; fullscreen; encrypted-media"
                    allowFullScreen
                  />
                )
              ) : selectedProvider.provider_id === 999998 ? (
                // Manual IMDB iframe
                watchError ? (
                  <PlayerError error={watchError} />
                ) : (
                  <iframe
                  src={getManualVidsrcUrl()}
                    title={movie.title || movie.name}
                    style={{ width: '100%', height: '100%' }}
                    frameBorder="0"
                   referrerPolicy="no-referrer"
  allow="autoplay; fullscreen; encrypted-media"
                    allowFullScreen
                  />
                )
              ) : selectedProvider.link ? (
                <iframe
                  src={selectedProvider.link}
                  title={movie.title || movie.name}
                  className="w-full h-full"
                 referrerPolicy="no-referrer"
  allow="autoplay; fullscreen; encrypted-media"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-400 mb-4">No embedded player available</p>
                    <a
                      href={providers.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-netflix-red text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      <FiExternalLink size={20} />
                      Watch on {selectedProvider.provider_name}
                    </a>
                  </div>
                </div>
              )}
            </div>
            
            {/* TV Show Season/Episode Selector */}
            {(location.pathname.includes('tv')) && (
              <div className="flex gap-4 mb-4">
                <select
                  value={vidsrcSeason}
                  onChange={(e) => {
                    setVidsrcSeason(Number(e.target.value))
                    // Clear watch error when changing season/episode
                    setWatchError(null)
                  }}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg"
                >
                  {[...Array(Math.min(movie.number_of_seasons || 1, 20))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Season {i + 1}</option>
                  ))}
                </select>
                <select
                  value={vidsrcEpisode}
                  onChange={(e) => {
                    setVidsrcEpisode(Number(e.target.value))
                    // Clear watch error when changing season/episode
                    setWatchError(null)
                  }}
                  className="bg-gray-800 text-white px-4 py-2 rounded-lg"
                >
                  {[...Array(movie.seasons?.[vidsrcSeason - 1]?.episode_count || 10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>Episode {i + 1}</option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Movie Info */}
            <div className="flex items-start gap-6">
              {movie.poster_path && (
                <img
                  src={getImageUrl(movie.poster_path, 'w200')}
                  alt={movie.title || movie.name}
                  className="w-24 rounded-lg hidden sm:block"
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">
                  {movie.title || movie.name}
                </h1>
                <p className="text-gray-400 mb-2">
                  {getYear(movie.release_date || movie.first_air_date)} •
                  {movie.runtime && ` ${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`} •
                  <span className="text-green-400 ml-2">
                    {selectedProvider.provider_id === 999999 
                      ? 'Streaming on vidsrc-embed.ru' 
                      : selectedProvider.provider_id === 999998
                      ? 'Streaming on vidsrc-embed.ru (Manual IMDB)'
                      : `Streaming on ${selectedProvider.provider_name}`
                    }
                  </span>
                </p>
                {movie.overview && (
                  <p className="text-gray-300 mt-2 line-clamp-2">{movie.overview}</p>
                )}
                <div className="flex gap-3 mt-4">
                  <Link
                    to={`/${type}/${id}`}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/watch-trailer/${type}/${id}`}
                    className="inline-flex items-center gap-2 px-6 py-2 bg-netflix-red text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <FiPlay size={18} />
                    Watch Trailer
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Provider Selection View
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto">
            {/* Movie Header */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              {movie.poster_path && (
                <img
                  src={getImageUrl(movie.poster_path, 'w300')}
                  alt={movie.title || movie.name}
                  className="w-48 rounded-lg shadow-2xl mx-auto md:mx-0"
                />
              )}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {movie.title || movie.name}
                </h1>
                <p className="text-gray-400 mb-4">
                  {getYear(movie.release_date || movie.first_air_date)} •
                  {movie.runtime && ` ${formatRuntime(movie.runtime)}`} •
                  {movie.vote_average && ` ${movie.vote_average.toFixed(1)} Rating`}
                </p>
                {movie.tagline && (
                  <p className="text-gray-500 italic mb-4">"{movie.tagline}"</p>
                )}
                {movie.overview && (
                  <p className="text-gray-300">{truncateText(movie.overview, 300)}</p>
                )}
              </div>
            </div>
            
            {/* Streaming Options */}
            <div className="space-y-8">
              {/* vidsrc-embed.ru Free Option */}
              {movie.imdb_id && (
                <section>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FiPlay className="text-green-500" />
                    Watch for Free - vidsrc-embed.ru
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <VidsrcmeCard
                      movie={movie}
                      type={type}
                      onClick={handleWatchVidsrc}
                      selected={selectedProvider?.provider_id === 999999}
                    />
                  </div>
                </section>
              )}
              

{!movie.imdb_id && location.pathname.includes('tv') && (
                <section>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FiPlay className="text-green-500" />
                    Watch for Free - vidsrc-embed.ru
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <VidsrcmeCard
                      movie={movie}
                      type={type}
                      onClick={handleManualImdb}
                      selected={selectedProvider?.provider_id === 999998}
                    />
                  </div>
                </section>
              )}

              {/* Manual IMDB Fallback - When IMDB ID is missing */}
              {/* {!movie.imdb_id && location.pathname.includes('tv') && (
                <section>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FiPlay className="text-yellow-500" />
                    Watch for Free - Enter IMDB ID
                  </h2>
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-lg mb-2">
                          {movie.title || movie.name}
                        </h4>
                        <p className="text-gray-400 mb-4">
                          This TV show doesn't have an IMDB ID in our database. 
                          Enter the IMDB ID manually to watch on vidsrcme.ru
                        </p>
                        <form onSubmit={handleManualImdb} className="flex gap-3">
                          <input
                            type="text"
                            value={manualImdbId}
                            onChange={(e) => setManualImdbId(e.target.value)}
                            placeholder="e.g., tt0944947"
                            className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                          />
                          <button
                            type="submit"
                            disabled={!manualImdbId.trim()}
                            className="px-6 py-3 bg-yellow-600 text-white font-semibold rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Watch
                          </button>
                        </form>
                        <p className="text-gray-500 text-sm mt-3">
                          💡 Tip: Search for "{movie.title || movie.name}" on IMDb to find the ID
                        </p>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 text-center">
                        <div className="h-16 w-16 bg-gradient-to-br from-yellow-600 to-orange-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <span className="text-white font-bold text-sm">IMDb</span>
                        </div>
                        <p className="text-yellow-500 text-sm font-medium">Manual Entry</p>
                      </div>
                    </div>
                  </div>
                </section>
              )} */}
              
              {/* Free Providers */}
              {providers?.free && providers.free.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FiPlay className="text-green-500" />
                    Watch for Free
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {providers.free.map((provider) => (
                      <ProviderCard
                        key={provider.provider_id}
                        provider={provider}
                        onClick={() => handleWatch(provider)}
                        selected={selectedProvider?.provider_id === provider.provider_id}
                      />
                    ))}
                  </div>
                </section>
              )}
              
              {/* Subscription Providers */}
              {providers?.flatrate && providers.flatrate.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FiMonitor className="text-blue-500" />
                    Subscription
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {providers.flatrate.map((provider) => (
                      <ProviderCard
                        key={provider.provider_id}
                        provider={provider}
                        onClick={() => handleWatch(provider)}
                        selected={selectedProvider?.provider_id === provider.provider_id}
                      />
                    ))}
                  </div>
                </section>
              )}
              
              {/* Rent Options */}
              {providers?.rent && providers.rent.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-yellow-500">$</span>
                    Rent
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {providers.rent.map((provider) => (
                      <ProviderCard
                        key={provider.provider_id}
                        provider={provider}
                        onClick={() => handleWatch(provider)}
                        selected={selectedProvider?.provider_id === provider.provider_id}
                        price={provider.rent}
                      />
                    ))}
                  </div>
                </section>
              )}
              
              {/* Buy Options */}
              {providers?.buy && providers.buy.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-green-500">$</span>
                    Buy
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {providers.buy.map((provider) => (
                      <ProviderCard
                        key={provider.provider_id}
                        provider={provider}
                        onClick={() => handleWatch(provider)}
                        selected={selectedProvider?.provider_id === provider.provider_id}
                        price={provider.buy}
                      />
                    ))}
                  </div>
                </section>
              )}
              
              {/* No Providers Available */}
              {(!providers?.free?.length && !providers?.flatrate?.length && !providers?.rent?.length && !providers?.buy?.length && !movie.imdb_id) && (
                <NoProvidersState movie={movie} type={type} id={id} />
              )}
              
              {/* TMDB Link */}
              {providers?.link && (
                <div className="mt-8 text-center">
                  <a
                    href={providers.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                  >
                    <FiExternalLink size={20} />
                    View All Watching Options on TMDB
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// vidsrc Card Component
const VidsrcmeCard = ({ movie, type, onClick, selected }) => {
  return (
    <button
      onClick={onClick}
      className={`
        w-full p-4 rounded-lg transition-all
        ${selected 
          ? 'bg-netflix-red ring-2 ring-netflix-red ring-offset-2 ring-offset-black' 
          : 'bg-gray-800 hover:bg-gray-700'
        }
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-center mb-2">
        <div className="h-12 w-12 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">VID</span>
        </div>
      </div>
      
      {/* Name */}
      <p className="text-white text-sm font-medium text-center line-clamp-1">
        vidsrc-embed.ru
      </p>
      
      {/* Type Badge */}
      <div className="absolute top-2 right-2">
        <span className="text-xs px-2 py-0.5 rounded bg-green-500 text-white">
          Free
        </span>
      </div>
      
      {/* Watch Now indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 bg-netflix-red rounded-full p-1">
          <FiPlay size={12} className="text-white" />
        </div>
      )}
      
      {/* Info */}
      <p className="text-gray-400 text-xs text-center mt-2">
        {location.pathname.includes('tv') ? `${movie.number_of_seasons || 0} Seasons` : 'Full Movie'}
      </p>
    </button>
  )
}

// Provider Card Component
const ProviderCard = ({ provider, onClick, selected, price }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative p-4 rounded-lg transition-all
        ${selected 
          ? 'bg-netflix-red ring-2 ring-netflix-red ring-offset-2 ring-offset-black' 
          : 'bg-gray-800 hover:bg-gray-700'
        }
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-center mb-2">
        {provider.logo_path ? (
          <img
            src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
            alt={provider.provider_name}
            className="h-12 object-contain"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {provider.provider_name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      
      {/* Name */}
      <p className="text-white text-sm font-medium text-center line-clamp-1">
        {provider.provider_name}
      </p>
      
      {/* Price */}
      {price && (
        <p className="text-gray-400 text-xs text-center mt-1">
          {price.type === 'rent' ? `Rent $${price.price}` : `Buy $${price.price}`}
        </p>
      )}
      
      {/* Type Badge */}
      <div className="absolute top-2 right-2">
        <span className={`
          text-xs px-2 py-0.5 rounded
          ${provider.type === 'free' ? 'bg-green-500 text-white' : ''}
          ${provider.type === 'subscription' ? 'bg-blue-500 text-white' : ''}
          ${provider.type === 'rent' ? 'bg-yellow-500 text-black' : ''}
          ${provider.type === 'buy' ? 'bg-green-600 text-white' : ''}
        `}>
          {STREAMING_TYPES[provider.type] || provider.type}
        </span>
      </div>
      
      {/* Watch Now indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 bg-netflix-red rounded-full p-1">
          <FiPlay size={12} className="text-white" />
        </div>
      )}
    </button>
  )
}

// Loading State
const LoadingState = () => (
  <div className="min-h-screen bg-black">
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="flex gap-6 mb-8">
          <Skeleton className="w-48 h-72 rounded-lg" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Error State
const ErrorState = ({ error, onBack }) => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <p className="text-red-500 text-lg mb-4">Error: {error}</p>
      <button
        onClick={onBack}
        className="px-6 py-3 bg-netflix-red text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Go Back
      </button>
    </div>
  </div>
)

// No Providers State
const NoProvidersState = ({ movie, type, id }) => (
  <div className="text-center py-16 bg-gray-900/50 rounded-lg">
    <div className="mb-6">
      <svg className="w-20 h-20 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">Not Available for Streaming</h2>
    <p className="text-gray-400 mb-6">
      This title is not currently available to watch for free or by subscription in your region.
    </p>
    <div className="flex justify-center gap-4">
      <Link
        to={`/watch-trailer/${type}/${id}`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-netflix-red text-white rounded-md hover:bg-red-700 transition-colors"
      >
        <FiPlay size={20} />
        Watch Trailer
      </Link>
      <Link
        to={`/${type}/${id}`}
        className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
      >
        View Details
      </Link>
    </div>
  </div>
)

// Player Error Component
const PlayerError = ({ error }) => (
  <div className="w-full h-full flex items-center justify-center bg-gray-900">
    <div className="text-center max-w-md px-4">
      <div className="mb-4">
        <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Cannot Load Player</h3>
      <p className="text-gray-400">{error}</p>
      <p className="text-gray-500 text-sm mt-2">
        This content may not be available for streaming in your region.
      </p>
    </div>
  </div>
)

// Helper functions
const formatRuntime = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

export default MoviePlayerPage

