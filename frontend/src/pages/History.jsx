/**
 * Diagnosis History Log
 * Author: Drabesh Acharya
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { predictionService } from "../services/api";
import { Calendar, AlertTriangle, CheckCircle, ArrowRight, Clock, Trash2, Search, Edit, X, Activity, ShoppingCart, Leaf, Ban } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// ── Helpers ───────────────────────────────────────────────────────────
const getDisplayTitle = (pred, t) => {
    if (pred.treatment_status === 'non_plant' || pred.is_plant_image === false) return t("history.badgeNonLeaf");
    if (pred.treatment_status === 'out_of_scope' || pred.disease_name === 'Outside Scope' || pred.disease_name === 'Unrecognized')
        return t("history.badgeOutsideScope");
    if (pred.is_healthy || pred.disease_name === 'Healthy')
        return `${pred.plant_name || t("plants.plantName")} – ${t("history.badgeHealthy")}`;
    return pred.disease_name_ne && t.language === 'ne' ? pred.disease_name_ne : pred.disease_name;
};

const StatusBadge = ({ pred, t }) => {
    if (pred.is_plant_image === false)
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800, background: '#f1f5f9', color: '#475569' }}><Ban size={12} />{t("history.badgeNonLeaf")}</span>;
    if (pred.is_healthy)
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800, background: '#dcfce7', color: '#15803d' }}><CheckCircle size={12} />{t("history.badgeHealthy")}</span>;
    if (pred.disease_name === 'Outside Scope' || pred.treatment_status === 'out_of_scope' || !pred.disease_name)
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800, background: '#fef3c7', color: '#b45309' }}><AlertTriangle size={12} />{t("history.badgeOutsideScope")}</span>;
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800, background: '#fee2e2', color: '#dc2626' }}><AlertTriangle size={12} />{t("history.badgeDiseased")}</span>;
};

const SeverityBadge = ({ severity, t }) => {
    if (!severity || severity === 'unknown') return null;
    const map = {
        low: { bg: '#fef9c3', color: '#854d0e', label: t("history.severityLow") },
        minor: { bg: '#fef9c3', color: '#854d0e', label: t("history.severityLow") },
        moderate: { bg: '#ffedd5', color: '#9a3412', label: t("history.severityModerate") },
        severe: { bg: '#fee2e2', color: '#dc2626', label: t("history.severityHigh") },
        high: { bg: '#fee2e2', color: '#dc2626', label: t("history.severityHigh") },
        critical: { bg: '#fef2f2', color: '#991b1b', label: t("history.severityCritical") },
    };
    const s = map[severity?.toLowerCase()] || { bg: '#f1f5f9', color: '#475569', label: severity };
    return <span style={{ padding: '0.2rem 0.6rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 800, background: s.bg, color: s.color }}>{s.label}</span>;
};

const History = () => {
    const { t } = useLanguage();
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, healthy, infected
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPrediction, setEditingPrediction] = useState(null);
    const [infoModalData, setInfoModalData] = useState(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const { data } = await predictionService.getHistory();
            setPredictions(data.results || data);
            setLoading(false);
        } catch (error) {
            console.error("Error loading history:", error);
            setLoading(false);
        }
    };

    const filteredPredictions = predictions.filter(p => {
        if (filter === "healthy") return p.is_healthy;
        if (filter === "infected") return !p.is_healthy && p.is_plant_image && p.treatment_status !== 'out_of_scope' && p.disease_name !== 'Outside Scope' && p.disease_name !== 'Non-Leaf Image';
        if (filter === "outside_scope") return p.treatment_status === 'out_of_scope' || p.disease_name === 'Outside Scope';
        if (filter === "non_leaf") return p.is_plant_image === false || p.treatment_status === 'non_plant' || p.disease_name === 'Non-Leaf Image';
        return true;
    });

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleEdit = (prediction) => {
        setEditingPrediction(prediction);
        setShowEditModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t("history.deleteConfirm") || "Delete this scan record? This cannot be undone.")) {
            try {
                await predictionService.delete(id);
                // Remove from local state instead of re-fetching to preserve scroll position
                setPredictions(prev => prev.filter(p => p.id !== id));
            } catch (e) {
                console.error(e);
                alert(t("history.deleteFailed") || "Failed to delete record");
            }
        }
    };

    const handleUpdatePrediction = async (e) => {
        e.preventDefault();
        try {
            await predictionService.update(editingPrediction.id, {
                is_healthy: editingPrediction.is_healthy,
                severity: editingPrediction.severity,
                confidence: editingPrediction.confidence,
                treatment_status: editingPrediction.treatment_status
            });
            setShowEditModal(false);
            loadHistory();
        } catch (error) {
            console.error("Error updating prediction:", error);
            alert(t("history.updateFailed") || "Failed to update record");
        }
    };

    return (
        <div className="page-container">
            <Navbar activePage="history" />
            <div className="page-content animate-slide-up">
                <div className="page-header" style={{ marginBottom: '3rem' }}>
                    <div>
                        <h1>{t("history.title")}</h1>
                        <p className="subtitle">{t("history.subtitle")}</p>
                    </div>
                </div>

                <div className="filter-tabs-container" style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '2rem',
                    background: 'var(--bg-surface-inner)',
                    padding: '0.4rem',
                    borderRadius: '16px',
                    width: 'fit-content',
                    border: '1px solid var(--border-light)'
                }}>
                    {[
                        { id: 'all', label: t("history.filterAll"), icon: <Search size={16} /> },
                        { id: 'infected', label: t("history.filterInfected"), icon: <AlertTriangle size={16} />, color: '#dc2626' },
                        { id: 'healthy', label: t("history.filterHealthy"), icon: <CheckCircle size={16} />, color: '#15803d' },
                        { id: 'outside_scope', label: t("history.filterOutsideScope"), icon: <Leaf size={16} />, color: '#b45309' },
                        { id: 'non_leaf', label: t("history.filterNonLeaf"), icon: <Ban size={16} />, color: '#475569' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.6rem 1.2rem',
                                borderRadius: '12px',
                                border: 'none',
                                fontSize: '0.9rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                background: filter === tab.id ? (tab.color || 'var(--primary)') : 'transparent',
                                color: filter === tab.id ? 'white' : 'var(--text-secondary)',
                                boxShadow: filter === tab.id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="loading-spinner-container">
                        <div className="spinner"></div>
                        <p>{t("history.loading")}</p>
                    </div>
                ) : (
                    <div className="history-grid">
                        {filteredPredictions.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {filteredPredictions.map(pred => (
                                    <div key={pred.id} className="history-card animate-slide-up" style={{
                                        display: 'flex',
                                        background: 'var(--bg-surface-1)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-light)',
                                        overflow: 'hidden',
                                        padding: '1.5rem',
                                        alignItems: 'center',
                                        gap: '2rem',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}>
                                        {/* Image Thumbnail */}
                                        <div style={{ width: '100px', height: '100px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                            <img
                                                src={pred.image_url || pred.image}
                                                alt="Scan"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={(e) => e.target.src = 'https://placehold.co/100x100?text=No+Image'}
                                            />
                                        </div>

                                        {/* Content */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '1rem', flexWrap: 'wrap' }}>
                                                <h3 style={{
                                                    fontSize: '1.1rem', fontWeight: 900, margin: 0,
                                                    color: pred.is_plant_image === false ? '#475569'
                                                        : pred.is_healthy ? '#15803d'
                                                            : 'var(--text-main)'
                                                }}>
                                                    {getDisplayTitle(pred, t)}
                                                </h3>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
                                                    <Clock size={14} /> {formatDate(pred.created_at)}
                                                </span>
                                            </div>

                                            {/* Badges row */}
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <StatusBadge pred={pred} t={t} />
                                                <SeverityBadge severity={pred.severity} t={t} />
                                                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                    {t("history.confidence")}: <strong>{Math.round(pred.confidence || 0)}%</strong>
                                                </span>
                                                {!pred.is_healthy && pred.is_plant_image !== false && (
                                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                        {t("history.treatmentStatusLabel")}: <strong style={{ color: pred.treatment_status === 'treated' ? '#15803d' : pred.treatment_status === 'in_progress' ? '#b45309' : 'inherit' }}>
                                                            {pred.treatment_status === 'untreated' ? t("history.statusUntreated")
                                                                : pred.treatment_status === 'in_progress' ? t("history.statusInProgress")
                                                                    : pred.treatment_status === 'treated' ? t("history.statusTreated")
                                                                        : pred.treatment_status === 'healthy' ? t("history.statusHealthy")
                                                                            : pred.treatment_status || t("history.statusUntreated")}
                                                        </strong>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                {/* Button logic for special cases and valid cases */}
                                                {(pred.treatment_status === 'non_plant' || pred.is_plant_image === false || pred.treatment_status === 'out_of_scope' || pred.disease_name === 'Unrecognized') ? (
                                                    <button
                                                        onClick={() => setInfoModalData(pred)}
                                                        className="btn-secondary"
                                                        style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                                                    >
                                                        {t("history.viewDetails")}
                                                    </button>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <Link
                                                            to="/treatment"
                                                            state={{
                                                                initialDiseaseId: pred.predicted_disease,
                                                                initialDiseaseName: pred.disease_name,
                                                                fromHistory: true
                                                            }}
                                                            className="btn-secondary"
                                                            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                                                        >
                                                            {t("history.viewTreatment")}
                                                        </Link>

                                                        {pred.treatment_status === 'untreated' && !pred.is_healthy && (
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await predictionService.update(pred.id, { treatment_status: 'in_progress' });
                                                                        loadHistory();
                                                                    } catch (err) {
                                                                        console.error(err);
                                                                    }
                                                                }}
                                                                className="btn-primary"
                                                                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                                                                title="Move to Treatment History"
                                                            >
                                                                <Activity size={16} style={{ marginRight: '0.4rem' }} />
                                                                {t("history.startTreatment")}
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(pred)}
                                                    className="btn-secondary"
                                                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                >
                                                    <Edit size={16} />
                                                    {t("history.edit")}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(pred.id)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: '1px solid var(--danger)',
                                                        color: 'var(--danger)',
                                                        padding: '0.5rem',
                                                        borderRadius: 'var(--radius-sm)',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-results">
                                <Clock size={64} className="text-muted" />
                                <h3>{t("history.noHistoryTitle")}</h3>
                                <p>{t("history.noHistoryDesc")}</p>
                                <Link to="/disease" className="btn-primary mt-4">{t("history.startNewScan")}</Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Info Modal for Non-Plant / Out-of-Scope */}
            {infoModalData && (
                <div className="modal-overlay">
                    <div className="modal-content animate-slide-up" style={{ maxWidth: '450px', padding: '2rem' }}>
                        <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', margin: 0 }}>
                                {infoModalData.is_plant_image === false || infoModalData.treatment_status === 'non_plant' ? (
                                    <><Ban size={24} style={{ color: '#475569' }} /> {t("history.modalTitleNonPlant")}</>
                                ) : (
                                    <><AlertTriangle size={24} style={{ color: '#b45309' }} /> {t("history.modalTitleOutsideScope")}</>
                                )}
                            </h2>
                            <button className="close-btn" onClick={() => setInfoModalData(null)}><X /></button>
                        </div>
                        <div className="modal-body" style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                            {infoModalData.is_plant_image === false || infoModalData.treatment_status === 'non_plant' ? (
                                <p>{t("history.modalBodyNonPlant")}</p>
                            ) : (
                                <p>{t("history.modalBodyOutsideScope")}</p>
                            )}
                            <div style={{ background: 'var(--bg-surface-inner)', padding: '1rem', borderRadius: '12px', marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{t("detection.aiConfidenceLabel") || "AI Confidence"}</span>
                                <span style={{ fontWeight: 900, color: 'var(--primary)' }}>{Math.round(infoModalData.confidence || 0)}%</span>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ marginTop: '2rem', justifyContent: 'center' }}>
                            <button type="button" className="btn-primary" onClick={() => setInfoModalData(null)}>
                                {t("history.modalAcknowledge")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingPrediction && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{t("history.editTitle")}</h2>
                        <form onSubmit={handleUpdatePrediction}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    {t("history.healthStatus")}
                                </label>
                                <select
                                    value={editingPrediction.is_healthy}
                                    onChange={(e) => setEditingPrediction({ ...editingPrediction, is_healthy: e.target.value === 'true' })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-light)',
                                        background: 'var(--bg-card)',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value="true">{t("history.optionHealthy")}</option>
                                    <option value="false">{t("history.optionDiseased")}</option>
                                </select>
                            </div>

                            {!editingPrediction.is_healthy && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                        {t("history.severityLevel")}
                                    </label>
                                    <select
                                        value={editingPrediction.severity || 'moderate'}
                                        onChange={(e) => setEditingPrediction({ ...editingPrediction, severity: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--border-light)',
                                            background: 'var(--bg-card)',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        <option value="low">{t("history.severityLow")}</option>
                                        <option value="moderate">{t("history.severityModerate")}</option>
                                        <option value="high">{t("history.severityHigh")}</option>
                                        <option value="critical">{t("history.severityCritical")}</option>
                                    </select>
                                </div>
                            )}

                            {!editingPrediction.is_healthy && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                        {t("history.treatmentStatusLabel")}
                                    </label>
                                    <select
                                        value={editingPrediction.treatment_status || 'untreated'}
                                        onChange={(e) => setEditingPrediction({ ...editingPrediction, treatment_status: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-sm)',
                                            border: '1px solid var(--border-light)',
                                            background: 'var(--bg-card)',
                                            color: 'var(--text-primary)'
                                        }}
                                    >
                                        <option value="untreated">{t("history.statusUntreated")}</option>
                                        <option value="in_progress">{t("history.statusInProgress")}</option>
                                        <option value="treated">{t("history.statusTreated")}</option>
                                    </select>
                                </div>
                            )}

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    {t("history.confidenceLabel")}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={editingPrediction.confidence || 0}
                                    onChange={(e) => setEditingPrediction({ ...editingPrediction, confidence: parseFloat(e.target.value) })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-light)',
                                        background: 'var(--bg-card)',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="btn-secondary"
                                >
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

export default History;
