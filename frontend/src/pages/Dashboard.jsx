import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { plantService } from "../services/api";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPlants: 0,
    healthyPlants: 0,
    diseasesDetected: 0,
    treatmentsAvailable: 0,
    byDifficulty: {},
    bySunlight: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const { data } = await plantService.getStatistics();

      setStats({
        totalPlants: data.total_plants,
        healthyPlants: data.total_plants - data.toxic_plants, // Simple logic for demonstration
        diseasesDetected: data.toxic_plants, // Placeholder for actual disease detection stats
        treatmentsAvailable: data.medicinal_plants, // Placeholder
        byDifficulty: data.by_difficulty,
        bySunlight: data.by_sunlight
      });
      setLoading(false);
    } catch (error) {
      console.error("Dashboard stats error:", error);
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
            <Link to="/plants" className="stat-card clickable">
              <div className="stat-icon">🌿</div>
              <div>
                <h3>{stats.totalPlants}</h3>
                <p>Total Plants</p>
              </div>
            </Link>
            <Link to="/plants?filter=healthy" className="stat-card clickable">
              <div className="stat-icon">✅</div>
              <div>
                <h3>{stats.healthyPlants}</h3>
                <p>Healthy Plants</p>
              </div>
            </Link>
            <Link to="/diseases" className="stat-card clickable">
              <div className="stat-icon">⚠️</div>
              <div>
                <h3>{stats.diseasesDetected}</h3>
                <p>Diseases Detected</p>
              </div>
            </Link>
            <Link to="/treatment" className="stat-card clickable">
              <div className="stat-icon">💊</div>
              <div>
                <h3>{stats.treatmentsAvailable}</h3>
                <p>Treatments Available</p>
              </div>
            </Link>
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




