/**
 * Navigation Bar Component
 * 
 * The main top navigation for the application. It provides access to all major modules
 * like Dashboard, Plants, Diseases, Detection, and Settings.
 * Includes user session management and account switching access.
 * 
 * Author: Drabesh Acharya
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Leaf, Activity, Camera, ShieldCheck, LogOut, Settings as SettingsIcon, Users, History as HistoryIcon } from "lucide-react";
import SwitchAccountModal from "./SwitchAccountModal";

const Navbar = ({ activePage }) => {
  const navigate = useNavigate();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
  const username = localStorage.getItem("username") || "User";

  // This function handles user logout, clearing session data and redirecting to the login page.
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard" style={{ textDecoration: 'none' }}>
          <h2>
            <Leaf size={28} className="text-primary" />
            <span style={{ fontSize: '1.4rem' }}>Smart Plant Health Management System</span>
          </h2>
        </Link>
      </div>
      <div className="navbar-links">
        <Link to="/dashboard" className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </Link>
        <Link to="/plants" className={`nav-link ${activePage === "plants" ? "active" : ""}`}>
          <Leaf size={18} />
          <span>My Plants</span>
        </Link>
        <Link to="/diseases" className={`nav-link ${activePage === "diseases" ? "active" : ""}`}>
          <Activity size={18} />
          <span>Diseases</span>
        </Link>
        <Link to="/disease" className={`nav-link ${activePage === "disease" ? "active" : ""}`}>
          <Camera size={18} />
          <span>Detection</span>
        </Link>
        <Link to="/history" className={`nav-link ${activePage === "history" ? "active" : ""}`}>
          <HistoryIcon size={18} />
          <span>History</span>
        </Link>
        <Link to="/treatment" className={`nav-link ${activePage === "treatment" ? "active" : ""}`}>
          <ShieldCheck size={18} />
          <span>Treatments</span>
        </Link>
        <Link to="/settings" className={`nav-link ${activePage === "settings" ? "active" : ""}`}>
          <SettingsIcon size={18} />
          <span>Settings</span>
        </Link>

        <div className="nav-user-greeting" style={{ marginLeft: '1rem', marginRight: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>
          {/* We show a warm greeting to the user to make the platform feel friendly */}
          <span>Welcome,</span>
          <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{username}</span>

          <button
            onClick={() => setIsSwitchModalOpen(true)}
            title="Switch Account"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: '0.2rem',
              marginLeft: '0.5rem',
              transition: 'color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Users size={16} />
          </button>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} />
          <span>Logout</span>
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

