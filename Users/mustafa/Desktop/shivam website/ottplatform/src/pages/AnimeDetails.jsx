
import { useCallback, useEffect, useState } from 'react';
import {
    FiArrowLeft,
    FiCalendar,
    FiClock,
    FiExternalLink,
    FiFilm,
    FiHeart,
    FiInfo,
    FiList,
    FiLoader,
    FiPlay
} from 'react-icons/fi';
import { Link, useParams, useSearchParams } from 'react-router-dom';

// API Base
const API_BASE = 'http://localhost:3000/anime/animekai';

// Anime Details Page
const AnimeDetailsPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const titleParam = searchParams.get('title');
  
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [servers, setServers] = useState([]);
  const [loadingServers, setLoadingServers] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [activeTab, setActiveTab] = useState('servers'); // 'servers' | 'episodes'
  const [videoUrl, setVideoUrl] = useState(null);

  // Fetch anime details
  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching details for anime ID:', id);
      const response = await fetch(`${API_BASE}/info?id=${encodeURIComponent(id)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get anime details (HTTP ${response.status})`);
      }
      
      const data = await response.json();
      console.log('Anime details received:', data);
      setDetails(data);
      
      // Set episodes from data
      if (data.episodes && Array.isArray(data.episodes) && data.episodes.length > 0) {
        setEpisodes(data.episodes);
      } else if (data.totalEpisodes) {
        // Generate episode list from totalEpisodes
        const totalEps = typeof data.totalEpisodes === 'number' ? data.totalEpisodes : 0;
        const eps = [];
        for (let i = 1; i <= Math.min(totalEps, 500); i++) {
          eps.push({ number: i, id: `${id}-episode-${i}` });
        }
        setEpisodes(eps);
      } else {
        setEpisodes([]);
      }
    } catch (err) {
      console.error('Details error:', err);
      setError(err.message || 'Failed to load anime details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Fetch servers and video sources for selected episode
  const fetchServers = useCallback(async () => {
    setLoadingServers(true);
    setServers([]);
    setVideoUrl(null);
    
    try {
      console.log(`Fetching servers for episode ${selectedEpisode} of anime:`, id);
      
      // Generate token for server request
      const token = generateToken();
      const serverUrl = `${API_BASE}/servers/${encodeURIComponent(id)}$ep=${selectedEpisode}$token=${token}`;
      console.log('Server URL:', serverUrl);
      
      const response = await fetch(serverUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to get servers (HTTP ${response.status})`);
      }
      
      const data = await response.json();
      console.log('Server response:', data);
      
      // Extract sources from response - handle the API response format
      if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
        setServers(data.sources);
        if (data.sources[0]?.url) {
          setVideoUrl(data.sources[0].url);
        }
      } else if (data.servers && Array.isArray(data.servers) && data.servers.length > 0) {
        setServers(data.servers);
        if (data.servers[0]?.url) {
          setVideoUrl(data.servers[0].url);
        }
      } else if (data.url) {
        setServers([{ name: 'Video', url: data.url, quality: 'HD' }]);
        setVideoUrl(data.url);
      } else {
        setServers([]);
      }
    } catch (err) {
      console.error('Servers error:', err);
      // For now, show a direct link to watch on source
      if (details?.url) {
        setServers([{ name: 'Watch on Anikai', url: details.url, quality: 'HD' }]);
      } else {
        setServers([]);
      }
    } finally {
      setLoadingServers(false);
    }
  }, [id, selectedEpisode, details]);

  useEffect(() => {
    if (details) {
      fetchServers();
    }
  }, [selectedEpisode, details, fetchServers]);

  // Generate a simple token for server requests
  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 16; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  // Handle episode change
  const handleEpisodeChange = (episodeNumber) => {
    setSelectedEpisode(episodeNumber);
    setActiveTab('servers');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="animate-spin text-purple-500 text-4xl mx-auto mb-4" />
          <p className="text-gray-400">Loading anime details...</p>
          <p className="text-gray-500 text-sm mt-2">Fetching: {id}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
            <p className="text-red-500 text-lg mb-2">Failed to Load Anime</p>
            <p className="text-gray-400 text-sm">{error}</p>
          </div>
          <Link
            to="/anime"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FiArrowLeft size={20} />
            Back to Anime
          </Link>
        </div>
      </div>
    );
  }

  if (!details) {
    return null;
  }

  const anime = details;
  const displayTitle = anime.title || titleParam || 'Unknown Title';
  const posterSrc = anime.image || anime.poster || 'https://via.placeholder.com/300x450?text=No+Image';
  const backdropSrc = anime.cover || anime.backdrop || anime.image;

  // Parse genres from the string format
  const parseGenres = (genres) => {
    if (!genres || !Array.isArray(genres)) return [];
    return genres.flatMap(g => {
      if (typeof g === 'string') {
        // Handle the format: "Country:  Japan   Genres:  Adventure, Comedy, Fantasy, Shounen, Action   Premiered: Winter 2000  Date aired: Mar 04, 2000  Episodes: 1 Duration: 50 min"
        const genresMatch = g.match(/Genres:\s*([^Premiere]+)/i);
        if (genresMatch) {
          return genresMatch[1].split(',').map(x => x.trim()).filter(Boolean);
        }
        // If no "Genres:" prefix, try to extract from the string
        const parts = g.split(/Country:|Premier:|Date aired:|Episodes:|Duration:/);
        if (parts.length > 1) {
          return parts[1].split(',').map(x => x.trim()).filter(Boolean);
        }
        return g;
      }
      return g;
    }).filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
  };

  const parsedGenres = parseGenres(anime.genres);
  const seasonInfo = anime.season || anime.releaseDate;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section with Backdrop */}
      <div className="relative">
        {/* Backdrop Image */}
        {backdropSrc && (
          <div className="absolute inset-0 h-[50vh] md:h-[60vh] overflow-hidden">
            <img
              src={backdropSrc}
              alt={displayTitle}
              className="w-full h-full object-cover opacity-30"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/60 to-gray-900" />
          </div>
        )}
        
        {/* Navigation */}
        <div className="relative z-10 container mx-auto px-4 py-6">
          <Link
            to="/anime"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-gray-800/50 hover:bg-gray-800 px-4 py-2 rounded-lg"
          >
            <FiArrowLeft size={20} />
            Back to Anime
          </Link>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 pb-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            {/* Poster */}
            <div className="flex-shrink-0 mx-auto md:mx-0 w-full max-w-[280px] md:max-w-[320px]">
              <div className="relative rounded-xl overflow-hidden shadow-2xl group">
                <img
                  src={posterSrc}
                  alt={displayTitle}
                  className="w-full aspect-[2/3] object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x450?text=No+Image';
                  }}
                />
                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    to="#video-player"
                    className="transform hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.preventDefault();
                      if (episodes.length > 0) {
                        handleEpisodeChange(1);
                        document.getElementById('video-player')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <FiPlay className="text-white text-2xl md:text-3xl ml-1" />
                    </div>
                  </Link>
                </div>
              </div>
              
              {/* External Links */}
              {anime.url && (
                <a
                  href={anime.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <FiExternalLink size={18} />
                  View on Anikai
                </a>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1">
              {/* Title */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
                {displayTitle}
              </h1>
              
              {/* Japanese Title */}
              {anime.japaneseTitle && (
                <p className="text-gray-400 text-lg mb-4">
                  {anime.japaneseTitle}
                </p>
              )}
              
              {/* Type, Status & Season */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {anime.type && (
                  <span className="px-3 py-1.5 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg text-sm font-medium">
                    {anime.type}
                  </span>
                )}
                
                {anime.status && (
                  <span className="px-3 py-1.5 bg-green-600/20 border border-green-500/30 text-green-400 rounded-lg text-sm">
                    {anime.status}
                  </span>
                )}
                
                {/* Sub/Dub Info */}
                {(anime.hasSub || anime.hasDub) && (
                  <div className="flex gap-2">
                    {anime.hasSub && (
                      <span className="px-3 py-1.5 bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg text-sm">
                        SUB
                      </span>
                    )}
                    {anime.hasDub && (
                      <span className="px-3 py-1.5 bg-orange-600/20 border border-orange-500/30 text-orange-400 rounded-lg text-sm">
                        DUB
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Meta Information */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {seasonInfo && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <FiCalendar className="text-purple-400" />
                    <span className="text-sm">{seasonInfo}</span>
                  </div>
                )}
                {anime.totalEpisodes && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <FiFilm className="text-purple-400" />
                    <span className="text-sm">{anime.totalEpisodes} Episodes</span>
                  </div>
                )}
                {anime.duration && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <FiClock className="text-purple-400" />
                    <span className="text-sm">{anime.duration}</span>
                  </div>
                )}
              </div>
              
              {/* Genres */}
              {parsedGenres.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                    <FiList /> Genres
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {parsedGenres.slice(0, 6).map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-800 text-purple-400 rounded-full text-sm border border-gray-700"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Description */}
              {anime.description && (
                <div className="mb-6">
                  <h3 className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                    <FiInfo /> Synopsis
                  </h3>
                  <p className="text-gray-300 leading-relaxed">
                    {expandedDescription ? anime.description : anime.description.slice(0, 400)}
                    {anime.description.length > 400 && (
                      <button
                        onClick={() => setExpandedDescription(!expandedDescription)}
                        className="ml-2 text-purple-400 hover:text-purple-300"
                      >
                        {expandedDescription ? 'Show Less' : '...Read More'}
                      </button>
                    )}
                  </p>
                </div>
              )}
              
              {/* Relations (Related Anime) */}
              {anime.relations && anime.relations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-gray-400 text-sm mb-3 flex items-center gap-2">
                    <FiFilm /> Relations
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {anime.relations.slice(0, 4).map((rel, index) => (
                      <Link
                        key={index}
                        to={`/anime/${encodeURIComponent(rel.id)}?title=${encodeURIComponent(rel.title)}`}
                        className="flex items-center gap-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg p-2 pr-3 transition-colors"
                      >
                        <img
                          src={rel.image || rel.poster}
                          alt={rel.title}
                          className="w-8 h-12 object-cover rounded"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <div>
                          <p className="text-white text-sm truncate max-w-[120px]">{rel.title}</p>
                          <p className="text-gray-500 text-xs">{rel.type} {rel.relationType && `• ${rel.relationType}`}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Video Player Section */}
      <div id="video-player" className="container mx-auto px-4 py-8 border-t border-gray-800">
        <div className="bg-gray-800/50 rounded-xl p-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <FiPlay className="text-purple-500" />
              {anime.totalEpisodes === 1 ? 'Watch Movie' : `Watch Episode ${selectedEpisode}`}
            </h2>
            
            {/* Episode Navigation */}
            {episodes.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEpisodeChange(Math.max(1, selectedEpisode - 1))}
                  disabled={selectedEpisode <= 1}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium">
                  Ep {selectedEpisode} / {episodes.length}
                </span>
                <button
                  onClick={() => handleEpisodeChange(Math.min(episodes.length, selectedEpisode + 1))}
                  disabled={selectedEpisode >= episodes.length}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('servers')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === 'servers'
                  ? 'text-purple-400 border-purple-500'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              Video Sources
            </button>
            {episodes.length > 1 && (
              <button
                onClick={() => setActiveTab('episodes')}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === 'episodes'
                    ? 'text-purple-400 border-purple-500'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                Episode List
              </button>
            )}
          </div>
          
          {/* Tab Content */}
          {activeTab === 'servers' ? (
            /* Servers/Sources Tab */
            <div>
              {loadingServers ? (
                <div className="flex items-center justify-center py-12">
                  <FiLoader className="animate-spin text-purple-500 text-3xl" />
                </div>
              ) : servers.length > 0 ? (
                <div className="grid gap-3">
                  {servers.map((server, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-800 rounded-xl hover:bg-gray-750 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
                          <FiPlay className="text-purple-400" />
                        </div>
                        <div>
                          <span className="text-white font-medium block">
                            {server.name || server.quality || `Server ${index + 1}`}
                          </span>
                          {server.quality && server.quality !== server.name && (
                            <span className="text-gray-500 text-xs">{server.quality}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {server.url && (
                          <>
                            <a
                              href={server.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                            >
                              <FiPlay size={16} />
                              Watch
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-800/30 rounded-xl">
                  <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FiFilm className="text-gray-500 text-2xl" />
                  </div>
                  <p className="text-gray-400 mb-2">No streaming sources available</p>
                  <p className="text-gray-500 text-sm mb-4">
                    Try selecting a different episode
                  </p>
                  {anime.url && (
                    <a
                      href={anime.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      <FiExternalLink size={18} />
                      Watch on Anikai
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Episodes Tab */
            <div>
              {episodes.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  {episodes.map((ep) => (
                    <button
                      key={ep.number || ep.id}
                      onClick={() => handleEpisodeChange(ep.number)}
                      className={`py-3 px-2 rounded-lg text-sm font-medium transition-all ${
                        selectedEpisode === ep.number
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      {ep.number}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">No episode information available</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Recommendations */}
      {anime.recommendations && anime.recommendations.length > 0 && (
        <div className="container mx-auto px-4 py-8 border-t border-gray-800">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <FiHeart className="text-red-500" />
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {anime.recommendations.slice(0, 12).map((rec, index) => (
              <Link
                key={index}
                to={`/anime/${encodeURIComponent(rec.id)}?title=${encodeURIComponent(rec.title)}`}
                className="group bg-gray-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all"
              >
                <div className="aspect-[2/3] overflow-hidden">
                  <img
                    src={rec.image || rec.poster || 'https://via.placeholder.com/200x300?text=No+Image'}
                    alt={rec.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/200x300?text=No+Image';
                    }}
                  />
                </div>
                <div className="p-3">
                  <h3 className="text-white text-sm truncate group-hover:text-purple-400 transition-colors">
                    {rec.title}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                    <FiFilm size={12} />
                    {rec.type} • {rec.episodes || '?'} eps
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimeDetailsPage;

