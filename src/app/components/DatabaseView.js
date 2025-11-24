'use client';

import { useState, useEffect } from 'react';
import api from '../services/api';

export default function DatabaseView({ databaseInfo, isConnected }) {
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (databaseInfo && databaseInfo.table_names && databaseInfo.table_names.length > 0) {
      setSelectedTable(databaseInfo.table_names[0]);
    }
  }, [databaseInfo]);

  useEffect(() => {
    if (selectedTable && isConnected) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable, isConnected]);

  const fetchTableData = async (tableName) => {
    setLoading(true);
    try {
      console.log(`Fetching data for table: ${tableName}`);
      const data = await api.getTableData(tableName, 10);
      console.log('API response:', data);
      
      // Handle the improved response format
      if (data.success && data.data && Array.isArray(data.data)) {
        console.log('Setting table data:', data.data);
        setTableData(data.data);
      } else if (data.error) {
        console.log('API returned error:', data.error);
        setTableData([]);
      } else {
        console.log('No valid data array found in response');
        setTableData([]);
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshDatabase = async () => {
    if (isConnected && !refreshing) {
      setRefreshing(true);
      try {
        const data = await api.getDatabaseInfo();
        // Emit custom event to update database info in parent
        window.dispatchEvent(new CustomEvent('database-refresh', { detail: data }));
      } catch (error) {
        console.error('Error refreshing database:', error);
      } finally {
        setRefreshing(false);
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-lg font-semibold mb-2">Database Disconnected</h3>
          <p className="text-sm">Please check your backend connection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-900 flex flex-col min-h-0">
      {/* Database Header */}
      <div className="bg-gray-800 px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white truncate">Database View</h2>
          <button
            onClick={refreshDatabase}
            disabled={refreshing}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md transition-colors flex items-center space-x-1 flex-shrink-0"
          >
            {refreshing ? (
              <>
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Refreshing...</span>
              </>
            ) : (
              <span>Refresh</span>
            )}
          </button>
        </div>
      </div>

      {/* Database Info */}
      <div className="p-2 sm:p-4 md:p-6 border-b border-gray-700 flex-shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
          <div className="bg-gray-800 rounded-lg p-2 sm:p-3 md:p-4">
            <div className="text-gray-400 mb-1 text-xs sm:text-sm">Total Tables</div>
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-400">
              {databaseInfo?.total_tables || 0}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-2 sm:p-3 md:p-4">
            <div className="text-gray-400 mb-1 text-xs sm:text-sm">Status</div>
            <div className="text-sm sm:text-base md:text-lg font-semibold text-green-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-2 sm:p-4 md:p-6">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-300 mb-2 sm:mb-3 md:mb-4">Tables</h3>
          <div className="space-y-1 sm:space-y-2">
            {databaseInfo?.table_names?.map((tableName) => (
              <div
                key={tableName}
                onClick={() => setSelectedTable(tableName)}
                className={`p-2 sm:p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedTable === tableName
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between min-w-0">
                  <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                    <span className="font-medium text-xs sm:text-sm md:text-base truncate">{tableName}</span>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0 ml-1 sm:ml-2">
                    {databaseInfo?.tables?.[tableName]?.columns?.length || 0} cols
                  </div>
                </div>
              </div>
            )) || (
              <div className="text-center text-gray-400 py-4 sm:py-6 md:py-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-gray-800 rounded-full flex items-center justify-center">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-600 rounded"></div>
                </div>
                <p className="text-xs sm:text-sm">No tables found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Details */}
      {selectedTable && (
        <div className="border-t border-gray-700 bg-gray-800 flex-shrink-0">
          <div className="p-2 sm:p-3 md:p-4">
            <h4 className="text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-2 md:mb-3">
              {selectedTable} Structure
            </h4>
            <div className="space-y-1 max-h-20 sm:max-h-24 md:max-h-32 overflow-y-auto">
              {databaseInfo?.tables?.[selectedTable]?.columns?.map((column, index) => (
                <div key={index} className="flex items-center justify-between text-xs bg-gray-700 rounded px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2">
                  <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-400 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-300 truncate text-xs sm:text-sm">{column.name}</span>
                  </div>
                  <div className="text-gray-400 text-xs truncate ml-1 sm:ml-2 flex-shrink-0">
                    {column.type}
                    {column.nullable ? '' : ' NOT NULL'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table Data Preview */}
      {selectedTable && (
        <div className="border-t border-gray-700 bg-gray-800 flex-shrink-0">
          <div className="p-2 sm:p-3 md:p-4">
            <h4 className="text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-2 md:mb-3">
              {selectedTable} Data Preview
            </h4>
            {loading ? (
              <div className="text-center text-gray-400 py-2">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <span className="text-xs">Loading...</span>
              </div>
            ) : tableData && tableData.length > 0 ? (
              <div className="max-h-32 overflow-y-auto">
                <div className="text-xs text-gray-400 mb-2">
                  Showing {tableData.length} rows
                </div>
                <div className="space-y-1">
                  {tableData.slice(0, 5).map((row, index) => (
                    <div key={index} className="bg-gray-700 rounded px-2 py-1 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">#{index + 1}</span>
                        <div className="flex-1 truncate">
                          {Object.entries(row).slice(0, 3).map(([key, value]) => (
                            <span key={key} className="text-gray-300">
                              {key}: {String(value).substring(0, 20)}
                              {String(value).length > 20 ? '...' : ''}
                            </span>
                          )).join(' | ')}
                        </div>
                      </div>
                    </div>
                  ))}
                  {tableData.length > 5 && (
                    <div className="text-xs text-gray-400 text-center py-1">
                      ... and {tableData.length - 5} more rows
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-2">
                <div className="text-xs">No data available</div>
              </div>
            )}
          </div>
        </div>
      )}

      

    </div>
  );
}
