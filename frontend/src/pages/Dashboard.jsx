/**
 * Main Dashboard
 * Author: Drabesh Acharya
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Leaf, Activity, ShieldCheck, Plus, Camera, List, Settings as SettingsIcon, Clock, ChevronRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import * as api from "../services/api";

const Dashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalPlants: 0,
    healthyPlants: 0,
    diseasesDetected: 0,
    treatmentsAvailable: 0
  });
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, historyRes] = await Promise.all([
        api.plantService.getStatistics(),
        api.predictionService.getHistory()
      ]);

      const statsData = statsRes.data;
      setStats({
        totalPlants: statsData.total_plants,
        healthyPlants: statsData.healthy_plants,
        diseasesDetected: statsData.diseases_detected,
        treatmentsAvailable: statsData.treatments_available
      });

      const historyData = historyRes.data.results || historyRes.data;
      setRecentPredictions(historyData.slice(0, 4));

      setLoading(false);
    } catch (error) {
      console.error("Dashboard and history data error:", error);
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <Navbar activePage="dashboard" />
      <div className="page-content animate-slide-up" style={{ padding: '2rem 3rem' }}>
        {/* Professional Hero Section */}
        <div className="dashboard-hero" style={{
          background: 'linear-gradient(135deg, var(--primary), #064e3b)',
          padding: '3rem',
          borderRadius: '30px',
          color: '#fff',
          marginBottom: '3rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.5rem' }}>
              {t("nav.welcome")} <span style={{ color: '#6ee7b7' }}>{sessionStorage.getItem("username") || "User"}</span>
            </h1>
            <p className="subtitle" style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', maxWidth: '600px' }}>
              {t("dashboard.subtitle")}
            </p>
          </div>
          {/* Subtle background decoration */}
          <div style={{
            position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px',
            background: 'radial-gradient(circle, rgba(110,231,183,0.15) 0%, transparent 70%)',
            borderRadius: '50%'
          }}></div>
        </div>

        {loading ? (
          <div className="loading-spinner-container">
            <div className="spinner"></div>
            <p>{t("dashboard.loading")}</p>
          </div>
        ) : (
          <div className="stats-grid" style={{ marginBottom: '4rem' }}>
            <Link to="/plants" className="stat-card professional-card" style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-light)'
            }}>
              <div className="stat-icon" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}><Leaf size={28} /></div>
              <div>
                <h3>{stats.totalPlants}</h3>
                <p>{t("dashboard.statPlants")}</p>
              </div>
            </Link>

            <Link to="/plants?filter=healthy" className="stat-card professional-card" style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-light)'
            }}>
              <div className="stat-icon" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}><Activity size={28} /></div>
              <div>
                <h3>{stats.healthyPlants}</h3>
                <p>{t("dashboard.statHealthyPlants")}</p>
              </div>
            </Link>

            <Link to="/history" className="stat-card professional-card" style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-light)'
            }}>
              <div className="stat-icon" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}><Camera size={28} /></div>
              <div>
                <h3>{stats.diseasesDetected}</h3>
                <p>{t("dashboard.statDiseasesIdentified")}</p>
              </div>
            </Link>

            <Link to="/treatment" className="stat-card professional-card" style={{
              background: 'var(--bg-surface-1)',
              border: '1px solid var(--border-light)'
            }}>
              <div className="stat-icon" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}><ShieldCheck size={28} /></div>
              <div>
                <h3>{stats.treatmentsAvailable}</h3>
                <p>{t("dashboard.statTreatmentsAvailable")}</p>
              </div>
            </Link>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>
          {/* Quick Actions */}
          <div className="quick-actions">
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '2rem' }}>{t("dashboard.quickActions")}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <Link to="/plants" className="stat-card professional-card action-card">
                <div className="stat-icon" style={{ background: 'var(--bg-surface-inner)' }}><Plus size={24} /></div>
                <h3 style={{ fontSize: '1.1rem' }}>{t("dashboard.actionAddPlant")}</h3>
              </Link>
              <Link to="/disease" className="stat-card professional-card action-card">
                <div className="stat-icon" style={{ background: 'var(--bg-surface-inner)' }}><Camera size={24} /></div>
                <h3 style={{ fontSize: '1.1rem' }}>{t("dashboard.actionCheckDisease")}</h3>
              </Link>
              <Link to="/treatment" className="stat-card professional-card action-card">
                <div className="stat-icon" style={{ background: 'var(--bg-surface-inner)' }}><List size={24} /></div>
                <h3 style={{ fontSize: '1.1rem' }}>{t("dashboard.actionTreatments")}</h3>
              </Link>
              <Link to="/store" className="stat-card professional-card action-card" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}>
                <div className="stat-icon" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}><ShieldCheck size={24} /></div>
                <h3 style={{ fontSize: '1.1rem' }}>{t("dashboard.actionOpenStore") || "Open Store"}</h3>
              </Link>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="recent-activity">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0 }}>{t("dashboard.recentActivity") || "Recent"}</h2>
              <Link to="/history" style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                {t("dashboard.viewAll") || "View All"} <ChevronRight size={16} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {recentPredictions.length > 0 ? recentPredictions.map(item => (
                <div key={item.id} className="activity-item" style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem', background: 'var(--bg-card)', borderRadius: '16px',
                  border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)'
                }}>
                  <img src={item.image_url || item.image} alt="" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{item.disease_name}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.plant_name}</p>
                  </div>
                  <div className={`badge ${item.is_healthy ? 'success' : 'danger'}`} style={{ fontSize: '0.65rem' }}>
                    {item.is_healthy ? 'HEALTHY' : 'DISEASED'}
                  </div>
                </div>
              )) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-app)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
                  <Clock size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
