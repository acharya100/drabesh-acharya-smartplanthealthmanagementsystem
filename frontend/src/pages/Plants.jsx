/**
 * Plant Collection Management
 */

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { plantService, predictionService } from "../services/api";
import { Search, Filter, Plus, Thermometer, Droplets, Sun, Info, Trash2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const Plants = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    sunlight: "",
    water: "",
    difficulty: ""
  });
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    return params.get('filter') || "all";
  });

  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [newPlant, setNewPlant] = useState({
    name: "",
    scientific_name: "",
    family: "",
    description: "",
    sunlight_requirement: "partial_sun",
    water_frequency: "weekly",
    difficulty_level: "beginner",
    health_status: "healthy"
  });
  const [plantImage, setPlantImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Sync activeTab with URL filter parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get('filter');
    if (filter && filter !== activeTab) {
      setActiveTab(filter);
    }
  }, [location.search]);

  useEffect(() => {
    loadPlants();
  }, [filters, activeTab, location]);

  const loadPlants = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams(location.search);
      const params = {
        search: searchTerm,
        sunlight_requirement: filters.sunlight,
        water_frequency: filters.water,
        difficulty_level: filters.difficulty
      };

      if (activeTab && activeTab !== 'all') {
        params.health_status = activeTab;
      }

      const { data } = await plantService.getAll(params);
      setPlants(data.results || data);
      setLoading(false);
    } catch (error) {
      console.error("Error loading plants:", error);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadPlants();
  };

  const toggleFilter = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: prev[name] === value ? "" : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      let processedFile = file;

      // Extract folder name from path if available (webkitRelativePath)
      if (file.webkitRelativePath) {
        const pathParts = file.webkitRelativePath.split('/');
        if (pathParts.length > 1) {
          const folderName = pathParts[pathParts.length - 2];
          if (folderName.includes('___')) {
            // Encode folder name in filename for backend identification
            const newFileName = `${folderName}__${file.name}`;
            processedFile = new File([file], newFileName, { type: file.type });
            console.log(`[Identify] Encoded folder name in filename: ${newFileName}`);
          }
        }
      }

      setPlantImage(processedFile);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAnalyzeAI = async () => {
    if (!plantImage) {
      alert(t("plants.uploadFirstError") || "Please upload an image first for AI analysis.");
      return;
    }

    try {
      setIsAnalyzing(true);
      const formData = new FormData();
      formData.append('image', plantImage);

      const { data } = await predictionService.identify(formData);

      if (data.success) {
        const isNonPlant = data.data.is_plant_image === false;
        const isOutOfScope = data.data.is_out_of_scope === true;
        const rawName = data.data.name || '';
        const rawSci = data.data.scientific_name || '';

        // Non-plant image
        if (isNonPlant || !data.data.is_plant_image) {
          setNewPlant(prev => ({
            ...prev,
            name: 'Non-Leaf Image',
            scientific_name: 'N/A',
            health_status: 'non_leaf',
            sunlight_requirement: 'outside_scope',
            water_frequency: 'outside_scope',
            description: 'This image does not contain a recognizable plant leaf.'
          }));
        }
        // Outside scope image
        else if (isOutOfScope || data.data.disease_name === 'Outside Scope') {
          setNewPlant(prev => ({
            ...prev,
            name: 'Outside Scope',
            scientific_name: 'N/A',
            health_status: 'out_of_scope',
            sunlight_requirement: 'outside_scope',
            water_frequency: 'outside_scope',
            description: 'This species is not currently supported by our disease detection models.'
          }));
        }
        // Valid plant
        else {
          setNewPlant(prev => ({
            ...prev,
            name: rawName,
            scientific_name: rawSci,
            sunlight_requirement: data.data.suggestions?.sunlight?.toLowerCase().replace(' ', '_') || 'partial_sun',
            water_frequency: data.data.suggestions?.water?.toLowerCase() || 'weekly',
            difficulty_level: data.data.suggestions?.difficulty?.toLowerCase() || 'beginner',
            description: ''
          }));
        }
      }
      setIsAnalyzing(false);
    } catch (error) {
      console.error('AI Analysis failed:', error);
      setIsAnalyzing(false);
      alert(t('plants.aiAnalysisFailed') || 'AI analysis failed. Please fill the details manually.');
    }
  };

  const handleEdit = (plant) => {
    setSelectedPlant(plant);
    setIsEditing(true);
    setNewPlant({
      name: plant.name,
      scientific_name: plant.scientific_name || "",
      family: plant.family || "",
      description: plant.description || "",
      sunlight_requirement: plant.sunlight_requirement,
      water_frequency: plant.water_frequency,
      difficulty_level: plant.difficulty_level,
      health_status: plant.health_status || 'healthy'
    });
    setImagePreview(plant.image);
    setShowAddModal(true);
  };

  const handleViewDetails = (plant) => {
    setSelectedPlant(plant);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t("plants.deleteConfirm") || "Are you sure you want to delete this plant? This action cannot be undone.")) {
      try {
        setLoading(true);
        await plantService.delete(id);
        await loadPlants();
      } catch (error) {
        console.error("Error deleting plant:", error);
        alert(t("plants.deleteFailed") || "Failed to delete plant. Check your permissions or network connection.");
        setLoading(false);
      }
    }
  };

  const handleSubmitNewPlant = async (e) => {
    e.preventDefault();

    const isNonLeaf = newPlant.health_status === 'non_leaf';
    const isOutScope = newPlant.health_status === 'out_of_scope';

    // Auto-correct labels before saving
    const finalPlant = { ...newPlant };
    if (isNonLeaf) {
      finalPlant.name = 'Non-Plant Image';
      finalPlant.scientific_name = 'Non-Plant Image';
      finalPlant.sunlight_requirement = 'not_needed';
      finalPlant.water_frequency = 'not_needed';
    } else if (isOutScope) {
      finalPlant.name = 'Out of Scope';
      finalPlant.scientific_name = 'Out of Scope';
      finalPlant.sunlight_requirement = 'outside_scope';
      finalPlant.water_frequency = 'outside_scope';
    } else if (!finalPlant.name.trim()) {
      alert(t("plants.saveFailedInfo") || "Please provide a valid Plant Name before saving.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      Object.keys(finalPlant).forEach(key => {
        if (finalPlant[key] !== null && finalPlant[key] !== undefined && finalPlant[key] !== '') {
          formData.append(key, finalPlant[key]);
        }
      });
      if (plantImage && typeof plantImage !== 'string') {
        formData.append('image', plantImage);
      }

      if (isEditing) {
        await plantService.update(selectedPlant.id, formData);
      } else {
        await plantService.create(formData);
      }

      setShowAddModal(false);
      resetForm();
      loadPlants();
    } catch (error) {
      console.error("Error saving plant:", error);
      setLoading(false);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : (t("plants.saveFailedInfo") || "Check if name is unique and image is valid.");
      alert(`${t("plants.saveFailed") || "Failed to save plant:"} ${errorMsg}`);
    }
  };

  const resetForm = () => {
    setNewPlant({
      name: "",
      scientific_name: "",
      family: "",
      description: "",
      sunlight_requirement: "partial_sun",
      water_frequency: "weekly",
      difficulty_level: "beginner",
      health_status: "healthy"
    });
    setPlantImage(null);
    setImagePreview(null);
    setIsEditing(false);
    setSelectedPlant(null);
  };

  return (
    <div className="page-container">
      <Navbar activePage="plants" />
      <div className="page-content animate-slide-up">
        <div className="page-header">
          <div>
            <h1>{t("plants.title")}</h1>
            <p className="subtitle">{t("plants.subtitle")}</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => { resetForm(); setShowAddModal(true); }}
          >
            <Plus size={20} />
            <span>{t("plants.addNewPlant")}</span>
          </button>
        </div>

        {/* --- NEW TABS --- */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button className={`btn-secondary ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')} style={{ background: activeTab === 'all' ? 'var(--primary)' : 'transparent', color: activeTab === 'all' ? 'white' : 'var(--text-main)', border: activeTab === 'all' ? 'none' : '1px solid var(--border-light)' }}>{t("history.filterAll") || "All"}</button>
          <button className={`btn-secondary ${activeTab === 'healthy' ? 'active' : ''}`} onClick={() => setActiveTab('healthy')} style={{ background: activeTab === 'healthy' ? '#15803d' : 'transparent', color: activeTab === 'healthy' ? 'white' : 'var(--text-main)', border: activeTab === 'healthy' ? 'none' : '1px solid var(--border-light)' }}>{t("dashboard.statHealthyPlants") || "Healthy Plants"}</button>
          <button className={`btn-secondary ${activeTab === 'unhealthy' ? 'active' : ''}`} onClick={() => setActiveTab('unhealthy')} style={{ background: activeTab === 'unhealthy' ? '#dc2626' : 'transparent', color: activeTab === 'unhealthy' ? 'white' : 'var(--text-main)', border: activeTab === 'unhealthy' ? 'none' : '1px solid var(--border-light)' }}>{t("dashboard.statUnhealthyPlants") || "Unhealthy Plants"}</button>
          <button className={`btn-secondary ${activeTab === 'out_of_scope' ? 'active' : ''}`} onClick={() => setActiveTab('out_of_scope')} style={{ background: activeTab === 'out_of_scope' ? '#d97706' : 'transparent', color: activeTab === 'out_of_scope' ? 'white' : 'var(--text-main)', border: activeTab === 'out_of_scope' ? 'none' : '1px solid var(--border-light)' }}>{t("dashboard.statOutOfScope") || "Out of Scope"}</button>
          <button className={`btn-secondary ${activeTab === 'non_leaf' ? 'active' : ''}`} onClick={() => setActiveTab('non_leaf')} style={{ background: activeTab === 'non_leaf' ? '#64748b' : 'transparent', color: activeTab === 'non_leaf' ? 'white' : 'var(--text-main)', border: activeTab === 'non_leaf' ? 'none' : '1px solid var(--border-light)' }}>{t("dashboard.statNonPlant") || "Non-Plant Images"}</button>
        </div>

        {/* Search and Filter Section */}
        <div className="search-filter-section mb-8">
          <form onSubmit={handleSearch} className="search-bar-container">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder={t("plants.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary">{t("plants.searchButton")}</button>
          </form>
        </div>

        {/* Plants Grid */}
        {loading ? (
          <div className="loading-spinner-container">
            <div className="spinner"></div>
            <p>{t("plants.loading")}</p>
          </div>
        ) : (
          <div className="plants-grid">
            {plants.length > 0 ? (
              plants.map(plant => (
                <div key={plant.id} className="plant-card-v2">
                  <div className="plant-image-container">
                    <img
                      src={plant.image || "https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=500&h=400&auto=format&fit=crop"}
                      alt={plant.name}
                      onError={(e) => e.target.src = "https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=500&h=400&auto=format&fit=crop"}
                    />
                  </div>
                  <div className="plant-info">
                    <div className="plant-header">
                      <h3>
                        {plant.health_status === 'non_leaf' ? (t("history.badgeNonPlant") || 'Non-Plant Image') :
                          plant.health_status === 'out_of_scope' ? (t("history.badgeOutsideScope") || 'Out of Scope') :
                            plant.name}
                      </h3>
                      <span className="scientific-name">
                        {plant.health_status === 'non_leaf' ? (t("history.badgeNonPlant") || 'Non-Plant Image') :
                          plant.health_status === 'out_of_scope' ? (t("history.badgeOutsideScope") || 'Out of Scope') :
                            plant.scientific_name}
                      </span>
                    </div>

                    <div className="plant-specs">
                      <div className="spec-item"><Sun size={16} />
                        {plant.health_status === 'non_leaf' ? (t("common.notNeeded") || 'Not Needed') :
                          plant.health_status === 'out_of_scope' ? (t("common.notAvailable") || 'Not Available') :
                            plant.sunlight_display}
                      </div>
                      <div className="spec-item"><Droplets size={16} />
                        {plant.health_status === 'non_leaf' ? (t("common.notNeeded") || 'Not Needed') :
                          plant.health_status === 'out_of_scope' ? (t("common.notAvailable") || 'Not Available') :
                            plant.water_frequency_display}
                      </div>
                    </div>

                    <div className="plant-footer">
                      <div className="plant-badges">
                        {plant.health_status === 'healthy' && <span className="badge badge-edible">{t("history.badgeHealthy") || "Healthy"}</span>}
                        {plant.health_status === 'unhealthy' && <span className="badge badge-toxic">{t("history.badgeDiseased") || "Unhealthy"}</span>}
                        {plant.health_status === 'non_leaf' && <span className="badge" style={{ backgroundColor: 'var(--warning-subtle)', color: '#d97706', fontWeight: 600 }}>{t("history.badgeNonLeaf") || "Non Leaf"}</span>}
                        {plant.health_status === 'out_of_scope' && <span className="badge" style={{ backgroundColor: 'var(--text-muted)', color: 'white', fontWeight: 600 }}>{t("history.badgeOutsideScope") || "Out of Scope"}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%', justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleEdit(plant)}>
                          {t("plants.editPlant")}
                        </button>
                        <button className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleViewDetails(plant)}>
                          {t("plants.viewDetails")}
                        </button>
                        <button className="btn-secondary" style={{ padding: '0.4rem', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={() => handleDelete(plant.id)} title={t("plants.deleteTitle") || "Delete Plant"}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <Search size={64} className="text-muted" />
                <h3>{t("plants.noPlantsTitle")}</h3>
                <p>{t("plants.noPlantsDesc")}</p>
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
              <h2>{isEditing ? t("plants.editPlant") : t("plants.addNewPlantTitle")}</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmitNewPlant} className="add-plant-form">
              <div className="form-grid">
                <div className="form-left">
                  <div className="image-upload-area" onClick={() => document.getElementById('plant-image-input').click()}>
                    {imagePreview ? (
                      <div className="preview-container" style={{ width: '100%', height: '100%' }}>
                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
                      </div>
                    ) : (
                      <>
                        <Plus size={40} className="text-muted" />
                        <span className="mt-4 text-muted font-bold text-center">{t("plants.uploadPhoto")}</span>
                      </>
                    )}
                    <input id="plant-image-input" type="file" accept="image/*" onChange={handleImageChange} hidden />
                  </div>

                  {!isEditing && (
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ width: '100%', marginTop: '2rem' }}
                      onClick={handleAnalyzeAI}
                      disabled={isAnalyzing || !plantImage}
                    >
                      {isAnalyzing ? t("plants.identifying") : t("plants.identifyAI")}
                    </button>
                  )}
                </div>

                <div className="form-right">
                  <div className="form-group-row">
                    <div className="form-group">
                      <label>{t("plants.plantName")}</label>
                      <input
                        type="text"
                        value={newPlant.name}
                        onChange={(e) => setNewPlant({ ...newPlant, name: e.target.value })}
                        placeholder={t("plants.plantNamePlaceholder") || "e.g. Fiddle Leaf Fig"}
                        readOnly={newPlant.health_status === 'non_leaf' || newPlant.health_status === 'out_of_scope'}
                        style={{ opacity: (newPlant.health_status === 'non_leaf' || newPlant.health_status === 'out_of_scope') ? 0.7 : 1 }}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t("plants.scientificName")}</label>
                      <input
                        type="text"
                        value={newPlant.scientific_name}
                        onChange={(e) => setNewPlant({ ...newPlant, scientific_name: e.target.value })}
                        placeholder={t("plants.scientificNamePlaceholder") || "e.g. Ficus lyrata"}
                        readOnly={newPlant.health_status === 'non_leaf' || newPlant.health_status === 'out_of_scope'}
                        style={{ opacity: (newPlant.health_status === 'non_leaf' || newPlant.health_status === 'out_of_scope') ? 0.7 : 1 }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>{t("plants.descriptionLabel")}</label>
                    <textarea
                      value={newPlant.description}
                      onChange={(e) => setNewPlant({ ...newPlant, description: e.target.value })}
                      rows="4"
                      placeholder={t("plants.descriptionPlaceholder") || "Enter a description of the plant..."}
                    ></textarea>
                  </div>

                  {/* Sunlight + Water — hidden for non_leaf, 'Not Known' info for out_of_scope */}
                  {newPlant.health_status === 'non_leaf' ? (
                    <div style={{ padding: '1rem 1.25rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ℹ️ Sunlight requirement and watering frequency are not applicable for non-plant images.
                    </div>
                  ) : newPlant.health_status === 'out_of_scope' ? (
                    <div style={{ padding: '1rem 1.25rem', background: '#fefce8', borderRadius: '10px', border: '1px solid #fde047', color: '#854d0e', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ fontWeight: 700 }}>⚠️ Out of Scope Image</div>
                      <div>Sunlight Requirement: <strong>Not Available</strong></div>
                      <div>Watering Frequency: <strong>Not Available</strong></div>
                    </div>
                  ) : (
                    <div className="form-group-row">
                      <div className="form-group">
                        <label>{t("plants.sunlightReq")}</label>
                        <select
                          value={newPlant.sunlight_requirement}
                          onChange={(e) => setNewPlant({ ...newPlant, sunlight_requirement: e.target.value })}
                        >
                          <option value="full_sun">{t("plants.sunFull") || "Full Sun"}</option>
                          <option value="partial_sun">{t("plants.sunPartialSun") || "Partial Sun"}</option>
                          <option value="partial_shade">{t("plants.sunPartialShade") || "Partial Shade"}</option>
                          <option value="full_shade">{t("plants.sunFullShade") || "Full Shade"}</option>
                          <option value="outside_scope">{t("plants.outsideScope") || "Outside Scope"}</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{t("plants.waterFreq")}</label>
                        <select
                          value={newPlant.water_frequency}
                          onChange={(e) => setNewPlant({ ...newPlant, water_frequency: e.target.value })}
                        >
                          <option value="daily">{t("plants.waterDaily") || "Daily"}</option>
                          <option value="every_2_days">{t("plants.waterEvery2Days") || "Every 2 Days"}</option>
                          <option value="weekly">{t("plants.waterWeekly") || "Weekly"}</option>
                          <option value="bi_weekly">{t("plants.waterBiWeekly") || "Every 2 Weeks"}</option>
                          <option value="outside_scope">{t("plants.outsideScope") || "Outside Scope"}</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="form-checkbox-group" style={{ display: 'flex', gap: '2rem', border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-inner)', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <input type="radio" value="healthy" checked={newPlant.health_status === 'healthy'}
                        onChange={() => setNewPlant({ ...newPlant, health_status: 'healthy' })}
                        style={{ width: '20px', height: '20px' }} />
                      Healthy
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <input type="radio" value="unhealthy" checked={newPlant.health_status === 'unhealthy'}
                        onChange={() => setNewPlant({ ...newPlant, health_status: 'unhealthy' })}
                        style={{ width: '20px', height: '20px' }} />
                      Unhealthy
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <input type="radio" value="non_leaf" checked={newPlant.health_status === 'non_leaf'}
                        onChange={() => setNewPlant({ ...newPlant, health_status: 'non_leaf', name: 'Non-Leaf Image', scientific_name: 'N/A', sunlight_requirement: 'outside_scope', water_frequency: 'outside_scope' })}
                        style={{ width: '20px', height: '20px' }} />
                      Non-Leaf Image
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <input type="radio" value="out_of_scope" checked={newPlant.health_status === 'out_of_scope'}
                        onChange={() => setNewPlant({ ...newPlant, health_status: 'out_of_scope', name: 'Outside Scope', scientific_name: 'N/A', sunlight_requirement: 'outside_scope', water_frequency: 'outside_scope' })}
                        style={{ width: '20px', height: '20px' }} />
                      Outside Scope
                    </label>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>{t("plants.cancel")}</button>
                <button type="submit" className="btn-primary">{isEditing ? t("plants.updatePlant") : t("plants.savePlant")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Senior Standard Modal - View Details */}
      {showViewModal && selectedPlant && (
        <div className="modal-overlay">
          <div className="modal-content-large animate-slide-up">
            <div className="modal-header">
              <h2>{t("plants.plantDetails")}</h2>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>&times;</button>
            </div>
            <div className="add-plant-form">
              <div className="form-grid">
                <div className="form-left">
                  <div className="preview-image-wrapper">
                    <img src={selectedPlant.image || "https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=500&h=400&auto=format&fit=crop"} alt={selectedPlant.name} />
                  </div>
                  <div style={{ background: 'var(--bg-surface-inner)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                    <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{t("plants.quickStats")}</h4>
                    <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700 }}>{t("plants.sunlightLabel")}</span>
                        <span>{selectedPlant.sunlight_display}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700 }}>{t("plants.wateringLabel")}</span>
                        <span>{selectedPlant.water_frequency_display}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700 }}>{t("plants.difficultyLabel")}</span>
                        <span>{selectedPlant.difficulty_level_display}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-right">
                  <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{selectedPlant.name}</h1>
                    <p className="scientific-name" style={{ fontSize: '1.2rem' }}>{selectedPlant.scientific_name}</p>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("plants.description")}</h4>
                    <p style={{ lineHeight: 1.8, color: 'var(--text-main)' }}>{selectedPlant.description || (t("plants.noDescription") || "No description available for this plant.")}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {selectedPlant.health_status === 'healthy' && <span className="badge badge-edible" style={{ padding: '0.6rem 1.2rem' }}>Healthy</span>}
                    {selectedPlant.health_status === 'unhealthy' && <span className="badge badge-toxic" style={{ padding: '0.6rem 1.2rem' }}>Unhealthy</span>}
                    {selectedPlant.health_status === 'non_leaf' && <span className="badge" style={{ padding: '0.6rem 1.2rem', backgroundColor: 'var(--warning-subtle)', color: '#d97706', fontWeight: 600 }}>Non Leaf</span>}
                    {selectedPlant.health_status === 'out_of_scope' && <span className="badge" style={{ padding: '0.6rem 1.2rem', backgroundColor: 'var(--text-muted)', color: 'white', fontWeight: 600 }}>Out of Scope</span>}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '2rem 3rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => setShowViewModal(false)}>{t("plants.closeView")}</button>
              <button className="btn-primary" onClick={() => { setShowViewModal(false); handleEdit(selectedPlant); }}>{t("plants.editRecord")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plants;
