/**
 * Diagnosis History Log
 * 
 * Your personal archive of all past AI scans. This page allows users to review
 * previous diagnoses, track the health progress of their plants over time,
 * and quickly access treatment plans for past issues.
 * 
 * Author: Drabesh Acharya
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { predictionService } from "../services/api";
import { Calendar, AlertTriangle, CheckCircle, ArrowRight, Clock, Trash2, Search, Edit, X } from "lucide-react";

const History = () => {
    const [predictions, setPredictions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all"); // all, healthy, infected
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPrediction, setEditingPrediction] = useState(null);


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
        if (filter === "infected") return !p.is_healthy;
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
        if (window.confirm("Delete this scan record? This cannot be undone.")) {
            try {
                await predictionService.delete(id);
                loadHistory();
            } catch (e) {
                console.error(e);
                alert("Failed to delete record");
            }
        }
    };

    const handleUpdatePrediction = async (e) => {
        e.preventDefault();
        try {
            await predictionService.update(editingPrediction.id, {
                is_healthy: editingPrediction.is_healthy,
                severity: editingPrediction.severity,
                confidence: editingPrediction.confidence
            });
            setShowEditModal(false);
            loadHistory();
        } catch (error) {
            console.error("Error updating prediction:", error);
            alert("Failed to update record");
        }
    };

    return (
        <div className="page-container">
            <Navbar activePage="history" />
            <div className="page-content animate-slide-up">
                <div className="page-header">
                    <div>
                        <h1>Diagnosis History</h1>
                        <p className="subtitle">Archive of all your plant health scans</p>
                    </div>
                    <div className="filter-group" style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            className={`btn-secondary ${filter === 'all' ? 'active' : ''}`}
                            onClick={() => setFilter("all")}
                            style={{ background: filter === 'all' ? 'var(--primary)' : 'transparent', color: filter === 'all' ? 'white' : 'inherit' }}
                        >
                            All Scans
                        </button>
                        <button
                            className={`btn-secondary ${filter === 'infected' ? 'active' : ''}`}
                            onClick={() => setFilter("infected")}
                            style={{ background: filter === 'infected' ? '#dc2626' : 'transparent', color: filter === 'infected' ? 'white' : 'inherit' }}
                        >
                            Infected
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-spinner-container">
                        <div className="spinner"></div>
                        <p>Loading scan history...</p>
                    </div>
                ) : (
                    <div className="history-grid">
                        {filteredPredictions.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {filteredPredictions.map(pred => (
                                    <div key={pred.id} className="history-card animate-slide-up" style={{
                                        display: 'flex',
                                        background: 'var(--bg-card)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border-light)',
                                        overflow: 'hidden',
                                        padding: '1.5rem',
                                        alignItems: 'center',
                                        gap: '2rem'
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
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                                                    {pred.is_plant_image === false ? "Non-Plant Image Detected" : (pred.disease_name || (pred.is_healthy ? "Healthy Plant" : "Unidentified Issue"))}
                                                </h3>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Clock size={14} /> {formatDate(pred.created_at)}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                                <div className={`status-badge ${pred.is_plant_image === false ? 'not-plant' : (pred.is_healthy ? 'healthy' : 'infected')}`} style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                                    padding: '0.3rem 0.6rem', borderRadius: '4px',
                                                    fontSize: '0.75rem', fontWeight: 700,
                                                    background: pred.is_plant_image === false ? '#e5e7eb' : (pred.is_healthy ? 'var(--primary-subtle)' : '#fee2e2'),
                                                    color: pred.is_plant_image === false ? '#4b5563' : (pred.is_healthy ? 'var(--primary)' : '#dc2626')
                                                }}>
                                                    {pred.is_plant_image === false ? <X size={14} /> : (pred.is_healthy ? <CheckCircle size={14} /> : <AlertTriangle size={14} />)}
                                                    {pred.is_plant_image === false ? 'Non-Plant' : (pred.is_healthy ? 'Healthy' : 'Diseased')}
                                                </div>

                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    Compliance: <strong>{Math.round(pred.confidence || 0)}%</strong>
                                                </span>

                                                {pred.severity && !pred.is_healthy && pred.is_plant_image !== false && (
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        Severity: <strong style={{ textTransform: 'uppercase', color: pred.severity === 'critical' ? 'red' : 'inherit' }}>{pred.severity}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                                {/* View Treatment link for ALL cases */}
                                                <Link
                                                    to={pred.is_plant_image === false ? '/treatment?notplant=true' : (pred.is_healthy ? '/treatment?healthy=true' : `/treatment?disease=${pred.predicted_disease}`)}
                                                    className="btn-secondary"
                                                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                                                >
                                                    View Treatment
                                                </Link>
                                                <button
                                                    onClick={() => handleEdit(pred)}
                                                    className="btn-secondary"
                                                    style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                >
                                                    <Edit size={16} />
                                                    Edit
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
                                <h3>No History Found</h3>
                                <p>You haven't scanned any plants yet.</p>
                                <Link to="/disease" className="btn-primary mt-4">Start New Scan</Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {showEditModal && editingPrediction && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Edit Scan Record</h2>
                        <form onSubmit={handleUpdatePrediction}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    Health Status
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
                                    <option value="true">Healthy</option>
                                    <option value="false">Diseased</option>
                                </select>
                            </div>

                            {!editingPrediction.is_healthy && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                        Severity Level
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
                                        <option value="low">Low</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            )}

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                    Confidence (%)
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
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary">
                                    Save Changes
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
