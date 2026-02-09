// Skeleton Component for loading states
export const Skeleton = ({ className = '', variant = 'text', height, width }) => {
  const baseClass = 'skeleton rounded'
  
  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
    card: 'rounded-lg',
    avatar: 'rounded-full',
  }
  
  const style = {
    height: height || undefined,
    width: width || undefined,
  }
  
  return (
    <div 
      className={`${baseClass} ${variantClasses[variant] || variantClasses.text} ${className}`}
      style={style}
      aria-hidden="true"
    />
  )
}

// Skeleton Card for movie cards
export const SkeletonCard = () => {
  return (
    <div className="flex-shrink-0 w-40 md:w-48 lg:w-56 xl:w-64 animate-pulse">
      <Skeleton variant="card" className="aspect-[2/3] bg-gray-800" />
      <div className="mt-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

// Skeleton for hero section
export const SkeletonHero = () => {
  return (
    <div className="relative h-[70vh] w-full animate-pulse">
      <Skeleton className="h-full w-full bg-gray-800" />
      <div className="absolute inset-0 hero-gradient flex items-end p-8 md:p-16">
        <div className="max-w-2xl space-y-4 w-full">
          <Skeleton className="h-10 w-3/4 bg-gray-700" />
          <Skeleton className="h-6 w-full bg-gray-700" />
          <Skeleton className="h-6 w-2/3 bg-gray-700" />
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-12 w-32 bg-gray-700" />
            <Skeleton className="h-12 w-32 bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton for movie details
export const SkeletonDetails = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row gap-8">
        <Skeleton variant="rectangular" className="w-full md:w-96 aspect-[2/3] bg-gray-800" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-10 w-3/4 bg-gray-800" />
          <Skeleton className="h-6 w-1/2 bg-gray-800" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-24 bg-gray-800" />
            <Skeleton className="h-6 w-24 bg-gray-800" />
            <Skeleton className="h-6 w-24 bg-gray-800" />
          </div>
          <Skeleton className="h-24 w-full bg-gray-800" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-32 bg-gray-800" />
            <Skeleton className="h-12 w-32 bg-gray-800" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton for cast/crew section
export const SkeletonCast = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="text-center animate-pulse">
          <Skeleton variant="circular" className="w-24 h-24 mx-auto bg-gray-800" />
          <Skeleton className="h-4 w-24 mt-3 mx-auto bg-gray-800" />
          <Skeleton className="h-3 w-20 mt-1 mx-auto bg-gray-800" />
        </div>
      ))}
    </div>
  )
}

// Skeleton for carousel row
export const SkeletonRow = ({ title }) => {
  return (
    <div className="py-6">
      <h3 className="text-xl md:text-2xl font-bold mb-4">{title}</h3>
      <div className="flex gap-4 overflow-x-auto carousel-container pb-4">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}

// Loading spinner
export const LoadingSpinner = ({ size = 'md', color = 'red' }) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }
  
  const colors = {
    red: 'border-netflix-red border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-500 border-t-transparent',
  }
  
  return (
    <div 
      className={`
        ${sizes[size]}
        ${colors[color]}
        border-4 rounded-full animate-spin
      `}
    />
  )
}

// Full page loading
export const PageLoader = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <LoadingSpinner size="xl" color="red" />
        <p className="mt-4 text-gray-400">Loading...</p>
      </div>
    </div>
  )
}

export default Skeleton

