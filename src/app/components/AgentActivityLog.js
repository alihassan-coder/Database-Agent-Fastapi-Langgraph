'use client';

import { useState, useEffect, useRef } from 'react';

export default function AgentActivityLog({ logs }) {
  const [filter, setFilter] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const logsEndRef = useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });

  const getLogIcon = (type) => {
    switch (type) {
      case 'user_message':
        return (
          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        );
      case 'agent_response':
        return (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-sm"></div>
          </div>
        );
      case 'database_operation':
        return (
          <div className="w-4 h-4 bg-purple-500 rounded flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-sm"></div>
          </div>
        );
      case 'error':
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-0.5 bg-white"></div>
          </div>
        );
      case 'clear_chat':
        return (
          <div className="w-4 h-4 bg-yellow-500 rounded flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-sm"></div>
          </div>
        );
      default:
        return (
          <div className="w-4 h-4 bg-gray-500 rounded flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-sm"></div>
          </div>
        );
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'user_message':
        return 'text-blue-400';
      case 'agent_response':
        return 'text-green-400';
      case 'database_operation':
        return 'text-purple-400';
      case 'error':
        return 'text-red-400';
      case 'clear_chat':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const truncateContent = (content, maxLength = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <div className="h-full bg-gray-900 flex flex-col">
      {/* Log Header */}
      <div className="bg-gray-800 px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-semibold text-white">Agent Activity Log</h3>
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
            >
              <option value="all">All</option>
              <option value="user_message">User</option>
              <option value="agent_response">Agent</option>
              <option value="database_operation">Database</option>
              <option value="error">Errors</option>
            </select>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-gray-400 hover:text-white p-1"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          </div>
        </div>
      </div>

      {/* Log Content */}
      <div className={`flex-1 overflow-y-auto ${isExpanded ? '' : 'max-h-24 sm:max-h-32'}`}>
        {filteredLogs.length === 0 ? (
          <div className="p-3 sm:p-4 text-center text-gray-400">
            <div className="w-8 h-8 mx-auto mb-2 bg-gray-800 rounded flex items-center justify-center">
              <div className="w-4 h-4 bg-gray-600 rounded"></div>
            </div>
            <p className="text-xs sm:text-sm">No activity yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Start chatting to see agent activity
            </p>
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-2">
            {filteredLogs.map((log, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-lg p-2 sm:p-3 border border-gray-700"
              >
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0 mt-0.5">{getLogIcon(log.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${getLogColor(log.type)}`}>
                        {log.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-300 mb-2">
                      {truncateContent(log.content, 40)}
                    </div>
                    {log.status && (
                      <div className="flex items-center space-x-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          log.status === 'completed' ? 'bg-green-500' :
                          log.status === 'failed' ? 'bg-red-500' :
                          log.status === 'sent' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}></div>
                        <span className="text-xs text-gray-400 capitalize">
                          {log.status}
                        </span>
                        {log.operation_type && (
                          <span className="text-xs bg-gray-700 px-1.5 py-0.5 rounded">
                            {log.operation_type}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>

      {/* Log Stats */}
      <div className="bg-gray-800 border-t border-gray-700 px-3 sm:px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span>Total: {logs.length}</span>
            <span>Filtered: {filteredLogs.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
