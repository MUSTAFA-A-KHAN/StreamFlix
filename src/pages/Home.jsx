import { useEffect, useState } from 'react'
import { FiInfo, FiPlay } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Carousel } from '../components/movie/Carousel'
import { RatingBadge } from '../components/ui/Rating'
import { SkeletonHero, SkeletonRow } from '../components/ui/Skeleton'
import * as tmdbService from '../services/tmdb'

// Home Page
const HomePage = () => {
  const [featured, setFeatured] = useState([])
  const [sections, setSections] = useState({
    trending: { data: [], loading: true, error: null },
    popular: { data: [], loading: true, error: null },
    topRated: { data: [], loading: true, error: null },
    upcoming: { data: [], loading: true, error: null },
    nowPlaying: { data: [], loading: true, error: null },
  })
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured content (first movie from trending)
        const trendingRes = await tmdbService.getTrending('week')
        const trendingMovies = trendingRes.results.filter(m => m.backdrop_path)
        setFeatured(trendingMovies.slice(0, 5))
        
        // Fetch all sections in parallel
        const [popular, topRated, upcoming, nowPlaying] = await Promise.all([
          tmdbService.getPopularMovies(1),
          tmdbService.getTopRatedMovies(1),
          tmdbService.getUpcomingMovies(1),
          tmdbService.getNowPlayingMovies(1),
        ])
        
        setSections({
          trending: { data: trendingMovies, loading: false, error: null },
          popular: { data: popular.results, loading: false, error: null },
          topRated: { data: topRated.results, loading: false, error: null },
          upcoming: { data: upcoming.results, loading: false, error: null },
          nowPlaying: { data: nowPlaying.results, loading: false, error: null },
        })
      } catch (error) {
        console.error('Error fetching home page data:', error)
        setSections({
          trending: { data: [], loading: false, error: error.message },
          popular: { data: [], loading: false, error: error.message },
          topRated: { data: [], loading: false, error: error.message },
          upcoming: { data: [], loading: false, error: error.message },
          nowPlaying: { data: [], loading: false, error: error.message },
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  if (loading) {
    return <PageLoader />
  }
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Featured/Hero Section */}
      <section className="relative">
        {featured.length > 0 ? (
          <FeaturedSection movies={featured} />
        ) : (
          <SkeletonHero />
        )}
      </section>
      
      {/* Content Sections */}
      <div className="relative -mt-32 z-10 pb-12" style={{marginTop:"1rem"}}>
        {/* Trending Now */}
        <Carousel
          title="Trending Now"
          movies={sections.trending.data}
          loading={sections.trending.loading}
          error={sections.trending.error}
          size="md"
        />
        
        {/* Popular Movies */}
        <Carousel
          title="Popular Movies"
          movies={sections.popular.data}
          loading={sections.popular.loading}
          error={sections.popular.error}
          size="md"
        />
        
        {/* Top Rated */}
        <Carousel
          title="Top Rated"
          movies={sections.topRated.data}
          loading={sections.topRated.loading}
          error={sections.topRated.error}
          size="md"
        />
        
        {/* Coming Soon */}
        <Carousel
          title="Coming Soon"
          movies={sections.upcoming.data}
          loading={sections.upcoming.loading}
          error={sections.upcoming.error}
          size="md"
        />
        
        {/* Now Playing */}
        <Carousel
          title="Now Playing"
          movies={sections.nowPlaying.data}
          loading={sections.nowPlaying.loading}
          error={sections.nowPlaying.error}
          size="md"
        />
      </div>
      
      {/* Anime Section */}
      <section className="py-8 sm:py-10 md:py-12 bg-gradient-to-r from-purple-900/50 to-gray-900 border-t border-gray-800">
        <div className="container mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="text-3xl sm:text-4xl md:text-5xl">🎌</span>
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                  AnimeFlix
                </h2>
                <p className="text-gray-400 text-sm sm:text-base">
                  Stream your favorite anime series and movies
                </p>
              </div>
            </div>
            <Link
              to="/anime"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-md transition-colors text-base sm:text-lg touch-manipulation"
            >
              <span>Browse Anime</span>
              <FiPlay size={20} className="sm:w-6 sm:h-6" />
            </Link>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-t from-black to-gray-900">
        <div className="container mx-auto px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to watch?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Join millions of users enjoying the latest movies and TV shows. 
            Start your free trial today!
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 px-8 py-4 bg-netflix-red text-white font-bold rounded-md hover:bg-red-700 transition-colors text-lg"
          >
            <FiPlay size={24} />
            Start Watching
          </Link>
        </div>
      </section>
    </div>
  )
}

// Featured Section Component
const FeaturedSection = ({ movies }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % movies.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [movies.length])
  
  const currentMovie = movies[activeIndex]
  
  return (
    <div className="relative h-[70vh] overflow-hidden">
      {/* Featured Movie Backdrop */}
      <div className="absolute inset-0">
        <img
          src={`https://image.tmdb.org/t/p/original${currentMovie.backdrop_path}`}
          alt={currentMovie.title || currentMovie.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
      </div>
      
      {/* Featured Content */}
      <div className="relative h-full flex items-center px-4 sm:px-6 md:px-8 lg:px-16 xl:px-24">
        <div className="max-w-2xl space-y-4 sm:space-y-6">
          {/* Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-netflix-red font-bold tracking-wider uppercase text-xs sm:text-sm">
              Featured
            </span>
            <RatingBadge rating={currentMovie.vote_average} size="sm" />
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight">
            {currentMovie.title || currentMovie.name}
          </h1>

          {/* Overview */}
          <p className="text-gray-300 text-sm sm:text-base md:text-lg line-clamp-3">
            {currentMovie.overview || 'No description available for this title.'}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-400">
            <span>{new Date(currentMovie.release_date || currentMovie.first_air_date).getFullYear()}</span>
            {currentMovie.adult && (
              <span className="border border-gray-500 px-1 text-xs">18+</span>
            )}
            <span className="capitalize">{currentMovie.media_type}</span>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 pt-3 sm:pt-4">
            <Link
              to={`/watch/${currentMovie.media_type || 'movie'}/${currentMovie.id}`}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-netflix-red text-white font-semibold rounded-md hover:bg-red-700 transition-colors text-sm sm:text-base touch-manipulation"
            >
              <FiPlay size={16} className="sm:w-5 sm:h-5" />
              Watch Now
            </Link>
            <Link
              to={`/watch-trailer/${currentMovie.media_type || 'movie'}/${currentMovie.id}`}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-700/80 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors text-sm sm:text-base touch-manipulation"
            >
              <FiPlay size={16} className="sm:w-5 sm:h-5" />
              Watch Trailer
            </Link>
            <Link
              to={`/${currentMovie.media_type || 'movie'}/${currentMovie.id}`}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gray-700/80 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors text-sm sm:text-base touch-manipulation"
            >
              <FiInfo size={16} className="sm:w-5 sm:h-5" />
              More Info
            </Link>
          </div>
        </div>
      </div>
      
      {/* Dots Navigation */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveIndex(index)}
            className={`
              w-2 h-2 rounded-full transition-all
              ${index === activeIndex 
                ? 'bg-white w-8' 
                : 'bg-white/50 hover:bg-white/70'
              }
            `}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

// Loading State
const PageLoader = () => (
  <div className="min-h-screen bg-gray-900">
    <SkeletonHero />
    <div className="relative -mt-32 z-10 pb-12">
      <SkeletonRow title="Trending Now" />
      <SkeletonRow title="Popular Movies" />
      <SkeletonRow title="Top Rated" />
    </div>
  </div>
)

export default HomePage

