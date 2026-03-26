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
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    sunlight: "",
    water: "",
    difficulty: ""
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
    is_edible: false,
    is_medicinal: false,
    is_toxic: false
  });
  const [plantImage, setPlantImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const location = useLocation();

  useEffect(() => {
    loadPlants();
  }, [filters, location]);

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

      if (queryParams.get('filter') === 'healthy') {
        params.is_toxic = false;
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
        setNewPlant(prev => ({
          ...prev,
          name: data.data.name,
          scientific_name: data.data.scientific_name,
          sunlight_requirement: data.data.suggestions.sunlight.toLowerCase().replace(' ', '_'),
          water_frequency: data.data.suggestions.water.toLowerCase(),
          difficulty_level: data.data.suggestions.difficulty.toLowerCase()
        }));
      }
      setIsAnalyzing(false);
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setIsAnalyzing(false);
      alert(t("plants.aiAnalysisFailed") || "AI analysis failed. Please fill the details manually.");
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
      is_edible: plant.is_edible,
      is_medicinal: plant.is_medicinal,
      is_toxic: plant.is_toxic
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
    try {
      setLoading(true);
      const formData = new FormData();
      Object.keys(newPlant).forEach(key => {
        formData.append(key, newPlant[key]);
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
      is_edible: false,
      is_medicinal: false,
      is_toxic: false
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
                      <h3>{plant.name}</h3>
                      <span className="scientific-name">{plant.scientific_name}</span>
                    </div>

                    <div className="plant-specs">
                      <div className="spec-item"><Sun size={16} />{plant.sunlight_display}</div>
                      <div className="spec-item"><Droplets size={16} />{plant.water_frequency_display}</div>
                    </div>

                    <div className="plant-footer">
                      <div className="plant-badges">
                        {plant.is_edible && <span className="badge badge-edible">{t("plants.edible")}</span>}
                        {plant.is_toxic && <span className="badge badge-toxic">{t("plants.toxic")}</span>}
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
                        required
                        placeholder={t("plants.plantNamePlaceholder") || "e.g. Fiddle Leaf Fig"}
                      />
                    </div>
                    <div className="form-group">
                      <label>{t("plants.scientificName")}</label>
                      <input
                        type="text"
                        value={newPlant.scientific_name}
                        onChange={(e) => setNewPlant({ ...newPlant, scientific_name: e.target.value })}
                        placeholder={t("plants.scientificNamePlaceholder") || "e.g. Ficus lyrata"}
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
                      </select>
                    </div>
                  </div>

                  <div className="form-checkbox-group" style={{ display: 'flex', gap: '2rem', border: '1px solid var(--border-light)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-inner)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={newPlant.is_edible} onChange={(e) => setNewPlant({ ...newPlant, is_edible: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                      {t("plants.edibleLabel")}
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                      <input type="checkbox" checked={newPlant.is_toxic} onChange={(e) => setNewPlant({ ...newPlant, is_toxic: e.target.checked })} style={{ width: '20px', height: '20px' }} />
                      {t("plants.toxicLabel")}
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
                    {selectedPlant.is_edible && <span className="badge badge-edible" style={{ padding: '0.6rem 1.2rem' }}>{t("plants.edibleSpecies")}</span>}
                    {selectedPlant.is_toxic && <span className="badge badge-toxic" style={{ padding: '0.6rem 1.2rem' }}>{t("plants.toxicSpecies")}</span>}
                    {selectedPlant.is_medicinal && <span className="badge" style={{ padding: '0.6rem 1.2rem', background: 'var(--info-subtle)', color: 'var(--info)', border: '1px solid var(--info)' }}>{t("plants.medicinalUse")}</span>}
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
