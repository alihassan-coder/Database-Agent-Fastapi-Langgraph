'use client';

import { useState, useEffect } from 'react';

export default function ResponsiveLayout({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Mobile Header */}
        <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-blue-400">Database Agent</h1>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                <div className="w-4 h-0.5 bg-current"></div>
                <div className="w-4 h-0.5 bg-current"></div>
                <div className="w-4 h-0.5 bg-current"></div>
              </div>
            </button>
          </div>
        </header>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
            <nav className="flex space-x-2">
              <button
                onClick={() => setShowMobileMenu(false)}
                className="flex-1 py-2 px-3 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                Chat
              </button>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="flex-1 py-2 px-3 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                Database
              </button>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="flex-1 py-2 px-3 text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
              >
                Logs
              </button>
            </nav>
          </div>
        )}

        {/* Mobile Content */}
        <div className="h-[calc(100vh-64px)] overflow-y-auto">
          {children}
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {children}
    </div>
  );
}
