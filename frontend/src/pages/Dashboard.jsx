import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPlants: 0,
    diseasesDetected: 0,
    treatmentsAvailable: 0,
    healthyPlants: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      
      setTimeout(() => {
        setStats({ totalPlants: 12, diseasesDetected: 5, treatmentsAvailable: 8, healthyPlants: 7 });
        setLoading(false);
      }, 300);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar activePage="dashboard" />
      <div className="page-content">
        <div className="page-header">
          <h1>Dashboard</h1>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🌿</div>
              <div>
                <h3>{stats.totalPlants}</h3>
                <p>Total Plants</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div>
                <h3>{stats.healthyPlants}</h3>
                <p>Healthy Plants</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div>
                <h3>{stats.diseasesDetected}</h3>
                <p>Diseases Detected</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💊</div>
              <div>
                <h3>{stats.treatmentsAvailable}</h3>
                <p>Treatments Available</p>
              </div>
            </div>
          </div>
        )}

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <Link to="/plants" className="action-card">
              <div className="action-icon">➕</div>
              <h3>Add Plant</h3>
            </Link>
            <Link to="/disease" className="action-card">
              <div className="action-icon">🔍</div>
              <h3>Detect Disease</h3>
            </Link>
            <Link to="/treatment" className="action-card">
              <div className="action-icon">💉</div>
              <h3>View Treatments</h3>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;




