import { Link, useNavigate } from "react-router-dom";

const Navbar = ({ activePage }) => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("isAuthenticated");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>🌱 Smart Plant Health Management System</h2>
      </div>
      <div className="navbar-links">
        <Link to="/dashboard" className={`nav-link ${activePage === "dashboard" ? "active" : ""}`}>
          Dashboard
        </Link>
        <Link to="/plants" className={`nav-link ${activePage === "plants" ? "active" : ""}`}>
          Plants
        </Link>
        <Link to="/diseases" className={`nav-link ${activePage === "diseases" ? "active" : ""}`}>
          Diseases
        </Link>
        <Link to="/disease" className={`nav-link ${activePage === "disease" ? "active" : ""}`}>
          Detection
        </Link>
        <Link to="/treatment" className={`nav-link ${activePage === "treatment" ? "active" : ""}`}>
          Treatment
        </Link>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;

