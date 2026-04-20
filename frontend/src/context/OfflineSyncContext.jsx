import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { offlineStore } from '../utils/offlineStore';
import { predictionService } from '../services/api';

const OfflineSyncContext = createContext();

export const useOfflineSync = () => useContext(OfflineSyncContext);

export const OfflineSyncProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(window.navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(offlineStore.getQueue().length);
  const [lastSyncStatus, setLastSyncStatus] = useState('idle');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[OfflineSync] Browser is back online');
    };
    const handleOffline = () => {
      setIsOnline(false);
      console.log('[OfflineSync] Browser went offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync Logic
  const processQueue = useCallback(async () => {
    // Basic guards
    if (!window.navigator.onLine || isSyncing) return;
    
    const currentQueue = offlineStore.getQueue();
    if (currentQueue.length === 0) {
      setQueueCount(0);
      return;
    }

    console.log(`[OfflineSync] Starting sync for ${currentQueue.length} items...`);
    setIsSyncing(true);
    setLastSyncStatus('syncing');

    let successCount = 0;
    const idRemap = {};

    try {
      for (const op of currentQueue) {
        try {
          offlineStore.updateOpStatus(op.id, 'syncing');

          // Resolve remapped target IDs
          const resolvedTargetId = idRemap[op.targetId] ?? op.targetId;

          switch (op.type) {
            case 'UPDATE_PRED':
              if (typeof resolvedTargetId === 'string' && resolvedTargetId.startsWith('offline-')) {
                offlineStore.dequeue(op.id);
                continue;
              }
              await predictionService.update(resolvedTargetId, op.payload);
              break;
            case 'DELETE_PRED':
              await predictionService.delete(resolvedTargetId);
              break;
            case 'CREATE_PRED':
              if (op.payload.imageBase64) {
                const blob = await fetch(op.payload.imageBase64).then(res => res.blob());
                const formData = new FormData();
                formData.append('image', blob, 'offline_capture.jpg');
                const response = await predictionService.detect(formData);
                
                const realId = response?.data?.predictionId || response?.data?.id;
                if (realId && typeof op.targetId === 'string' && op.targetId.startsWith('offline-')) {
                  idRemap[op.targetId] = realId;
                }
              }
              break;
          }

          offlineStore.dequeue(op.id);
          successCount++;
        } catch (err) {
          console.error(`[OfflineSync] Failed to sync operation ${op.id}:`, err);
          // If it's a 4xx error (client error), it's likely invalid data.
          // We mark as failed but don't loop.
          offlineStore.updateOpStatus(op.id, 'failed', true);
          
          // Stop processing the queue if we hit a serious network error,
          // but if it's a 400 (Bad Request), maybe skip this item and continue?
          if (err.response?.status === 400) {
             console.warn('[OfflineSync] Item rejected by server (400). Skipping to next item.');
             offlineStore.dequeue(op.id); // Remove bad data to prevent loops
          } else {
             break; // Stop syncing for now (probably network issue)
          }
        }
      }
    } finally {
      setIsSyncing(false);
      setQueueCount(offlineStore.getQueue().length);
      setLastSyncStatus(successCount > 0 ? 'success' : 'error');
      setTimeout(() => setLastSyncStatus('idle'), 5000);
    }
  }, []); // Empty dependencies stabilize the function

  // Handle auto-sync on reconnect (Debounced/Throttled)
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        processQueue();
      }, 3000); // 3-second delay to ensure connection is stable
      return () => clearTimeout(timer);
    }
  }, [isOnline]); // processQueue is now stable, but we still focus on isOnline

  // Periodic poll for queue count to keep UI in sync
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueCount(offlineStore.getQueue().length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    isOnline,
    isSyncing,
    queueCount,
    lastSyncStatus,
    triggerSync: processQueue,
    enqueueAction: (type, targetId, payload) => {
      const op = offlineStore.enqueue(type, targetId, payload);
      setQueueCount(offlineStore.getQueue().length);
      return op;
    }
  };

  return (
    <OfflineSyncContext.Provider value={value}>
      {children}
    </OfflineSyncContext.Provider>
  );
};
