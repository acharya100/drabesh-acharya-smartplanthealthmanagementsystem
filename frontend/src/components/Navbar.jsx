import { Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Leaf, Activity, Camera, ShieldCheck, LogOut } from "lucide-react";

const Navbar = ({ activePage }) => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("isAuthenticated");
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
        <button className="logout-btn" onClick={logout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

