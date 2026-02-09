import {
  FiClock,
  FiCompass,
  FiHeart,
  FiHome,
  FiStar,
  FiTrendingUp,
  FiTv,
} from "react-icons/fi";
import { NavLink } from "react-router-dom";

// Sidebar Component
export const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { icon: FiHome, label: "Home", to: "/" },
    { icon: FiCompass, label: "Browse", to: "/browse" },
    { icon: FiTrendingUp, label: "Trending", to: "/browse?sort=trending" },
    { icon: FiTv, label: "Movies", to: "/browse?type=movie" },
    { icon: FiTv, label: "TV Shows", to: "/browse?type=tv" },
    { icon: FiTv, label: "Anime", to: "/anime" },
    {
      icon: FiTv,
      label: "Anime Server-2",
      to: "https://MUSTAFA-A-KHAN.github.io/AnimeFlix/",
    },
    { icon: FiHeart, label: "Watchlist", to: "/watchlist" },
  ];

  const categories = [
    { icon: FiClock, label: "Coming Soon", to: "/browse?sort=upcoming" },
    { icon: FiStar, label: "Top Rated", to: "/browse?sort=top_rated" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-gray-900 z-50
          transform transition-transform duration-300 ease-in-out
          md:static md:transform-none md:transition-none md:h-auto md:min-h-full md:top-0 md:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo (Mobile) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 md:hidden">
          <span className="text-2xl font-bold text-netflix-red">
            StreamFlix
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <FiHome size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 sm:p-4 space-y-4 sm:space-y-6">
          {/* Main Menu */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3 px-2 sm:px-3">
              Menu
            </h3>
            <ul className="space-y-1">
              {menuItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-md
                      transition-colors duration-200 text-sm sm:text-base
                      ${
                        isActive
                          ? "bg-gray-800 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                      }
                    `}
                  >
                    <item.icon size={18} className="sm:w-5 sm:h-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3 px-2 sm:px-3">
              Categories
            </h3>
            <ul className="space-y-1">
              {categories.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-md
                      transition-colors duration-200 text-sm sm:text-base
                      ${
                        isActive
                          ? "bg-gray-800 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                      }
                    `}
                  >
                    <item.icon size={18} className="sm:w-5 sm:h-5" />
                    <span className="font-medium">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Genres */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3 px-2 sm:px-3">
              Popular Genres
            </h3>
            <ul className="space-y-1">
              {[
                { name: "Action", path: "/browse?genre=28" },
                { name: "Comedy", path: "/browse?genre=35" },
                { name: "Drama", path: "/browse?genre=18" },
                { name: "Thriller", path: "/browse?genre=53" },
                { name: "Sci-Fi", path: "/browse?genre=878" },
              ].map((genre) => (
                <li key={genre.path}>
                  <NavLink
                    to={genre.path}
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2.5 rounded-md
                      transition-colors duration-200 text-sm sm:text-base
                      ${
                        isActive
                          ? "bg-gray-800 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                      }
                    `}
                  >
                    <FiTv size={18} className="sm:w-5 sm:h-5" />
                    <span className="font-medium">{genre.name}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white cursor-pointer transition-colors">
            <FiClock size={20} />
            <span>Recently Watched</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
