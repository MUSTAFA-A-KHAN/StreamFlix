import { useEffect, useState } from 'react'
import { FiCalendar, FiClock, FiFilm, FiHeart, FiPlay, FiPlus, FiShare2, FiTv, FiUser } from 'react-icons/fi'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Carousel } from '../components/movie/Carousel'
import { RatingBadge } from '../components/ui/Rating'
import { PageLoader } from '../components/ui/Skeleton'
import { useWatchlist } from '../context/WatchlistContext'
import * as tmdbService from '../services/tmdb'
import { GENRES } from '../utils/constants'
import { formatRuntime, getGenreNames, getImageUrl, getYear, truncateText } from '../utils/helpers'

// Movie Details Page
const MovieDetailsPage = () => {
  
  const location = useLocation()
  const { type= location.pathname.split("/")[[1]] , id } = useParams()
  const [details, setDetails] = useState(null)
  const [credits, setCredits] = useState(null)
  const [videos, setVideos] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [movieCredits, setMovieCredits] = useState(null)
  const [tvCredits, setTvCredits] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist()
  const inWatchlist = details && type !== 'person' ? isInWatchlist(details.id) : false
  
  useEffect(() => {

    let pathname  = location.pathname
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Handle person/actor type
        if (pathname.includes("person") === 'person') {
          const personDetails = await tmdbService.getPersonDetails(id)
          const [movieCreditsData, tvCreditsData] = await Promise.all([
            tmdbService.getPersonMovieCredits(id),
            tmdbService.getPersonTVCredits(id),
          ])
          
          setDetails(personDetails)
          setMovieCredits(movieCreditsData)
          setTvCredits(tvCreditsData)
          setCredits(null)
          setVideos(null)
          setRecommendations([])
        } else {
          console.log()
          // Handle movie/TV types
          console.log(pathname.includes("tv") )
          const [detailsData, creditsData, videosData, recommendationsData] = await Promise.all([
            pathname.includes("tv") ? tmdbService.getTVDetails(id) : tmdbService.getMovieDetails(id),
            pathname.includes("tv") ? tmdbService.getTVCredits(id) : tmdbService.getMovieCredits(id),
            pathname.includes("tv") ? tmdbService.getTVVideos(id) : tmdbService.getMovieVideos(id),
            pathname.includes("tv") ? tmdbService.getTVRecommendations(id) : tmdbService.getMovieRecommendations(id),
          ])
          
          setDetails(detailsData)
          setCredits(creditsData)
          setVideos(videosData)
          setRecommendations(recommendationsData.results || [])
        }
      } catch (err) {
        console.error('Error fetching details:', err)
        setError(err.message || 'Failed to load details')
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchData()
    }
  }, [id, type])
  
  // Get trailer
  const getTrailer = () => {
    if (!videos?.results) return null
    return videos.results.find(v => v.type === 'Trailer' && v.site === 'YouTube')
      || videos.results.find(v => v.type === 'Teaser' && v.site === 'YouTube')
      || videos.results[0]
  }
  
  const trailer = getTrailer()
  const genres = details && details.genres ? getGenreNames(details.genres, GENRES.MOVIE) : []
  const director = credits?.crew?.find(c => c.job === 'Director')
  const cast = credits?.cast?.slice(0, 6) || []
  
  // TV show season/episode selection
  const [selectedSeason, setSelectedSeason] = useState(1)
  const [selectedEpisode, setSelectedEpisode] = useState(1)
  
  // Update episode count when season changes
  const currentSeasonData = details?.seasons?.find(s => s.season_number === selectedSeason)
  const episodeCount = currentSeasonData?.episode_count || 1
  
  // Reset episode if it exceeds the new season's count
  useEffect(() => {
    if (selectedEpisode > episodeCount) {
      setSelectedEpisode(1)
    }
  }, [selectedSeason, episodeCount])
  
  // Check if this is a person/actor page
  const isPerson = type === 'person'
  
  // Get person credits combined and sorted by popularity
  const personMovies = movieCredits?.cast?.map(item => ({ ...item, media_type: 'movie' })) || []
  const personTvShows = tvCredits?.cast?.map(item => ({ ...item, media_type: 'tv' })) || []
  const combinedPersonCredits = [...personMovies, ...personTvShows]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, 20)
  
  // Handle watchlist
  const handleWatchlist = () => {
    if (!details) return
    
    if (inWatchlist) {
      removeFromWatchlist(details.id)
    } else {
      addToWatchlist({
        id: details.id,
        title: details.title || details.name,
        poster_path: details.poster_path,
        backdrop_path: details.backdrop_path,
        vote_average: details.vote_average,
        release_date: details.release_date || details.first_air_date,
        media_type: type,
      })
    }
  }
  
  // Handle share
  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: details?.title || details?.name,
          text: `Check out ${details?.title || details?.name} on StreamFlix!`,
          url: url,
        })
      } catch (err) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(url)
      alert('Link copied to clipboard!')
    }
  }
  
  if (loading) {
    return <PageLoader />
  }
  
  if (error || !details) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error || 'Content not found'}</p>
          <Link
            to="/"
            className="px-6 py-3 bg-netflix-red text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }
  
  // Render Person/Actor Page
  if (isPerson) {
    return (
      <div className="min-h-screen bg-gray-900">
        {/* Backdrop */}
        <div className="relative h-[50vh] md:h-[60vh]">
          <div className="absolute inset-0">
            {details.profile_path ? (
              <img
                src={getImageUrl(details.profile_path, 'original')}
                alt={details.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-transparent" />
          </div>
        </div>
        
        {/* Content */}
        <div className="container mx-auto px-4 -mt-40 relative z-10 pb-16">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              <div className="w-48 md:w-64 lg:w-80 rounded-lg overflow-hidden shadow-2xl">
                {details.profile_path ? (
                  <img
                    src={getImageUrl(details.profile_path, 'w500')}
                    alt={details.name}
                    className="w-full h-auto"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gray-800 flex items-center justify-center">
                    <FiUser className="text-gray-600" size={64} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Details */}
            <div className="flex-1">
              {/* Name */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {details.name}
              </h1>
              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-6">
                {details.birthday && (
                  <span className="flex items-center gap-1">
                    <FiCalendar size={16} />
                    {getYear(details.birthday)}
                    {details.deathday && ` - ${getYear(details.deathday)}`}
                  </span>
                )}
                {details.place_of_birth && (
                  <span className="text-gray-400 text-sm">
                    📍 {details.place_of_birth}
                  </span>
                )}
              </div>
              
              {/* Biography */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-3">Biography</h3>
                <p className="text-gray-300 leading-relaxed">
                  {truncateText(details.biography, 1000) || 'No biography available.'}
                </p>
              </div>
              
              {/* Known For */}
              {combinedPersonCredits.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-white mb-3">Known For</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {combinedPersonCredits.slice(0, 6).map((item) => (
                      <Link
                        key={`${item.media_type}-${item.id}`}
                        to={`/${item.media_type}/${item.id}`}
                        className="group"
                      >
                        {item.poster_path ? (
                          <img
                            src={getImageUrl(item.poster_path, 'w300')}
                            alt={item.title || item.name}
                            className="w-full rounded-lg shadow-md group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center">
                            <FiFilm className="text-gray-600" size={24} />
                          </div>
                        )}
                        <p className="text-white text-sm mt-2 truncate group-hover:text-netflix-red transition-colors">
                          {item.title || item.name}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700/80 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  <FiShare2 size={20} />
                  Share
                </button>
              </div>
            </div>
          </div>
          
          {/* Filmography */}
          {combinedPersonCredits.length > 0 && (
            <section className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Filmography</h2>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-gray-400">
                    <FiFilm size={16} className="text-blue-400" />
                    {personMovies.length} Movies
                  </span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <FiTv size={16} className="text-purple-400" />
                    {personTvShows.length} TV Shows
                  </span>
                </div>
              </div>
              <Carousel
                title="All Credits"
                movies={combinedPersonCredits}
                showInfoOnHover={true}
                size="md"
              />
            </section>
          )}
        </div>
      </div>
    )
  }
  
  // Render Movie/TV Show Page
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Backdrop */}
      <div className="relative h-[60vh] md:h-[70vh]">
        <div className="absolute inset-0">
          <img
            src={getImageUrl(details.backdrop_path, 'w1280')}
            alt={details.title || details.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-transparent" />
        </div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 -mt-48 relative z-10 pb-16">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="hidden md:block flex-shrink-0 w-80">
            <img
              src={getImageUrl(details.poster_path, 'w500')}
              alt={details.title || details.name}
              className="w-full rounded-lg shadow-2xl"
            />
          </div>
          
          {/* Details */}
          <div className="flex-1">
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
              {details.title || details.name}
            </h1>
            
            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-gray-300 mb-6">
              {details.release_date && (
                <span className="flex items-center gap-1">
                  <FiCalendar size={16} />
                  {getYear(details.release_date || details.first_air_date)}
                </span>
              )}
              {details.runtime && (
                <span className="flex items-center gap-1">
                  <FiClock size={16} />
                  {formatRuntime(details.runtime)}
                </span>
              )}
              <RatingBadge rating={details.vote_average} />
              {details.adult && (
                <span className="border border-gray-500 px-1 text-xs">18+</span>
              )}
              {details.status === 'Released' && (
                <span className="text-green-500 text-sm">Released</span>
              )}
              {location.pathname.includes('tv') && details.number_of_seasons && (
                <span className="text-gray-400 text-sm">
                  {details.number_of_seasons} Season{details.number_of_seasons !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {genres.map((genre) => (
                <Link
                  key={genre}
                  to={`/browse?genre=${GENRES.MOVIE.find(g => g.name === genre)?.id}`}
                  className="px-4 py-1 bg-gray-800 text-white text-sm rounded-full hover:bg-gray-700 transition-colors"
                >
                  {genre}
                </Link>
              ))}
            </div>
            
            {/* Tagline */}
            {details.tagline && (
              <p className="text-gray-400 italic mb-6 text-lg">
                "{details.tagline}"
              </p>
            )}
            
            {/* Overview */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-3">Overview</h3>
              <p className="text-gray-300 leading-relaxed">
                {truncateText(details.overview, 500)}
              </p>
            </div>
            
            {/* Key Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {director && (
                <div>
                  <p className="text-gray-500 text-sm">Director</p>
                  <p className="text-white font-medium">{director.name}</p>
                </div>
              )}
              {details.production_companies?.[0] && (
                <div>
                  <p className="text-gray-500 text-sm">Studio</p>
                  <p className="text-white font-medium">
                    {details.production_companies[0].name}
                  </p>
                </div>
              )}
              {details.budget > 0 && (
                <div>
                  <p className="text-gray-500 text-sm">Budget</p>
                  <p className="text-white font-medium">
                    ${details.budget.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            
            {/* TV Show Watch for Free - vidsrc-embed.ru */}
            {location.pathname.includes('tv') && details.imdb_id && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FiPlay className="text-green-500" />
                  Watch for Free - vidsrc-embed.ru
                </h3>
                <div className="bg-gray-800/50 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-lg mb-2">
                        {details.title || details.name}
                      </h4>
                      <p className="text-gray-400 mb-4">
                        Season {selectedSeason} • Episode {selectedEpisode}
                      </p>
                      <div className="flex gap-3">
                        <a
                          href={`https://vidsrc-embed.ru/embed/tv?tmdb=${details.imdb_id.startsWith('tt') ? details.imdb_id : `tt${details.imdb_id}`}&season=${selectedSeason}&episode=${selectedEpisode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
                        >
                          <FiPlay size={20} />
                          Play Now
                        </a>
                      </div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 text-center">
                      <div className="h-16 w-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <span className="text-white font-bold text-sm">VID</span>
                      </div>
                      <p className="text-green-500 text-sm font-medium">Free Streaming</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex flex-wrap gap-4 mb-8">
              {/* TV Show Season/Episode Selector */}
              {location.pathname.includes('tv') && details?.seasons && (
                <div className="flex gap-2 w-full sm:w-auto">
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                  >
                    {details.seasons
                      .filter(s => s.season_number > 0)
                      .map((season) => (
                        <option key={season.id} value={season.season_number}>
                          Season {season.season_number}
                        </option>
                      ))}
                  </select>
                  <select
                    value={selectedEpisode}
                    onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                    className="bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-netflix-red"
                  >
                    {[...Array(episodeCount)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>Ep {i + 1}</option>
                    ))}
                  </select>
                </div>
              )}
              {console.log(location.pathname.includes('tv') ? `/watch/${type}/${id}?season=${selectedSeason}&episode=${selectedEpisode}` : `/watch/${type}/${id}`)}
              <Link
                to={location.pathname.includes('tv') ? `/watch/${type}/${id}?season=${selectedSeason}&episode=${selectedEpisode}` : `/watch/${type}/${id}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-netflix-red text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
              >
                <FiPlay size={20} />
                {location.pathname.includes('tv') ? `Watch S${selectedSeason}E${selectedEpisode}` : 'Watch Now'}
              </Link>
              
              <Link
                to={`/watch-trailer/${type}/${id}${trailer ? `?v=${trailer.key}` : ''}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700/80 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors"
              >
                <FiPlay size={20} />
                Watch Trailer
              </Link>
              
              <button
                onClick={handleWatchlist}
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
              
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700/80 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                <FiShare2 size={20} />
                Share
              </button>
            </div>
          </div>
        </div>
        
        {/* Cast Section */}
        {cast.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6">Top Cast</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {cast.map((person) => (
                <Link
                  key={person.id}
                  to={`/person/${person.id}`}
                  className="text-center group"
                >
                  {person.profile_path ? (
                    <img
                      src={getImageUrl(person.profile_path, 'w185')}
                      alt={person.name}
                      className="w-24 h-24 mx-auto rounded-full object-cover mb-3 group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-24 h-24 mx-auto rounded-full bg-gray-800 mb-3 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                      <span className="text-gray-500 text-2xl">
                        {person.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <p className="text-white font-medium text-sm group-hover:text-netflix-red transition-colors">{person.name}</p>
                  <p className="text-gray-400 text-xs">{person.character}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
        
        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className="mt-12">
            <Carousel
              title="You May Also Like"
              movies={recommendations}
              showInfoOnHover={true}
              size="md"
            />
          </section>
        )}
      </div>
    </div>
  )
}

export default MovieDetailsPage

