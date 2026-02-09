import { useRef } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { SkeletonCard } from '../ui/Skeleton'
import MovieCard from './MovieCard'

// Carousel Component
export const Carousel = ({ 
  title, 
  movies = [], 
  loading = false, 
  error = null,
  showInfoOnHover = true,
  size = 'md',
  className = ''
}) => {
  const scrollContainerRef = useRef(null)
  
  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const scrollAmount = container.clientWidth * 0.8
      
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      }
    }
  }
  
  return (
    <div className={`py-6 ${className}`}>
      {/* Title */}
      {title && (
        <h2 className="text-xl md:text-2xl font-bold text-white mb-4 px-4 md:px-8">
          {title}
        </h2>
      )}
      
      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow */}
        {movies.length > 0 && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 hidden md:flex items-center justify-center w-12 bg-black/50 hover:bg-black/70 text-white transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Scroll left"
          >
            <FiChevronLeft size={24} />
          </button>
        )}
        
        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 md:gap-4 overflow-x-auto carousel-container px-4 md:px-8 pb-4 group"
          style={{ scrollBehavior: 'smooth' }}
        >
          {/* Loading State */}
          {loading && [...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
          
          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center w-full h-48 text-gray-400">
              <p>Error loading movies: {error}</p>
            </div>
          )}
          
          {/* Empty State */}
          {!loading && !error && movies.length === 0 && (
            <div className="flex items-center justify-center w-full h-48 text-gray-400">
              <p>No movies found</p>
            </div>
          )}
          
          {/* Movie Cards */}
          {!loading && !error && movies.map((movie) => (
            <MovieCard 
              key={movie.id} 
              movie={movie}
              showInfoOnHover={showInfoOnHover}
              size={size}
            />
          ))}
        </div>
        
        {/* Right Arrow */}
        {movies.length > 0 && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 hidden md:flex items-center justify-center w-12 bg-black/50 hover:bg-black/70 text-white transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Scroll right"
          >
            <FiChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  )
}

// Multi-Row Carousel
export const MultiRowCarousel = ({ sections = [] }) => {
  return (
    <div className="space-y-8">
      {sections.map((section, index) => (
        <Carousel
          key={index}
          title={section.title}
          movies={section.movies}
          loading={section.loading}
          error={section.error}
          showInfoOnHover={true}
          size="md"
        />
      ))}
    </div>
  )
}

export default Carousel

