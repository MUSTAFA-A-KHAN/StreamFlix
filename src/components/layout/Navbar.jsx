import { useEffect, useState } from 'react'
import { FiBell, FiMenu, FiUser } from 'react-icons/fi'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useWatchlist } from '../../context/WatchlistContext'
import { SearchBar } from '../search/SearchBar'

// Navbar Component
export const Navbar = ({ onMenuClick }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { getWatchlistCount } = useWatchlist()
  
  const watchlistCount = getWatchlistCount()
  const isHomePage = location.pathname === '/'
  
  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Hide navbar on certain pages
  if (location.pathname === '/watch-trailer' || location.pathname === '/watchlist') {
    return null
  }
  
  return (
    <nav 
      className={`
        fixed top-0 left-0 right-0 z-40
        transition-all duration-300
        ${isScrolled || !isHomePage 
          ? 'bg-gray-900/95 backdrop-blur-md shadow-lg' 
          : 'bg-gradient-to-b from-black/80 to-transparent'
        }
      `}
    >
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
          {/* Left Section */}
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
            {/* Mobile Menu Button */}
            <button
              onClick={onMenuClick}
              className="md:hidden text-white hover:text-netflix-red transition-colors p-1"
            >
              <FiMenu size={20} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-1 sm:gap-2">
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-netflix-red">
                StreamFlix
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              <NavLink to="/" active={location.pathname === '/'}>
                Home
              </NavLink>
              <NavLink to="/browse" active={location.pathname === '/browse'}>
                Browse
              </NavLink>
              <NavLink to="/watchlist" active={location.pathname === '/watchlist'}>
                Watchlist
              </NavLink>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            {/* Search - Desktop */}
            <div className="hidden md:block w-48 lg:w-64 xl:w-80">
              <SearchBar
                showSuggestions={true}
                placeholder="Search movies, TV shows..."
              />
            </div>

            {/* Notifications */}
            <button className="hidden md:flex text-white hover:text-netflix-red transition-colors relative p-1">
              <FiBell size={18} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-netflix-red text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* Watchlist */}
            <Link
              to="/watchlist"
              className="text-white hover:text-netflix-red transition-colors relative p-1"
            >
              <span className="hidden md:inline text-sm">Watchlist</span>
              <span className="md:hidden text-sm">List</span>
              {watchlistCount > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 sm:w-5 sm:h-5 bg-netflix-red text-white text-xs rounded-full flex items-center justify-center">
                  {watchlistCount > 9 ? '9+' : watchlistCount}
                </span>
              )}
            </Link>

            {/* Profile */}
            <button className="hidden md:flex text-white hover:text-netflix-red transition-colors p-1">
              <FiUser size={18} />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3 sm:pb-4">
          <SearchBar
            showSuggestions={true}
            placeholder="Search movies, TV shows..."
          />
        </div>
      </div>
    </nav>
  )
}

// NavLink Component
const NavLink = ({ to, children, active }) => {
  return (
    <Link
      to={to}
      className={`
        text-sm font-medium transition-colors
        ${active 
          ? 'text-white' 
          : 'text-gray-300 hover:text-white'
        }
      `}
    >
      {children}
    </Link>
  )
}

export default Navbar

