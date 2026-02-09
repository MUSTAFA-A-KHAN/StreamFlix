import { useCallback, useEffect, useState } from 'react'
import {
  FiCalendar,
  FiClock,
  FiHeart,
  FiInfo,
  FiList,
  FiPlay,
  FiSearch,
  FiStar,
  FiTrendingUp,
  FiX
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { AnimeCarousel } from '../components/movie/AnimeCarousel'
import { SkeletonHero, SkeletonRow } from '../components/ui/Skeleton'
import {
  browseByQuery,
  getHomeData,
  getPosterUrl,
  searchAnime
} from '../services/anime'

// API Base
const API_BASE = 'https://hianimeapi-6uju.onrender.com/api/v1'

// Provider options
const PROVIDER_OPTIONS = [
  { id: 'hianime-scrap', label: 'HiAnime' },
  { id: 'animekai', label: 'AnimeKai' },
  { id: 'animepahe', label: 'AnimePahe' },
  {id: 'hianime-scrap' ,label: "hianime-scrap"}
]

// Browse categories
const BROWSE_CATEGORIES = [
  { id: 'top-airing', label: 'Top Airing', icon: <FiTrendingUp /> },
  { id: 'most-popular', label: 'Most Popular', icon: <FiStar /> },
  { id: 'most-favorite', label: 'Most Favorite', icon: <FiHeart /> },
  { id: 'completed', label: 'Completed', icon: <FiList /> },
  { id: 'recently-added', label: 'Recently Added', icon: <FiClock /> },
  { id: 'top-upcoming', label: 'Top Upcoming', icon: <FiCalendar /> },
  { id: 'subbed-anime', label: 'Subbed Anime', icon: <FiPlay /> },
  { id: 'dubbed-anime', label: 'Dubbed Anime', icon: <FiPlay /> },
]

// Anime Browse Page
const AnimeBrowsePage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [homeData, setHomeData] = useState(null)
  const [spotlight, setSpotlight] = useState([])
  const [sections, setSections] = useState({
    trending: { data: [], loading: true, error: null },
    topAiring: { data: [], loading: true, error: null },
    mostPopular: { data: [], loading: true, error: null },
    mostFavorite: { data: [], loading: true, error: null },
    completed: { data: [], loading: true, error: null },
    recentlyAdded: { data: [], loading: true, error: null },
    topUpcoming: { data: [], loading: true, error: null },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentCategory, setCurrentCategory] = useState('trending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchMode, setSearchMode] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState('hianime-scrap')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch home data and spotlight on page load - with proper cleanup to prevent duplicates
  useEffect(() => {
    let isMounted = true;
    let homeFetched = false;

    const fetchData = async () => {
      if (homeFetched) return;
      homeFetched = true;

      try {
        setLoading(true)
        setError(null)
        
        const home = await getHomeData()
        
        if (!isMounted) return;
        
        // Extract data from the nested structure: home.data.spotlight, home.data.trending, etc.
        const homeData = home.data || {}
        
        setHomeData(homeData)
        setSpotlight(homeData.spotlight?.slice(0, 5) || [])
        
        // Set up sections
        setSections({
          trending: { 
            data: homeData.trending || [], 
            loading: false, 
            error: null 
          },
          topAiring: { 
            data: homeData.topAiring || [], 
            loading: false, 
            error: null 
          },
          mostPopular: { 
            data: homeData.mostPopular || [], 
            loading: false, 
            error: null 
          },
          mostFavorite: { 
            data: homeData.mostFavorite || [], 
            loading: false, 
            error: null 
          },
          completed: { 
            data: homeData.latestCompleted || [], 
            loading: false, 
            error: null 
          },
          recentlyAdded: { 
            data: homeData.newAdded || [], 
            loading: false, 
            error: null 
          },
          topUpcoming: { 
            data: homeData.topUpcoming || [], 
            loading: false, 
            error: null 
          },
        })
      } catch (err) {
        if (!isMounted) return;
        console.error('Home data error:', err)
        setError('Failed to load anime data')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()

    return () => {
      isMounted = false;
    };
  }, [])

  // Handle category selection
  const handleCategorySelect = async (categoryId) => {
    setSearchMode(false)
    setCurrentCategory(categoryId)
    setPage(1)
    setShowFilters(false)

    // Update sections to show loading for the selected category
    setSections(prev => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], loading: true }
    }))

    try {
      const data = await browseByQuery(categoryId, 1)
      
      if (data.data && data.data.response) {
        setSections(prev => ({
          ...prev,
          [categoryId]: { 
            data: data.data.response, 
            loading: false, 
            error: null 
          }
        }))
        setTotalPages(data.data.pageInfo?.totalPages || 1)
      }
    } catch (err) {
      console.error('Category fetch error:', err)
      setSections(prev => ({
        ...prev,
        [categoryId]: { 
          data: [], 
          loading: false, 
          error: err.message 
        }
      }))
    }
  }

  // Search handler
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchMode(false)
      return
    }

    setSearchMode(true)

    // Update trending section to show loading
    setSections(prev => ({
      ...prev,
      trending: { ...prev.trending, loading: true, error: null }
    }))

    try {
      const data = await searchAnime(searchQuery.trim(), 1, selectedProvider)

      if (data.data && data.data.response) {
        setSections(prev => ({
          ...prev,
          trending: { 
            data: data.data.response, 
            loading: false, 
            error: null 
          }
        }))
        setTotalPages(data.data.pageInfo?.totalPages || 1)
      } else {
        setSections(prev => ({
          ...prev,
          trending: { data: [], loading: false, error: null }
        }))
      }
    } catch (err) {
      console.error('Search error:', err)
      setSections(prev => ({
        ...prev,
        trending: { 
          data: [], 
          loading: false, 
          error: err.message || 'Failed to search anime' 
        }
      }))
    }
  }, [searchQuery, selectedProvider])

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Load more results
  const loadMore = async () => {
    if (page >= totalPages) return
    
    try {
      if (searchMode) {
        const data = await searchAnime(searchQuery.trim(), page + 1)
        if (data.data?.response) {
          setSections(prev => ({
            ...prev,
            trending: {
              data: [...prev.trending.data, ...data.data.response],
              loading: false,
              error: null
            }
          }))
          setPage(page + 1)
        }
      } else {
        const data = await browseByQuery(currentCategory, page + 1)
        if (data.data?.response) {
          setSections(prev => ({
            ...prev,
            [currentCategory]: {
              data: [...prev[currentCategory].data, ...data.data.response],
              loading: false,
              error: null
            }
          }))
          setPage(page + 1)
        }
      }
    } catch (err) {
      console.error('Load more error:', err)
    }
  }

  // Clear search and reset
  const clearSearch = () => {
    setSearchQuery('')
    setSearchMode(false)
    setPage(1)
    setShowFilters(false)
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Featured/Hero Section */}
      <section className="relative">
        {spotlight.length > 0 ? (
          <FeaturedSection anime={spotlight} />
        ) : (
          <SkeletonHero />
        )}
      </section>

      {/* Search & Filter Bar */}
      <div className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4">
            {/* Search */}
            <div className="flex-1 w-full md:max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Search anime..."
                  className="w-full px-4 sm:px-5 py-2.5 sm:py-3 pr-20 sm:pr-24 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm sm:text-base touch-manipulation"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-10 sm:right-12 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 text-gray-400 hover:text-white transition-colors touch-manipulation"
                  >
                    <FiX size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                )}
                <button
                  onClick={handleSearch}
                  className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors touch-manipulation"
                >
                  <FiSearch size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base touch-manipulation ${
                showFilters ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              <FiList size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden xs:inline">Filters</span>
            </button>

            {/* Provider Selection */}
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm sm:text-base touch-manipulation"
            >
              {PROVIDER_OPTIONS.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-800">
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {BROWSE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm touch-manipulation ${
                      currentCategory === cat.id && !searchMode
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Sections */}
      <div className="relative -mt-32 z-10 pb-12">
        {searchMode ? (
          /* Search Results */
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FiSearch className="text-purple-500" />
                Search Results for "{searchQuery}"
              </h2>
              <button
                onClick={clearSearch}
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
              >
                <FiX size={16} />
                Clear
              </button>
            </div>

            {error && (
              <div className="text-center py-16">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {!error && sections.trending.data.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">😔</div>
                <h2 className="text-2xl font-bold text-white mb-2">No Results Found</h2>
                <p className="text-gray-400">Try a different search term</p>
              </div>
            )}

            <AnimeCarousel
              anime={sections.trending.data}
              loading={sections.trending.loading}
              error={sections.trending.error}
              size="md"
            />
          </div>
        ) : (
          /* Carousel Sections */
          <>
            {/* Trending Now */}
            <AnimeCarousel
              title="Trending Now"
              anime={sections.trending.data}
              loading={sections.trending.loading}
              error={sections.trending.error}
              size="md"
            />

            {/* Top Airing */}
            <AnimeCarousel
              title="Top Airing"
              anime={sections.topAiring.data}
              loading={sections.topAiring.loading}
              error={sections.topAiring.error}
              size="md"
            />

            {/* Most Popular */}
            <AnimeCarousel
              title="Most Popular"
              anime={sections.mostPopular.data}
              loading={sections.mostPopular.loading}
              error={sections.mostFavorite.error}
              size="md"
            />

            {/* Most Favorite */}
            <AnimeCarousel
              title="Most Favorite"
              anime={sections.mostFavorite.data}
              loading={sections.mostFavorite.loading}
              error={sections.mostFavorite.error}
              size="md"
            />

            {/* Completed */}
            <AnimeCarousel
              title="Completed Series"
              anime={sections.completed.data}
              loading={sections.completed.loading}
              error={sections.completed.error}
              size="md"
            />

            {/* Recently Added */}
            <AnimeCarousel
              title="Recently Added"
              anime={sections.recentlyAdded.data}
              loading={sections.recentlyAdded.loading}
              error={sections.recentlyAdded.error}
              size="md"
            />

            {/* Top Upcoming */}
            <AnimeCarousel
              title="Top Upcoming"
              anime={sections.topUpcoming.data}
              loading={sections.topUpcoming.loading}
              error={sections.topUpcoming.error}
              size="md"
            />
          </>
        )}
      </div>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-t from-black to-gray-900">
        <div className="container mx-auto px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to watch anime?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Discover thousands of anime series and movies. From classics to the latest releases!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white font-bold rounded-md hover:bg-purple-700 transition-colors text-lg"
          >
            <FiPlay size={24} />
            Browse All
          </Link>
        </div>
      </section>
    </div>
  )
}

// Featured Section Component
const FeaturedSection = ({ anime }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % anime.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [anime.length])
  
  const currentAnime = anime[activeIndex]
  
  return (
    <div className="relative h-[70vh] overflow-hidden">
      {/* Featured Anime Backdrop */}
      <div className="absolute inset-0">
        <img
          src={getPosterUrl(currentAnime.poster)}
          alt={currentAnime.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
      </div>
      
      {/* Featured Content */}
      <div className="relative h-full flex items-center px-8 md:px-16 lg:px-24">
        <div className="max-w-2xl space-y-6">
          {/* Badge */}
          <div className="flex items-center gap-3">
            <span className="text-purple-500 font-bold tracking-wider uppercase text-sm">
              Featured
            </span>
            {currentAnime.rank && (
              <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded font-medium">
                #{currentAnime.rank}
              </span>
            )}
          </div>
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            {currentAnime.title}
          </h1>
          
          {/* Overview */}
          <p className="text-gray-300 text-lg line-clamp-3">
            {currentAnime.description || currentAnime.synopsis || 'No description available.'}
          </p>
          
          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {currentAnime.type && <span>{currentAnime.type}</span>}
            {currentAnime.episodes && (
              <span>
                {currentAnime.episodes.eps || currentAnime.episodes.sub || currentAnime.episodes.dub || '?'} Episodes
              </span>
            )}
            {currentAnime.rating && (
              <span className="text-yellow-400 flex items-center gap-1">
                <FiStar size={14} />
                {currentAnime.rating}
              </span>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Link
              to={`/watch/anime/${encodeURIComponent(currentAnime.id)}?ep=1`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-700 transition-colors"
            >
              <FiPlay size={20} />
              Watch Now
            </Link>
            <Link
              to={`/anime/${encodeURIComponent(currentAnime.id)}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700/80 text-white font-semibold rounded-md hover:bg-gray-600 transition-colors"
            >
              <FiInfo size={20} />
              More Info
            </Link>
          </div>
        </div>
      </div>
      
      {/* Dots Navigation */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2">
        {anime.map((_, index) => (
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
      <SkeletonRow title="Top Airing" />
      <SkeletonRow title="Most Popular" />
    </div>
  </div>
)

export default AnimeBrowsePage
