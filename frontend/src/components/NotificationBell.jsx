import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, ExternalLink, ShoppingBag, Package, AlertTriangle } from "lucide-react";
import { eCommerceService } from "../services/api";
import { useNavigate } from "react-router-dom";

const TYPE_ICONS = {
  order_placed: ShoppingBag,
  order_shipped: Package,
  order_delivered: CheckCheck,
  order_cancelled: AlertTriangle,
  low_stock: AlertTriangle,
  back_in_stock: Package,
  general: Bell,
};

const TYPE_COLORS = {
  order_placed: "#22c55e",
  order_shipped: "#3b82f6",
  order_delivered: "var(--primary)",
  order_cancelled: "#ef4444",
  low_stock: "#f59e0b",
  back_in_stock: "#22c55e",
  general: "var(--primary)",
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const prevUnreadRef = useRef(0);
  const isLoggedIn = !!sessionStorage.getItem("access_token");

  const fetchData = async () => {
    if (!isLoggedIn) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        eCommerceService.getNotifications(),
        eCommerceService.getUnreadCount(),
      ]);
      const allNotifs = notifRes.data.results || notifRes.data;
      const newCount = countRes.data.count;

      setNotifications(allNotifs.slice(0, 15));
      setUnreadCount(newCount);
      prevUnreadRef.current = newCount;
    } catch (err) {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll for new notifications every 60s
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await eCommerceService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) { console.error(err); }
  };

  const handleClickNotification = async (notif) => {
    if (!notif.is_read) {
      try {
        await eCommerceService.markNotificationRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (e) { }
    }
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  if (!isLoggedIn) return null;

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "40px", height: "40px", borderRadius: "10px",
          background: open ? "var(--primary-subtle)" : "transparent",
          border: "1px solid var(--border-light)",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", transition: "all 0.2s",
          color: open ? "var(--primary)" : "var(--text-muted)",
        }}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: "-6px", right: "-6px",
            background: "#ef4444", color: "white",
            borderRadius: "100px", minWidth: "18px", height: "18px",
            fontSize: "0.65rem", fontWeight: 800, lineHeight: "18px", textAlign: "center",
            padding: "0 4px", boxShadow: "0 2px 6px rgba(239,68,68,0.5)",
            animation: "notifPulse 2s ease-in-out infinite"
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
            <style>{`@keyframes notifPulse { 0%,100%{box-shadow:0 2px 6px rgba(239,68,68,0.5)} 50%{box-shadow:0 2px 12px rgba(239,68,68,0.85)} }`}</style>
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          width: "360px", background: "var(--bg-card)",
          border: "1px solid var(--border-light)", borderRadius: "20px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)", zIndex: 1000,
          overflow: "hidden"
        }}>
          {/* Header */}
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0, fontWeight: 800, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Bell size={16} stroke="var(--primary)" /> Notifications
              {unreadCount > 0 && <span style={{ background: "var(--primary-subtle)", color: "var(--primary)", borderRadius: "100px", padding: "0.1rem 0.5rem", fontSize: "0.7rem", fontWeight: 800 }}>{unreadCount} new</span>}
            </h4>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.78rem", color: "var(--primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "2.5rem", textAlign: "center" }}>
                <Bell size={32} style={{ opacity: 0.2, marginBottom: "0.75rem" }} />
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => {
                const Icon = TYPE_ICONS[notif.notification_type] || Bell;
                const color = TYPE_COLORS[notif.notification_type] || "var(--primary)";
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClickNotification(notif)}
                    style={{
                      width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                      padding: "1rem 1.25rem", display: "flex", gap: "1rem", alignItems: "flex-start",
                      background: notif.is_read ? "transparent" : "var(--primary-subtle)",
                      borderBottom: "1px solid var(--border-light)", transition: "background 0.2s"
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-main)"}
                    onMouseLeave={e => e.currentTarget.style.background = notif.is_read ? "transparent" : "var(--primary-subtle)"}
                  >
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={18} color={color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: notif.is_read ? 600 : 800, fontSize: "0.875rem", color: "var(--text-main)", marginBottom: "0.2rem" }}>{notif.title}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{notif.message}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-light)", marginTop: "0.4rem" }}>
                        {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    {!notif.is_read && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--primary)", flexShrink: 0, marginTop: "4px" }}></div>}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid var(--border-light)", textAlign: "center" }}>
            <button onClick={() => { setOpen(false); navigate("/orders"); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontWeight: 700, fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              View All Orders <ExternalLink size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
