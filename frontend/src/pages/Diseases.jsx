/**
 * Diseases Database Page
 * 
 * Displays a professional browsing interface for plant diseases.
 * Features search and severity filtering.
 * 
 * Author: Smart Plant Health Management System
 * Sprint: 3 - Plant and Disease Management
 */

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { diseaseService } from "../services/api";
import { Search, Filter, AlertTriangle, Activity, Info } from "lucide-react";

const Diseases = () => {
    const [diseases, setDiseases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [severityFilter, setSeverityFilter] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
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

    const handleSubmitNewDisease = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await diseaseService.create(newDisease);
            setShowAddModal(false);
            setNewDisease({
                name: "",
                scientific_name: "",
                disease_type: "fungal",
                severity_level: "moderate",
                is_contagious: false,
                spread_rate: "moderate",
                symptoms: "",
                causes: "",
                affected_plants: []
            });
            loadDiseases();
        } catch (error) {
            console.error("Error creating disease:", error);
            setLoading(false);
            const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : "Check if name is unique and all fields valid.";
            alert(`Failed to create disease: ${errorMsg}`);
        }
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
                        <h1>Pathology Archive</h1>
                        <p className="subtitle">Expert-verified database of plant pathogens and physiological disorders</p>
                    </div>
                    <button
                        className="btn-primary"
                        onClick={() => setShowAddModal(true)}
                    >
                        <Activity size={20} />
                        <span>Log New Pathogen</span>
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="search-filter-section mb-8">
                    <form onSubmit={handleSearch} className="search-bar-container">
                        <div className="search-input-wrapper">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Search pathogens, clinical symptoms or origins..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn-primary">Query Database</button>
                    </form>
                </div>

                {/* Diseases Grid */}
                {loading ? (
                    <div className="loading-spinner-container">
                        <div className="spinner"></div>
                        <p>Synchronizing with clinical databases...</p>
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

                                    <div className="disease-body-info" style={{ padding: '0 2rem 2rem 2rem' }}>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                            {disease.symptoms?.substring(0, 140)}...
                                        </p>

                                        <div className="disease-meta" style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Activity size={16} /> {disease.is_contagious ? 'Contagious' : 'Isolated'}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <AlertTriangle size={16} /> {disease.affected_plant_count} Hosts
                                            </div>
                                        </div>
                                    </div>

                                    <div className="disease-card-footer" style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>{disease.treatment_count} Protocols available</span>
                                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Clinical View</button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-results">
                                <Search size={64} className="text-muted" />
                                <h3>No Pathology Records Found</h3>
                                <p>Refine your query parameters to locate specific pathogen data.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Senior Standard Modal */}
            {showAddModal && (
                <div className="modal-overlay">
                    <div className="modal-content-large animate-slide-up">
                        <div className="modal-header">
                            <h2>Log Pathogenic Specimen</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmitNewDisease} className="add-plant-form">
                            <div className="form-grid">
                                <div className="form-left">
                                    <div className="form-group">
                                        <label>Taxonomic Type</label>
                                        <select
                                            value={newDisease.disease_type}
                                            onChange={(e) => setNewDisease({ ...newDisease, disease_type: e.target.value })}
                                        >
                                            <option value="fungal">Fungal</option>
                                            <option value="bacterial">Bacterial</option>
                                            <option value="viral">Viral</option>
                                            <option value="pest">Entomological Pest</option>
                                            <option value="deficiency">Nutritional Deficiency</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Severity Tier</label>
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
                                            CONTAGIOUS
                                        </label>
                                    </div>
                                </div>

                                <div className="form-right">
                                    <div className="form-group-row">
                                        <div className="form-group">
                                            <label>Pathogen Common Name</label>
                                            <input
                                                type="text"
                                                value={newDisease.name}
                                                onChange={(e) => setNewDisease({ ...newDisease, name: e.target.value })}
                                                required
                                                placeholder="e.g. Powdery Mildew"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Scientific Classification</label>
                                            <input
                                                type="text"
                                                value={newDisease.scientific_name}
                                                onChange={(e) => setNewDisease({ ...newDisease, scientific_name: e.target.value })}
                                                placeholder="e.g. Podosphaera xanthii"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Symptomatic Observations</label>
                                        <textarea
                                            value={newDisease.symptoms}
                                            onChange={(e) => setNewDisease({ ...newDisease, symptoms: e.target.value })}
                                            rows="4"
                                            placeholder="Detailed report of visible markers..."
                                        ></textarea>
                                    </div>

                                    <div className="form-group">
                                        <label>Host Species Affiliation</label>
                                        <div className="plant-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', maxHeight: '160px', overflowY: 'auto', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                                            {plants.map(plant => (
                                                <div
                                                    key={plant.id}
                                                    className={`selection-item ${newDisease.affected_plant_ids?.includes(plant.id) ? 'selected' : ''}`}
                                                    onClick={() => handlePlantToggle(plant.id)}
                                                    style={{
                                                        padding: '0.5rem', border: '1px solid var(--border-light)', borderRadius: '4px', cursor: 'pointer', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600,
                                                        background: newDisease.affected_plant_ids?.includes(plant.id) ? 'var(--primary-subtle)' : 'white',
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
                                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Discard Record</button>
                                <button type="submit" className="btn-primary">Authenticate Log</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Diseases;
