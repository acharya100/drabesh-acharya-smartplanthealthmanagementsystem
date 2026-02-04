import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Leaf, Activity, Camera, ShieldCheck, LogOut } from "lucide-react";

const Navbar = ({ activePage }) => {
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "User";

  const logout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>
          <Leaf size={28} className="text-primary" />
          <span>Smart Plant Health</span>
        </h2>
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
        <Link to="/treatment" className={`nav-link ${activePage === "treatment" ? "active" : ""}`}>
          <ShieldCheck size={18} />
          <span>Treatments</span>
        </Link>
        <div className="nav-user-greeting" style={{ marginRight: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>
          <span>Welcome,</span>
          <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{username}</span>
        </div>
        <button className="logout-btn" onClick={logout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

