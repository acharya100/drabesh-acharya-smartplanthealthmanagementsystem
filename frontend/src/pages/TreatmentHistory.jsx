/**
 * Treatment History Page
 * Track active and completed treatments with cost estimates
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { predictionService } from "../services/api";
import { Activity, Clock, CheckCircle, AlertTriangle, ChevronRight, DollarSign, ExternalLink, Edit, Trash2, X } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const TreatmentHistory = () => {
    const { t } = useLanguage();
    const [activeTreatments, setActiveTreatments] = useState([]);
    const [completedTreatments, setCompletedTreatments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCost, setTotalCost] = useState(0);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPrediction, setEditingPrediction] = useState(null);

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

    const handleEdit = (prediction) => {
        setEditingPrediction({ ...prediction });
        setShowEditModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t("history.deleteConfirm") || "Delete this record?")) {
            try {
                await predictionService.delete(id);
                loadTreatmentHistory();
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleUpdatePrediction = async (e) => {
        e.preventDefault();
        try {
            await predictionService.update(editingPrediction.id, {
                is_healthy: editingPrediction.is_healthy,
                severity: editingPrediction.severity,
                treatment_status: editingPrediction.treatment_status
            });
            setShowEditModal(false);
            loadTreatmentHistory();
        } catch (error) {
            console.error("Error updating prediction:", error);
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
                                <div className="treatment-history-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '2rem' }}>
                                    {activeTreatments.map(item => (
                                        <TreatmentCard
                                            key={item.id}
                                            item={item}
                                            t={t}
                                            formatDate={formatDate}
                                            onUpdateStatus={updateStatus}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="no-results" style={{ padding: '3rem', background: 'var(--bg-surface-1)', borderRadius: '16px', border: '1px dashed var(--border-light)' }}>
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

                                <div className="treatment-history-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '2rem' }}>
                                    {completedTreatments.map(item => (
                                        <TreatmentCard
                                            key={item.id}
                                            item={item}
                                            t={t}
                                            formatDate={formatDate}
                                            onUpdateStatus={updateStatus}
                                            isCompleted={true}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && editingPrediction && (
                <div className="modal-overlay">
                    <div className="modal-content animate-slide-up" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Edit size={20} /> {t("history.editTitle")}
                            </h2>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleUpdatePrediction}>
                            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div className="form-group">
                                    <label>{t("history.healthStatus")}</label>
                                    <select
                                        value={editingPrediction.is_healthy ? "healthy" : "diseased"}
                                        onChange={(e) => setEditingPrediction({ ...editingPrediction, is_healthy: e.target.value === "healthy" })}
                                        className="form-control"
                                    >
                                        <option value="healthy">{t("history.optionHealthy")}</option>
                                        <option value="diseased">{t("history.optionDiseased")}</option>
                                    </select>
                                </div>

                                {!editingPrediction.is_healthy && (
                                    <div className="form-group">
                                        <label>{t("history.severityLevel")}</label>
                                        <select
                                            value={editingPrediction.severity}
                                            onChange={(e) => setEditingPrediction({ ...editingPrediction, severity: e.target.value })}
                                            className="form-control"
                                        >
                                            <option value="low">{t("history.severityLow")}</option>
                                            <option value="moderate">{t("history.severityModerate")}</option>
                                            <option value="high">{t("history.severityHigh")}</option>
                                            <option value="critical">{t("history.severityCritical")}</option>
                                        </select>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>{t("history.treatmentStatusLabel")}</label>
                                    <select
                                        value={editingPrediction.treatment_status}
                                        onChange={(e) => setEditingPrediction({ ...editingPrediction, treatment_status: e.target.value })}
                                        className="form-control"
                                    >
                                        <option value="untreated">{t("history.statusUntreated")}</option>
                                        <option value="in_progress">{t("history.statusInProgress")}</option>
                                        <option value="treated">{t("history.statusTreated")}</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>
                                    {t("history.cancel")}
                                </button>
                                <button type="submit" className="btn-primary">
                                    {t("history.saveChanges")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const TreatmentCard = ({ item, t, formatDate, onUpdateStatus, isCompleted = false, onEdit, onDelete }) => {
    const treatment = item.disease_details?.treatments?.[0];

    // Calculate duration
    const createdDate = new Date(item.created_at);
    const today = new Date();
    const diffTime = Math.abs(today - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return (
        <div className={`treatment-record-card ${isCompleted ? 'completed' : 'active'}`} style={{
            background: 'var(--bg-surface-1)',
            borderRadius: '20px',
            border: '1px solid var(--border-light)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            position: 'relative',
            boxShadow: 'var(--shadow-md)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
        }}>
            {/* Action Buttons */}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={() => onEdit(item)}
                    style={{ background: 'var(--bg-surface-inner)', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', color: 'var(--text-muted)' }}
                    title={t("history.edit")}
                >
                    <Edit size={16} />
                </button>
                <button
                    onClick={() => onDelete(item.id)}
                    style={{ background: 'var(--bg-surface-inner)', border: 'none', padding: '0.5rem', borderRadius: '8px', cursor: 'pointer', color: 'var(--danger)' }}
                    title={t("history.delete")}
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem' }}>
                <div style={{ position: 'relative' }}>
                    <img
                        src={item.image_url || item.image}
                        alt={item.disease_name}
                        style={{ width: '100px', height: '100px', borderRadius: '16px', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border-light)' }}
                    />
                    {!isCompleted && (
                        <div style={{
                            position: 'absolute',
                            bottom: '-8px',
                            right: '-8px',
                            background: 'var(--warning)',
                            color: '#fff',
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '10px',
                            fontWeight: 700,
                            boxShadow: 'var(--shadow-sm)'
                        }}>
                            {diffDays}d
                        </div>
                    )}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: '4rem' }}>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>{item.disease_name}</h4>
                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600 }}>{item.plant_name}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                        <span className={`badge ${item.severity === 'critical' || item.severity === 'severe' ? 'danger' : 'warning'}`} style={{ fontSize: '0.7rem' }}>
                            {item.severity?.toUpperCase()}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            <Clock size={14} />
                            {formatDate(item.created_at)}
                        </div>
                    </div>
                </div>
            </div>

            {treatment ? (
                <div style={{
                    padding: '1rem',
                    background: 'linear-gradient(135deg, var(--bg-surface-inner), var(--bg-surface-1))',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    border: '1px solid var(--border-light)',
                    position: 'relative'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 850, color: 'var(--text-primary)' }}>{treatment.name}</div>
                        <div style={{ color: 'var(--primary)', fontWeight: 800 }}>
                            NPR {treatment.cost_estimate?.replace('NPR ', '')}
                        </div>
                    </div>
                    <div style={{ color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {treatment.description}
                    </div>
                </div>
            ) : (
                <div style={{ padding: '1rem', background: 'var(--bg-surface-inner)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border-light)' }}>
                    {t("detection.noTreatmentFound")}
                </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                <Link
                    to="/treatment"
                    state={{
                        initialDiseaseId: item.predicted_disease,
                        initialDiseaseName: item.disease_name,
                        fromHistory: true
                    }}
                    className="btn-secondary"
                    style={{ flex: 1.2, fontSize: '0.85rem', padding: '0.6rem', justifyContent: 'center', borderRadius: '10px' }}
                >
                    <ExternalLink size={16} />
                    {t("treatmentHistory.viewProtocol")}
                </Link>

                {isCompleted ? (
                    <button
                        onClick={() => onUpdateStatus(item.id, 'in_progress')}
                        className="btn-secondary"
                        style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem', justifyContent: 'center', borderRadius: '10px' }}
                    >
                        <Activity size={16} />
                        {t("treatmentHistory.markInProgress")}
                    </button>
                ) : (
                    <button
                        onClick={() => onUpdateStatus(item.id, 'treated')}
                        className="btn-primary"
                        style={{ flex: 1, fontSize: '0.85rem', padding: '0.6rem', justifyContent: 'center', borderRadius: '10px' }}
                    >
                        <CheckCircle size={16} />
                        {t("treatmentHistory.markAsTreated")}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TreatmentHistory;
