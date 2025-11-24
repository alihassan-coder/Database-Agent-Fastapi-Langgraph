'use client';

import { useState, useEffect } from 'react';
import api from '../services/api';

export default function HumanApprovalDialog({ 
  isOpen, 
  onClose, 
  onApprove, 
  onDeny, 
  approvalMessage, 
  sqlQuery,
  approvalId,
  operationType,
  tableName
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null);

  useEffect(() => {
    if (isOpen && approvalId) {
      checkApprovalStatus();
    }
  }, [isOpen, approvalId]);

  const checkApprovalStatus = async () => {
    try {
      const status = await api.getApprovalStatus(approvalId);
      setApprovalStatus(status);
    } catch (error) {
      console.error('Error checking approval status:', error);
    }
  };

  const handleApprove = async () => {
    if (!approvalId) {
      console.error('No approvalId provided!');
      return;
    }
  
    setIsProcessing(true);
  
    try {
      // Ensure onApprove is awaited and errors are caught properly
      const result = await onApprove(approvalId);
  
      if (!result || result.error) {
        throw new Error(result?.error || 'Approval failed — invalid backend response');
      }
  
      console.log('✅ Operation approved successfully:', result);
      onClose();
    } catch (error) {
      console.error('❌ Error approving operation:', error.message || error);
      alert(`Failed to approve operation: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleDeny = async () => {
    if (!approvalId) {
      console.error('No approvalId provided!');
      return;
    }
  
    setIsProcessing(true);
  
    try {
      const result = await onDeny(approvalId);
  
      if (!result || result.error) {
        throw new Error(result?.error || 'Deny failed — invalid backend response');
      }
  
      console.log('🚫 Operation denied successfully:', result);
      onClose();
    } catch (error) {
      console.error('❌ Error denying operation:', error.message || error);
      alert(`Failed to deny operation: ${error.message || error}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black-100 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">
                ⚠️ Dangerous Operation Detected
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              disabled={isProcessing}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
              <p className="text-red-200 text-sm">
                This operation could modify or delete data in your database. Please review the SQL query below and confirm your decision.
              </p>
            </div>

            {sqlQuery && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">SQL Query:</h4>
                <pre className="text-green-400 text-sm overflow-x-auto">
                  <code>{sqlQuery}</code>
                </pre>
              </div>
            )}

            {approvalStatus && (
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">Approval Details:</h4>
                <div className="text-sm text-blue-200 space-y-1">
                  <p><strong>Operation Type:</strong> {operationType || 'Unknown'}</p>
                  {tableName && <p><strong>Table:</strong> {tableName}</p>}
                  <p><strong>Status:</strong> <span className="capitalize">{approvalStatus.status}</span></p>
                  {approvalStatus.approval_request && (
                    <p><strong>Created:</strong> {new Date(approvalStatus.approval_request.created_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}

            {approvalMessage && (
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="prose prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: approvalMessage.replace(/\n/g, '<br>') }} />
                </div>
              </div>
            )}

            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
              <p className="text-yellow-200 text-sm">
                <strong>Warning:</strong> This operation cannot be undone. Make sure you want to proceed before confirming.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-700">
            <button
              onClick={handleDeny}
              disabled={isProcessing}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Cancel'}
            </button>
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isProcessing ? 'Processing...' : 'Approve & Execute'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
