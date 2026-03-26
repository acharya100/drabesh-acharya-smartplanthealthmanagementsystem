/**
 * Treatment Protocols
 */

import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { treatmentService, diseaseService, plantService } from "../services/api";
import {
  Search, ShieldCheck, Package,
  ChevronRight, Sprout, AlertTriangle,
  CheckCircle, Droplets, Thermometer,
  Plus, Edit2, Trash2
} from "lucide-react";
import TreatmentFormModal from "../components/TreatmentFormModal";
import { useLanguage } from "../context/LanguageContext";

const Treatment = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [diseases, setDiseases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlants, setLoadingPlants] = useState(true);
  const [customDiseases, setCustomDiseases] = useState([]);
  const [loadingCustom, setLoadingCustom] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false); // Controls TreatmentFormModal
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [editingTreatment, setEditingTreatment] = useState(null); // For edit mode
  const [modalLoading, setModalLoading] = useState(false);
  const [isFromHistory, setIsFromHistory] = useState(false);

  useEffect(() => {
    loadPlants();
    loadCustomDiseases();

    // Check if we came from another page with a specific disease to view
    if (location.state?.initialDiseaseId) {
      if (location.state.fromHistory) {
        setIsFromHistory(true);
      }
      handleViewTreatment({
        id: location.state.initialDiseaseId,
        name: location.state.initialDiseaseName || "Detected Disease"
      });
      // Clear the state so it doesn't reopen if the user navigates away and back
      navigate(location.pathname, { replace: true });
    }
  }, []);

  useEffect(() => {
    if (selectedPlant) {
      loadDiseases(selectedPlant.id);
    }
  }, [selectedPlant]);

  const loadPlants = async () => {
    try {
      setLoadingPlants(true);
      // Fetch 'global' plants (system plants) for the reference guide
      const { data } = await plantService.getAll({ global: true });
      const results = data.results || data;
      setPlants(results);

      // Select the first plant by default if available
      if (results.length > 0) {
        setSelectedPlant(results[0]);
      }
      setLoadingPlants(false);
    } catch (error) {
      console.error("Error loading plants:", error);
      setLoadingPlants(false);
    }
  };

  const loadDiseases = async (plantId) => {
    try {
      setLoading(true);
      // Filter diseases by affected_plants ID
      const { data } = await diseaseService.getAll({ affected_plants: plantId });
      setDiseases(data.results || data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading diseases:", error);
      setLoading(false);
    }
  };

  const loadCustomDiseases = async () => {
    try {
      setLoadingCustom(true);
      // Fetch diseases with no affected plants (custom diseases)
      const { data } = await diseaseService.getAll();
      const allDiseases = data.results || data;
      // Filter for diseases with no affected plants
      const custom = allDiseases.filter(d => !d.affected_plants || d.affected_plants.length === 0);
      setCustomDiseases(custom);
      setLoadingCustom(false);
    } catch (error) {
      console.error("Error loading custom diseases:", error);
      setLoadingCustom(false);
    }
  };

  const handleViewTreatment = async (disease) => {
    setModalLoading(true);
    setShowModal(true);
    setSelectedTreatment(null); // Clear previous

    try {
      // 1. Get Disease Details to find Treatment ID
      const { data: diseaseDetail } = await diseaseService.getById(disease.id);

      if (diseaseDetail.treatments && diseaseDetail.treatments.length > 0) {
        // 2. Get Full Treatment Details (for instructions etc)
        // We take the first treatment for now as per requirement map
        const treatmentId = diseaseDetail.treatments[0].id;
        const { data: treatmentDetail } = await treatmentService.getById(treatmentId);
        setSelectedTreatment({
          ...treatmentDetail,
          disease_name: diseaseDetail.name,
          symptoms: diseaseDetail.symptoms,
          prevention_measures: diseaseDetail.prevention_measures
        });
      } else {
        // Handle case with no treatment
        setSelectedTreatment({
          disease_name: disease.name,
          disease_id: disease.id,
          error: "No treatment protocol found for this disease."
        });
      }
    } catch (error) {
      console.error("Error fetching treatment:", error);
      setSelectedTreatment({ error: "Failed to load treatment properties." });
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (isFromHistory) {
      navigate(-1);
    }
  };

  const handleCreateTreatment = async (formData) => {
    await treatmentService.create(formData);
    // Refresh diseases to show update (or just close)
    if (selectedPlant) loadDiseases(selectedPlant.id);
  };

  const handleUpdateTreatment = async (formData) => {
    await treatmentService.update(editingTreatment.id, formData);
    // Refresh displayed treatment
    const { data } = await treatmentService.getById(editingTreatment.id);
    setSelectedTreatment({ ...data, disease_name: selectedTreatment.disease_name });
    if (selectedPlant) loadDiseases(selectedPlant.id);
  };

  const handleDeleteTreatment = async () => {
    if (!window.confirm(t("treatment.deleteConfirm") || "Are you sure you want to delete this treatment protocol?")) return;
    try {
      await treatmentService.delete(selectedTreatment.id);
      setShowModal(false);
      if (selectedPlant) loadDiseases(selectedPlant.id);
    } catch (error) {
      alert(t("treatment.deleteFailed") || "Failed to delete treatment.");
    }
  };

  const openAddModal = () => {
    setEditingTreatment(null);
    setShowAddModal(true);
  };

  const openEditModal = () => {
    setEditingTreatment(selectedTreatment);
    setShowAddModal(true);
  };

  return (
    <div className="page-container">
      <Navbar activePage="treatment" />

      <div className="page-content animate-slide-up" style={{ padding: '0', maxWidth: '100%', display: 'flex', height: 'calc(100vh - 80px)', overflow: 'hidden' }}>

        {/* SIDEBAR: HOST PLANTS */}
        <div style={{
          width: '280px',
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sprout size={20} className="text-primary" />
              {t("treatment.hostPlants")}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              {t("treatment.hostPlantsDesc")}
            </p>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {loadingPlants ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {plants.map(plant => (
                  <button
                    key={plant.id}
                    onClick={() => setSelectedPlant(plant)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      borderRadius: '8px',
                      background: selectedPlant?.id === plant.id ? 'var(--primary-subtle)' : 'transparent',
                      color: selectedPlant?.id === plant.id ? 'var(--primary)' : 'var(--text-secondary)',
                      border: selectedPlant?.id === plant.id ? '1px solid var(--primary)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontWeight: selectedPlant?.id === plant.id ? 600 : 400
                    }}
                  >
                    <span>{plant.name}</span>
                    <ChevronRight size={16} style={{ opacity: selectedPlant?.id === plant.id ? 1 : 0.3 }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CUSTOM DISEASES SECTION */}
          {customDiseases.length > 0 && (
            <>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-main)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t("treatment.customDiseases")}
                </h3>
              </div>
              <div style={{ padding: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
                {loadingCustom ? (
                  <div style={{ textAlign: 'center', padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading...</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {customDiseases.map(disease => (
                      <button
                        key={disease.id}
                        onClick={() => handleViewTreatment(disease)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          background: 'transparent',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-light)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--primary-subtle)';
                          e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.borderColor = 'var(--border-light)';
                        }}
                      >
                        <span>{disease.name}</span>
                        <ChevronRight size={14} style={{ opacity: 0.5 }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* MAIN CONTENT: DISEASES GRID */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: 'var(--bg-main)' }}>
          {selectedPlant ? (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{selectedPlant.name} Diseases</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Known pathologies affecting {selectedPlant.scientific_name}</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  onClick={openAddModal}
                >
                  <Plus size={18} />
                  <span>{t("treatment.addTreatment")}</span>
                </button>
              </div>

              {loading ? (
                <div className="loading-spinner-container">
                  <div className="spinner"></div>
                  <p>{t("treatment.analyzingRecords")}</p>
                </div>
              ) : diseases.length > 0 ? (
                <div className="diseases-grid">
                  {/* HEALTHY CARD */}
                  <div className="disease-card-v2" style={{ borderLeft: '4px solid var(--success)' }}>
                    <div className="disease-header-info" style={{ padding: '2rem' }}>
                      <div className="disease-title-row">
                        <h3>{t("treatment.healthyPlantTitle")} {selectedPlant.name}</h3>
                        <div className="badge badge-edible">{t("treatment.stable")}</div>
                      </div>
                      <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {t("treatment.noSigns")}
                      </p>
                    </div>
                    <div className="disease-card-footer" style={{ padding: '1.5rem', background: 'var(--bg-card)', borderTop: '1px solid var(--border-light)' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={16} /> {t("treatment.optimalCondition")}
                      </span>
                    </div>
                  </div>

                  {/* DISEASE CARDS */}
                  {diseases.map(disease => (
                    <div key={disease.id} className="disease-card-v2 animate-slide-up">
                      <div className="disease-header-info" style={{ padding: '2rem' }}>
                        <div className="disease-title-row">
                          <h3>{disease.name}</h3>
                          <div className={`badge ${disease.severity_level === 'critical' ? 'badge-toxic' : 'badge-warning'}`}>
                            {disease.severity_level}
                          </div>
                        </div>
                        <p className="scientific-name" style={{ marginBottom: '1rem' }}>{disease.scientific_name}</p>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                          {disease.symptoms ? (disease.symptoms.substring(0, 100) + '...') : "Symptoms not documented."}
                        </p>
                      </div>

                      <div className="disease-card-footer" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-light)', background: 'var(--bg-card)' }}>
                        <button
                          className="btn-primary"
                          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                          onClick={() => handleViewTreatment(disease)}
                        >
                          <ShieldCheck size={16} />
                          {t("treatment.viewTreatmentPlan")}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <CheckCircle size={64} className="text-success" style={{ opacity: 0.5 }} />
                  <h3>{t("treatment.noDiseasesTitle")}</h3>
                  <p>{t("treatment.noDiseasesDesc")}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Sprout size={64} className="text-primary" style={{ opacity: 0.3 }} />
              <h3>{t("treatment.selectPlantTitle")}</h3>
              <p>{t("treatment.selectPlantDesc")}</p>
            </div>
          )}
        </div>
      </div>

      {/* TREATMENT MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-large animate-slide-up" style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>{t("treatment.title")}</h2>
              <button className="close-btn" onClick={handleCloseModal}>&times;</button>
            </div>

            <div style={{ padding: '0', maxHeight: '70vh', overflowY: 'auto' }}>
              {modalLoading ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}>
                  <div className="spinner"></div>
                  <p>{t("treatment.fetchingProtocol")}</p>
                </div>
              ) : selectedTreatment?.error ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <AlertTriangle size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                  <p>{selectedTreatment.error}</p>
                </div>
              ) : selectedTreatment ? (
                <div>
                  {/* HEADER SECTION */}
                  <div style={{ padding: '2.5rem', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-light)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '2rem', right: '2rem', display: 'flex', gap: '0.5rem' }}>
                      {selectedTreatment.id && (
                        <>
                          <button
                            onClick={openEditModal}
                            style={{
                              height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                              padding: '0.5rem', cursor: 'pointer',
                              color: 'var(--text-secondary)'
                            }}
                            title="Edit Treatment"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={handleDeleteTreatment}
                            style={{
                              height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: 'var(--bg-card)', border: '1px solid #fee2e2',
                              boxShadow: '0 2px 4px rgba(239,68,68,0.1)',
                              padding: '0.5rem', cursor: 'pointer',
                              color: '#dc2626'
                            }}
                            title="Delete Treatment"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                    <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      {t("treatment.treatingLabel")} {selectedTreatment.disease_name}
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>{selectedTreatment.name}</h1>
                    <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                      {selectedTreatment.description}
                    </p>

                    <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t("treatment.effectiveness")}</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                          {selectedTreatment.effectiveness_rate != null ? `${selectedTreatment.effectiveness_rate}%` : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t("treatment.cost")}</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedTreatment.cost_estimate || 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>{t("treatment.type")}</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>{selectedTreatment.treatment_type?.toUpperCase() || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* DETAILED STEPS */}
                  <div style={{ padding: '2.5rem' }}>

                    {/* SYMPTOMS */}
                    {selectedTreatment.symptoms && (
                      <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertTriangle size={20} style={{ color: 'var(--warning)' }} />
                          {t("diseases.symptoms") || "Symptoms"}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedTreatment.symptoms}</p>
                      </div>
                    )}

                    {/* PREVENTION */}
                    {selectedTreatment.prevention_measures && (
                      <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <ShieldCheck size={20} className="text-primary" />
                          {t("treatment.preventive") || "Prevention Measures"}
                        </h3>
                        <div style={{ background: 'var(--primary-subtle)', padding: '1.5rem', borderRadius: '8px', color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                          {selectedTreatment.prevention_measures}
                        </div>
                      </div>
                    )}
                    <div style={{ marginBottom: '2.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle size={20} className="text-secondary" />
                        {t("treatment.stepByStep")}
                      </h3>
                      <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--secondary)', whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                        {selectedTreatment.instructions}
                      </div>
                    </div>

                    {/* Empty fallback for no instructions */}
                    {!selectedTreatment.id && selectedTreatment.error && (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <button className="btn-primary" onClick={openAddModal}>
                          <Plus size={16} /> {t("treatment.createProtocol")}
                        </button>
                      </div>
                    )}

                    {selectedTreatment.id && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Package size={18} /> {t("treatment.requiredProducts")}
                          </h3>
                          <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                            {selectedTreatment.related_products && selectedTreatment.related_products.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                {selectedTreatment.related_products.map(product => (
                                  <div 
                                    key={product.id}
                                    onClick={() => navigate('/ecommerce', { state: { productId: product.id } })}
                                    className="product-link-badge"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      padding: '0.5rem 0.75rem',
                                      background: 'var(--bg-card)',
                                      border: '1px solid var(--primary)',
                                      borderRadius: '6px',
                                      cursor: 'pointer',
                                      fontSize: '0.85rem',
                                      color: 'var(--primary)',
                                      fontWeight: 600,
                                      transition: 'all 0.2s',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                    }}
                                  >
                                    <Package size={14} />
                                    <span>{product.name}</span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>NPR {product.price}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                {selectedTreatment.products_needed}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={18} /> {t("treatment.preventive")}
                          </h3>
                          <p style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '6px' }}>
                            {selectedTreatment.is_preventive ? t("treatment.preventiveYes") : t("treatment.preventiveNo")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="modal-footer" style={{ padding: '1.5rem 2.5rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={handleCloseModal}>{t("treatment.closeProtocol")}</button>
            </div>
          </div>
        </div>
      )}

      <TreatmentFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={editingTreatment ? handleUpdateTreatment : handleCreateTreatment}
        initialData={editingTreatment}
        diseases={diseases}
        selectedDiseaseId={selectedTreatment?.disease_id}
      />

    </div>
  );
};

export default Treatment;
