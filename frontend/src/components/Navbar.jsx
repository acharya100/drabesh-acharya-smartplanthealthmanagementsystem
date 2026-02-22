/**
 * Navigation Bar Component
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Leaf, Activity, Camera, ShieldCheck, LogOut, Settings as SettingsIcon, Users, History as HistoryIcon } from "lucide-react";
import SwitchAccountModal from "./SwitchAccountModal";
import { useLanguage } from "../context/LanguageContext";

const Navbar = ({ activePage }) => {
  const navigate = useNavigate();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const username = sessionStorage.getItem("username") || "User";
  const isAdmin = sessionStorage.getItem("is_staff") === "true" || sessionStorage.getItem("is_superuser") === "true";
  const { t, language, setLanguage } = useLanguage();

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
      <div className="navbar-links">
        <Link to="/dashboard" className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}>
          <LayoutDashboard size={18} />
          <span>{t("nav.dashboard")}</span>
        </Link>
        <Link to="/plants" className={`nav-link ${activePage === "plants" ? "active" : ""}`}>
          <Leaf size={18} />
          <span>{t("nav.plants")}</span>
        </Link>
        <Link to="/diseases" className={`nav-link ${activePage === "diseases" ? "active" : ""}`}>
          <Activity size={18} />
          <span>{t("nav.diseases")}</span>
        </Link>
        <Link to="/disease" className={`nav-link ${activePage === "disease" ? "active" : ""}`}>
          <Camera size={18} />
          <span>{t("nav.detection")}</span>
        </Link>
        <Link to="/history" className={`nav-link ${activePage === "history" ? "active" : ""}`}>
          <HistoryIcon size={18} />
          <span>{t("nav.history")}</span>
        </Link>
        <Link to="/treatment" className={`nav-link ${activePage === "treatment" ? "active" : ""}`}>
          <ShieldCheck size={18} />
          <span>{t("nav.treatments")}</span>
        </Link>
        <Link to="/settings" className={`nav-link ${activePage === "settings" ? "active" : ""}`}>
          <SettingsIcon size={18} />
          <span>{t("nav.settings")}</span>
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

        <div className="nav-user-greeting" style={{ marginLeft: '0.5rem', marginRight: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem' }}>
          <span>{t("nav.welcome")}</span>
          <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{username}</span>

          <button
            onClick={() => setIsSwitchModalOpen(true)}
            title={t("nav.switchAccount")}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: '0.2rem',
              marginLeft: '0.3rem',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Users size={14} />
          </button>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} />
          <span>{t("nav.logout")}</span>
        </button>

        <SwitchAccountModal
          isOpen={isSwitchModalOpen}
          onClose={() => setIsSwitchModalOpen(false)}
        />
      </div>
    </nav>
  );
};

export default Navbar;
