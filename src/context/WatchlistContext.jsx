import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { generateId } from '../utils/helpers'

// Create context
const WatchlistContext = createContext()

// Storage key
const WATCHLIST_STORAGE_KEY = 'streamflix_watchlist'

// Provider component
export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Initialize watchlist from localStorage on mount
  useEffect(() => {
    try {
      const storedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY)
      if (storedWatchlist) {
        setWatchlist(JSON.parse(storedWatchlist))
      }
    } catch (err) {
      console.error('Error loading watchlist from localStorage:', err)
      setError('Failed to load watchlist')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist))
      } catch (err) {
        console.error('Error saving watchlist to localStorage:', err)
        setError('Failed to save watchlist')
      }
    }
  }, [watchlist, isLoading])

  // Check if item is in watchlist
  const isInWatchlist = useCallback((id) => {
    return watchlist.some(item => item.id === id)
  }, [watchlist])

  // Add item to watchlist
  const addToWatchlist = useCallback((item) => {
    if (!item || !item.id) {
      console.warn('Invalid item for watchlist')
      return false
    }

    if (isInWatchlist(item.id)) {
      console.warn('Item already in watchlist:', item.id)
      return false
    }

    const watchlistItem = {
      ...item,
      addedAt: new Date().toISOString(),
      uniqueId: generateId(),
    }

    setWatchlist(prev => [watchlistItem, ...prev])
    return true
  }, [isInWatchlist])

  // Remove item from watchlist
  const removeFromWatchlist = useCallback((id) => {
    setWatchlist(prev => prev.filter(item => item.id !== id))
    return true
  }, [])

  // Toggle item in watchlist
  const toggleWatchlist = useCallback((item) => {
    if (isInWatchlist(item.id)) {
      removeFromWatchlist(item.id)
      return false
    }
    addToWatchlist(item)
    return true
  }, [isInWatchlist, addToWatchlist, removeFromWatchlist])

  // Clear entire watchlist
  const clearWatchlist = useCallback(() => {
    setWatchlist([])
  }, [])

  // Update item in watchlist
  const updateWatchlistItem = useCallback((id, updates) => {
    setWatchlist(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    )
  }, [])

  // Get watchlist count
  const getWatchlistCount = useCallback(() => {
    return watchlist.length
  }, [watchlist])

  // Get all watchlist items
  const getWatchlistItems = useCallback(() => {
    return [...watchlist]
  }, [watchlist])

  // Sort watchlist
  const sortWatchlist = useCallback((sortBy = 'addedAt', order = 'desc') => {
    setWatchlist(prev => {
      const sorted = [...prev].sort((a, b) => {
        let aVal = a[sortBy]
        let bVal = b[sortBy]

        if (sortBy === 'addedAt') {
          aVal = new Date(aVal)
          bVal = new Date(bVal)
        }

        if (order === 'desc') {
          return bVal > aVal ? 1 : -1
        }
        return aVal > bVal ? 1 : -1
      })
      return sorted
    })
  }, [])

  // Filter watchlist
  const filterWatchlist = useCallback((filterFn) => {
    return watchlist.filter(filterFn)
  }, [watchlist])

  // Export watchlist to JSON
  const exportWatchlist = useCallback(() => {
    return JSON.stringify(watchlist, null, 2)
  }, [watchlist])

  // Import watchlist from JSON
  const importWatchlist = useCallback((jsonData) => {
    try {
      const items = JSON.parse(jsonData)
      if (Array.isArray(items)) {
        // Filter out invalid items
        const validItems = items.filter(item => item && item.id)
        setWatchlist(validItems)
        return true
      }
      return false
    } catch (err) {
      console.error('Error importing watchlist:', err)
      return false
    }
  }, [])

  // Context value
  const value = {
    watchlist,
    isLoading,
    error,
    isInWatchlist,
    addToWatchlist,
    removeFromWatchlist,
    toggleWatchlist,
    clearWatchlist,
    updateWatchlistItem,
    getWatchlistCount,
    getWatchlistItems,
    sortWatchlist,
    filterWatchlist,
    exportWatchlist,
    importWatchlist,
  }

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  )
}

// Custom hook to use watchlist
export const useWatchlist = () => {
  const context = useContext(WatchlistContext)
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider')
  }
  return context
}

export default WatchlistContext

