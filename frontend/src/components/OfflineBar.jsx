import { useOfflineSync } from "../context/OfflineSyncContext";
import { WifiOff, Cloud, RefreshCcw } from "lucide-react";

/**
 * OfflineBar - Refined Professional Version
 */
const OfflineBar = () => {
  const { isOnline, isSyncing, queueCount, triggerSync } = useOfflineSync();

  if (isOnline && queueCount === 0) return null;

  const showSyncing = isSyncing;
  const showPending = !isOnline && queueCount > 0;

  return (
    <div
      id="offline-notification-bar"
      role="alert"
      aria-live="polite"
      style={{
        position: "fixed",
        top: "var(--nav-height, 80px)",
        left: 0,
        width: "100%",
        zIndex: 980,
        backgroundColor: !isOnline ? "#fee2e2" : "#ecfdf5",
        borderBottom: `1px solid ${!isOnline ? "#fca5a5" : "#6ee7b7"}`,
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        padding: "0.5rem 1rem",
        color: !isOnline ? "#dc2626" : "#065f46",
        fontWeight: 600,
        fontSize: "0.85rem",
        animation: "offlineBarFadeIn 0.25s ease",
      }}
    >
      <style>{`
        @keyframes offlineBarFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      
      {!isOnline ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <WifiOff size={15} strokeWidth={2.5} />
            <span>You are currently offline</span>
          </div>
          {queueCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderLeft: '1px solid #fca5a5', paddingLeft: '1rem' }}>
              <Cloud size={14} />
              <span>{queueCount} changes waiting to sync</span>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCcw size={14} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "Synchronizing your changes..." : "Back online! Syncing completed."}</span>
          </div>
          {!isSyncing && queueCount > 0 && (
            <button 
              onClick={triggerSync}
              style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              Sync Now
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default OfflineBar;
