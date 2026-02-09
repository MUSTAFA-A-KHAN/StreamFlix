import { useEffect, useState } from 'react'
import { FiArrowLeft, FiExternalLink } from 'react-icons/fi'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { TrailerPlayer } from '../components/trailer/TrailerPlayer'
import { Skeleton } from '../components/ui/Skeleton'
import * as tmdbService from '../services/tmdb'
import { getImageUrl, getYear } from '../utils/helpers'

// Watch Trailer Page
const WatchTrailerPage = () => {
  const { type = 'movie', id } = useParams()
  const [searchParams] = useSearchParams()
  const videoId = searchParams.get('v')
  const navigate = useNavigate()
  
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = type === 'tv' 
          ? await tmdbService.getTVDetails(id)
          : await tmdbService.getMovieDetails(id)
        setMovie(data)
      } catch (err) {
        console.error('Error fetching movie:', err)
        setError(err.message || 'Failed to load trailer')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id, type])
  
  // If no videoId provided, try to get trailer from API
  const [trailerId, setTrailerId] = useState(videoId)
  
  useEffect(() => {
    if (!videoId) {
      const fetchTrailer = async () => {
        try {
          const videos = type === 'tv'
            ? await tmdbService.getTVVideos(id)
            : await tmdbService.getMovieVideos(id)
          
          const trailer = videos.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')
            || videos.results?.find(v => v.type === 'Teaser' && v.site === 'YouTube')
          
          if (trailer) {
            setTrailerId(trailer.key)
          }
        } catch (err) {
          console.error('Error fetching trailer:', err)
        }
      }
      
      fetchTrailer()
    }
  }, [id, type, videoId])
  
  if (loading) {
    return <LoadingState />
  }
  
  if (error) {
    return <ErrorState error={error} />
  }
  
  return (
    <div className="min-h-screen bg-black">
      {/* Back Button */}
      <div className="fixed top-20 left-4 z-50">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-black/50 hover:bg-black/70 text-white rounded-md transition-colors"
        >
          <FiArrowLeft size={20} />
          <span className="hidden sm:inline">Back</span>
        </button>
      </div>
      
      {/* Trailer Player */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          {trailerId ? (
            <>
              <TrailerPlayer 
                videoId={trailerId} 
                title={movie?.title || movie?.name}
              />
              
              {/* Movie Info */}
              {movie && (
                <div className="mt-6 flex items-start gap-6">
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
                    <p className="text-gray-400">
                      {getYear(movie.release_date || movie.first_air_date)} • 
                      {movie.vote_average && ` ${movie.vote_average.toFixed(1)} Rating`}
                    </p>
                    <p className="text-gray-300 mt-2 line-clamp-2">
                      {movie.overview}
                    </p>
                    <div className="flex gap-3 mt-4">
                      <Link
                        to={`/${type}/${id}`}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-netflix-red text-white rounded-md hover:bg-red-700 transition-colors"
                      >
                        View Details
                      </Link>
                      <a
                        href={`https://www.youtube.com/watch?v=${trailerId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                      >
                        <FiExternalLink size={18} />
                        Open in YouTube
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <NoTrailerState movie={movie} type={type} id={id} />
          )}
        </div>
      </div>
    </div>
  )
}

// Loading State
const LoadingState = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <Skeleton className="w-full max-w-4xl aspect-video rounded-lg mb-6" />
      <Skeleton className="h-8 w-64 mx-auto mb-4" />
      <Skeleton className="h-4 w-48 mx-auto" />
    </div>
  </div>
)

// Error State
const ErrorState = ({ error }) => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <p className="text-red-500 text-lg mb-4">Error: {error}</p>
      <Link
        to="/"
        className="px-6 py-3 bg-netflix-red text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Go Home
      </Link>
    </div>
  </div>
)

// No Trailer State
const NoTrailerState = ({ movie, type, id }) => (
  <div className="text-center py-16">
    <div className="mb-6">
      <svg className="w-20 h-20 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">No Trailer Available</h2>
    <p className="text-gray-400 mb-6">
      Unfortunately, there's no trailer available for this title.
    </p>
    {movie && (
      <div className="flex justify-center gap-4">
        <Link
          to={`/${type}/${id}`}
          className="px-6 py-3 bg-netflix-red text-white rounded-md hover:bg-red-700 transition-colors"
        >
          View Details
        </Link>
        <Link
          to="/browse"
          className="px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Browse More
        </Link>
      </div>
    )}
  </div>
)

export default WatchTrailerPage

