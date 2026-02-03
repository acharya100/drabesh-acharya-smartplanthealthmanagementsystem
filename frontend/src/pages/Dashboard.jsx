import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { plantService } from "../services/api";
import { Leaf, Activity, ShieldCheck, Plus, Camera, List } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPlants: 0,
    healthyPlants: 0,
    diseasesDetected: 0,
    treatmentsAvailable: 0
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
        healthyPlants: data.total_plants - data.toxic_plants,
        diseasesDetected: data.toxic_plants,
        treatmentsAvailable: data.medicinal_plants
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
      <div className="page-content animate-slide-up">
        <div className="page-header">
          <div>
            <h1>Plant Health Overview</h1>
            <p className="subtitle">Real-time biometrics and cultivation metrics</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner-container">
            <div className="spinner"></div>
            <p>Gathering system telemetry...</p>
          </div>
        ) : (
          <div className="stats-grid">
            <Link to="/plants" className="stat-card card clickable">
              <div className="stat-icon"><Leaf size={28} /></div>
              <div>
                <h3>{stats.totalPlants}</h3>
                <p>Total Species</p>
              </div>
            </Link>
            <Link to="/plants?filter=healthy" className="stat-card card clickable">
              <div className="stat-icon"><Activity size={28} /></div>
              <div>
                <h3>{stats.healthyPlants}</h3>
                <p>Curated Health</p>
              </div>
            </Link>
            <Link to="/diseases" className="stat-card card clickable">
              <div className="stat-icon"><Camera size={28} /></div>
              <div>
                <h3>{stats.diseasesDetected}</h3>
                <p>Pathogens Found</p>
              </div>
            </Link>
            <Link to="/treatment" className="stat-card card clickable">
              <div className="stat-icon"><ShieldCheck size={28} /></div>
              <div>
                <h3>{stats.treatmentsAvailable}</h3>
                <p>Medical Protocols</p>
              </div>
            </Link>
          </div>
        )}

        <div className="quick-actions mt-6">
          <h2 className="mb-8">System Access</h2>
          <div className="stats-grid">
            <Link to="/plants" className="stat-card card clickable">
              <div className="stat-icon"><Plus size={24} /></div>
              <h3>Enroll Specimen</h3>
            </Link>
            <Link to="/disease" className="stat-card card clickable">
              <div className="stat-icon"><Camera size={24} /></div>
              <h3>Active Diagnosis</h3>
            </Link>
            <Link to="/treatment" className="stat-card card clickable">
              <div className="stat-icon"><List size={24} /></div>
              <h3>Browse Catalog</h3>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;




