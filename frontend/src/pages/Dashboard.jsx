/**
 * Main Dashboard
 * Author: Drabesh Acharya
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { plantService } from "../services/api";
import { Leaf, Activity, ShieldCheck, Plus, Camera, List, Settings as SettingsIcon } from "lucide-react";

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
            <h1>Plant Health Dashboard</h1>
            <p className="subtitle">Overview of your plant collection and health status</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner-container">
            <div className="spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        ) : (
          <div className="stats-grid">
            <Link to="/plants" className="stat-card card clickable">
              <div className="stat-icon"><Leaf size={28} /></div>
              <div>
                <h3>{stats.totalPlants}</h3>
                <p>Total Plants</p>
              </div>
            </Link>
            <Link to="/plants?filter=healthy" className="stat-card card clickable">
              <div className="stat-icon"><Activity size={28} /></div>
              <div>
                <h3>{stats.healthyPlants}</h3>
                <p>Healthy Plants</p>
              </div>
            </Link>
            <Link to="/diseases" className="stat-card card clickable">
              <div className="stat-icon"><Camera size={28} /></div>
              <div>
                <h3>{stats.diseasesDetected}</h3>
                <p>Diseases Identified</p>
              </div>
            </Link>
            <Link to="/treatment" className="stat-card card clickable">
              <div className="stat-icon"><ShieldCheck size={28} /></div>
              <div>
                <h3>{stats.treatmentsAvailable}</h3>
                <p>Treatments Available</p>
              </div>
            </Link>
          </div>
        )}

        <div className="quick-actions" style={{ marginTop: '4rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <Link to="/plants" className="stat-card card clickable">
              <div className="stat-icon"><Plus size={24} /></div>
              <h3 style={{ fontSize: '1.25rem' }}>Add New Plant</h3>
            </Link>
            <Link to="/disease" className="stat-card card clickable">
              <div className="stat-icon"><Camera size={24} /></div>
              <h3 style={{ fontSize: '1.25rem' }}>Check Disease</h3>
            </Link>
            <Link to="/treatment" className="stat-card card clickable">
              <div className="stat-icon"><List size={24} /></div>
              <h3 style={{ fontSize: '1.25rem' }}>View Treatments</h3>
            </Link>
            <Link to="/diseases" className="stat-card card clickable">
              <div className="stat-icon"><Activity size={24} /></div>
              <h3 style={{ fontSize: '1.25rem' }}>Browse Diseases</h3>
            </Link>
            <Link to="/history" className="stat-card card clickable">
              <div className="stat-icon"><List size={24} /></div>
              <h3 style={{ fontSize: '1.25rem' }}>View History</h3>
            </Link>
            <Link to="/settings" className="stat-card card clickable">
              <div className="stat-icon"><SettingsIcon size={24} /></div>
              <h3 style={{ fontSize: '1.25rem' }}>Settings</h3>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
