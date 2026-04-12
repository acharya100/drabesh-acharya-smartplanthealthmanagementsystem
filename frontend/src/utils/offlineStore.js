/**
 * Offline Store Utility
 * Manages local persistence for pending updates when user is offline
 */

const OFFLINE_KEY = 'plant_management_offline_updates';

export const offlineStore = {
  /**
   * Save a pending update to localStorage
   */
  saveOfflineUpdate: (predictionId, data) => {
    try {
      const updates = JSON.parse(localStorage.getItem(OFFLINE_KEY) || '{}');
      updates[predictionId] = {
        ...data,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(OFFLINE_KEY, JSON.stringify(updates));
      console.log(`[OfflineStore] Saved update for prediction ${predictionId}`, data);
    } catch (err) {
      console.error('[OfflineStore] Error saving update:', err);
    }
  },

  /**
   * Get all pending updates
   */
  getOfflineUpdates: () => {
    try {
      return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '{}');
    } catch (err) {
      console.error('[OfflineStore] Error reading updates:', err);
      return {};
    }
  },

  /**
   * Merge pending updates into a list of server results
   */
  applyOfflineUpdates: (results) => {
    if (!Array.isArray(results)) return results;
    
    const updates = offlineStore.getOfflineUpdates();
    return results.map(item => {
      // If we have a local update for this ID, override the server data
      if (updates[item.id]) {
        console.log(`[OfflineStore] Applying local override for prediction ${item.id}`);
        return { ...item, ...updates[item.id] };
      }
      return item;
    });
  },

  /**
   * Clear a specific pending update (usually after successful sync)
   */
  clearOfflineUpdate: (predictionId) => {
    try {
      const updates = JSON.parse(localStorage.getItem(OFFLINE_KEY) || '{}');
      if (updates[predictionId]) {
        delete updates[predictionId];
        localStorage.setItem(OFFLINE_KEY, JSON.stringify(updates));
        console.log(`[OfflineStore] Cleared update for prediction ${predictionId}`);
      }
    } catch (err) {
      console.error('[OfflineStore] Error clearing update:', err);
    }
  },

  /**
   * Clear all updates
   */
  clearAll: () => {
    localStorage.removeItem(OFFLINE_KEY);
  }
};
