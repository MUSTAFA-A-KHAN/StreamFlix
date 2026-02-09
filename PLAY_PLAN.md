# Play Functionality Implementation Plan

## Overview
Implement a full movie player page that uses TMDB's watch/providers API to find free streaming options for movies.

## Files to Create/Modify

### 1. New Files
- `src/pages/MoviePlayer.jsx` - Full movie player page
- `src/components/player/MovieStreamPlayer.jsx` - Component to handle streaming from free sources

### 2. Modified Files
- `src/services/tmdb.js` - Add watch providers API functions
- `src/App.jsx` - Add route for movie player
- `src/components/movie/MovieCard.jsx` - Connect play button to movie player
- `src/pages/MovieDetails.jsx` - Add "Watch Now" button
- `src/utils/constants.js` - Add free streaming source mappings

## Implementation Steps

### Step 1: Add Watch Providers API (tmdb.js)
- Add `getMovieProviders(movieId)` function
- Add `getTVProviders(tvId)` function
- Add helper to filter free providers

### Step 2: Create MoviePlayer Page
- Fetch watch providers for the movie
- Display available free streaming options
- Embed player for the selected source
- Handle cases with no free options (show "Not Available" message)

### Step 3: Create MovieStreamPlayer Component
- Handle embedding from different free sources (Tubi, Pluto TV, Crackle, etc.)
- Support for Viddla (rent/buy fallback)
- Responsive iframe embedding

### Step 4: Update Routes (App.jsx)
- Add route: `/watch/:type/:id` for full movie watching

### Step 5: Connect Play Buttons
- Update MovieCard `handlePlayClick` to navigate to movie player
- Add "Watch Now" button to MovieDetailsPage

## Free Streaming Sources Integration

The implementation will support these free sources:
- **Tubi** - tubitv.com
- **Pluto TV** - pluto.tv
- **Crackle** - crackle.com
- **Vudu** - Free section
- **Peacock** - Free tier
- **YouTube** - Free movies section

## API Functions to Add

```javascript
// In tmdb.js
export const getMovieProviders = async (movieId) => { ... }
export const getTVProviders = async (tvId) => { ... }
export const getFreeProviders = async (id, type) => { ... }
```

## UI Flow

1. User clicks "Play" on a movie card
2. App fetches watch providers
3. If free options exist → Show provider selection
4. User clicks provider → Embeds player
5. If no free options → Show alternative actions (trailer, add to watchlist)

## Dependencies
- No new dependencies needed
- Uses existing react-router-dom and iframe embedding

## Notes
- TMDB only provides metadata and links to external services
- Actual movie availability depends on the streaming services
- Some movies may only be available for rent/purchase
- Geo-restrictions may apply based on user location

