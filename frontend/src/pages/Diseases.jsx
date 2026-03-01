/**
 * Author: Drabesh Acharya
 */

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { diseaseService } from "../services/api";
import { Search, Filter, AlertTriangle, Activity, Info, Trash2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const Diseases = () => {
    const { t } = useLanguage();
    const [diseases, setDiseases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [severityFilter, setSeverityFilter] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedDiseaseDetail, setSelectedDiseaseDetail] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [plants, setPlants] = useState([]);
    const [newDisease, setNewDisease] = useState({
        name: "",
        scientific_name: "",
        disease_type: "fungal",
        severity_level: "moderate",
        is_contagious: false,
        spread_rate: "moderate",
        symptoms: "",
        causes: "",
        affected_plant_ids: []
    });

    useEffect(() => {
        loadDiseases();
    }, [severityFilter]);

    const loadDiseases = async () => {
        try {
            setLoading(true);
            const params = {
                search: searchTerm,
                severity_level: severityFilter
            };
            const { data } = await diseaseService.getAll(params);
            setDiseases(data.results || data);

            // Use existing service for consistency
            const { data: plantData } = await (await import('../services/api')).plantService.getAll();
            setPlants(plantData.results || plantData);

            setLoading(false);
        } catch (error) {
            console.error("Error loading diseases:", error);
            setLoading(false);
        }
    };

    const handleEdit = (disease) => {
        setSelectedDiseaseDetail(disease);
        setIsEditing(true);
        setNewDisease({
            name: disease.name,
            scientific_name: disease.scientific_name || "",
            disease_type: disease.disease_type,
            severity_level: disease.severity_level,
            is_contagious: disease.is_contagious,
            spread_rate: disease.spread_rate || "moderate",
            symptoms: disease.symptoms || "",
            causes: disease.causes || "",
            affected_plant_ids: disease.affected_plant_ids || []
        });
        setShowAddModal(true);
    };

    const handleViewDetails = async (disease) => {
        try {
            setLoading(true);
            const { data } = await diseaseService.getById(disease.id);
            setSelectedDiseaseDetail(data);
            setShowViewModal(true);
        } catch (error) {
            console.error("Error fetching disease details:", error);
            alert("Failed to load disease details.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this disease record? This cannot be undone.")) {
            try {
                setLoading(true);
                await diseaseService.delete(id);
                await loadDiseases();
            } catch (error) {
                console.error("Error deleting disease:", error);
                alert("Failed to delete disease record. Check your permissions.");
                setLoading(false);
            }
        }
    };

    const handleSubmitDisease = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (isEditing) {
                await diseaseService.update(selectedDiseaseDetail.id, newDisease);
            } else {
                await diseaseService.create(newDisease);
            }
            setShowAddModal(false);
            resetForm();
            loadDiseases();
        } catch (error) {
            console.error("Error saving disease:", error);
            setLoading(false);
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : "Check if name is unique and all fields valid.";
            alert(`Failed to save disease: ${errorMsg}`);
        }
    };

    const resetForm = () => {
        setNewDisease({
            name: "",
            scientific_name: "",
            disease_type: "fungal",
            severity_level: "moderate",
            is_contagious: false,
            spread_rate: "moderate",
            symptoms: "",
            causes: "",
            affected_plant_ids: []
        });
        setIsEditing(false);
        setSelectedDiseaseDetail(null);
    };

    const handlePlantToggle = (plantId) => {
        setNewDisease(prev => {
            const current = [...prev.affected_plant_ids];
            if (current.includes(plantId)) {
                return { ...prev, affected_plant_ids: current.filter(id => id !== plantId) };
            } else {
                return { ...prev, affected_plant_ids: [...current, plantId] };
            }
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        loadDiseases();
    };

    return (
        <div className="page-container">
            <Navbar activePage="disease" />
            <div className="page-content animate-slide-up">
                <div className="page-header">
                    <div>
                        <h1>{t("diseases.title")}</h1>
                        <p className="subtitle">{t("diseases.subtitle")}</p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => { resetForm(); setShowAddModal(true); }}
                    >
                        <Activity size={20} />
                        <span>{t("diseases.addDisease")}</span>
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="search-filter-section mb-8">
                    <form onSubmit={handleSearch} className="search-bar-container">
                        <div className="search-input-wrapper">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                placeholder={t("diseases.searchPlaceholder")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn-primary">Search Database</button>
                    </form>
                </div>

                {/* Diseases Grid */}
                {loading ? (
                    <div className="loading-spinner-container">
                        <div className="spinner"></div>
                        <p>{t("diseases.loading")}</p>
                    </div>
                ) : (
                    <div className="diseases-grid">
                        {diseases.length > 0 ? (
                            diseases.map(disease => (
                                <div key={disease.id} className="disease-card-v2 animate-slide-up">
                                    <div className="disease-header-info" style={{ padding: '2rem' }}>
                                        <div className="disease-title-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <h3 style={{ margin: 0 }}>{disease.name}</h3>
                                            <div className={`badge ${disease.severity_level === 'critical' ? 'badge-toxic' : 'badge-edible'}`} style={{ borderRadius: '4px' }}>
                                                {disease.severity_level}
                                            </div>
                                        </div>
                                        <span className="scientific-name">{disease.scientific_name}</span>
                                    </div>

                                    <div className="disease-body-info" style={{ padding: '0 2rem 1.5rem 2rem' }}>
                                        {/* We show a snippet of the symptoms to keep the cards looking neat and uniform */}
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                            {disease.symptoms?.substring(0, 140)}...
                                        </p>

                                        <div className="disease-meta" style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Activity size={16} /> {disease.is_contagious ? 'Contagious' : 'Not Contagious'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <AlertTriangle size={16} /> {disease.affected_plant_count} Host Plants
                                            </div>
                                        </div>
                                    </div>

                                    <div className="disease-card-footer" style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>{disease.treatment_count} Treatments</span>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleEdit(disease)}>{t("diseases.editDisease")}</button>
                                            <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleViewDetails(disease)}>{t("plants.viewDetails")}</button>
                                            <button className="btn-secondary" style={{ padding: '0.4rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete(disease.id)} title={t("diseases.deleteDisease")}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-results">
                                <Search size={64} className="text-muted" />
                                <h3>No Diseases Found</h3>
                                <p>Try different search terms to find disease data.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Senior Standard Modal - Add/Edit */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content-large animate-slide-up">
                        <div className="modal-header">
                            <h2>{isEditing ? "Edit Disease" : "Add New Disease"}</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmitDisease} className="add-plant-form">
                            <div className="form-grid">
                                <div className="form-left">
                                    <div className="form-group">
                                        <label>Disease Type</label>
                                        <select
                                            value={newDisease.disease_type}
                                            onChange={(e) => setNewDisease({ ...newDisease, disease_type: e.target.value })}
                                        >
                                            <option value="fungal">Fungal</option>
                                            <option value="bacterial">Bacterial</option>
                                            <option value="viral">Viral</option>
                                            <option value="pest">Insect Pest</option>
                                            <option value="deficiency">Nutritional Deficiency</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Severity Level</label>
                                        <select
                                            value={newDisease.severity_level}
                                            onChange={(e) => setNewDisease({ ...newDisease, severity_level: e.target.value })}
                                        >
                                            <option value="mild">Low (Tier 1)</option>
                                            <option value="moderate">Medium (Tier 2)</option>
                                            <option value="severe">High (Tier 3)</option>
                                            <option value="critical">Critical (Tier 4)</option>
                                        </select>
                                    </div>

                                    <div className="form-checkbox-group" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold' }}>
                                            <input
                                                type="checkbox"
                                                checked={newDisease.is_contagious}
                                                onChange={(e) => setNewDisease({ ...newDisease, is_contagious: e.target.checked })}
                                                style={{ width: '20px', height: '20px' }}
                                            />
                                            Contagious
                                        </label>
                                    </div>
                                </div>

                                <div className="form-right">
                                    <div className="form-group-row">
                                        <div className="form-group">
                                            <label>Disease Name</label>
                                            <input
                                                type="text"
                                                value={newDisease.name}
                                                onChange={(e) => setNewDisease({ ...newDisease, name: e.target.value })}
                                                required
                                                placeholder="e.g. Powdery Mildew"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Scientific Name</label>
                                            <input
                                                type="text"
                                                value={newDisease.scientific_name}
                                                onChange={(e) => setNewDisease({ ...newDisease, scientific_name: e.target.value })}
                                                placeholder="e.g. Podosphaera xanthii"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Symptoms</label>
                                        <textarea
                                            value={newDisease.symptoms}
                                            onChange={(e) => setNewDisease({ ...newDisease, symptoms: e.target.value })}
                                            rows="3"
                                            placeholder="Describe the visible signs of the disease..."
                                        ></textarea>
                                    </div>

                                    <div className="form-group">
                                        <label>Cause of Disease</label>
                                        <textarea
                                            value={newDisease.causes}
                                            onChange={(e) => setNewDisease({ ...newDisease, causes: e.target.value })}
                                            rows="2"
                                            placeholder="Environmental or biological causes..."
                                        ></textarea>
                                    </div>

                                    <div className="form-group">
                                        <label>Affected Plants</label>
                                        <div className="plant-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', maxHeight: '160px', overflowY: 'auto', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                                            {plants.map(plant => (
                                                <div
                                                    key={plant.id}
                                                    className={`selection-item ${newDisease.affected_plant_ids?.includes(plant.id) ? 'selected' : ''}`}
                                                    onClick={() => handlePlantToggle(plant.id)}
                                                    style={{
                                                        padding: '0.5rem', border: '1px solid var(--border-light)', borderRadius: '4px', cursor: 'pointer', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600,
                                                        background: newDisease.affected_plant_ids?.includes(plant.id) ? 'var(--primary-subtle)' : 'var(--bg-card)',
                                                        color: newDisease.affected_plant_ids?.includes(plant.id) ? 'var(--primary)' : 'inherit',
                                                        borderColor: newDisease.affected_plant_ids?.includes(plant.id) ? 'var(--primary)' : 'var(--border-light)'
                                                    }}
                                                >
                                                    {plant.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer" style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">{isEditing ? "Update Disease" : "Save Disease"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Senior Standard Modal - View Details */}
            {showViewModal && selectedDiseaseDetail && (
                <div className="modal-overlay">
                    <div className="modal-content-large animate-slide-up">
                        <div className="modal-header">
                            <h2>Disease Details</h2>
                            <button className="close-btn" onClick={() => setShowViewModal(false)}>&times;</button>
                        </div>
                        <div className="add-plant-form">
                            <div className="form-grid">
                                <div className="form-left">
                                    <div style={{ background: 'var(--bg-main)', padding: '2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                                        <h4 style={{ marginBottom: '1.5rem', color: 'var(--primary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Profile Summary</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>SEVERITY</span>
                                                <span style={{ fontSize: '1rem', fontWeight: 800, color: selectedDiseaseDetail.severity_level === 'critical' ? '#dc2626' : 'var(--secondary)' }}>{selectedDiseaseDetail.severity_level.toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>TYPE</span>
                                                <span style={{ fontSize: '1rem', fontWeight: 800 }}>{selectedDiseaseDetail.disease_type.toUpperCase()}</span>
                                            </div>
                                            <div>
                                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>CONTAGIOUS</span>
                                                <span style={{ fontSize: '1rem', fontWeight: 800 }}>{selectedDiseaseDetail.is_contagious ? 'YES' : 'NO'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-right">
                                    <div style={{ marginBottom: '2.5rem' }}>
                                        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>{selectedDiseaseDetail.name}</h1>
                                        <p className="scientific-name" style={{ fontSize: '1.2rem', opacity: 0.7 }}>{selectedDiseaseDetail.scientific_name}</p>
                                    </div>

                                    <div style={{ marginBottom: '2rem' }}>
                                        <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 800 }}>Symptoms</h4>
                                        {/* This bubble provides a nice focus for reading symptoms */}
                                        <p style={{ lineHeight: 1.8, background: 'var(--bg-main)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>{selectedDiseaseDetail.symptoms || "Detailed symptoms not recorded."}</p>
                                    </div>

                                    <div style={{ marginBottom: '2rem' }}>
                                        <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 800 }}>Causes</h4>
                                        <p style={{ lineHeight: 1.8 }}>{selectedDiseaseDetail.causes || "No causes documented."}</p>
                                    </div>

                                    <div>
                                        <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 800 }}>Commonly Affected Plants</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {selectedDiseaseDetail.affected_plants?.map((plant, i) => (
                                                <span key={i} style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '0.85rem' }}>{plant.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ padding: '2rem 3rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Close Archive</button>
                            <button className="btn-primary" onClick={() => { setShowViewModal(false); handleEdit(selectedDiseaseDetail); }}>Update Record</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Diseases;
