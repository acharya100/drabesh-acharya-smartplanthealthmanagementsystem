/**
 * Main Dashboard
 * Author: Drabesh Acharya
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { plantService } from "../services/api";
import { Leaf, Activity, ShieldCheck, Plus, Camera, List, Settings as SettingsIcon } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const Dashboard = () => {
  const { t } = useLanguage();
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
            <h1>{t("dashboard.title")}</h1>
            <p className="subtitle">{t("dashboard.subtitle")}</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner-container">
            <div className="spinner"></div>
            <p>{t("dashboard.loading")}</p>
          </div>
        ) : (
          <div className="stats-grid">
            <Link to="/plants" className="stat-card card clickable">
              <div className="stat-icon"><Leaf size={28} /></div>
              <div>
                <h3>{stats.totalPlants}</h3>
                <p>{t("dashboard.statPlants")}</p>
              </div>
            </Link>
            <Link to="/plants?filter=healthy" className="stat-card card clickable">
              <div className="stat-icon"><Activity size={28} /></div>
              <div>
                <h3>{stats.healthyPlants}</h3>
                <p>{t("dashboard.statHealthyPlants")}</p>
              </div>
            </Link>
            <Link to="/diseases" className="stat-card card clickable">
              <div className="stat-icon"><Camera size={28} /></div>
              <div>
                <h3>{stats.diseasesDetected}</h3>
                <p>{t("dashboard.statDiseasesIdentified")}</p>
              </div>
            </Link>
            <Link to="/treatment" className="stat-card card clickable">
              <div className="stat-icon"><ShieldCheck size={28} /></div>
              <div>
                <h3>{stats.treatmentsAvailable}</h3>
                <p>{t("dashboard.statTreatmentsAvailable")}</p>
              </div>
            </Link>
          </div>
        )}

        <div className="quick-actions" style={{ marginTop: '4rem' }}>
          <h2 style={{ marginBottom: '2rem' }}>{t("dashboard.quickActions")}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <Link to="/plants" className="stat-card card clickable">
              <div className="stat-icon"><Plus size={24} /></div>
              <h3 style={{ fontSize: '1.25rem' }}>{t("dashboard.actionAddPlant")}</h3>
            </Link>
            <Link to="/disease" className="stat-card card clickable">
              <div className="stat-icon"><Camera size={24} /></div>
              <h3 style={{ fontSize: '1.25rem' }}>{t("dashboard.actionCheckDisease")}</h3>
            </Link>
            <Link to="/treatment" className="stat-card card clickable">
              <div className="stat-icon"><List size={24} /></div>
              <h3 style={{ fontSize: '1.25rem' }}>{t("dashboard.actionTreatments")}</h3>
            </Link>
            <Link to="/diseases" className="stat-card card clickable">
              <div className="stat-icon"><Activity size={24} /></div>
              <h3 style={{ fontSize: '1.25rem' }}>{t("dashboard.actionBrowseDiseases")}</h3>
            </Link>
            <Link to="/history" className="stat-card card clickable">
              <div className="stat-icon"><List size={24} /></div>
              <h3 style={{ fontSize: '1.25rem' }}>{t("dashboard.actionViewHistory")}</h3>
            </Link>
            <Link to="/settings" className="stat-card card clickable">
              <div className="stat-icon"><SettingsIcon size={24} /></div>
              <h3 style={{ fontSize: '1.25rem' }}>{t("dashboard.actionSettings")}</h3>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
