/**
 * Treatment Protocols
 * 
 * A knowledge base of remedial actions for plant diseases. Each treatment plan
 * includes step-by-step instructions, required products, and effectiveness ratings.
 * Users can view details to save their plants.
 * 
 * Author: Drabesh Acharya
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { treatmentService, diseaseService } from "../services/api";
import { Search, Filter, ShieldCheck, List, Package, ArrowRight, Trash2, CheckCircle, AlertTriangle } from "lucide-react";

const Treatment = () => {
  const [treatments, setTreatments] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
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

    // Check URL parameters for special cases
    const urlParams = new URLSearchParams(window.location.search);
    const isHealthy = urlParams.get('healthy');
    const isNotPlant = urlParams.get('notplant');
    const diseaseParam = urlParams.get('disease');

    if (isHealthy === 'true') {
      setSelectedDisease('healthy');
    } else if (isNotPlant === 'true') {
      setSelectedDisease('notplant');
    } else if (diseaseParam) {
      setSelectedDisease(diseaseParam);
    }
  }, []);

  useEffect(() => {
    if (selectedDisease !== 'healthy' && selectedDisease !== 'notplant') {
      loadTreatments();
    }
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

  const handleEdit = (treatment) => {
    setSelectedTreatment(treatment);
    setIsEditing(true);
    setNewTreatment({
      name: treatment.name,
      disease: treatment.disease,
      treatment_type: treatment.treatment_type,
      description: treatment.description || "",
      instructions: treatment.instructions || "",
      products_needed: treatment.products_needed || "",
      effectiveness_rate: treatment.effectiveness_rate,
      is_preventive: treatment.is_preventive,
      cost_estimate: treatment.cost_estimate
    });
    setShowAddModal(true);
  };

  const handleViewDetails = (treatment) => {
    setSelectedTreatment(treatment);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this treatment plan? This action cannot be undone.")) {
      try {
        setLoading(true);
        await treatmentService.delete(id);
        await loadTreatments();
      } catch (error) {
        console.error("Error deleting treatment:", error);
        alert("Failed to delete treatment plan. Check your permissions.");
        setLoading(false);
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadTreatments();
  };

  const handleSubmitTreatment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEditing) {
        await treatmentService.update(selectedTreatment.id, newTreatment);
      } else {
        await treatmentService.create(newTreatment);
      }
      setShowAddModal(false);
      resetForm();
      loadTreatments();
    } catch (error) {
      console.error("Error saving treatment:", error);
      setLoading(false);
      alert("Failed to save treatment record.");
    }
  };

  const resetForm = () => {
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
    setIsEditing(false);
    setSelectedTreatment(null);
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
            onClick={() => { resetForm(); setShowAddModal(true); }}
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
        ) : selectedDisease === 'healthy' ? (
          // Healthy Plant Message
          <div className="healthy-plant-message" style={{
            maxWidth: '800px',
            margin: '4rem auto',
            textAlign: 'center',
            padding: '3rem',
            background: 'linear-gradient(135deg, var(--success-subtle) 0%, var(--bg-card) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--success)'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <CheckCircle size={80} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
            </div>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--success)',
              marginBottom: '1rem'
            }}>
              Excellent News!
            </h2>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '1.5rem'
            }}>
              No Disease Detected
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.8',
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}>
              Your plant appears to be in excellent health. Treatment is not required at this time as no disease or infection has been identified. Continue with regular care and monitoring to maintain optimal plant health.
            </p>
            <div style={{
              padding: '1.5rem',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              marginTop: '2rem'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--primary)',
                marginBottom: '1rem'
              }}>
                Recommended Preventive Care:
              </h4>
              <ul style={{
                textAlign: 'left',
                color: 'var(--text-secondary)',
                lineHeight: '2',
                listStyle: 'none',
                padding: 0
              }}>
                <li>✓ Maintain consistent watering schedule</li>
                <li>✓ Ensure adequate sunlight exposure</li>
                <li>✓ Monitor for early signs of stress or disease</li>
                <li>✓ Provide appropriate nutrients and fertilization</li>
                <li>✓ Keep the growing environment clean and well-ventilated</li>
              </ul>
            </div>
            <div style={{ marginTop: '2rem' }}>
              <Link to="/disease" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowRight size={20} />
                Scan Another Plant
              </Link>
            </div>
          </div>
        ) : selectedDisease === 'notplant' ? (
          // Not a Plant Leaf Message
          <div className="healthy-plant-message" style={{
            maxWidth: '800px',
            margin: '4rem auto',
            textAlign: 'center',
            padding: '3rem',
            background: 'linear-gradient(135deg, var(--primary-subtle) 0%, var(--bg-card) 100%)',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--primary)'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <AlertTriangle size={80} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
            </div>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--primary)',
              marginBottom: '1rem'
            }}>
              Invalid Image Type
            </h2>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '1.5rem'
            }}>
              Not a Plant Leaf Detected
            </h3>
            <p style={{
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.8',
              marginBottom: '2rem',
              maxWidth: '600px',
              margin: '0 auto 2rem'
            }}>
              The uploaded image does not appear to be a plant leaf. Our AI system has identified this as a non-plant object (e.g., person, vehicle, or other unrelated item). For accurate diagnosis, please upload a clear, close-up photo of a single plant leaf.
            </p>
            <div style={{
              padding: '1.5rem',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              marginTop: '2rem'
            }}>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--primary)',
                marginBottom: '1rem'
              }}>
                Identification Guidelines:
              </h4>
              <ul style={{
                textAlign: 'left',
                color: 'var(--text-secondary)',
                lineHeight: '2',
                listStyle: 'none',
                padding: 0
              }}>
                <li>⚠️ Ensure the image contains only plant leaves</li>
                <li>⚠️ Avoid including people or backgrounds in the frame</li>
                <li>⚠️ Position the leaf centrally and ensure good lighting</li>
                <li>⚠️ Capture both the upper and lower surfaces if possible</li>
              </ul>
            </div>
            <div style={{ marginTop: '2rem' }}>
              <Link to="/disease" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <ArrowRight size={20} />
                Try Again with a Leaf
              </Link>
            </div>
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
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => handleEdit(t)}>Edit</button>
                      <button className="btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={() => handleViewDetails(t)}>View Details</button>
                      <button className="btn-secondary" style={{ padding: '0.4rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete(t.id)} title="Delete Treatment">
                        <Trash2 size={16} />
                      </button>
                    </div>
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

      {/* Senior Standard Modal - Add/Edit */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content-large animate-slide-up">
            <div className="modal-header">
              <h2>{isEditing ? "Edit Treatment Plan" : "Add Treatment Plan"}</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmitTreatment} className="add-plant-form">
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
                <button type="submit" className="btn-primary">{isEditing ? "Update Treatment" : "Save Treatment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Senior Standard Modal - View Details */}
      {showViewModal && selectedTreatment && (
        <div className="modal-overlay">
          <div className="modal-content-large animate-slide-up">
            <div className="modal-header">
              <h2>Treatment Protocol</h2>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>&times;</button>
            </div>
            <div className="add-plant-form">
              <div className="form-grid">
                <div className="form-left">
                  <div style={{ background: 'var(--bg-main)', padding: '2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                    <h4 style={{ marginBottom: '1.5rem', color: 'var(--primary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em' }}>Metrics</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>SUCCESS RATE</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{selectedTreatment.effectiveness_rate}%</span>
                          <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${selectedTreatment.effectiveness_rate}%`, background: 'var(--secondary)' }}></div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>COST LEVEL</span>
                        <span style={{ fontSize: '1rem', fontWeight: 800 }}>{selectedTreatment.cost_estimate}</span>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>TYPE</span>
                        <span style={{ fontSize: '1rem', fontWeight: 800 }}>{selectedTreatment.treatment_type.toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-right">
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>PROTOCOL FOR {selectedTreatment.disease_name}</div>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800 }}>{selectedTreatment.name}</h1>
                    <p style={{ lineHeight: 1.8, color: 'var(--text-main)', fontSize: '1.1rem' }}>{selectedTreatment.description}</p>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 800 }}>Application Instructions</h4>
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--secondary)', whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                      {selectedTreatment.instructions || "Contact an expert for detailed application steps."}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 800 }}>Inventory Required</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                      <Package size={20} className="text-secondary" />
                      <span>{selectedTreatment.products_needed || "General gardening tools"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '2rem 3rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>Close Protocol</button>
              <button className="btn-primary" onClick={() => { setShowViewModal(false); handleEdit(selectedTreatment); }}>Update Plan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Treatment;
