import { FiStar } from 'react-icons/fi'
import { getRatingColor } from '../../utils/helpers'

// Star Rating Component
export const StarRating = ({ rating = 0, maxRating = 10, size = 'md', showNumber = true }) => {
  const stars = Math.round((rating / maxRating) * 5)
  const starSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  }[size]
  
  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <FiStar
          key={i}
          className={`
            ${starSize}
            ${i < stars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}
          `}
        />
      ))}
      {showNumber && (
        <span className={`ml-1 text-sm ${getRatingColor(rating)}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// Rating Badge Component
export const RatingBadge = ({ rating = 0, maxRating = 10, size = 'md' }) => {
  const badgeSize = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  }[size]
  
  const fontSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size]
  
  const colorClass = getRatingColor(rating)
  const bgClass = colorClass.replace('text-', 'bg-')
  
  return (
    <div className={`inline-flex items-center ${badgeSize} ${bgClass} rounded-md font-bold`}>
      <span className={fontSize}>{rating.toFixed(1)}</span>
      <span className="ml-0.5 text-xs opacity-70">/ {maxRating}</span>
    </div>
  )
}

// Rating Circle Component
export const RatingCircle = ({ rating = 0, maxRating = 10, size = 'lg' }) => {
  const percentage = (rating / maxRating) * 100
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  }
  
  const fontSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }
  
  const getColorClass = () => {
    if (rating >= 8) return 'text-green-500'
    if (rating >= 6) return 'text-yellow-500'
    if (rating >= 4) return 'text-orange-500'
    return 'text-red-500'
  }
  
  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="50%"
          cy="50%"
          r="40"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx="50%"
          cy="50%"
          r="40"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${getColorClass()} transition-all duration-500`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`${fontSizes[size]} font-bold ${getColorClass()}`}>
          {rating.toFixed(1)}
        </span>
      </div>
    </div>
  )
}

// IMDb-style Rating
export const IMDBRating = ({ rating = 0, votes, size = 'md' }) => {
  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size]
  
  const fontSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size]
  
  return (
    <div className="flex items-center gap-1">
      <svg className={`${iconSize} fill-yellow-400`} viewBox="0 0 24 24">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
      <span className={`${fontSize} font-bold text-yellow-400`}>{rating.toFixed(1)}</span>
      {votes && (
        <span className={`${fontSize} text-gray-400`}>
          {formatVotes(votes)}
        </span>
      )}
    </div>
  )
}

// Helper function to format vote count
const formatVotes = (votes) => {
  if (!votes) return ''
  if (votes >= 1000000) {
    return `${(votes / 1000000).toFixed(1)}M votes`
  }
  if (votes >= 1000) {
    return `${(votes / 1000).toFixed(1)}K votes`
  }
  return `${votes} votes`
}

export default RatingBadge

