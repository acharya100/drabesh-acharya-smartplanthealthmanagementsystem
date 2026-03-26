import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import SwitchAccountModal from "./SwitchAccountModal";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { authService } from "../services/api";
import { Leaf, Activity, Camera, ShieldCheck, List, Settings, LogOut, ChevronDown, User, Users, Store, ShoppingCart, Sun, Moon, WifiOff, Package } from "lucide-react";

const Navbar = ({ activePage }) => {
  const navigate = useNavigate();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!window.navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const username = sessionStorage.getItem("username") || "User";
  const isAdmin = sessionStorage.getItem("is_staff") === "true" || sessionStorage.getItem("is_superuser") === "true";
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
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>
            <Leaf size={24} className="text-primary" />
            <span>{t("nav.brand")}</span>
          </h2>
        </Link>
      </div>
 
      {/* Offline Indicator - Modern Floating Badge */}
      <div 
        className={`offline-toast ${isOffline ? 'visible' : ''}`}
        style={{
          position: 'fixed',
          bottom: isOffline ? '2rem' : '-5rem',
          left: '2rem',
          background: 'var(--danger)',
          color: 'white',
          padding: '0.75rem 1.25rem',
          borderRadius: '50px',
          fontWeight: 700,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)',
          zIndex: 9999,
          transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          opacity: isOffline ? 1 : 0,
          pointerEvents: isOffline ? 'auto' : 'none'
        }}
      >
        <WifiOff size={18} />
        <span>{t("nav.offline") || "You are offline. Showing cached data."}</span>
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

        {/* Knowledge & Records Dropdown */}
        <div className="nav-dropdown">
          <button className={`nav-link ${(activePage === 'diseases' || activePage === 'treatment' || activePage === 'history' || activePage === 'treatment-history' || activePage === 'orders') ? 'active' : ''}`}>
             <Settings size={18} /> <span>{t("nav.library") || "Library & History"}</span> <ChevronDown size={14} />
          </button>
          <div className="dropdown-menu">
            <Link to="/diseases" className="dropdown-item"><Activity size={16} /> {t("nav.diseases")}</Link>
            <Link to="/treatment" className="dropdown-item"><ShieldCheck size={16} /> {t("nav.treatments")}</Link>
            <div className="dropdown-divider"></div>
            <Link to="/history" className="dropdown-item"><Activity size={16} /> {t("nav.history")}</Link>
            <Link to="/treatment-history" className="dropdown-item"><Activity size={16} /> {t("nav.treatmentHistory")}</Link>
            <Link to="/orders" className="dropdown-item"><Package size={16} /> {t("nav.orders") || "Orders"}</Link>
          </div>
        </div>

        <Link to="/settings" className={`nav-link ${activePage === 'settings' ? 'active' : ''}`}>
          <Settings size={18} /> <span>{t("nav.settings")}</span>
        </Link>
      </div>

      <div className="navbar-actions">
        <Link to="/cart" style={{ position: 'relative', marginRight: '1rem', color: 'var(--text-muted)' }}>
          <ShoppingCart size={24} />
          {totalItems > 0 && (
            <span style={{
              position: 'absolute', top: '-8px', right: '-8px',
              background: 'var(--danger)', color: 'white',
              fontSize: '0.7rem', padding: '0.2rem 0.4rem',
              borderRadius: '50%', minWidth: '18px', textAlign: 'center',
              fontWeight: 800, border: '2px solid var(--white)'
            }}>
              {totalItems}
            </span>
          )}
        </Link>

        {isAdmin && (
          <Link
            to="/admin-panel"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.4rem 0.9rem', borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', fontWeight: 700, fontSize: '0.82rem',
              textDecoration: 'none', marginLeft: '0.25rem',
              boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            <ShieldCheck size={15} />
            <span>{t("nav.admin")}</span>
          </Link>
        )}

        {/* Language toggle button */}
        <button
          onClick={toggleLanguage}
          title={language === "en" ? "Switch to Nepali" : "English मा फेर्नुहोस्"}
          className="lang-toggle-btn"
        >
          <span className="lang-flag">{language === "en" ? "🇳🇵" : "🇬🇧"}</span>
          <span className="lang-code">{language === "en" ? "NE" : "EN"}</span>
        </button>

        {/* Theme toggle button */}
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          className="lang-toggle-btn"
          style={{ marginLeft: '1rem' }}
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className="nav-dropdown" style={{ marginLeft: '1rem' }}>
          <button className="nav-link" style={{ gap: '0.75rem', padding: '0.4rem 0.8rem', background: 'var(--bg-surface-inner)', borderRadius: '50px', border: '1px solid var(--border-light)', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '28px', height: '28px', background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                {username ? username.substring(0,2).toUpperCase() : 'U'}
              </div>
              <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>{username}</span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
          <div className="dropdown-menu" style={{ right: 0, left: 'auto', minWidth: '220px', padding: '0.5rem' }}>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-light)', marginBottom: '0.5rem' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("nav.welcome")}</p>
              <p style={{ margin: 0, fontWeight: 800, color: 'var(--text-main)' }}>{username}</p>
            </div>
            <button onClick={() => setIsSwitchModalOpen(true)} className="dropdown-item" style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none' }}>
              <Users size={16} /> {t("nav.switchAccount") || "Switch Account"}
            </button>
            <button onClick={handleLogout} className="dropdown-item" style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', color: 'var(--danger)' }}>
              <LogOut size={16} /> {t("nav.logout")}
            </button>
          </div>
        </div>

        <SwitchAccountModal
          isOpen={isSwitchModalOpen}
          onClose={() => setIsSwitchModalOpen(false)}
        />
      </div>
    </nav>
  );
};

export default Navbar;
