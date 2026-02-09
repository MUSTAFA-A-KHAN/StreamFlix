import { useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'
import { GENRES } from '../../utils/constants'

// Genre Filter Component
export const GenreFilter = ({ 
  mediaType = 'movie',
  selectedGenre,
  onGenreChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const genres = GENRES[mediaType.toUpperCase()] || GENRES.MOVIE
  
  const handleGenreSelect = (genreId) => {
    onGenreChange?.(genreId)
    setIsOpen(false)
  }
  
  const selectedGenreName = genres.find(g => g.id === selectedGenre)?.name || 'All Genres'
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
      >
        <span>{selectedGenreName}</span>
        <FiChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
            <button
              onClick={() => handleGenreSelect(null)}
              className={`
                w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors
                ${selectedGenre === null ? 'text-netflix-red' : 'text-white'}
              `}
            >
              All Genres
            </button>
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => handleGenreSelect(genre.id)}
                className={`
                  w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors
                  ${selectedGenre === genre.id ? 'text-netflix-red' : 'text-white'}
                `}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Filter Chips Component
export const FilterChips = ({ 
  filters = [],
  selectedFilter,
  onFilterChange,
  className = ''
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`
            px-4 py-1.5 rounded-full text-sm font-medium transition-colors
            ${selectedFilter === filter.id 
              ? 'bg-netflix-red text-white' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }
          `}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

// Sort Options Component
export const SortOptions = ({ 
  options = [],
  selectedOption,
  onSortChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const defaultOptions = [
    { id: 'popularity.desc', label: 'Most Popular' },
    { id: 'vote_average.desc', label: 'Highest Rated' },
    { id: 'primary_release_date.desc', label: 'Newest First' },
    { id: 'revenue.desc', label: 'Highest Grossing' },
  ]
  
  const sortOptions = options.length > 0 ? options : defaultOptions
  const selectedLabel = sortOptions.find(o => o.id === selectedOption)?.label || 'Sort By'
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
      >
        <span>{selectedLabel}</span>
        <FiChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl overflow-hidden z-50">
            {sortOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => {
                  onSortChange(option.id)
                  setIsOpen(false)
                }}
                className={`
                  w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors
                  ${selectedOption === option.id ? 'text-netflix-red' : 'text-white'}
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Year Filter Component
export const YearFilter = ({ 
  selectedYear,
  onYearChange,
  startYear = 1900,
  endYear = new Date().getFullYear(),
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i)
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
      >
        <span>{selectedYear || 'Year'}</span>
        <FiChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-32 bg-gray-800 rounded-lg shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
            <button
              onClick={() => {
                onYearChange(null)
                setIsOpen(false)
              }}
              className={`
                w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors
                ${selectedYear === null ? 'text-netflix-red' : 'text-white'}
              `}
            >
              Any Year
            </button>
            {years.map((year) => (
              <button
                key={year}
                onClick={() => {
                  onYearChange(year)
                  setIsOpen(false)
                }}
                className={`
                  w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors
                  ${selectedYear === year ? 'text-netflix-red' : 'text-white'}
                `}
              >
                {year}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// Rating Filter Component
export const RatingFilter = ({ 
  selectedRating,
  onRatingChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const ratings = [
    { id: 9, label: '9+ Excellent' },
    { id: 8, label: '8+ Great' },
    { id: 7, label: '7+ Good' },
    { id: 6, label: '6+ Fair' },
  ]
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors"
      >
        <span>{selectedRating ? `${selectedRating}+` : 'Rating'}</span>
        <FiChevronDown 
          size={16} 
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-40 bg-gray-800 rounded-lg shadow-xl overflow-hidden z-50">
            <button
              onClick={() => {
                onRatingChange(null)
                setIsOpen(false)
              }}
              className={`
                w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors
                ${selectedRating === null ? 'text-netflix-red' : 'text-white'}
              `}
            >
              Any Rating
            </button>
            {ratings.map((rating) => (
              <button
                key={rating.id}
                onClick={() => {
                  onRatingChange(rating.id)
                  setIsOpen(false)
                }}
                className={`
                  w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors
                  ${selectedRating === rating.id ? 'text-netflix-red' : 'text-white'}
                `}
              >
                {rating.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default GenreFilter

