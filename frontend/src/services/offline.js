class OfflineService {
  constructor() {
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];
    this.syncInProgress = false;
    this.listeners = [];
    this.STORAGE_KEYS = {
      QUEUE: 'offline_queue',
      CACHED_DATA: 'cached_data',
      LAST_SYNC: 'last_sync',
      PENDING_UPLOADS: 'pending_uploads'
    };

    this.init();
  }

  // Initialize offline service
  init() {
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Load offline queue from storage
    this.loadOfflineQueue();

    // Setup periodic sync attempts
    this.setupPeriodicSync();

    console.log('OfflineService initialized:', this.isOnline ? 'ONLINE' : 'OFFLINE');
  }

  // Event Handlers
  handleOnline() {
    console.log('Device came online');
    this.isOnline = true;
    this.notifyListeners('online');
    this.syncOfflineData();
  }

  handleOffline() {
    console.log('Device went offline');
    this.isOnline = false;
    this.notifyListeners('offline');
  }

  // Listener Management
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(event, data = null) {
    this.listeners.forEach(callback => {
      try {
        callback({ type: event, data });
      } catch (error) {
        console.error('Error in offline listener:', error);
      }
    });
  }

  // Queue Management
  loadOfflineQueue() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.QUEUE);
      this.offlineQueue = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading offline queue:', error);
      this.offlineQueue = [];
    }
  }

  saveOfflineQueue() {
    try {
      localStorage.setItem(this.STORAGE_KEYS.QUEUE, JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }

  // Add request to offline queue
  addToQueue(request) {
    const queueItem = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      type: request.type || 'api_call',
      ...request
    };

    this.offlineQueue.push(queueItem);
    this.saveOfflineQueue();

    console.log('Added to offline queue:', queueItem);
    this.notifyListeners('queue_updated', { queue: this.offlineQueue });

    return queueItem.id;
  }

  // Remove item from queue
  removeFromQueue(id) {
    this.offlineQueue = this.offlineQueue.filter(item => item.id !== id);
    this.saveOfflineQueue();
    this.notifyListeners('queue_updated', { queue: this.offlineQueue });
  }

  // Clear entire queue
  clearQueue() {
    this.offlineQueue = [];
    this.saveOfflineQueue();
    this.notifyListeners('queue_updated', { queue: this.offlineQueue });
  }

  // Get queue status
  getQueueStatus() {
    return {
      length: this.offlineQueue.length,
      items: this.offlineQueue,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }

  // Data Caching
  cacheData(key, data, ttl = null) {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        ttl: ttl ? Date.now() + ttl : null
      };

      const cached = this.getCachedData();
      cached[key] = cacheItem;
      
      localStorage.setItem(this.STORAGE_KEYS.CACHED_DATA, JSON.stringify(cached));
      console.log('Data cached:', key);
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }

  getCachedData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.CACHED_DATA);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading cached data:', error);
      return {};
    }
  }

  getFromCache(key) {
    try {
      const cached = this.getCachedData();
      const item = cached[key];

      if (!item) return null;

      // Check if item has expired
      if (item.ttl && Date.now() > item.ttl) {
        this.removeFromCache(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.error('Error getting from cache:', error);
      return null;
    }
  }

  removeFromCache(key) {
    try {
      const cached = this.getCachedData();
      delete cached[key];
      localStorage.setItem(this.STORAGE_KEYS.CACHED_DATA, JSON.stringify(cached));
    } catch (error) {
      console.error('Error removing from cache:', error);
    }
  }

  clearCache() {
    try {
      localStorage.removeItem(this.STORAGE_KEYS.CACHED_DATA);
      console.log('Cache cleared');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Sync offline data when back online
  async syncOfflineData() {
    if (!this.isOnline || this.syncInProgress || this.offlineQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log('Starting offline sync...', this.offlineQueue.length, 'items');

    this.notifyListeners('sync_started', { queueLength: this.offlineQueue.length });

    const successfulSyncs = [];
    const failedSyncs = [];

    for (const item of [...this.offlineQueue]) {
      try {
        const result = await this.syncItem(item);
        
        if (result.success) {
          successfulSyncs.push(item);
          this.removeFromQueue(item.id);
        } else {
          failedSyncs.push({ item, error: result.error });
        }
      } catch (error) {
        console.error('Sync error for item:', item, error);
        failedSyncs.push({ item, error });
      }

      // Small delay between requests to avoid overwhelming the server
      await this.delay(100);
    }

    this.syncInProgress = false;
    
    // Update last sync timestamp
    localStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

    console.log('Offline sync completed:', {
      successful: successfulSyncs.length,
      failed: failedSyncs.length
    });

    this.notifyListeners('sync_completed', {
      successful: successfulSyncs,
      failed: failedSyncs
    });
  }

  // Sync individual item
  async syncItem(item) {
    try {
      switch (item.type) {
        case 'api_call':
          return await this.syncApiCall(item);
        case 'form_submission':
          return await this.syncFormSubmission(item);
        case 'file_upload':
          return await this.syncFileUpload(item);
        default:
          console.warn('Unknown sync item type:', item.type);
          return { success: false, error: 'Unknown item type' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sync API call
  async syncApiCall(item) {
    const { method, url, data, headers } = item;
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (response.ok) {
        const responseData = await response.json();
        return { success: true, data: responseData };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sync form submission
  async syncFormSubmission(item) {
    // Implementation depends on your form handling
    return this.syncApiCall(item);
  }

  // Sync file upload
  async syncFileUpload(item) {
    const { url, file, data, headers } = item;
    
    try {
      const formData = new FormData();
      
      if (file) {
        formData.append('file', file);
      }
      
      if (data) {
        Object.keys(data).forEach(key => {
          formData.append(key, data[key]);
        });
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: headers || {},
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        return { success: true, data: responseData };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Utility functions
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Setup periodic sync attempts
  setupPeriodicSync() {
    setInterval(() => {
      if (this.isOnline && this.offlineQueue.length > 0 && !this.syncInProgress) {
        console.log('Attempting periodic sync...');
        this.syncOfflineData();
      }
    }, 30000); // Try every 30 seconds
  }

  // Exam-specific offline functionality
  
  // Save exam attempt offline
  saveExamAttemptOffline(examId, answers, studentInfo) {
    const attemptData = {
      type: 'exam_submission',
      examId,
      answers,
      studentInfo,
      attemptedAt: new Date().toISOString(),
      url: `/api/exams/${examId}/submit`,
      method: 'POST',
      data: { answers, studentInfo }
    };

    const id = this.addToQueue(attemptData);
    
    // Also cache locally for viewing
    this.cacheData(`exam_attempt_${examId}`, attemptData);
    
    return id;
  }

  // Get cached exam attempts
  getCachedExamAttempts() {
    const cached = this.getCachedData();
    return Object.keys(cached)
      .filter(key => key.startsWith('exam_attempt_'))
      .map(key => cached[key].data);
  }

  // Save question response offline
  saveQuestionResponseOffline(questionId, response) {
    this.cacheData(`question_response_${questionId}`, {
      response,
      timestamp: new Date().toISOString()
    });
  }

  // Get cached question response
  getCachedQuestionResponse(questionId) {
    return this.getFromCache(`question_response_${questionId}`);
  }

  // Save exam data for offline viewing
  cacheExamData(examId, examData) {
    this.cacheData(`exam_data_${examId}`, examData, 24 * 60 * 60 * 1000); // 24 hours TTL
  }

  // Get cached exam data
  getCachedExamData(examId) {
    return this.getFromCache(`exam_data_${examId}`);
  }

  // Network status check
  async checkConnectivity() {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const wasOnline = this.isOnline;
      this.isOnline = response.ok;
      
      if (wasOnline !== this.isOnline) {
        if (this.isOnline) {
          this.handleOnline();
        } else {
          this.handleOffline();
        }
      }
      
      return this.isOnline;
    } catch (error) {
      const wasOnline = this.isOnline;
      this.isOnline = false;
      
      if (wasOnline) {
        this.handleOffline();
      }
      
      return false;
    }
  }

  // Storage management
  getStorageUsage() {
    let totalSize = 0;
    
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
      }
    }
    
    return {
      totalSize,
      queueSize: JSON.stringify(this.offlineQueue).length,
      cacheSize: localStorage.getItem(this.STORAGE_KEYS.CACHED_DATA)?.length || 0
    };
  }

  cleanupOldData() {
    try {
      const now = Date.now();
      const cached = this.getCachedData();
      let cleaned = false;

      // Remove expired cache items
      Object.keys(cached).forEach(key => {
        const item = cached[key];
        if (item.ttl && now > item.ttl) {
          delete cached[key];
          cleaned = true;
        }
      });

      if (cleaned) {
        localStorage.setItem(this.STORAGE_KEYS.CACHED_DATA, JSON.stringify(cached));
        console.log('Cleaned up expired cache items');
      }

      // Remove old queue items (older than 7 days)
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      const originalLength = this.offlineQueue.length;
      
      this.offlineQueue = this.offlineQueue.filter(item => {
        const itemTime = new Date(item.timestamp).getTime();
        return itemTime > sevenDaysAgo;
      });

      if (this.offlineQueue.length !== originalLength) {
        this.saveOfflineQueue();
        console.log('Cleaned up old queue items:', originalLength - this.offlineQueue.length);
      }

    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }

  // Public API
  isOffline() {
    return !this.isOnline;
  }

  getLastSyncTime() {
    return localStorage.getItem(this.STORAGE_KEYS.LAST_SYNC);
  }

  forcSync() {
    if (this.isOnline) {
      return this.syncOfflineData();
    } else {
      console.warn('Cannot sync while offline');
      return Promise.resolve();
    }
  }
}

const offlineService = new OfflineService();

// Cleanup old data on initialization
offlineService.cleanupOldData();

// Setup periodic cleanup
setInterval(() => {
  offlineService.cleanupOldData();
}, 60 * 60 * 1000); // Every hour

export default offlineService;