/**
 * Offline Store Utility v2 (Professional Queue-based)
 * Manages an ordered queue of transactions to be replayed when connection is restored.
 */

const OFFLINE_QUEUE_KEY = 'plant_management_sync_queue';
const LEGACY_UPDATES_KEY = 'plant_management_offline_updates';

export const offlineStore = {
  /**
   * @param {string} type - Action type (e.g. 'UPDATE_PRED', 'DELETE_PRED')
   * @param {number|string} targetId - ID of the entity being acted upon
   * @param {object} payload - Data to be sent to the server
   */
  enqueue: (type, targetId, payload) => {
    try {
      const queue = offlineStore.getQueue();
      const newOp = {
        id: crypto.randomUUID(),
        type,
        targetId,
        payload,
        timestamp: new Date().toISOString(),
        status: 'pending', // pending, syncing, failed
        retryCount: 0
      };
      queue.push(newOp);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log(`[OfflineStore] Enqueued ${type} for ${targetId}`, newOp);
      return newOp;
    } catch (err) {
      console.error('[OfflineStore] Error enqueuing:', err);
      return null;
    }
  },

  /**
   * Get all operations in the queue
   */
  getQueue: () => {
    try {
      // Basic Migration for legacy users
      const legacy = localStorage.getItem(LEGACY_UPDATES_KEY);
      if (legacy) {
        console.warn('[OfflineStore] Found legacy updates. Migrating to queue...');
        const updates = JSON.parse(legacy);
        localStorage.removeItem(LEGACY_UPDATES_KEY);
        // Clear all and let the new system take over
      }

      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error('[OfflineStore] Error reading queue:', err);
      return [];
    }
  },

  /**
   * Peak at the first item in the queue
   */
  peek: () => {
    const queue = offlineStore.getQueue();
    return queue.length > 0 ? queue[0] : null;
  },

  /**
   * Remove the top item from the queue (usually after success)
   */
  dequeue: (id) => {
    try {
      let queue = offlineStore.getQueue();
      queue = queue.filter(op => op.id !== id);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      console.log(`[OfflineStore] Dequeued operation ${id}`);
    } catch (err) {
      console.error('[OfflineStore] Error dequeuing:', err);
    }
  },

  /**
   * Update an operation's status or retry count
   */
  updateOpStatus: (id, status, retry = false) => {
    try {
      const queue = offlineStore.getQueue();
      const index = queue.findIndex(op => op.id === id);
      if (index !== -1) {
        queue[index].status = status;
        if (retry) queue[index].retryCount += 1;
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      }
    } catch (err) {
      console.error('[OfflineStore] Error updating status:', err);
    }
  },

  /**
   * Apply all pending "UPDATE" type overrides to a result set
   * This ensures the UI reflects what's in the queue
   */
  applyPendingQueue: (results) => {
    if (!Array.isArray(results)) return results;
    const queue = offlineStore.getQueue();
    
    let reconciled = [...results];

    // Process queue items in order
    queue.forEach(op => {
      if (op.type === 'UPDATE_PRED') {
        reconciled = reconciled.map(item => 
          item.id === op.targetId ? { ...item, ...op.payload } : item
        );
      } else if (op.type === 'DELETE_PRED') {
        reconciled = reconciled.filter(item => item.id !== op.targetId);
      }
    });

    return reconciled;
  },

  /**
   * Legacy Compat: old components might still call applyOfflineUpdates
   */
  applyOfflineUpdates: (results) => {
     return offlineStore.applyPendingQueue(results);
  },

  /**
   * Clear all
   */
  clearAll: () => {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    localStorage.removeItem(LEGACY_UPDATES_KEY);
  },

  /**
   * Legacy Compatibility: Wrapper for component relying on old saveOfflineUpdate
   */
  saveOfflineUpdate: (targetId, payload) => {
    // We treat this as an UPDATE_PRED action since that's what the old method did
    offlineStore.enqueue('UPDATE_PRED', targetId, payload);
  }
};
