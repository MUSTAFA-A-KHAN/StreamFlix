import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AgeGate from "./components/AgeGate";
import Layout from "./components/layout/Layout";
import AnimeBrowsePage from "./pages/AnimeBrowse";
import AnimeDetailsPage from "./pages/AnimeDetails";
import AnimePlayerPage from "./pages/AnimePlayer";
import BrowseMoviesPage from "./pages/BrowseMovies";
import HomePage from "./pages/Home";
import MovieDetailsPage from "./pages/MovieDetails";
import MoviePlayerPage from "./pages/MoviePlayer";
import WatchTrailerPage from "./pages/WatchTrailer";
import WatchlistPage from "./pages/Watchlist";

// App Component
function App() {
  const [isVerified, setIsVerified] = useState(true);

  const handleVerification = () => {
    setIsVerified(true);
  };

  if (!isVerified) {
    return <AgeGate onVerified={handleVerification} />;
  }

  return (
    <BrowserRouter basename="/StreamFlix">
      <Routes>
        {/* Layout Route */}
        <Route path="/" element={<Layout />}>
          {/* Home Page */}
          <Route index element={<HomePage />} />

          {/* Browse Page */}
          <Route path="browse" element={<BrowseMoviesPage />} />

          {/* Watchlist Page */}
          <Route path="watchlist" element={<WatchlistPage />} />

          {/* Movie Details Page */}
          <Route path="movie/:id" element={<MovieDetailsPage />} />

          {/* TV Show Details Page */}
          <Route path="tv/:id" element={<MovieDetailsPage />} />

          {/* Person Details Page */}
          <Route path="person/:id" element={<MovieDetailsPage />} />

          {/* Anime Browse Page */}
          <Route path="anime" element={<AnimeBrowsePage />} />

          {/* Anime Details Page */}
          <Route path="anime/:id" element={<AnimeDetailsPage />} />
        </Route>

        {/* Watch Anime Page (Full screen, no layout) */}
        <Route path="watch/anime/:id" element={<AnimePlayerPage />} />

        {/* Watch Movie Page (Full screen, no layout) */}
        <Route path="watch/:type/:id" element={<MoviePlayerPage />} />

        {/* Watch Trailer Page (Full screen, no layout) */}
        <Route path="watch-trailer/:type/:id" element={<WatchTrailerPage />} />

        {/* 404 Page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// Not Found Page
const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-netflix-red mb-4">404</h1>
        <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-gray-400 mb-6">
          Sorry, the page you're looking for doesn't exist.
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-netflix-red text-white font-semibold rounded-md hover:bg-red-700 transition-colors"
        >
          Go Home
        </a>
      </div>
    </div>
  );
};

export default App;
