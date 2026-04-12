/**
 * OfflineBar — Standalone offline notification bar
 * Sits directly below the navbar. Does NOT overlap the header.
 * Does NOT reuse or modify any existing alert/notification components.
 */
import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

const OfflineBar = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline  = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener("online",  goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online",  goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      id="offline-notification-bar"
      role="alert"
      aria-live="polite"
      style={{
        /* Sits directly below the fixed navbar */
        position: "fixed",
        top: "var(--nav-height, 80px)",
        left: 0,
        width: "100%",
        zIndex: 980,                       /* below navbar (usually 1000+) */
        backgroundColor: "#fee2e2",
        borderBottom: "1px solid #fca5a5",
        boxShadow: "0 2px 6px rgba(239,68,68,0.08)",
        /* Content */
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.5rem",
        padding: "0.45rem 1rem",
        color: "#dc2626",
        fontWeight: 600,
        fontSize: "0.85rem",
        fontFamily: "inherit",
        /* Smooth enter */
        animation: "offlineBarFadeIn 0.25s ease",
      }}
    >
      <style>{`
        @keyframes offlineBarFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <WifiOff size={15} strokeWidth={2.5} />
      You are offline
    </div>
  );
};

export default OfflineBar;
