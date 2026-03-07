/**
 * Treatment History Page
 * Track active and completed treatments with cost estimates
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { predictionService } from "../services/api";
import { Activity, Clock, CheckCircle, AlertTriangle, ChevronRight, DollarSign, ExternalLink } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const TreatmentHistory = () => {
    const { t } = useLanguage();
    const [activeTreatments, setActiveTreatments] = useState([]);
    const [completedTreatments, setCompletedTreatments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCost, setTotalCost] = useState(0);

    useEffect(() => {
        loadTreatmentHistory();
    }, []);

    const loadTreatmentHistory = async () => {
        try {
            setLoading(true);
            const { data } = await predictionService.getHistory();
            const history = data.results || data;

            // Filter records that are being treated or have been treated
            const active = history.filter(p => p.treatment_status === 'in_progress');
            const completed = history.filter(p => p.treatment_status === 'treated');

            setActiveTreatments(active);
            setCompletedTreatments(completed);

            // Calculate total estimated cost (using lower bound of the range)
            let total = 0;
            active.forEach(item => {
                const costStr = item.disease_details?.treatments?.[0]?.cost_estimate || "";
                const match = costStr.match(/(\d+)/);
                if (match) {
                    total += parseInt(match[1].replace(/,/g, ''));
                }
            });
            setTotalCost(total);

            setLoading(false);
        } catch (error) {
            console.error("Error loading treatment history:", error);
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await predictionService.update(id, { treatment_status: newStatus });
            loadTreatmentHistory();
        } catch (error) {
            console.error("Error updating treatment status:", error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="page-container">
            <Navbar activePage="treatment-history" />
            <div className="page-content animate-slide-up">
                <div className="page-header" style={{ marginBottom: '2rem' }}>
                    <div>
                        <h1>{t("treatmentHistory.title")}</h1>
                        <p className="subtitle">{t("treatmentHistory.subtitle")}</p>
                    </div>
                    {activeTreatments.length > 0 && (
                        <div style={{
                            background: 'var(--primary-subtle)',
                            padding: '1rem 1.5rem',
                            borderRadius: '12px',
                            border: '1px solid var(--primary-light)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end'
                        }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
                                {t("treatmentHistory.totalEstimatedCost")}
                            </span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                                NPR {totalCost.toLocaleString()}
                            </span>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div className="loading-spinner-container">
                        <div className="spinner"></div>
                        <p>{t("treatmentHistory.loading")}</p>
                    </div>
                ) : (
                    <div className="treatment-history-sections" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                        {/* Active Treatments Section */}
                        <section>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <Activity size={20} className="text-warning" />
                                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{t("treatmentHistory.activeTreatments")}</h2>
                                <span className="badge warning" style={{ marginLeft: '0.5rem' }}>{activeTreatments.length}</span>
                            </div>

                            {activeTreatments.length > 0 ? (
                                <div className="treatment-history-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                                    {activeTreatments.map(item => (
                                        <TreatmentCard
                                            key={item.id}
                                            item={item}
                                            t={t}
                                            formatDate={formatDate}
                                            onUpdateStatus={updateStatus}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="no-results" style={{ padding: '3rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
                                    <Clock size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                                    <h3>{t("treatmentHistory.noActiveTreatments")}</h3>
                                    <p>{t("treatmentHistory.noActiveTreatmentsDesc")}</p>
                                    <Link to="/history" className="btn-primary mt-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {t("nav.history")} <ChevronRight size={16} />
                                    </Link>
                                </div>
                            )}
                        </section>

                        {/* Completed Treatments Section */}
                        {completedTreatments.length > 0 && (
                            <section>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <CheckCircle size={20} className="text-success" />
                                    <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{t("treatmentHistory.completedTreatments")}</h2>
                                    <span className="badge success" style={{ marginLeft: '0.5rem' }}>{completedTreatments.length}</span>
                                </div>

                                <div className="treatment-history-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                                    {completedTreatments.map(item => (
                                        <TreatmentCard
                                            key={item.id}
                                            item={item}
                                            t={t}
                                            formatDate={formatDate}
                                            onUpdateStatus={updateStatus}
                                            isCompleted={true}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

const TreatmentCard = ({ item, t, formatDate, onUpdateStatus, isCompleted = false }) => {
    const treatment = item.disease_details?.treatments?.[0];

    return (
        <div className={`treatment-record-card ${isCompleted ? 'completed' : 'active'}`} style={{
            background: 'var(--bg-card)',
            borderRadius: '16px',
            border: '1px solid var(--border-light)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'relative',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.3s ease'
        }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <img
                    src={item.image_url || item.image}
                    alt={item.disease_name}
                    style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{item.disease_name}</h4>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{item.plant_name}</p>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                            {formatDate(item.created_at)}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                        <span className={`badge ${item.severity === 'critical' || item.severity === 'severe' ? 'danger' : 'warning'}`} style={{ fontSize: '0.65rem' }}>
                            {item.severity?.toUpperCase()}
                        </span>
                        {treatment && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <DollarSign size={14} /> {treatment.cost_estimate}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {treatment && (
                <div style={{
                    padding: '0.75rem',
                    background: 'var(--bg-app)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-light)'
                }}>
                    <div style={{ fontWeight: 850, marginBottom: '0.2rem', color: 'var(--text-primary)' }}>{treatment.name}</div>
                    <div style={{ color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {treatment.description}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Link
                    to="/treatment"
                    state={{ initialDiseaseId: item.predicted_disease, initialDiseaseName: item.disease_name }}
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'center' }}
                >
                    <ExternalLink size={14} style={{ marginRight: '0.4rem' }} />
                    {t("treatmentHistory.viewProtocol")}
                </Link>

                {isCompleted ? (
                    <button
                        onClick={() => onUpdateStatus(item.id, 'in_progress')}
                        className="btn-secondary"
                        style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'center' }}
                    >
                        {t("treatmentHistory.markInProgress")}
                    </button>
                ) : (
                    <button
                        onClick={() => onUpdateStatus(item.id, 'treated')}
                        className="btn-primary"
                        style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem', justifyContent: 'center' }}
                    >
                        <CheckCircle size={14} style={{ marginRight: '0.4rem' }} />
                        {t("treatmentHistory.markAsTreated")}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TreatmentHistory;
