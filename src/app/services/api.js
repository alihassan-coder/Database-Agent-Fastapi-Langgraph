const API_BASE_URL = 'http://localhost:8000';

class DatabaseAgentAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Health check
  async checkHealth() {
    return this.request('/health');
  }

  // Get database information
  async getDatabaseInfo() {
    return this.request('/database-info');
  }

  // Send chat message
  async sendChatMessage(query, threadId = null) {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({
        query,
        thread_id: threadId,
      }),
    });
  }

  // Stream chat message
  async streamChatMessage(query, threadId = null, onChunk) {
    const url = `${this.baseURL}/chat/stream`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          thread_id: threadId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (onChunk) {
                onChunk(data);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming request failed:', error);
      throw error;
    }
  }

  // Get conversation history
  async getConversationHistory(threadId = null) {
    const endpoint = threadId ? `/conversation-history?thread_id=${threadId}` : '/conversation-history';
    return this.request(endpoint);
  }

  // Clear conversation history
  async clearConversationHistory(threadId = null) {
    const endpoint = threadId ? `/conversation-history?thread_id=${threadId}` : '/conversation-history';
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Thread management methods
  async createNewThread() {
    return this.request('/threads/new', {
      method: 'POST',
    });
  }

  async listThreads() {
    return this.request('/threads');
  }

  async getThreadInfo(threadId) {
    return this.request(`/threads/${threadId}`);
  }

  async deleteThread(threadId) {
    return this.request(`/threads/${threadId}`, {
      method: 'DELETE',
    });
  }

  // Execute SQL query directly
  async executeSQLQuery(query) {
    return this.sendChatMessage(query);
  }

  // Get table data
  async getTableData(tableName, limit = 10) {
    return this.request(`/table-data/${tableName}?limit=${limit}`);
  }

  // Get table schema
  async getTableSchema(tableName) {
    const query = `DESCRIBE ${tableName}`;
    return this.executeSQLQuery(query);
  }

  // Human Approval Methods - Simplified
  async createApprovalRequest(sqlQuery) {
    return this.request('/approval/request', {
      method: 'POST',
      body: JSON.stringify({
        sql_query: sqlQuery
      })
    });
  }

  async getApprovalStatus(approvalId) {
    return this.request(`/approval/${approvalId}`);
  }

  async approveOperation(approvalId, approvedBy = 'user') {
    return fetch(`${this.baseURL}/approval/${approvalId}/approve?approved_by=${approvedBy}`, {
      method: 'POST'
    }).then(res => res.json());
  }


  async denyOperation(approvalId, deniedBy = 'user') {
    return this.request(`/approval/${approvalId}/deny?denied_by=${deniedBy}`, {
      method: 'POST'
    });
  }

  async getPendingApprovals() {
    return this.request('/approval/pending');
  }

  async cleanupExpiredApprovals() {
    return this.request('/approval/cleanup', {
      method: 'POST'
    });
  }
}

// Create singleton instance
const api = new DatabaseAgentAPI();

export default api;