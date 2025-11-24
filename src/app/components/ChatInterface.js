'use client';

import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import HumanApprovalDialog from './HumanApprovalDialog';

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm"; // for tables, lists, etc.
import rehypeHighlight from "rehype-highlight";


export default function ChatInterface({ onAgentAction, isConnected }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [canStop, setCanStop] = useState(false);
  const [approvalDialog, setApprovalDialog] = useState({ 
    isOpen: false, 
    message: '', 
    sqlQuery: '', 
    approvalId: null, 
    operationType: null, 
    tableName: null 
  });
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  function fixBrokenTables(markdown) {
    return markdown.replace(/(\|\s*\|[-]+.*\|)/g, (match) => {
      // remove the accidental extra pipe at start like "| |----|"
      return match.replace(/^\|\s*\|/, '|');
    });
  }
  console.log('currentSessionId', currentSessionId);
  console.log('canStop', canStop);
  console.log('currentThreadId', currentThreadId);
  console.log('messages', messages);
  console.log('input', input);
  console.log('isLoading', isLoading);
  console.log('isTyping', isTyping);

  function formatResponse(content) {
    // Add better formatting for database responses
    if (content.includes('```sql')) {
      return content; // Already formatted
    }
    
    // Format simple responses
    if (content.includes('Results:') || content.includes('Success:')) {
      return content;
    }
    
    return content;
  }


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Create a new thread when component mounts
  useEffect(() => {
    if (isConnected && !currentThreadId) {
      createNewThread();
    }
  }, [isConnected]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !isConnected || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);

    onAgentAction({
      type: 'user_message',
      content: userMessage.content,
      status: 'sent'
    });

    window.dispatchEvent(new CustomEvent('agent-activity'));

    try {
      abortControllerRef.current = new AbortController();

      const agentMessage = {
        id: Date.now() + 1,
        type: 'agent',
        content: '',
        timestamp: new Date().toISOString(),
        isStreaming: true
      };

      setMessages(prev => [...prev, agentMessage]);

      await api.streamChatMessage(
        userMessage.content,
        currentThreadId,
        (data) => {
          console.log('Received streaming data:', data);
          
          // Handle session start
          if (data.chunk_type === 'session_start' && data.session_id) {
            console.log('Session started:', data.session_id);
            setCurrentSessionId(data.session_id);
            setCanStop(true);
            return;
          }

          // Update session ID when received
          if (data.session_id && data.session_id !== currentSessionId) {
            console.log('Session ID updated:', data.session_id);
            setCurrentSessionId(data.session_id);
            setCanStop(true);
          }

          // Handle human approval requests
          if (data.chunk_type === 'human_approval') {
            console.log('Human approval required:', data);
            setIsTyping(false);
            setCanStop(false);
            
            // Extract SQL query from the approval message
            const sqlMatch = data.chunk.match(/```sql\n([\s\S]*?)\n```/);
            const sqlQuery = sqlMatch ? sqlMatch[1] : '';
            
            // Extract operation type and table name from SQL query
            const operationType = sqlQuery.toUpperCase().split(' ')[0] || 'UNKNOWN';
            const tableNameMatch = sqlQuery.match(/(?:FROM|TABLE)\s+(\w+)/i);
            const tableName = tableNameMatch ? tableNameMatch[1] : null;
            
            setMessages(prev =>
              prev.map(msg =>
                msg.id === agentMessage.id
                  ? { ...msg, content: data.chunk, isStreaming: false, requiresApproval: true }
                  : msg
              )
            );
            
            // Extract approval ID from the message if present (capture UUIDs with hyphens)
            // Example in message: **Approval ID:** 123e4567-e89b-12d3-a456-426614174000
            const approvalIdMatch = data.chunk.match(/\*\*Approval ID:\*\*\s*([0-9a-fA-F-\-]+)/);
            const approvalId = approvalIdMatch ? approvalIdMatch[1] : null;
            
            // Show approval dialog
            setApprovalDialog({
              isOpen: true,
              message: data.chunk,
              sqlQuery: sqlQuery,
              approvalId: approvalId,
              operationType: operationType,
              tableName: tableName
            });
            
            onAgentAction({
              type: 'human_approval_required',
              content: data.chunk,
              status: 'pending_approval',
              requires_approval: true,
              thread_id: data.thread_id,
              approval_id: approvalId
            });
            return;
          }

          // Handle stopped response
          if (data.chunk_type === 'stopped') {
            console.log('Generation stopped by backend');
            setIsTyping(false);
            setCanStop(false);
            setMessages(prev =>
              prev.map(msg =>
                msg.id === agentMessage.id
                  ? { ...msg, content: msg.content + "\n\n[Generation stopped by user]", isStreaming: false }
                  : msg
              )
            );
            return;
          }

          // streaming chunks: append text chunks
          if (data.chunk_type === 'text') {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === agentMessage.id
                  ? { ...msg, content: msg.content + data.chunk }
                  : msg
              )
            );
          }

          if (data.is_final) {
            setIsTyping(false);
            setCanStop(false);
            setMessages(prev =>
              prev.map(msg =>
                msg.id === agentMessage.id
                  ? { ...msg, isStreaming: false }
                  : msg
              )
            );

            // Update current thread ID if provided
            if (data.thread_id && data.thread_id !== currentThreadId) {
              setCurrentThreadId(data.thread_id);
            }

            onAgentAction({
              type: 'agent_response',
              content: data.chunk,
              status: 'completed',
              operation_type: data.operation_type || 'chat',
              thread_id: data.thread_id
            });

            window.dispatchEvent(new CustomEvent('agent-activity'));
          }
        },
        { signal: abortControllerRef.current.signal }
      );

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Error sending message:', error);
        const errorMessage = {
          id: Date.now() + 1,
          type: 'error',
          content: `Error: ${error.message}`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);

        onAgentAction({
          type: 'error',
          content: error.message,
          status: 'failed'
        });
      }
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setCanStop(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = async () => {
    console.log('Stop generation called:', { currentSessionId, canStop });
    if (currentSessionId && canStop) {
      try {
        console.log('Sending stop request for session:', currentSessionId);
        await api.stopGeneration(currentSessionId);
        setCanStop(false);
        setIsTyping(false);
        setIsLoading(false);
        
        console.log('Stop request successful');
        onAgentAction({
          type: 'stop_generation',
          content: 'Generation stopped',
          status: 'completed'
        });
      } catch (error) {
        console.error('Failed to stop generation:', error);
        onAgentAction({
          type: 'error',
          content: `Failed to stop generation: ${error.message}`,
          status: 'failed'
        });
      }
    } else {
      console.log('Cannot stop - missing session ID or not allowed to stop');
    }
  };

  const clearChat = async () => {
    setMessages([]);
    setCurrentThreadId(null);
    setCurrentSessionId(null);
    setCanStop(false);
    
    // Clear the current thread's history on the backend
    if (currentThreadId) {
      try {
        await api.clearConversationHistory(currentThreadId);
      } catch (error) {
        console.error('Failed to clear thread history:', error);
      }
    }
    
    onAgentAction({
      type: 'clear_chat',
      content: 'Chat cleared',
      status: 'completed'
    });
  };

  const createNewThread = async () => {
    try {
      const response = await api.createNewThread();
      setCurrentThreadId(response.thread_id);
      setCurrentSessionId(null);
      setCanStop(false);
      setMessages([]);
      
      onAgentAction({
        type: 'new_thread',
        content: `New thread created: ${response.thread_id}`,
        status: 'completed',
        thread_id: response.thread_id
      });
    } catch (error) {
      console.error('Failed to create new thread:', error);
      onAgentAction({
        type: 'error',
        content: `Failed to create new thread: ${error.message}`,
        status: 'failed'
      });
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleApprovalApprove = async (approvalId) => {
    // Use the passed approvalId parameter if available, otherwise fall back to state
    const idToUse = approvalId || approvalDialog.approvalId;
    
    try {
      if (!idToUse) {
        console.error('No approval ID found');
        throw new Error('No approval ID found');
      }

      // Approve the operation via API BEFORE closing the dialog
      console.log('Approving operation:', idToUse);
      const approvalResult = await api.approveOperation(idToUse);
      console.log('Approval result:', approvalResult);
      
      // Close the dialog after successful approval
      setApprovalDialog({ 
        isOpen: false, 
        message: '', 
        sqlQuery: '', 
        approvalId: null, 
        operationType: null, 
        tableName: null 
      });
      
      // Add a user message showing approval
      const userApprovalMsg = {
        id: Date.now(),
        type: 'user',
        content: '✅ Approved dangerous operation',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userApprovalMsg]);
      
      // Trigger the agent to execute the approved operation
      // Send a special message to continue the workflow
      setIsLoading(true);
      const response = await api.sendChatMessage('__APPROVED__', currentThreadId);
      
      // Add the response to messages
      const approvalMessage = {
        id: Date.now() + 1,
        type: 'agent',
        content: response.response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, approvalMessage]);
      setIsLoading(false);
      
      onAgentAction({
        type: 'approval_granted',
        content: 'User approved the dangerous operation',
        status: 'completed'
      });
      
      // Return success for the dialog
      return { success: true };
    } catch (error) {
      console.error('Error approving operation:', error);
      setIsLoading(false);
      const errorMessage = {
        id: Date.now(),
        type: 'error',
        content: `Error approving operation: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Return error for the dialog
      return { error: error.message };
    }
  };

  const handleApprovalDeny = async (approvalId) => {
    // Use the passed approvalId parameter if available, otherwise fall back to state
    const idToUse = approvalId || approvalDialog.approvalId;
    
    try {
      if (!idToUse) {
        console.error('No approval ID found');
        throw new Error('No approval ID found');
      }

      // Deny the operation via API BEFORE closing the dialog
      console.log('Denying operation:', idToUse);
      const denialResult = await api.denyOperation(idToUse);
      console.log('Denial result:', denialResult);
      
      // Close the dialog after successful denial
      setApprovalDialog({ 
        isOpen: false, 
        message: '', 
        sqlQuery: '', 
        approvalId: null, 
        operationType: null, 
        tableName: null 
      });
      
      // Add a user message showing denial
      const userDenialMsg = {
        id: Date.now(),
        type: 'user',
        content: '❌ Denied dangerous operation',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userDenialMsg]);
      
      // Trigger the agent to acknowledge the denial
      setIsLoading(true);
      const response = await api.sendChatMessage('__DENIED__', currentThreadId);
      
      // Add the response to messages
      const denialMessage = {
        id: Date.now() + 1,
        type: 'agent',
        content: response.response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, denialMessage]);
      setIsLoading(false);
      
      onAgentAction({
        type: 'approval_denied',
        content: 'User denied the dangerous operation',
        status: 'completed'
      });
    } catch (error) {
      console.error('Error denying operation:', error);
      setIsLoading(false);
      const errorMessage = {
        id: Date.now(),
        type: 'error',
        content: `Error denying operation: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleApprovalClose = () => {
    setApprovalDialog({ 
      isOpen: false, 
      message: '', 
      sqlQuery: '', 
      approvalId: null, 
      operationType: null, 
      tableName: null 
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-base sm:text-lg font-semibold text-white">Chat with AI Agent</h2>
            {currentThreadId && (
              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                Thread: {currentThreadId.substring(0, 8)}...
              </span>
            )}
            {currentSessionId && (
              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                Session: {currentSessionId.substring(0, 8)}...
              </span>
            )}
            {canStop && (
              <span className="text-xs text-red-400 bg-red-900 px-2 py-1 rounded animate-pulse">
                Can Stop
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={createNewThread}
              className="px-3 py-1 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              New Thread
            </button>
            <button
              onClick={clearChat}
              className="px-5 py-1 text-xs sm:text-sm bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
            >
              Clear
            </button>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-6 sm:py-8 px-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-sm"></div>
              </div>
            </div>
            <h3 className="text-base sm:text-lg font-semibold mb-2">Welcome to Database Agent</h3>
            <p className="text-sm text-gray-300 mb-4">Ask me anything about your database.</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} px-2`}>
            <div className={`max-w-[85%] sm:max-w-[80%] rounded-lg px-3 sm:px-4 py-2 sm:py-3 ${message.type === 'user'
              ? 'bg-blue-600 text-white'
              : message.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-100'
              }`}>

                
              <div className="text-sm sm:text-base leading-relaxed message-content">
                {message.type === 'agent' ? (
                  <div className="markdown-wrapper prose max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {fixBrokenTables(formatResponse(message.content))}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap break-words">{message.content}</div>
                )}
              </div>


              <div className="text-xs opacity-70 mt-2 flex items-center justify-between">
                <span>{formatTime(message.timestamp)}</span>
                {message.isStreaming && <span className="text-blue-400 animate-pulse">●</span>}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start px-2">
            <div className="bg-gray-700 rounded-lg px-3 sm:px-4 py-2 sm:py-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-700 p-4 sm:p-6">
        <form onSubmit={sendMessage} className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              canStop 
                ? "Generation in progress... Click Stop to interrupt" 
                : isConnected 
                  ? "Ask me about your database..." 
                  : "Connecting to backend..."
            }
            disabled={!isConnected || isLoading || canStop}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />

          <button
            type={canStop ? "button" : "submit"}
            onClick={canStop ? stopGeneration : undefined}
            disabled={!isConnected || (!canStop && !input.trim())}
            className={`relative px-8 py-3 text-white rounded-lg transition-all duration-200 group shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 ${
              canStop 
                ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 animate-pulse" 
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {canStop ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Stop</span>
                </>
              ) : isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="font-medium">Sending...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  <span className="font-medium">Send</span>
                </>
              )}
            </div>
          </button>
        </form>
      </div>

      {/* Human Approval Dialog */}
      <HumanApprovalDialog
        isOpen={approvalDialog.isOpen}
        onClose={handleApprovalClose}
        onApprove={handleApprovalApprove}
        onDeny={handleApprovalDeny}
        approvalMessage={approvalDialog.message}
        sqlQuery={approvalDialog.sqlQuery}
        approvalId={approvalDialog.approvalId}
        operationType={approvalDialog.operationType}
        tableName={approvalDialog.tableName}
      />
    </div>
  );
}
