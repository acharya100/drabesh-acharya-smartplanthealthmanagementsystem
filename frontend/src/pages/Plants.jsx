/**
 * Plant Collection Management
 */

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { plantService, predictionService } from "../services/api";
import { Search, Filter, Plus, Thermometer, Droplets, Sun, Info, Trash2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { toSnake } from "../utils/caseTransformer";

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
    scientificName: "",
    family: "",
    description: "",
    sunlightRequirement: "partial_sun",
    waterFrequency: "weekly",
    difficultyLevel: "beginner",
    healthStatus: "healthy"
  });
  const [plantImage, setPlantImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const loadPlants = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const queryParams = new URLSearchParams(location.search);
      const params = {
        search: searchTerm,
        sunlightRequirement: filters.sunlight,
        waterFrequency: filters.water,
        difficultyLevel: filters.difficulty
      };

      if (activeTab && activeTab !== 'all') {
        params.healthStatus = activeTab;
      }

      const { data } = await plantService.getAll(params);
      setPlants(data.results || data);

      if (!silent) setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error("Error loading plants:", error);
      setLoading(false);
      setRefreshing(false);
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
        const rawName = data.data.name || '';
        const rawSci = data.data.scientificName || data.data.scientific_name || '';
        const isNonPlant = data.data.is_non_plant || data.data.isNonPlant || data.data.type === 'non_plant';
        const isOutOfScope = data.data.is_out_of_scope || data.data.isOutOfScope || data.data.type === 'out_of_scope';
        const isPlantImage = data.data.is_plant_image ?? data.data.isPlantImage ?? true; // Default to true if missing

        // Non-plant image
        if (isNonPlant || isPlantImage === false) {
          setNewPlant(prev => ({
            ...prev,
            name: "Non-Plant Image",
            scientificName: "Non-Plant Image",
            healthStatus: 'non_plant',
            sunlightRequirement: 'non_plant',
            waterFrequency: 'non_plant',
            description: t("plants.nonPlantImageDesc") || 'The uploaded image is not a plant.'
          }));
        }
        // Outside scope image
        else if (isOutOfScope || data.data.disease_name === 'Outside Scope') {
          setNewPlant(prev => ({
            ...prev,
            name: "Outside Scope",
            scientificName: "Out of Scope",
            healthStatus: 'out_of_scope',
            sunlightRequirement: 'outside_scope',
            waterFrequency: 'outside_scope',
            description: t("plants.outsideScopeDesc") || 'The plant species is not currently supported.'
          }));
        }
        // Valid plant
        else {
          const isHealthy = data.data.is_healthy ?? data.data.isHealthy ?? true;
          setNewPlant(prev => ({
            ...prev,
            name: rawName,
            scientificName: rawSci,
            sunlightRequirement: data.data.suggestions?.sunlight?.toLowerCase().replace(' ', '_') || 'partial_sun',
            waterFrequency: data.data.suggestions?.water?.toLowerCase() || 'weekly',
            difficultyLevel: data.data.suggestions?.difficulty?.toLowerCase() || 'beginner',
            healthStatus: isHealthy ? 'healthy' : 'unhealthy',
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
      scientificName: plant.scientificName || "",
      family: plant.family || "",
      description: plant.description || "",
      sunlightRequirement: plant.sunlightRequirement,
      waterFrequency: plant.waterFrequency,
      difficultyLevel: plant.difficultyLevel,
      healthStatus: plant.healthStatus || 'healthy'
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
        await plantService.delete(id);
        await loadPlants(true); // Silent reload
      } catch (error) {
        console.error("Error deleting plant:", error);
        alert(t("plants.deleteFailed") || "Failed to delete plant. Check your permissions or network connection.");
      }
    }
  };

  const handleSubmitNewPlant = async (e) => {
    e.preventDefault();

    const isNonPlant = newPlant.healthStatus === 'non_plant';
    const isOutScope = newPlant.healthStatus === 'out_of_scope';

    // Auto-correct labels before saving
    const finalPlant = { ...newPlant };
    if (isNonPlant) {
      finalPlant.name = 'Non-Plant Image';
      finalPlant.scientificName = 'Non-Plant Image';
      finalPlant.sunlightRequirement = 'non_plant';
      finalPlant.waterFrequency = 'non_plant';
      finalPlant.is_non_plant = true;
      finalPlant.is_out_of_scope = false;
    } else if (isOutScope) {
      finalPlant.name = 'Out of Scope';
      finalPlant.scientificName = 'Out of Scope';
      finalPlant.sunlightRequirement = 'outside_scope';
      finalPlant.waterFrequency = 'outside_scope';
      finalPlant.is_non_plant = false;
      finalPlant.is_out_of_scope = true;
    } else if (!finalPlant.name.trim()) {
      alert(t("plants.saveFailedInfo") || "Please provide a valid Plant Name before saving.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      
      // Transform camelCase state to snake_case for the Django backend
      const snakePlant = toSnake(finalPlant);
      
      Object.keys(snakePlant).forEach(key => {
        if (snakePlant[key] !== null && snakePlant[key] !== undefined && snakePlant[key] !== '') {
          formData.append(key, snakePlant[key]);
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
      loadPlants(true); // Silent reload
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
      scientificName: "",
      family: "",
      description: "",
      sunlightRequirement: "partial_sun",
      waterFrequency: "weekly",
      difficultyLevel: "beginner",
      healthStatus: "healthy"
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
          <button className={`btn-secondary ${activeTab === 'out_of_scope' ? 'active' : ''}`} onClick={() => setActiveTab('out_of_scope')} style={{ background: activeTab === 'out_of_scope' ? '#d97706' : 'transparent', color: activeTab === 'out_of_scope' ? 'white' : 'var(--text-main)', border: activeTab === 'out_of_scope' ? 'none' : '1px solid var(--border-light)' }}>{t("dashboard.statOutOfScope") || "Outside Scope"}</button>
          <button className={`btn-secondary ${activeTab === 'non_plant' ? 'active' : ''}`} onClick={() => setActiveTab('non_plant')} style={{ background: activeTab === 'non_plant' ? '#64748b' : 'transparent', color: activeTab === 'non_plant' ? 'white' : 'var(--text-main)', border: activeTab === 'non_plant' ? 'none' : '1px solid var(--border-light)' }}>{t("dashboard.statNonPlant") || "Non-Plant Images"}</button>
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
                        {plant.healthStatus === 'non_plant' ? (t("history.badgeNonPlant") || 'Non-Plant Image') :
                          plant.healthStatus === 'out_of_scope' ? (t("history.badgeOutsideScope") || 'Out of Scope') :
                            plant.name}
                      </h3>
                      <span className="scientific-name">
                        {plant.healthStatus === 'non_plant' ? (t("history.badgeNonPlant") || 'Non-Plant Image') :
                          plant.healthStatus === 'out_of_scope' ? (t("history.badgeOutsideScope") || 'Out of Scope') :
                            plant.scientificName}
                      </span>
                    </div>

                    <div className="plant-specs">
                      <div className="spec-item"><Sun size={16} />
                        {plant.healthStatus === 'non_plant' ? (t("common.notNeeded") || 'Not Needed') :
                          plant.healthStatus === 'out_of_scope' ? (t("common.notAvailable") || 'Not Available') :
                            plant.sunlight_display}
                      </div>
                      <div className="spec-item"><Droplets size={16} />
                        {plant.healthStatus === 'non_plant' ? (t("common.notNeeded") || 'Not Needed') :
                          plant.healthStatus === 'out_of_scope' ? (t("common.notAvailable") || 'Not Available') :
                            plant.waterFrequency_display}
                      </div>
                    </div>

                    <div className="plant-footer">
                      <div className="plant-badges">
                        {plant.healthStatus === 'healthy' && <span className="badge badge-edible">{t("history.badgeHealthy") || "Healthy"}</span>}
                        {plant.healthStatus === 'unhealthy' && <span className="badge badge-toxic">{t("history.badgeDiseased") || "Unhealthy"}</span>}
                        {plant.healthStatus === 'non_plant' && <span className="badge" style={{ backgroundColor: 'var(--warning-subtle)', color: '#d97706', fontWeight: 600 }}>{t("history.badgeNonPlant") || "Non-Plant"}</span>}
                        {plant.healthStatus === 'out_of_scope' && <span className="badge" style={{ backgroundColor: 'var(--text-muted)', color: 'white', fontWeight: 600 }}>{t("history.badgeOutsideScope") || "Out of Scope"}</span>}
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
                        readOnly={newPlant.healthStatus === 'non_plant' || newPlant.healthStatus === 'out_of_scope'}
                        style={{ opacity: (newPlant.healthStatus === 'non_plant' || newPlant.healthStatus === 'out_of_scope') ? 0.7 : 1 }}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t("plants.scientificName")}</label>
                      <input
                        type="text"
                        value={newPlant.scientificName}
                        onChange={(e) => setNewPlant({ ...newPlant, scientificName: e.target.value })}
                        placeholder={t("plants.scientificNamePlaceholder") || "e.g. Ficus lyrata"}
                        readOnly={newPlant.healthStatus === 'non_plant' || newPlant.healthStatus === 'out_of_scope'}
                        style={{ opacity: (newPlant.healthStatus === 'non_plant' || newPlant.healthStatus === 'out_of_scope') ? 0.7 : 1 }}
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

                  {/* Sunlight + Water — informational box for non_leaf or out_of_scope */}
                  {(newPlant.healthStatus === 'non_plant' || newPlant.healthStatus === 'out_of_scope') ? (
                    <div style={{
                      background: newPlant.healthStatus === 'non_plant' ? 'var(--bg-main)' : '#fefce8',
                      borderRadius: '12px',
                      border: `1px solid ${newPlant.healthStatus === 'non_plant' ? 'var(--border-light)' : '#fde047'}`,
                      color: newPlant.healthStatus === 'non_plant' ? 'var(--text-secondary)' : '#854d0e',
                      fontSize: '0.88rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem'
                    }}>
                      <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        {newPlant.healthStatus === 'non_plant' ? (
                          <><Plus size={16} style={{ transform: 'rotate(45deg)' }} /> {t("plants.nonPlantImageHeading") || "Non-Plant Image"}</>
                        ) : (
                          <><Info size={16} /> {t("plants.outsideScopeHeading") || "Outside Scope Image"}</>
                        )}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid currentColor', paddingBottom: '0.4rem', opacity: 0.8 }}>
                        <span>{t("plants.sunlightLabel") || "Sunlight"}:</span>
                        <span style={{ fontWeight: 700 }}>{newPlant.healthStatus === 'non_plant' ? (t("common.notNeeded") || "Not Needed") : (t("common.notAvailable") || "Not Available")}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                        <span>{t("plants.wateringLabel") || "Watering"}:</span>
                        <span style={{ fontWeight: 700 }}>{newPlant.healthStatus === 'non_plant' ? (t("common.notNeeded") || "Not Needed") : (t("common.notAvailable") || "Not Available")}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="form-group-row">
                      <div className="form-group">
                        <label>{t("plants.sunlightReq")}</label>
                        <select
                          value={newPlant.sunlightRequirement}
                          onChange={(e) => setNewPlant({ ...newPlant, sunlightRequirement: e.target.value })}
                        >
                          <option value="full_sun">{t("plants.sunFull") || "Full Sun"}</option>
                          <option value="partial_sun">{t("plants.sunPartialSun") || "Partial Sun"}</option>
                          <option value="partial_shade">{t("plants.sunPartialShade") || "Partial Shade"}</option>
                          <option value="full_shade">{t("plants.sunFullShade") || "Full Shade"}</option>
                          <option value="outside_scope">{t("plants.outsideScope") || "Outside Scope"}</option>
                          <option value="non_plant">{t("plants.nonPlantImage") || "Non-Plant Image"}</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>{t("plants.waterFreq")}</label>
                        <select
                          value={newPlant.waterFrequency}
                          onChange={(e) => setNewPlant({ ...newPlant, waterFrequency: e.target.value })}
                        >
                          <option value="daily">{t("plants.waterDaily") || "Daily"}</option>
                          <option value="every_2_days">{t("plants.waterEvery2Days") || "Every 2 Days"}</option>
                          <option value="weekly">{t("plants.waterWeekly") || "Weekly"}</option>
                          <option value="bi_weekly">{t("plants.waterBiWeekly") || "Every 2 Weeks"}</option>
                          <option value="outside_scope">{t("plants.outsideScope") || "Outside Scope"}</option>
                          <option value="non_plant">{t("plants.nonPlantImage") || "Non-Plant Image"}</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="form-checkbox-group" style={{ display: 'flex', gap: '2rem', border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-inner)', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <input type="radio" value="healthy" checked={newPlant.healthStatus === 'healthy'}
                        onChange={() => setNewPlant({ ...newPlant, healthStatus: 'healthy' })}
                        style={{ width: '20px', height: '20px' }} />
                      {t("history.badgeHealthy") || "Healthy"}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <input type="radio" value="unhealthy" checked={newPlant.healthStatus === 'unhealthy'}
                        onChange={() => setNewPlant({ ...newPlant, healthStatus: 'unhealthy' })}
                        style={{ width: '20px', height: '20px' }} />
                      {t("history.badgeDiseased") || "Unhealthy"}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <input type="radio" value="non_plant" checked={newPlant.healthStatus === 'non_plant'}
                        onChange={() => setNewPlant({ ...newPlant, healthStatus: 'non_plant', name: 'Non-Plant Image', scientificName: 'Non-Plant Image', sunlightRequirement: 'non_plant', waterFrequency: 'non_plant' })}
                        style={{ width: '20px', height: '20px' }} />
                      {t("history.badgeNonPlant") || "Non-Plant Image"}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <input type="radio" value="out_of_scope" checked={newPlant.healthStatus === 'out_of_scope'}
                        onChange={() => setNewPlant({ ...newPlant, healthStatus: 'out_of_scope', name: 'Out of Scope', scientificName: 'Out of Scope', sunlightRequirement: 'outside_scope', waterFrequency: 'outside_scope' })}
                        style={{ width: '20px', height: '20px' }} />
                      {t("history.badgeOutsideScope") || "Out of Scope"}
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
                        <span>{selectedPlant.waterFrequency_display}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700 }}>{t("plants.difficultyLabel")}</span>
                        <span>{selectedPlant.difficultyLevel_display}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-right">
                  <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{selectedPlant.name}</h1>
                    <p className="scientific-name" style={{ fontSize: '1.2rem' }}>{selectedPlant.scientificName}</p>
                  </div>

                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("plants.description")}</h4>
                    <p style={{ lineHeight: 1.8, color: 'var(--text-main)' }}>{selectedPlant.description || (t("plants.noDescription") || "No description available for this plant.")}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {selectedPlant.healthStatus === 'healthy' && <span className="badge badge-edible" style={{ padding: '0.6rem 1.2rem' }}>{t("history.badgeHealthy") || "Healthy"}</span>}
                    {selectedPlant.healthStatus === 'unhealthy' && <span className="badge badge-toxic" style={{ padding: '0.6rem 1.2rem' }}>{t("history.badgeDiseased") || "Unhealthy"}</span>}
                    {selectedPlant.healthStatus === 'non_plant' && <span className="badge" style={{ padding: '0.6rem 1.2rem', backgroundColor: 'var(--warning-subtle)', color: '#d97706', fontWeight: 600 }}>{t("history.badgeNonPlant") || "Non-Plant Image"}</span>}
                    {selectedPlant.healthStatus === 'out_of_scope' && <span className="badge" style={{ padding: '0.6rem 1.2rem', backgroundColor: 'var(--text-muted)', color: 'white', fontWeight: 600 }}>{t("history.badgeOutsideScope") || "Out of Scope"}</span>}
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
