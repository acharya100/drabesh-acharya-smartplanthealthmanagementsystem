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
            setLoading(false);
        } catch (error) {
            console.error("Error loading diseases:", error);
            setLoading(false);
        }
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
        </div>
    );
};

export default Diseases;
