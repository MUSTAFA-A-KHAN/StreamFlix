# 🎬 StreamFlix - Netflix-style OTT Platform

A modern, responsive streaming platform built with React.js and Tailwind CSS, featuring movies and TV shows from TMDB API with YouTube trailer integration.

![StreamFlix Screenshot](https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200)

## ✨ Features

- 🏠 **Homepage** - Trending, popular, top-rated, upcoming, and now playing movies/TV shows
- 🔍 **Search** - Full-text search with debouncing and suggestions
- 🎭 **Genre Filtering** - Filter by genre, year, rating, and sort options
- 📄 **Movie Details** - Complete info including cast, crew, and recommendations
- 🎬 **Trailer Streaming** - Embedded YouTube player for trailers
- ❤️ **Watchlist** - Save favorites to localStorage
- 📱 **Responsive Design** - Mobile-first approach with Tailwind CSS
- 🌙 **Dark Theme** - Netflix-inspired dark UI
- ⚡ **Fast Loading** - Skeleton loaders and lazy loading
- 🔄 **Error Handling** - Graceful error states

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- TMDB API Key (free)

### Installation

1. **Clone the repository**
   ```bash
   cd ott-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your TMDB API key:
   ```
   VITE_TMDB_API_KEY=your_api_key_here
   ```

4. **Get TMDB API Key**
   - Go to [TMDB Settings](https://www.themoviedb.org/settings/api)
   - Click "Request an API Key" under the API section
   - Fill out the form (Developer option is fine)
   - Copy your API key

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📁 Project Structure

```
ott-platform/
├── src/
│   ├── components/
│   │   ├── layout/         # Navbar, Sidebar, Layout
│   │   ├── movie/          # MovieCard, Carousel
│   │   ├── search/         # SearchBar, GenreFilter
│   │   ├── trailer/        # TrailerPlayer
│   │   └── ui/             # Button, Input, Modal, etc.
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── BrowseMovies.jsx
│   │   ├── MovieDetails.jsx
│   │   ├── WatchTrailer.jsx
│   │   └── Watchlist.jsx
│   ├── services/
│   │   ├── tmdb.js         # TMDB API service
│   │   └── youtube.js      # YouTube helpers
│   ├── hooks/
│   │   ├── useMovies.js
│   │   └── useMovieDetails.js
│   ├── context/
│   │   └── WatchlistContext.jsx
│   ├── utils/
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── App.jsx
│   └── main.jsx
├── .env.example
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS
- **React Router v6** - Client-side routing
- **Axios** - HTTP client
- **React Player** - Video player
- **React Icons** - Icon library

## 📝 Available Scripts

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🎨 Customization

### Changing Colors

Edit `tailwind.config.js`:

```js
colors: {
  netflix: {
    red: '#E50914',      // Your brand color
    black: '#141414',
    dark: '#181818',
    gray: '#808080',
    light: '#f5f5f1',
  }
}
```

### Adding New Routes

In `App.jsx`:

```jsx
<Route path="/new-page" element={<NewPage />} />
```

### API Configuration

Edit `src/utils/constants.js`:

```js
export const TMDB_CONFIG = {
  BASE_URL: 'https://api.themoviedb.org/3',
  IMAGE_BASE_URL: 'https://image.tmdb.org/t/p',
  API_KEY: import.meta.env.VITE_TMDB_API_KEY,
}
```

## 🚀 Deployment

### Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add environment variable `VITE_TMDB_API_KEY`
4. Deploy!

### Netlify

1. Push to GitHub
2. Import project in Netlify
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variable `VITE_TMDB_API_KEY`

### Build Locally

```bash
npm run build
# Output in /dist folder
```

## 🔧 API Reference

### TMDB Endpoints Used

| Endpoint | Description |
|----------|-------------|
| `/trending/all/week` | Trending content |
| `/movie/popular` | Popular movies |
| `/movie/top_rated` | Top rated movies |
| `/movie/upcoming` | Coming soon |
| `/movie/now_playing` | In theaters |
| `/movie/{id}` | Movie details |
| `/movie/{id}/credits` | Cast & crew |
| `/movie/{id}/videos` | Trailers |
| `/search/movie` | Search movies |
| `/discover/movie` | Filtered discovery |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🙏 Credits

- [TMDB](https://www.themoviedb.org/) - Movie & TV data
- [YouTube](https://www.youtube.com/) - Trailer hosting
- [Unsplash](https://unsplash.com/) - Demo images
- [React](https://reactjs.org/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

Built with ❤️ for movie lovers

