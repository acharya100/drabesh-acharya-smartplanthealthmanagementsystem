import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import NotificationBell from "./NotificationBell";
import { useOfflineSync } from "../context/OfflineSyncContext";
import SwitchAccountModal from "./SwitchAccountModal";
import { Leaf, Activity, Camera, ShieldCheck, List, Settings, LogOut, ChevronDown, User, Users, Store, ShoppingCart, Sun, Moon, Package, Heart, MessageSquare, FlaskConical, Cloud, CloudOff, RefreshCcw, Check } from "lucide-react";

/**
 * Navbar - Refined Professional Offline Sync Version
 */
const Navbar = ({ activePage }) => {
  const navigate = useNavigate();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);

  const { isOnline, isSyncing, queueCount, lastSyncStatus, triggerSync } = useOfflineSync();

  const username = sessionStorage.getItem("username") || "User";
  const isAdmin = sessionStorage.getItem("isStaff") === "true" || sessionStorage.getItem("isSuperuser") === "true";
  const { t, language, setLanguage } = useLanguage();
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ne" : "en");
  };


  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <h2 style={{ fontSize: '0.95rem', margin: 0, whiteSpace: 'nowrap' }}>
            <Leaf size={20} className="text-primary" />
            <span>{t("nav.brand")}</span>
          </h2>
        </Link>
      </div>



      <div className="navbar-links">
        <Link to="/dashboard" className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}>
          <List size={18} />
          <span>{t("nav.dashboard")}</span>
        </Link>
        <Link to="/plants" className={`nav-link ${activePage === "plants" ? "active" : ""}`}>
          <Leaf size={18} />
          <span>{t("nav.plants")}</span>
        </Link>
        <Link to="/disease" className={`nav-link ${activePage === "disease" ? "active" : ""}`}>
          <Camera size={18} />
          <span>{t("nav.detection")}</span>
        </Link>
        <Link to="/store" className={`nav-link ${activePage === 'store' ? 'active' : ''}`}>
          <Store size={18} /> <span>{t("nav.store") || "Store"}</span>
        </Link>
        <Link to="/chat" className={`nav-link ${activePage === 'chat' ? 'active' : ''}`}>
          <MessageSquare size={18} /> <span>{t("nav.chat") || "Expert Chat"}</span>
        </Link>
        <Link to="/soil" className={`nav-link ${activePage === 'soil' ? 'active' : ''}`}>
          <FlaskConical size={18} /> <span>{t("nav.soil") || "Soil"}</span>
        </Link>

        {/* Knowledge & Records Dropdown */}
        <div className="nav-dropdown">
          <button className={`nav-link ${(activePage === 'diseases' || activePage === 'treatment' || activePage === 'history' || activePage === 'treatment-history' || activePage === 'orders') ? 'active' : ''}`}>
            <Settings size={18} /> <span>{t("nav.library") !== "nav.library" ? t("nav.library") : "Knowledge & History"}</span> <ChevronDown size={14} />
          </button>
          <div className="dropdown-menu">
            <Link to="/diseases" className="dropdown-item"><Activity size={16} /> {t("nav.diseaseAtlas") || "Disease Database"}</Link>
            <Link to="/treatment" className="dropdown-item"><ShieldCheck size={16} /> {t("nav.treatmentProtocols") || "Treatment Protocols"}</Link>
            <div className="dropdown-divider"></div>
            <Link to="/history" className="dropdown-item"><Activity size={16} /> {t("nav.history")}</Link>
            <Link to="/treatment-history" className="dropdown-item"><Activity size={16} /> {t("nav.treatmentHistory")}</Link>
            <Link to="/orders" className="dropdown-item"><Package size={16} /> {t("nav.orders") || "Orders"}</Link>
            <Link to="/cart" className="dropdown-item"><ShoppingCart size={16} /> {t("nav.cart")}</Link>
            <Link to="/wishlist" className="dropdown-item"><Heart size={16} /> {t("nav.wishlist")}</Link>
          </div>
        </div>

        <Link to="/settings" className={`nav-link ${activePage === 'settings' ? 'active' : ''}`}>
          <Settings size={18} /> <span>{t("nav.settings")}</span>
        </Link>
      </div>
      <div className="navbar-actions" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        {/* Global Sync Status Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {!isOnline ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.7rem", borderRadius: "100px", background: "#fef3c7", color: "#b45309", fontSize: "0.75rem", fontWeight: 800, border: "1px solid #fcd34d" }}>
              <CloudOff size={14} /> {queueCount > 0 ? `${queueCount} pending` : "Offline"}
            </div>
          ) : isSyncing ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.7rem", borderRadius: "100px", background: "var(--primary-subtle)", color: "var(--primary)", fontSize: "0.75rem", fontWeight: 800, border: "1px solid var(--primary-light)" }}>
              <RefreshCcw size={14} className="animate-spin" /> Syncing...
            </div>
          ) : lastSyncStatus === 'success' ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.7rem", borderRadius: "100px", background: "#d1fae5", color: "#065f46", fontSize: "0.75rem", fontWeight: 800, border: "1px solid #6ee7b7" }}>
              <Check size={14} /> Synced
            </div>
          ) : queueCount > 0 ? (
            <button
              onClick={triggerSync}
              style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.7rem", borderRadius: "100px", background: "var(--bg-card)", color: "var(--primary)", fontSize: "0.75rem", fontWeight: 800, border: "1.5px solid var(--primary)", cursor: "pointer" }}
              title="Click to manually sync pending changes"
            >
              <Cloud size={14} /> Sync Now ({queueCount})
            </button>
          ) : null}
        </div>

        {/* Cart */}
        <Link to="/cart" style={{ position: "relative", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px", border: "1px solid var(--border-light)", color: "var(--text-muted)", background: "transparent", flexShrink: 0 }}
          title="Shopping Cart">
          <ShoppingCart size={19} />
          {totalItems > 0 && (
            <span style={{ position: "absolute", top: "-5px", right: "-5px", background: "var(--danger)", color: "white", fontSize: "0.62rem", padding: "1px 5px", borderRadius: "99px", minWidth: 17, textAlign: "center", fontWeight: 900, border: "2px solid var(--bg-main)" }}>
              {totalItems}
            </span>
          )}
        </Link>


        {/* Notification Bell */}
        <NotificationBell />

        {/* Controls Pill: Language + Divider + Theme */}
        <div style={{ display: "flex", alignItems: "center", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "50px", padding: "3px 4px", gap: "2px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <button
              onClick={() => language !== "en" && toggleLanguage()}
              title="English"
              style={{ padding: "4px 8px", borderRadius: "50px", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 800, background: language === "en" ? "var(--primary)" : "transparent", color: language === "en" ? "white" : "var(--text-muted)", transition: "all 0.2s" }}
            >EN</button>
            <button
              onClick={() => language !== "ne" && toggleLanguage()}
              title="Nepali (                  )"
              style={{ padding: "4px 8px", borderRadius: "50px", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 800, background: language === "ne" ? "var(--primary)" : "transparent", color: language === "ne" ? "white" : "var(--text-muted)", transition: "all 0.2s" }}
            >NP</button>
          </div>
          <div style={{ width: 1, height: 20, background: "var(--border-light)", flexShrink: 0 }} />
          <button
            onClick={toggleTheme}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50px", border: "none", cursor: "pointer", background: "transparent", color: "var(--text-muted)", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--primary-subtle)"; e.currentTarget.style.color = "var(--primary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </div>

        {/* User + Admin Dropdown */}
        <div className="nav-dropdown">
          <button className="nav-link" style={{ gap: "0.5rem", padding: "5px 10px 5px 5px", background: "var(--bg-card)", borderRadius: "50px", border: "1px solid var(--border-light)", cursor: "pointer" }}>
            <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,var(--primary),#16a34a)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.75rem", flexShrink: 0 }}>
              {username.substring(0, 2).toUpperCase()}
            </div>
            <span style={{ fontWeight: 700, color: "var(--text-main)", fontSize: "0.875rem", maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{username}</span>
            <ChevronDown size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          </button>
          <div className="dropdown-menu" style={{ right: 0, left: "auto", minWidth: 230, padding: "0.5rem" }}>
            {/* User Info */}
            <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid var(--border-light)", marginBottom: "0.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{t("nav.welcome")}</p>
              <p style={{ margin: "0.2rem 0 0", fontWeight: 800, color: "var(--text-main)", fontSize: "1rem" }}>{username}</p>
            </div>
            {/* Admin Panel Link */}
            {isAdmin && (
              <Link to="/admin-panel" className="dropdown-item" style={{ color: "#059669", fontWeight: 700 }}>
                <ShieldCheck size={16} /> {t("nav.admin")}
              </Link>
            )}
            {/* Switch Account */}
            <button onClick={() => setIsSwitchModalOpen(true)} className="dropdown-item" style={{ width: "100%", textAlign: "left", border: "none", background: "none" }}>
              <Users size={16} /> {t("nav.switchAccount") || "Switch Account"}
            </button>
            <div style={{ height: 1, background: "var(--border-light)", margin: "0.4rem 0" }} />
            {/* Logout */}
            <button onClick={handleLogout} className="dropdown-item" style={{ width: "100%", textAlign: "left", border: "none", background: "none", color: "var(--danger)" }}>
              <LogOut size={16} /> {t("nav.logout")}
            </button>
          </div>
        </div>

        <SwitchAccountModal isOpen={isSwitchModalOpen} onClose={() => setIsSwitchModalOpen(false)} />
      </div>
    </nav>
  );
};

export default Navbar;
