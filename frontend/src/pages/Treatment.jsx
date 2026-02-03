/**
 * Treatment Recommendations Page
 * 
 * Provides detailed guidance on managing plant diseases.
 * Connects to the backend Treatment API for verified protocols.
 * 
 * Author: Smart Plant Health Management System
 * Sprint: 3 - Plant and Disease Management
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { treatmentService, diseaseService } from "../services/api";
import { Search, Filter, ShieldCheck, List, Package, ArrowRight } from "lucide-react";

const Treatment = () => {
  const [treatments, setTreatments] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTreatment, setNewTreatment] = useState({
    name: "",
    disease: "",
    treatment_type: "organic",
    description: "",
    instructions: "",
    products_needed: "",
    effectiveness_rate: 85,
    is_preventive: false,
    cost_estimate: "Low"
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTreatments();
  }, [selectedDisease]);

  const loadData = async () => {
    try {
      const { data } = await diseaseService.getAll();
      setDiseases(data.results || data);
    } catch (error) {
      console.error("Error loading diseases list:", error);
    }
  };

  const loadTreatments = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        disease: selectedDisease
      };
      const { data } = await treatmentService.getAll(params);
      setTreatments(data.results || data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading treatments:", error);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadTreatments();
  };

  const handleSubmitNewTreatment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await treatmentService.create(newTreatment);
      setShowAddModal(false);
      setNewTreatment({
        name: "",
        disease: "",
        treatment_type: "organic",
        description: "",
        instructions: "",
        products_needed: "",
        effectiveness_rate: 85,
        is_preventive: false,
        cost_estimate: "Low"
      });
      loadTreatments();
    } catch (error) {
      console.error("Error creating treatment:", error);
      setLoading(false);
      alert("Failed to create treatment record.");
    }
  };

  return (
    <div className="page-container">
      <Navbar activePage="treatment" />
      <div className="page-content animate-slide-up">
        <div className="page-header">
          <div>
            <h1>Treatment Plans</h1>
            <p className="subtitle">Guided steps for plant recovery and health</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <ShieldCheck size={20} />
            <span>Add Treatment</span>
          </button>
        </div>

        <div className="search-filter-section mb-8">
          <form onSubmit={handleSearch} className="search-bar-container">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search treatments, products, or steps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary">Search</button>
          </form>
        </div>

        {loading ? (
          <div className="loading-spinner-container">
            <div className="spinner"></div>
            <p>Loading treatment records...</p>
          </div>
        ) : (
          <div className="treatments-grid">
            {treatments.length > 0 ? (
              treatments.map(t => (
                <div key={t.id} className="treatment-card-v2 animate-slide-up">
                  <div className="treatment-main" style={{ padding: '2.5rem' }}>
                    <div className="disease-ctx" style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      Target: {t.disease_name}
                    </div>
                    <h3 style={{ marginBottom: '1rem' }}>{t.name}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>{t.description}</p>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <div className={`badge ${t.effectiveness_rate > 80 ? 'badge-edible' : 'badge-toxic'}`} style={{ borderRadius: '4px' }}>
                        {t.effectiveness_rate}% Effective
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Cost: {t.cost_estimate}</span>
                    </div>
                  </div>

                  <div className="treatment-footer-v2" style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)' }}>{t.treatment_type} Type</span>
                    <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}>View Steps</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <ShieldCheck size={64} className="text-muted" />
                <h3>No Treatments Found</h3>
                <p>Try searching for a different disease or keyword.</p>
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
              <h2>Add Treatment Plan</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmitNewTreatment} className="add-plant-form">
              <div className="form-grid">
                <div className="form-left">
                  <div className="form-group">
                    <label>Target Disease</label>
                    <select
                      value={newTreatment.disease}
                      onChange={(e) => setNewTreatment({ ...newTreatment, disease: e.target.value })}
                      required
                    >
                      <option value="">Select Disease...</option>
                      {diseases.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Treatment Type</label>
                    <select
                      value={newTreatment.treatment_type}
                      onChange={(e) => setNewTreatment({ ...newTreatment, treatment_type: e.target.value })}
                    >
                      <option value="organic">Organic/Natural</option>
                      <option value="chemical">Chemical/Synthetic</option>
                      <option value="biological">Biological Agent</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Effectiveness (%)</label>
                    <input
                      type="number"
                      min="0" max="100"
                      value={newTreatment.effectiveness_rate}
                      onChange={(e) => setNewTreatment({ ...newTreatment, effectiveness_rate: e.target.value })}
                    />
                  </div>

                  <div className="form-checkbox-group" style={{ border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-main)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 'bold' }}>
                      <input
                        type="checkbox"
                        checked={newTreatment.is_preventive}
                        onChange={(e) => setNewTreatment({ ...newTreatment, is_preventive: e.target.checked })}
                        style={{ width: '20px', height: '20px' }}
                      />
                      Preventative Action
                    </label>
                  </div>
                </div>

                <div className="form-right">
                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Treatment Name</label>
                      <input
                        type="text"
                        value={newTreatment.name}
                        onChange={(e) => setNewTreatment({ ...newTreatment, name: e.target.value })}
                        required
                        placeholder="e.g. Concentrated Neem Spray"
                      />
                    </div>
                    <div className="form-group">
                      <label>Cost Level</label>
                      <select
                        value={newTreatment.cost_estimate}
                        onChange={(e) => setNewTreatment({ ...newTreatment, cost_estimate: e.target.value })}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newTreatment.description}
                      onChange={(e) => setNewTreatment({ ...newTreatment, description: e.target.value })}
                      rows="2"
                      placeholder="Brief summary of the treatment..."
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>Instructions</label>
                    <textarea
                      value={newTreatment.instructions}
                      onChange={(e) => setNewTreatment({ ...newTreatment, instructions: e.target.value })}
                      rows="4"
                      placeholder="1. Prepare solution&#10;2. Apply to leaves..."
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>Products Needed</label>
                    <input
                      type="text"
                      value={newTreatment.products_needed}
                      onChange={(e) => setNewTreatment({ ...newTreatment, products_needed: e.target.value })}
                      placeholder="e.g. Neem oil, Soap, Water"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Treatment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Treatment;
