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
    if (!window.navigator.onLine || isSyncing) return;

    const queue = offlineStore.getQueue();
    if (queue.length === 0) {
      setQueueCount(0);
      return;
    }

    console.log(`[OfflineSync] Starting sync for ${queue.length} items...`);
    setIsSyncing(true);
    setLastSyncStatus('syncing');

    let successCount = 0;

    // Process items sequentially to preserve order
    // Track fake offline-xxx → real server ID mapping
    const idRemap = {};



    for (const op of queue) {
      try {
        offlineStore.updateOpStatus(op.id, 'syncing');

        // Resolve remapped target IDs (offline-xxx → real server id after CREATE_PRED succeeds)
        const resolvedTargetId = idRemap[op.targetId] ?? op.targetId;

        switch (op.type) {
          case 'UPDATE_PRED':
            // Skip if still an unresolved fake offline ID (CREATE_PRED may have failed)
            if (typeof resolvedTargetId === 'string' && resolvedTargetId.startsWith('offline-')) {
              console.warn(`[OfflineSync] Skipping UPDATE_PRED for unresolved fake ID: ${resolvedTargetId}`);
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
              // Map the fake offline ID to the real server-assigned ID
              const realId = response?.data?.predictionId || response?.data?.id;
              if (realId && typeof op.targetId === 'string' && op.targetId.startsWith('offline-')) {
                idRemap[op.targetId] = realId;
                console.log(`[OfflineSync] ID remapped: ${op.targetId} → ${realId}`);
              }
            }
            break;
          default:
            console.warn(`[OfflineSync] Unknown operation type: ${op.type}`);
        }

        offlineStore.dequeue(op.id);
        successCount++;
      } catch (err) {
        console.error(`[OfflineSync] Failed to sync operation ${op.id}:`, err);
        offlineStore.updateOpStatus(op.id, 'failed', true);
      }
    }

    setIsSyncing(false);
    setQueueCount(offlineStore.getQueue().length);
    setLastSyncStatus(successCount > 0 ? 'success' : 'error');

    // Reset status after a few seconds
    setTimeout(() => setLastSyncStatus('idle'), 5000);
  }, [isSyncing]);

  // Handle auto-sync on reconnect
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

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
