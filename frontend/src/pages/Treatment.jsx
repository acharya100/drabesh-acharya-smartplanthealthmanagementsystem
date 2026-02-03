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
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Treatment Protocols</h1>
            <p className="subtitle">Expert-verified methods for plant recovery</p>
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <ShieldCheck size={20} />
            <span>Add New Protocol</span>
          </button>
        </div>

        <div className="search-filter-section mb-8">
          <form onSubmit={handleSearch} className="search-bar-container">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search by treatment name or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-search">Search</button>
            <select
              className="filter-select-v2"
              value={selectedDisease}
              onChange={(e) => setSelectedDisease(e.target.value)}
            >
              <option value="">All Diseases</option>
              {diseases.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </form>
        </div>

        {loading ? (
          <div className="loading-spinner-container">
            <div className="spinner"></div>
            <p>Loading medical protocols...</p>
          </div>
        ) : (
          <div className="treatments-grid">
            {treatments.length > 0 ? (
              treatments.map(t => (
                <div key={t.id} className="treatment-card-v2 animate-slide-up">
                  <div className="treatment-header-v2">
                    <div className="treatment-badge">
                      {t.is_preventive ? 'Preventive' : 'Curative'}
                    </div>
                    <div className={`effectiveness-meter efficacy-${Math.floor((t.effectiveness_rate || 0) / 20) * 20}`}>
                      {t.effectiveness_rate}% Effective
                    </div>
                  </div>

                  <div className="treatment-main">
                    <div className="disease-ctx">{t.disease_name}</div>
                    <h3>{t.name}</h3>
                    <p className="treatment-desc">{t.description}</p>
                  </div>

                  <div className="treatment-details-v2">
                    <div className="detail-section">
                      <h4><List size={16} /> Application Steps</h4>
                      <ul className="v2-steps-list">
                        {t.instruction_steps?.slice(0, 3).map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                        {t.instruction_steps?.length > 3 && <li className="more-steps">+{t.instruction_steps.length - 3} more steps...</li>}
                      </ul>
                    </div>

                    <div className="detail-section">
                      <h4><Package size={16} /> Products Needed</h4>
                      <div className="product-pills-v2">
                        {t.products_list?.map((p, i) => (
                          <span key={i} className="prod-pill">{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="treatment-footer-v2">
                    <div className="cost-est">Est. Cost: {t.cost_estimate || 'N/A'}</div>
                    <button className="btn-primary-sm">
                      <span>Full Protocol</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <ShieldCheck size={48} />
                <h3>No Treatments Found</h3>
                <p>We don't have a protocol matching your search yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Treatment Modal */}
      {showAddModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content-large animate-slide-up">
            <div className="modal-header">
              <h2>Add New Treatment Protocol</h2>
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
                      <option value="organic">Organic</option>
                      <option value="chemical">Chemical</option>
                      <option value="biological">Biological</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Effectiveness Rate (%)</label>
                    <input
                      type="number"
                      min="0" max="100"
                      value={newTreatment.effectiveness_rate}
                      onChange={(e) => setNewTreatment({ ...newTreatment, effectiveness_rate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Preventive?</label>
                    <div className="form-checkbox-group" style={{ background: 'none', padding: 0 }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={newTreatment.is_preventive}
                          onChange={(e) => setNewTreatment({ ...newTreatment, is_preventive: e.target.checked })}
                        /> Yes
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-right">
                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Protocol Name</label>
                      <input
                        type="text"
                        value={newTreatment.name}
                        onChange={(e) => setNewTreatment({ ...newTreatment, name: e.target.value })}
                        required
                        placeholder="e.g. Neem Oil Solution"
                      />
                    </div>
                    <div className="form-group">
                      <label>Cost Estimate</label>
                      <select
                        value={newTreatment.cost_estimate}
                        onChange={(e) => setNewTreatment({ ...newTreatment, cost_estimate: e.target.value })}
                      >
                        <option value="Low">Low Cost</option>
                        <option value="Medium">Medium Cost</option>
                        <option value="High">High Cost</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Overview / Description</label>
                    <textarea
                      value={newTreatment.description}
                      onChange={(e) => setNewTreatment({ ...newTreatment, description: e.target.value })}
                      rows="2"
                      placeholder="Brief summary of the treatment..."
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>Application Steps (Newline separated)</label>
                    <textarea
                      value={newTreatment.instructions}
                      onChange={(e) => setNewTreatment({ ...newTreatment, instructions: e.target.value })}
                      rows="3"
                      placeholder="1. Mix ingredients&#10;2. Spray at dusk..."
                    ></textarea>
                  </div>

                  <div className="form-group">
                    <label>Products Needed (Comma separated)</label>
                    <input
                      type="text"
                      value={newTreatment.products_needed}
                      onChange={(e) => setNewTreatment({ ...newTreatment, products_needed: e.target.value })}
                      placeholder="e.g. Neem oil, Water, Soap"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Protocol</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Treatment;
