'use client';

import { useState, useEffect, useRef } from 'react';
import ChatInterface from './components/ChatInterface';
import DatabaseView from './components/DatabaseView';
import AgentActivityLog from './components/AgentActivityLog';
import ResponsiveLayout from './components/ResponsiveLayout';
import api from './services/api';


export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [databaseInfo, setDatabaseInfo] = useState(null);
  const [agentLogs, setAgentLogs] = useState([]);
  const [lastHealthCheck, setLastHealthCheck] = useState(null);

  useEffect(() => {
    // Initial connection check only
    const checkConnection = async () => {
      try {
        const healthData = await api.checkHealth();
        const nowConnected = healthData.status === 'healthy';
        
        setIsConnected(nowConnected);
        setLastHealthCheck(new Date().toLocaleTimeString());
        
        // Fetch database info if connected
        if (nowConnected) {
          const dbData = await api.getDatabaseInfo();
          setDatabaseInfo(dbData);
        }
      } catch (error) {
        console.error('Failed to connect to backend:', error);
        setIsConnected(false);
      }
    };

    // Only check connection on initial load
    checkConnection();
    
    // Listen for manual database refresh
    const handleDatabaseRefresh = (event) => {
      setDatabaseInfo(event.detail);
    };
    window.addEventListener('database-refresh', handleDatabaseRefresh);

    return () => {
      window.removeEventListener('database-refresh', handleDatabaseRefresh);
    };
  }, []);

  const addAgentLog = (log) => {
    setAgentLogs(prev => [...prev, { ...log, timestamp: new Date().toISOString() }]);
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      // Check health first
      const healthData = await api.checkHealth();
      const nowConnected = healthData.status === 'healthy';
      
      setIsConnected(nowConnected);
      setLastHealthCheck(new Date().toLocaleTimeString());
      
      // If connected, also refresh database info
      if (nowConnected) {
        const dbData = await api.getDatabaseInfo();
        setDatabaseInfo(dbData);
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
      setIsConnected(false);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ResponsiveLayout>
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-500 tracking-tight drop-shadow-md hover:text-blue-600 transition-colors duration-300">
              Database Agent
            </h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs sm:text-sm text-gray-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              {lastHealthCheck && (
                <span className="text-xs text-gray-500 hidden sm:block">
                  Last check: {lastHealthCheck}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="px-3 py-1.5 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 disabled:cursor-not-allowed rounded-md transition-colors flex items-center space-x-2"
            >
              {refreshing ? (
                <>
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Refreshing...</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </>
              )}
            </button>
            <div className="text-xs sm:text-sm text-gray-400 hidden sm:block">
              Database Assistant
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] sm:h-[calc(100vh-72px)]">
        {/* Left Panel - Chat Interface */}
        <div className="flex-1 border-b lg:border-b-0 lg:border-r border-gray-700 min-h-[50vh] lg:min-h-full">
          <ChatInterface 
            onAgentAction={addAgentLog}
            isConnected={isConnected}
          />
        </div>

        {/* Right Panel - Database View */}
        <div className="flex-1 flex flex-col min-h-[50vh] lg:min-h-full">
          <DatabaseView 
            databaseInfo={databaseInfo}
            isConnected={isConnected}
          />
          
          {/* Agent Activity Log */}
          <div className="h-1/3 border-t border-gray-700">
            <AgentActivityLog logs={agentLogs} />
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
}

// this is the page.js file for the database-agent-frountend-nextjs project