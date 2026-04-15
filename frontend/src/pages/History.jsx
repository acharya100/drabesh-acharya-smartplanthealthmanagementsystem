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
import { useNavigate } from "react-router-dom";
import { useOfflineSync } from "../context/OfflineSyncContext";
import { offlineStore } from "../utils/offlineStore";

// ── Helpers ───────────────────────────────────────────────────────────

// Normalise treatment_status-based invalid flags introduced by both old and new API
const isNonPlantRecord = (pred) => pred.is_plant_image === false || pred.treatment_status === 'non_plant';
const isOutOfScopeRecord = (pred) => pred.treatment_status === 'out_of_scope' ||
    pred.disease_name === 'Outside Scope' || pred.disease_name === 'out_of_scope' ||
    pred.disease_name === 'Unrecognized';
const isInvalidRecord = (pred) => isNonPlantRecord(pred) || isOutOfScopeRecord(pred);

const getDisplayTitle = (pred, t) => {
    if (isNonPlantRecord(pred)) return t("history.badgeNonLeaf") || 'Non-Plant Image';
    if (isOutOfScopeRecord(pred)) return t("history.badgeOutsideScope") || 'Outside Scope';
    if (pred.is_healthy || pred.disease_name === 'Healthy')
        return `${pred.plant_name || t("plants.plantName")} – ${t("history.badgeHealthy")}`;
    return pred.disease_name_ne && t.language === 'ne' ? pred.disease_name_ne : pred.disease_name;
};

const StatusBadge = ({ pred, t }) => {
    if (isNonPlantRecord(pred))
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800, background: '#f1f5f9', color: '#475569' }}><Ban size={12} />{t("history.badgeNonLeaf") || 'Non-Plant Image'}</span>;
    if (pred.is_healthy)
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800, background: '#dcfce7', color: '#15803d' }}><CheckCircle size={12} />{t("history.badgeHealthy")}</span>;
    if (isOutOfScopeRecord(pred) || pred.disease_name === 'Outside Scope' || pred.disease_name === 'Not Applicable' || !pred.disease_name)
        return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800, background: '#fef3c7', color: '#b45309' }}><AlertTriangle size={12} />{t("history.badgeOutsideScope") || 'Outside Scope'}</span>;
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.75rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 800, background: '#fee2e2', color: '#dc2626' }}><AlertTriangle size={12} />{t("history.badgeDiseased")}</span>;
};

const SeverityBadge = ({ severity, t }) => {
    if (!severity || severity === 'unknown') return null;
    const map = {
        minor: { bg: '#fef9c3', color: '#854d0e', label: t("history.severityLow") || "Minor" },
        moderate: { bg: '#ffedd5', color: '#9a3412', label: t("history.severityModerate") || "Moderate" },
        severe: { bg: '#fee2e2', color: '#dc2626', label: t("history.severityHigh") || "Severe" },
        critical: { bg: '#fef2f2', color: '#991b1b', label: t("history.severityCritical") || "Critical" },
    };
    const s = map[severity?.toLowerCase()] || { bg: '#f1f5f9', color: '#475569', label: severity };
    return <span style={{ padding: '0.2rem 0.6rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 800, background: s.bg, color: s.color }}>{s.label}</span>;
};

const History = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { isOnline, enqueueAction } = useOfflineSync();
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, healthy, infected
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPrediction, setEditingPrediction] = useState(null);
    const [infoModalData, setInfoModalData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);

            let reconciledHistory = [];
            
            // Always attempt local backend — Django on localhost is accessible without internet
            const { data } = await predictionService.getHistory();
            const history = data.results || data;
            reconciledHistory = offlineStore.applyOfflineUpdates(history);

            setPredictions(reconciledHistory);
            if (!silent) setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error("Error loading history:", error);
            setPredictions(prev => offlineStore.applyOfflineUpdates(prev));
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filteredPredictions = predictions.filter(p => {
        if (filter === "healthy") return p.is_healthy;
        if (filter === "infected") return !p.is_healthy && !isInvalidRecord(p) && p.disease_name !== 'Not Applicable';
        if (filter === "outside_scope") return isOutOfScopeRecord(p) || p.disease_name === 'Outside Scope' || p.disease_name === 'Not Applicable';
        if (filter === "non_plant") return isNonPlantRecord(p) || p.disease_name === 'Non-Plant Image';
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
            // Always try local backend; catch block enqueues on failure
            try {
                await predictionService.delete(id);
                setPredictions(prev => prev.filter(p => p.id !== id));
            } catch (e) {
                console.error(e);
                enqueueAction('DELETE_PRED', id, {});
                setPredictions(prev => offlineStore.applyOfflineUpdates(prev.filter(p => p.id !== id)));
            }
        }
    };

    const handleUpdatePrediction = async (e) => {
        e.preventDefault();
        const payload = {
            is_healthy: editingPrediction.is_healthy,
            severity: editingPrediction.severity,
            confidence: editingPrediction.confidence,
            treatment_status: editingPrediction.treatment_status,
            estimated_cost: parseFloat(editingPrediction.estimated_cost)
        };

        // Always try local backend first; enqueue if it fails
        try {
            await predictionService.update(editingPrediction.id, payload);
            setShowEditModal(false);
            loadHistory(true); // Silent reload
        } catch (error) {
            console.error("Error updating prediction:", error);
            enqueueAction('UPDATE_PRED', editingPrediction.id, payload);
            setShowEditModal(false);
            setPredictions(prev => offlineStore.applyOfflineUpdates(prev));
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
                        { id: 'non_plant', label: t("history.filterNonLeaf"), icon: <Ban size={16} />, color: '#475569' }
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
                                                {/* Only show severity/confidence for valid plant records */}
                                                {!isInvalidRecord(pred) && (
                                                    <>
                                                        <SeverityBadge severity={pred.severity} t={t} />
                                                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                                            {t("history.confidence")}: <strong>{Math.round(pred.confidence || 0)}%</strong>
                                                        </span>
                                                    </>
                                                )}
                                                {!pred.is_healthy && !isInvalidRecord(pred) && (
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
                                                {isInvalidRecord(pred) ? (
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
                                                                        navigate("/treatment-history");
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

            {/* ── Info Modal: Non-Plant / Out-of-Scope ─────────────────────────── */}
            {infoModalData && (
                <div className="modal-overlay" onClick={() => setInfoModalData(null)}>
                    <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px', padding: '2rem' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: isNonPlantRecord(infoModalData) ? '#64748b' : '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {isNonPlantRecord(infoModalData) ? <Ban size={22} color="white" /> : <AlertTriangle size={22} color="white" />}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                                        {isNonPlantRecord(infoModalData) ? 'NOT A PLANT IMAGE' : 'OUTSIDE SUPPORTED DATASET'}
                                    </div>
                                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)' }}>
                                        {isNonPlantRecord(infoModalData) ? (t('history.modalTitleNonPlant') || 'Non-Plant Image') : (t('history.modalTitleOutsideScope') || 'Outside Scope')}
                                    </h2>
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setInfoModalData(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem' }}><X size={20} /></button>
                        </div>

                        {/* Canonical data rows */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            {[
                                { label: 'Plant Name', value: isNonPlantRecord(infoModalData) ? 'Non-Plant Image' : 'Outside Scope' },
                                { label: 'Scientific Name', value: isNonPlantRecord(infoModalData) ? 'Non-Plant Image' : 'Outside Scope' },
                                { label: 'Disease', value: 'Not Applicable' },
                                { label: 'Severity', value: 'Not Applicable' },
                            ].map(row => (
                                <div key={row.label} style={{ background: 'var(--bg-main)', borderRadius: 10, padding: '0.75rem 1rem', border: '1px solid var(--border-light)' }}>
                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{row.label}</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{row.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Explanation */}
                        <div style={{ background: isNonPlantRecord(infoModalData) ? '#f8fafc' : '#fffbeb', borderRadius: 10, padding: '1rem', border: `1px solid ${isNonPlantRecord(infoModalData) ? '#e2e8f0' : '#fde68a'}`, marginBottom: '1.5rem' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                                {isNonPlantRecord(infoModalData)
                                    ? (t('history.modalBodyNonPlant') || 'The uploaded image does not contain a plant leaf. Please upload a clear, close-up photo of a plant leaf for disease analysis.')
                                    : (t('history.modalBodyOutsideScope') || 'This plant species is not currently supported by our disease detection models. Currently supported: Apple, Cherry, Corn, Grape, Orange, Peach, Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato, Blueberry.')}
                            </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button type="button" className="btn-primary" style={{ minWidth: 140 }} onClick={() => setInfoModalData(null)}>
                                {t('history.modalAcknowledge') || 'Understood'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Modal ─────────────────────────────────────────────── */}
            {showEditModal && editingPrediction && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{t("history.editTitle")}</h2>

                        {/* For invalid records — show read-only summary, no editable fields */}
                        {isInvalidRecord(editingPrediction) ? (
                            <div>
                                <div style={{ background: 'var(--bg-main)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--border-light)', marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Classification Summary</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        {[
                                            { label: 'Plant Name', value: isNonPlantRecord(editingPrediction) ? 'Non-Plant Image' : 'Outside Scope' },
                                            { label: 'Disease', value: 'Not Applicable' },
                                            { label: 'Severity', value: 'Not Applicable' },
                                            { label: 'Status', value: isNonPlantRecord(editingPrediction) ? 'Non-Plant Image' : 'Outside Scope' },
                                        ].map(row => (
                                            <div key={row.label} style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '0.7rem 0.9rem', border: '1px solid var(--border-light)' }}>
                                                <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{row.label}</div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{row.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                                    This record is classified as an invalid scan and cannot be edited as a plant record. You may delete it if no longer needed.
                                </p>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">{t("history.cancel")}</button>
                                </div>
                            </div>
                        ) : (
                            /* For valid records — show editable form */
                            <form onSubmit={handleUpdatePrediction}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                        {t("history.healthStatus")}
                                    </label>
                                    <select
                                        value={editingPrediction.is_healthy ? "true" : "false"}
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
                                    <div className="severity-cost-override" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div>
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
                                                <option value="minor">{t("history.severityLow") || "Minor"}</option>
                                                <option value="moderate">{t("history.severityModerate") || "Moderate"}</option>
                                                <option value="severe">{t("history.severityHigh") || "Severe"}</option>
                                                <option value="critical">{t("history.severityCritical") || "Critical"}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                                {t("history.estimatedCost") || "Estimated Cost (NPR)"}
                                            </label>
                                            <input
                                                type="number"
                                                value={editingPrediction.estimated_cost || 0}
                                                onChange={(e) => setEditingPrediction({ ...editingPrediction, estimated_cost: parseFloat(e.target.value) })}
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
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default History;
