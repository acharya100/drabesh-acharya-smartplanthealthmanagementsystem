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
            <div className="page-content">
                <div className="page-header">
                    <div>
                        <h1>Disease Database</h1>
                        <p className="subtitle">Reference for common plant ailments and pathogens</p>
                    </div>
                    <button
                        className="btn-primary flex items-center gap-2"
                        onClick={() => setShowAddModal(true)}
                    >
                        <Activity size={20} />
                        <span>Log New Disease</span>
                    </button>
                </div>

                {/* Search and Filter */}
                <div className="search-filter-section mb-8">
                    <form onSubmit={handleSearch} className="search-bar-container">
                        <div className="search-input-wrapper">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Search diseases, symptoms or causes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn-search">Search</button>
                        <select
                            className="filter-select-v2"
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                        >
                            <option value="">All Severities</option>
                            <option value="mild">Mild</option>
                            <option value="moderate">Moderate</option>
                            <option value="severe">Severe</option>
                            <option value="critical">Critical</option>
                        </select>
                    </form>
                </div>

                {/* Diseases Grid */}
                {loading ? (
                    <div className="loading-spinner-container">
                        <div className="spinner"></div>
                        <p>Scanning disease encyclopedia...</p>
                    </div>
                ) : (
                    <div className="diseases-grid">
                        {diseases.length > 0 ? (
                            diseases.map(disease => (
                                <div key={disease.id} className="disease-card-v2 animate-slide-up">
                                    <div className="disease-header-info">
                                        <div className="disease-title-row">
                                            <h3>{disease.name}</h3>
                                            <div className={`severity-indicator severity-${disease.severity_level}`}>
                                                {disease.severity_display?.split(' - ')[0]}
                                            </div>
                                        </div>
                                        <span className="scientific-name">{disease.scientific_name}</span>
                                    </div>

                                    <div className="disease-body-info">
                                        <div className="disease-type-badge">
                                            {disease.disease_type_display}
                                        </div>
                                        <p className="symptoms-preview">
                                            <strong>Symptoms:</strong> {disease.symptoms?.substring(0, 120)}...
                                        </p>

                                        <div className="disease-meta">
                                            <div className="meta-item">
                                                <Activity size={16} />
                                                <span>{disease.is_contagious ? `Contagious (${disease.spread_rate})` : 'Non-contagious'}</span>
                                            </div>
                                            <div className="meta-item">
                                                <AlertTriangle size={16} />
                                                <span>{disease.affected_plant_count} Species Affected</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="disease-card-footer">
                                        <span className="treatment-count">{disease.treatment_count} Treatments Available</span>
                                        <button className="btn-detail-link">
                                            <span>Full Profile</span>
                                            <Info size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-results">
                                <Search size={48} />
                                <h3>No Diseases Found</h3>
                                <p>We couldn't find any diseases matching your criteria.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Disease Modal */}
            {showAddModal && (
                <div className="modal-overlay animate-fade-in">
                    <div className="modal-content-large animate-slide-up">
                        <div className="modal-header">
                            <h2>Log New Disease</h2>
                            <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleSubmitNewDisease} className="add-plant-form">
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
                                            <option value="pest">Pest</option>
                                            <option value="deficiency">Nutrient Deficiency</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Severity Level</label>
                                        <select
                                            value={newDisease.severity_level}
                                            onChange={(e) => setNewDisease({ ...newDisease, severity_level: e.target.value })}
                                        >
                                            <option value="mild">Mild</option>
                                            <option value="moderate">Moderate</option>
                                            <option value="severe">Severe</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Contagious?</label>
                                        <div className="form-checkbox-group" style={{ background: 'none', padding: 0 }}>
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={newDisease.is_contagious}
                                                    onChange={(e) => setNewDisease({ ...newDisease, is_contagious: e.target.checked })}
                                                /> Yes
                                            </label>
                                        </div>
                                    </div>
                                    {newDisease.is_contagious && (
                                        <div className="form-group">
                                            <label>Spread Rate</label>
                                            <select
                                                value={newDisease.spread_rate}
                                                onChange={(e) => setNewDisease({ ...newDisease, spread_rate: e.target.value })}
                                            >
                                                <option value="low">Low</option>
                                                <option value="moderate">Moderate</option>
                                                <option value="high">High</option>
                                                <option value="extreme">Extreme</option>
                                            </select>
                                        </div>
                                    )}
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
                                            placeholder="Describe visible signs..."
                                        ></textarea>
                                    </div>

                                    <div className="form-group">
                                        <label>Affected Plants (Select Multiple)</label>
                                        <div className="plant-selection-grid">
                                            {plants.map(plant => (
                                                <div
                                                    key={plant.id}
                                                    className={`selection-item ${newDisease.affected_plant_ids?.includes(plant.id) ? 'selected' : ''}`}
                                                    onClick={() => handlePlantToggle(plant.id)}
                                                >
                                                    {plant.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                                <button type="submit" className="btn-primary">Save Disease Record</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Diseases;
