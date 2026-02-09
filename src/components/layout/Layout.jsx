import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

// Layout Component
const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navbar */}
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      
      {/* Main Layout Area */}
      <div className="pt-16 md:pt-20 flex flex-col md:flex-row min-h-screen w-full max-w-full overflow-x-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        {/* Main Content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
