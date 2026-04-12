/**
 * Treatment History Page
 * Track active and completed treatments with cost estimates
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { predictionService } from "../services/api";
import { Activity, Clock, CheckCircle, AlertTriangle, ChevronRight, DollarSign, ExternalLink, Edit, Trash2, X, Ban, Leaf } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import TreatmentStatusDropdown from "../components/TreatmentStatusDropdown";
import SeveritySelector from "../components/SeveritySelector";
import TreatmentFilterTabs from "../components/TreatmentFilterTabs";
import { offlineStore } from "../utils/offlineStore";

// ── Shared helpers ──────────────────────────────────────────────────────────
const getCardTitle = (item, t) => {
    if (item.treatment_status === 'non_plant' || item.is_plant_image === false)
        return t("treatmentFilters.non_plant");
    if (item.treatment_status === 'out_of_scope' || item.disease_name === 'Unrecognized')
        return t("treatmentFilters.out_of_scope");
    if (item.is_healthy || item.treatment_status === 'healthy')
        return `${item.plant_name || 'Plant'} – ${t("history.badgeHealthy")}`;
    return item.disease_name || 'Unknown Disease';
};

const SEV_MAP = {
    low: { bg: '#fef9c3', color: '#854d0e', label: 'Low' },
    minor: { bg: '#fef9c3', color: '#854d0e', label: 'Minor' },
    moderate: { bg: '#ffedd5', color: '#c2410c', label: 'Moderate' },
    high: { bg: '#fee2e2', color: '#dc2626', label: 'Severe' },
    severe: { bg: '#fee2e2', color: '#dc2626', label: 'Severe' },
    critical: { bg: '#fef2f2', color: '#991b1b', label: 'Critical' },
};

const SeverityBadge = ({ severity }) => {
    if (!severity || severity === 'unknown') return null;
    const s = SEV_MAP[severity.toLowerCase()] || { bg: '#f1f5f9', color: '#475569', label: severity };
    return (
        <span style={{
            display: 'inline-block', padding: '0.2rem 0.7rem',
            borderRadius: 100, fontSize: '0.7rem', fontWeight: 800,
            background: s.bg, color: s.color, textTransform: 'uppercase'
        }}>{s.label}</span>
    );
};

const COST_MAP = { low: 250, minor: 250, moderate: 350, high: 450, severe: 450, critical: 450 };
const getCost = (severity) => COST_MAP[severity?.toLowerCase()] || 250;

const TreatmentHistory = () => {
    const { t } = useLanguage();
    const [historyItems, setHistoryItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
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

            // Filter records that are part of treatment history
            const validHistory = history.filter(p => ['untreated', 'in_progress', 'treated', 'healthy', 'non_plant', 'out_of_scope'].includes(p.treatment_status));

            // Apply offline updates (local overrides)
            const reconciledHistory = offlineStore.applyOfflineUpdates(validHistory);

            setHistoryItems(reconciledHistory);

            // Calculate total estimated cost (for active ones)
            let total = 0;
            reconciledHistory.filter(p => !['treated', 'healthy', 'non_plant', 'out_of_scope'].includes(p.treatment_status) && !p.is_healthy).forEach(item => {
                const sev = item.severity?.toLowerCase();
                let cost = 250;
                if (sev === 'moderate') cost = 350;
                if (sev === 'severe' || sev === 'high' || sev === 'critical') cost = 450;
                total += cost;
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

    const updateSeverity = async (id, newSeverity) => {
        try {
            await predictionService.update(id, { severity: newSeverity });
            // Optimistic update in local state
            setHistoryItems(prev => prev.map(item =>
                item.id === id ? { ...item, severity: newSeverity } : item
            ));
            loadTreatmentHistory(); // Reload to get fresh cost total
        } catch (error) {
            console.error("Error updating severity:", error);
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
                treatment_status: editingPrediction.treatment_status,
                estimated_cost: editingPrediction.estimated_cost
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

    const filteredItems = historyItems.filter(item => {
        if (filter === 'all') return true;
        if (filter === 'healthy') return item.is_healthy || item.treatment_status === 'healthy';
        return item.treatment_status === filter;
    });

    const activeCount = historyItems.filter(p => !['treated', 'healthy', 'non_plant', 'out_of_scope'].includes(p.treatment_status) && !p.is_healthy).length;

    return (
        <div className="page-container">
            <Navbar activePage="treatment-history" />
            <div className="page-content animate-slide-up">
                <div className="page-header" style={{ marginBottom: '2rem' }}>
                    <div>
                        <h1>{t("treatmentHistory.title")}</h1>
                        <p className="subtitle">{t("treatmentHistory.subtitle")}</p>
                    </div>
                    {activeCount > 0 && (
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

                {/* ── NEW: TreatmentFilterTabs component ── */}
                <TreatmentFilterTabs activeFilter={filter} onChange={setFilter} />

                {loading ? (
                    <div className="loading-spinner-container">
                        <div className="spinner"></div>
                        <p>{t("treatmentHistory.loading")}</p>
                    </div>
                ) : (
                    <div className="treatment-history-sections" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                        {filteredItems.length > 0 ? (
                            <div className="treatment-history-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '2rem' }}>
                                {filteredItems.map(item => (
                                    <TreatmentCard
                                        key={item.id}
                                        item={item}
                                        t={t}
                                        formatDate={formatDate}
                                        onUpdateStatus={updateStatus}
                                        onUpdateSeverity={updateSeverity}
                                        isCompleted={item.treatment_status === 'treated'}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        getCardTitle={getCardTitle}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="no-results" style={{ padding: '3rem', background: 'var(--bg-surface-1)', borderRadius: '16px', border: '1px dashed var(--border-light)', gridColumn: '1 / -1' }}>
                                <Clock size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
                                <h3>{t("treatmentHistory.noActiveTreatments") || "No Treatments Found"}</h3>
                                <p>There are no treatments matching the currently selected filter.</p>
                                <Link to="/history" className="btn-primary mt-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {t("nav.history")} <ChevronRight size={16} />
                                </Link>
                            </div>
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

                                {/* ── NEW: SeveritySelector component ── */}
                                {!editingPrediction.is_healthy && editingPrediction.treatment_status !== 'healthy' && (
                                    <div className="form-group">
                                        <label>{t("history.severityLevel")}</label>
                                        <SeveritySelector
                                            severity={editingPrediction.severity || 'low'}
                                            onChange={(val) => setEditingPrediction({ ...editingPrediction, severity: val })}
                                            treatmentStatus={editingPrediction.treatment_status}
                                        />
                                    </div>
                                )}

                                {!editingPrediction.is_healthy && (
                                    <div className="form-group">
                                        <label>Estimated Price (NPR)</label>
                                        <input
                                            type="number"
                                            value={editingPrediction.estimated_cost || (editingPrediction.severity === 'moderate' ? 350 : (editingPrediction.severity === 'severe' ? 450 : 250))}
                                            onChange={(e) => setEditingPrediction({ ...editingPrediction, estimated_cost: e.target.value })}
                                            className="form-control"
                                        />
                                    </div>
                                )}

                                {/* ── NEW: TreatmentStatusDropdown component (edit modal) ── */}
                                <div className="form-group">
                                    <label>{t("history.treatmentStatusLabel")}</label>
                                    <TreatmentStatusDropdown
                                        value={editingPrediction.treatment_status || 'untreated'}
                                        onChange={(val) => setEditingPrediction({ ...editingPrediction, treatment_status: val })}
                                    />
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

const TreatmentCard = ({ item, t, formatDate, onUpdateStatus, onUpdateSeverity, isCompleted = false, onEdit, onDelete, getCardTitle }) => {
    const treatment = item.disease_details?.treatments?.[0];

    // Calculate duration
    const createdDate = new Date(item.created_at);
    const today = new Date();
    const diffTime = Math.abs(today - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const isHealthyStatus = item.is_healthy || item.treatment_status === 'healthy';
    const isNonPlant = item.treatment_status === 'non_plant' || item.is_plant_image === false;
    const isOutOfScope = item.treatment_status === 'out_of_scope' || item.disease_name === 'Unrecognized';
    const isSpecialCase = isNonPlant || isOutOfScope;

    // Cost display
    let estimatedCost;
    if (isHealthyStatus || isSpecialCase) {
        estimatedCost = null; // don't show cost
    } else {
        estimatedCost = `NPR ${getCost(item.severity).toLocaleString()}`;
    }

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
                    <div style={{ paddingRight: '4.5rem' }}>
                        {/* Title */}
                        <h4 style={{
                            margin: 0, fontSize: '1.05rem', fontWeight: 900,
                            color: isSpecialCase ? '#64748b' : (isHealthyStatus ? '#15803d' : 'var(--text-primary)'),
                            lineHeight: 1.3
                        }}>
                            {getCardTitle(item, t)}
                        </h4>
                        {item.plant_name && !isNonPlant && !isOutOfScope && (
                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                                {item.plant_name}
                            </p>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                        {/* Status badge */}
                        {isNonPlant && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.7rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 800, background: '#f1f5f9', color: '#475569' }}>
                                <Ban size={11} />Non-Plant
                            </span>
                        )}
                        {isOutOfScope && !isNonPlant && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.7rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 800, background: '#f3e8ff', color: '#6d28d9' }}>
                                <AlertTriangle size={11} />Out of Scope
                            </span>
                        )}
                        {isHealthyStatus && !isSpecialCase && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.7rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 800, background: '#dcfce7', color: '#15803d' }}>
                                <CheckCircle size={11} />{t("history.badgeHealthy")}
                            </span>
                        )}
                        {!isHealthyStatus && !isSpecialCase && <SeverityBadge severity={item.severity} />}

                        {/* Cost badge */}
                        {estimatedCost && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.7rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 800, background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                                {estimatedCost}
                            </span>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            <Clock size={13} />{formatDate(item.created_at)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Treatment info box */}
            {!isSpecialCase && (
                treatment ? (
                    <div style={{
                        padding: '1rem',
                        background: isHealthyStatus ? '#f0fdf4' : 'linear-gradient(135deg, var(--bg-surface-inner), var(--bg-surface-1))',
                        borderRadius: '12px', fontSize: '0.85rem',
                        border: `1px solid ${isHealthyStatus ? '#86efac' : 'var(--border-light)'}`,
                    }}>
                        {isHealthyStatus ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontWeight: 700 }}>
                                <CheckCircle size={16} /> No treatment required — plant is healthy.
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{treatment.name}</div>
                                    <div style={{ color: 'var(--primary)', fontWeight: 800 }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Est. Cost (by severity)</div>
                                        {estimatedCost}
                                    </div>
                                </div>
                                <div style={{ color: 'var(--text-muted)', lineHeight: 1.4 }}>{treatment.description}</div>
                            </>
                        )}
                    </div>
                ) : (
                    <div style={{ padding: '1rem', background: 'var(--bg-surface-inner)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1px dashed var(--border-light)' }}>
                        {isHealthyStatus
                            ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#15803d', fontWeight: 700 }}><CheckCircle size={15} />No treatment required</div>
                            : t("detection.noTreatmentFound")}
                    </div>
                )
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                <Link
                    to="/treatment"
                    state={{
                        initialDiseaseId: item.predicted_disease,
                        initialDiseaseName: item.disease_name,
                        fromHistory: true
                    }}
                    className="btn-secondary"
                    style={{ flex: '1 1 auto', fontSize: '0.82rem', padding: '0.6rem', justifyContent: 'center', borderRadius: '10px' }}
                >
                    <ExternalLink size={15} />
                    {t("treatmentHistory.viewProtocol")}
                </Link>

                {/* Severity dropdown — only for active diseased records */}
                {!isHealthyStatus && !isSpecialCase && (
                    <div style={{ flex: '1 1 auto', position: 'relative' }}>
                        <select
                            value={item.severity || ''}
                            onChange={(e) => onUpdateSeverity(item.id, e.target.value)}
                            title="Set Severity Level"
                            style={{
                                appearance: 'none', WebkitAppearance: 'none',
                                width: '100%', padding: '0.55rem 2rem 0.55rem 0.75rem',
                                borderRadius: 10, fontWeight: 700, fontSize: '0.82rem',
                                cursor: 'pointer', outline: 'none', fontFamily: 'inherit',
                                border: `1.5px solid ${!item.severity ? '#94a3b8'
                                        : item.severity === 'minor' ? '#ca8a04'
                                            : item.severity === 'moderate' ? '#c2410c'
                                                : '#dc2626'
                                    }`,
                                background: !item.severity ? '#f8fafc'
                                    : item.severity === 'minor' ? '#fef9c3'
                                        : item.severity === 'moderate' ? '#ffedd5'
                                            : '#fee2e2',
                                color: !item.severity ? '#475569'
                                    : item.severity === 'minor' ? '#854d0e'
                                        : item.severity === 'moderate' ? '#c2410c'
                                            : '#dc2626',
                            }}
                        >
                            <option value="" disabled>Set Severity</option>
                            <option value="minor">Minor</option>
                            <option value="moderate">Moderate</option>
                            <option value="severe">Severe</option>
                        </select>
                        <ChevronRight
                            size={13}
                            style={{
                                position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none',
                                color: !item.severity ? '#94a3b8' : item.severity === 'minor' ? '#ca8a04' : item.severity === 'moderate' ? '#c2410c' : '#dc2626'
                            }}
                        />
                    </div>
                )}

                {/* Status dropdown */}
                <div style={{ flex: '1 1 auto', position: 'relative' }}>
                    <TreatmentStatusDropdown
                        value={item.treatment_status || 'untreated'}
                        onChange={(val) => onUpdateStatus(item.id, val)}
                    />
                </div>
            </div>
        </div>
    );
};

export default TreatmentHistory;
