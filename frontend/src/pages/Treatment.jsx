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
  CheckCircle, Plus, Edit2, Trash2,
  Sparkles
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
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
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
    } else {
      loadAllDiseases();
    }
  }, [selectedPlant]);

  const loadAllDiseases = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const { data } = await diseaseService.getAll();
      setDiseases(data.results || data);

      if (!silent) setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error loading diseases:", error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPlants = async () => {
    try {
      setLoadingPlants(true);
      // Fetch 'global' plants (system plants) for the reference guide
      const { data } = await plantService.getAll({ global: true });
      const results = data.results || data;
      setPlants(results);

      // By default, no specific plant is selected (shows "All")
      setSelectedPlant(null);

      setLoadingPlants(false);
    } catch (error) {
      console.error("Error loading plants:", error);
      setLoadingPlants(false);
    }
  };

  const loadDiseases = async (plantId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      // Filter diseases by affected_plants ID
      const { data } = await diseaseService.getAll({ affected_plants: plantId });
      setDiseases(data.results || data);

      if (!silent) setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error loading diseases:", error);
      setLoading(false);
      setRefreshing(false);
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
    setSelectedTreatment(null);
    if (isFromHistory) {
      navigate(-1);
    }
  };

  const handleCreateTreatment = async (formData) => {
    await treatmentService.create(formData);
    // Refresh diseases to show update (or just close)
    if (selectedPlant) loadDiseases(selectedPlant.id, true); // silent
  };

  const handleUpdateTreatment = async (formData) => {
    await treatmentService.update(editingTreatment.id, formData);
    // Refresh displayed treatment
    const { data } = await treatmentService.getById(editingTreatment.id);
    setSelectedTreatment({ ...data, disease_name: selectedTreatment.disease_name });
    if (selectedPlant) loadDiseases(selectedPlant.id, true); // silent
  };

  const handleDeleteTreatment = async () => {
    if (!window.confirm(t("treatment.deleteConfirm") || "Are you sure you want to delete this treatment protocol?")) return;
    try {
      await treatmentService.delete(selectedTreatment.id);
      setSelectedTreatment(null);
      if (selectedPlant) loadDiseases(selectedPlant.id, true); // silent
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
                <button
                  onClick={() => { setSelectedPlant(null); setSelectedTreatment(null); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    borderRadius: '8px',
                    background: selectedPlant === null ? 'var(--primary-subtle)' : 'transparent',
                    color: selectedPlant === null ? 'var(--primary)' : 'var(--text-secondary)',
                    border: selectedPlant === null ? '1px solid var(--primary)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: selectedPlant === null ? 600 : 400
                  }}
                >
                  <span>All Plants</span>
                  <ChevronRight size={16} style={{ opacity: selectedPlant === null ? 1 : 0.3 }} />
                </button>
                {plants.map(plant => (
                  <button
                    key={plant.id}
                    onClick={() => { setSelectedPlant(plant); setSelectedTreatment(null); }}
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

        {/* MAIN CONTENT: DISEASES GRID OR PROTOCOL */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: 'var(--bg-main)' }}>
          {selectedTreatment ? (
            <div className="treatment-detail-view animate-slide-up" style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem 2.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-surface-inner)' }}>
                <button className="btn-secondary" onClick={handleCloseModal} style={{ padding: '0.5rem 1rem' }}>
                      Back to Directory
                </button>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{t("treatment.title")}</h2>
              </div>
              <div style={{ padding: '0' }}>
                {modalLoading ? (
                  <div style={{ padding: '4rem', textAlign: 'center' }}>
                    <div className="spinner"></div>
                    <p>{t("treatment.fetchingProtocol")}</p>
                  </div>
                ) : selectedTreatment?.error ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <AlertTriangle size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                    <p>{selectedTreatment.error}</p>
                    <div style={{ marginTop: '2rem' }}>
                      <button className="btn-primary" onClick={openAddModal}>
                        <Plus size={16} /> {t("treatment.createProtocol")}
                      </button>
                    </div>
                  </div>
                ) : (
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

                      {selectedTreatment.instructions && (
                        <div style={{ marginBottom: '2.5rem' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={20} className="text-secondary" />
                            {t("treatment.stepByStep")}
                          </h3>
                          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--secondary)', whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                            {selectedTreatment.instructions}
                          </div>
                        </div>
                      )}

                      {selectedTreatment.id && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                          <div>
                            {/* NEW SEPARATED FIRST AID SECTION */}
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309' }}>
                              <AlertTriangle size={18} /> Quick treatment / First aid
                            </h3>
                            <div style={{ padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '6px', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                              {selectedTreatment.products_needed || 'No immediate first aid materials specified.'}
                            </div>

                            {/* MARKETPLACE PRODUCTS - REDESIGNED FOR SINGLE CHOICE */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                              <Package size={20} className="text-primary" />
                              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                                Expert Recommendation
                              </h3>
                            </div>

                            <div style={{ padding: '0', background: 'transparent', borderRadius: '12px' }}>
                              {selectedTreatment.recommended_product ? (
                                <div className="recommendation-card" style={{
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--primary)',
                                  borderRadius: '12px',
                                  overflow: 'hidden',
                                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                  position: 'relative'
                                }}>
                                  {/* Featured Badge */}
                                  <div style={{
                                    position: 'absolute', top: '0', right: '0',
                                    background: 'var(--primary)', color: 'white',
                                    padding: '0.4rem 1rem', fontSize: '0.7rem',
                                    fontWeight: 900, textTransform: 'uppercase',
                                    borderBottomLeftRadius: '12px',
                                    zIndex: 1
                                  }}>
                                    Top Choice
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {/* Product Content */}
                                    <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                      {selectedTreatment.recommended_product.product.image ? (
                                        <img
                                          src={selectedTreatment.recommended_product.product.image}
                                          alt={selectedTreatment.recommended_product.product.name}
                                          style={{ width: '100px', height: '100px', objectFit: 'contain', borderRadius: '8px', background: '#f8fafc' }}
                                        />
                                      ) : (
                                        <div style={{ width: '100px', height: '100px', background: 'var(--bg-main)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                          <Package size={40} style={{ opacity: 0.2 }} />
                                        </div>
                                      )}
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                          {selectedTreatment.recommended_product.treatment_type}
                                        </div>
                                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800 }}>
                                          {selectedTreatment.recommended_product.product.name}
                                        </h4>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                                          NPR {parseFloat(selectedTreatment.recommended_product.product.price).toLocaleString()}
                                        </div>
                                      </div>
                                    </div>

                                    {/* AI Reasoning Section */}
                                    <div style={{
                                      padding: '1.25rem 1.5rem',
                                      background: 'var(--primary-subtle)',
                                      borderTop: '1px solid var(--primary)',
                                      borderBottom: '1px solid var(--border-light)'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Sparkles size={16} className="text-primary" />
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>Why this product?</span>
                                      </div>
                                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                        {selectedTreatment.recommended_product.reason}
                                      </p>
                                    </div>

                                    {/* Usage & CTA */}
                                    <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-inner)' }}>
                                      <div style={{ flex: 1, marginRight: '1rem' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Usage</span>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                                          {selectedTreatment.recommended_product.product.usage_instructions || 'Follow package instructions.'}
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate('/checkout', { state: { directBuyProduct: selectedTreatment.recommended_product.product } });
                                        }}
                                        className="btn-primary"
                                        style={{
                                          padding: '0.8rem 1.5rem',
                                          fontSize: '0.9rem',
                                          fontWeight: 700,
                                          borderRadius: '8px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem',
                                          boxShadow: '0 4px 12px rgba(var(--primary-rgb), 0.2)'
                                        }}
                                      >
                                        Buy Now <ChevronRight size={18} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div style={{
                                  padding: '2rem',
                                  textAlign: 'center',
                                  background: 'var(--bg-surface-inner)',
                                  borderRadius: '12px',
                                  border: '1px dashed var(--border-light)'
                                }}>
                                  <Package size={32} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                    No specific treatment products are currently linked.
                                    <br />
                                    <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/store')}>
                                      Browse general marketplace {"->"}
                                    </span>
                                  </p>
                                </div>
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
                )}
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
                  {selectedPlant ? `${selectedPlant.name} Diseases` : "Disease & Treatment Directory"}
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {selectedPlant ? `Known pathologies affecting ${selectedPlant.scientific_name}` : "Comprehensive directory of plant diseases and their treatment protocols"}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search diseases or symptoms..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '0.8rem 1rem 0.8rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.9rem' }}
                  />
                </div>
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

                  {/* DISEASE CARDS */}
                  {diseases.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.symptoms && d.symptoms.toLowerCase().includes(searchQuery.toLowerCase()))).map(disease => (
                    <div key={disease.id} className="disease-card-v2 animate-slide-up" style={{ position: 'relative' }}>
                      <div className="disease-header-info" style={{ padding: '2rem' }}>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm("Are you sure you want to delete this disease/treatment mapping?")) {
                               await treatmentService.delete(disease.id);
                               if (selectedPlant) loadDiseases(selectedPlant.id, true);
                               else loadAllDiseases(true);
                            }
                          }}
                          style={{
                            position: 'absolute', top: '1.25rem', right: '1.25rem',
                            background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer',
                            padding: '0.4rem', borderRadius: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          title="Delete Disease"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="disease-title-row" style={{ paddingRight: '2rem' }}>
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
          )}
        </div>
      </div>

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
