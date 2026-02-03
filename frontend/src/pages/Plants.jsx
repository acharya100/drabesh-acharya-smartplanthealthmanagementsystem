/**
 * Plants Management Page
 * 
 * Displays a professional grid of plants with advanced search and filtering.
 * Connects to the backend Plant API for real-time data.
 * 
 * Author: Smart Plant Health Management System
 * Sprint: 3 - Plant and Disease Management
 */

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { plantService } from "../services/api";
import { Search, Filter, Plus, Thermometer, Droplets, Sun, Info } from "lucide-react";

const Plants = () => {
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

  useEffect(() => {
    loadPlants();
  }, [filters]);

  const loadPlants = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        sunlight_requirement: filters.sunlight,
        water_frequency: filters.water,
        difficulty_level: filters.difficulty
      };
      const { data } = await plantService.getAll(params);
      // DRF returns results in data.results when paginated
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
      setPlantImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAnalyzeAI = async () => {
    if (!plantImage) {
      alert("Please upload an image first for AI analysis.");
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
      alert("AI analysis failed. Please fill the details manually.");
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
      if (plantImage) {
        formData.append('image', plantImage);
      }

      await plantService.create(formData);
      setShowAddModal(false);
      // Reset form
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
      loadPlants();
    } catch (error) {
      console.error("Error creating plant:", error);
      setLoading(false);
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : "Make sure the name is unique and image is valid.";
      alert(`Failed to create plant: ${errorMsg}`);
    }
  };

  return (
    <div className="page-container">
      <Navbar activePage="plants" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Plant Database</h1>
            <p className="subtitle">Discover and learn about various plant species</p>
          </div>
          <button
            className="btn-primary flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={20} />
            <span>Add New Species</span>
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="search-filter-section mb-8">
          <form onSubmit={handleSearch} className="search-bar-container">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search by name, scientific name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-search">Search</button>
            <button
              type="button"
              className={`btn-filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
            </button>
          </form>

          {showFilters && (
            <div className="filters-dropdown animate-fade-in">
              <div className="filter-group">
                <h3>Sunlight</h3>
                <div className="filter-pills">
                  {['full_sun', 'partial_sun', 'partial_shade', 'full_shade'].map(opt => (
                    <button
                      key={opt}
                      className={`filter-pill ${filters.sunlight === opt ? 'active' : ''}`}
                      onClick={() => toggleFilter('sunlight', opt)}
                    >
                      {opt.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <h3>Watering</h3>
                <div className="filter-pills">
                  {['daily', 'every_2_days', 'weekly', 'bi_weekly'].map(opt => (
                    <button
                      key={opt}
                      className={`filter-pill ${filters.water === opt ? 'active' : ''}`}
                      onClick={() => toggleFilter('water', opt)}
                    >
                      {opt.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <h3>Difficulty</h3>
                <div className="filter-pills">
                  {['beginner', 'intermediate', 'advanced', 'expert'].map(opt => (
                    <button
                      key={opt}
                      className={`filter-pill ${filters.difficulty === opt ? 'active' : ''}`}
                      onClick={() => toggleFilter('difficulty', opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Plants Grid */}
        {loading ? (
          <div className="loading-spinner-container">
            <div className="spinner"></div>
            <p>Loading curated plants...</p>
          </div>
        ) : (
          <div className="plants-grid">
            {plants.length > 0 ? (
              plants.map(plant => (
                <div key={plant.id} className="plant-card-v2 animate-slide-up">
                  <div className="plant-image-container">
                    <img
                      src={plant.image || "/default-plant.jpg"}
                      alt={plant.name}
                      onError={(e) => e.target.src = "https://images.unsplash.com/photo-1545239351-ef35f43d514b?q=80&w=300&h=200&auto=format&fit=crop"}
                    />
                    <div className="plant-difficulty-badge" data-level={plant.difficulty_level}>
                      {plant.difficulty_display}
                    </div>
                  </div>
                  <div className="plant-info">
                    <div className="plant-header">
                      <h3>{plant.name}</h3>
                      <span className="scientific-name">{plant.scientific_name}</span>
                    </div>
                    <p className="plant-desc-short">{plant.description?.substring(0, 100)}...</p>

                    <div className="plant-specs">
                      <div className="spec-item">
                        <Sun size={16} />
                        <span>{plant.sunlight_display}</span>
                      </div>
                      <div className="spec-item">
                        <Droplets size={16} />
                        <span>{plant.water_frequency_display}</span>
                      </div>
                      <div className="spec-item">
                        <Thermometer size={16} />
                        <span>{plant.temperature_range || "Ambient"}</span>
                      </div>
                    </div>

                    <div className="plant-footer">
                      <div className="plant-badges">
                        {plant.is_edible && <span className="badge badge-edible">Edible</span>}
                        {plant.is_medicinal && <span className="badge badge-medicinal">Medicinal</span>}
                        {plant.is_toxic && <span className="badge badge-toxic">Toxic</span>}
                      </div>
                      <button className="btn-icon-link">
                        <Info size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <Search size={48} />
                <h3>No Plants Found</h3>
                <p>Try adjusting your filters or search term to find what you're looking for.</p>
                <button className="btn-secondary mt-4" onClick={() => {
                  setSearchTerm("");
                  setFilters({ sunlight: "", water: "", difficulty: "" });
                }}>Clear All Filters</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add New Plant Modal */}
      {showAddModal && (
        <div className="modal-overlay animate-fade-in">
          <div className="modal-content-large animate-slide-up">
            <div className="modal-header">
              <h2>Add New Plant Species</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmitNewPlant} className="add-plant-form">
              <div className="form-grid">
                <div className="form-left">
                  <div className="image-upload-area">
                    {imagePreview ? (
                      <div className="preview-container">
                        <img src={imagePreview} alt="Preview" />
                        <button type="button" className="btn-reupload" onClick={() => { setPlantImage(null); setImagePreview(null); }}>Change Image</button>
                      </div>
                    ) : (
                      <label className="upload-placeholder">
                        <Plus size={40} />
                        <span>Upload Plant Image</span>
                        <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                      </label>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn-ai-analyze mt-4"
                    onClick={handleAnalyzeAI}
                    disabled={isAnalyzing || !plantImage}
                  >
                    {isAnalyzing ? "Analyzing Species..." : "Analyze with AI (PyTorch)"}
                  </button>
                  {isAnalyzing && <div className="ai-loader-bar"></div>}
                </div>

                <div className="form-right">
                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Plant Name</label>
                      <input
                        type="text"
                        value={newPlant.name}
                        onChange={(e) => setNewPlant({ ...newPlant, name: e.target.value })}
                        required
                        placeholder="e.g. Aloe Vera"
                      />
                    </div>
                    <div className="form-group">
                      <label>Scientific Name</label>
                      <input
                        type="text"
                        value={newPlant.scientific_name}
                        onChange={(e) => setNewPlant({ ...newPlant, scientific_name: e.target.value })}
                        placeholder="e.g. Aloe barbadensis"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newPlant.description}
                      onChange={(e) => setNewPlant({ ...newPlant, description: e.target.value })}
                      rows="3"
                    ></textarea>
                  </div>

                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Sunlight Requirement</label>
                      <select
                        value={newPlant.sunlight_requirement}
                        onChange={(e) => setNewPlant({ ...newPlant, sunlight_requirement: e.target.value })}
                      >
                        <option value="full_sun">Full Sun</option>
                        <option value="partial_sun">Partial Sun</option>
                        <option value="partial_shade">Partial Shade</option>
                        <option value="full_shade">Full Shade</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Water Frequency</label>
                      <select
                        value={newPlant.water_frequency}
                        onChange={(e) => setNewPlant({ ...newPlant, water_frequency: e.target.value })}
                      >
                        <option value="daily">Daily</option>
                        <option value="every_2_days">Every 2 Days</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi_weekly">Bi-Weekly</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Difficulty level</label>
                    <div className="difficulty-radio-group">
                      {['beginner', 'intermediate', 'advanced', 'expert'].map(level => (
                        <label key={level} className={`difficulty-label ${newPlant.difficulty_level === level ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name="difficulty"
                            value={level}
                            checked={newPlant.difficulty_level === level}
                            onChange={(e) => setNewPlant({ ...newPlant, difficulty_level: e.target.value })}
                          />
                          {level}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-checkbox-group">
                    <label><input type="checkbox" checked={newPlant.is_edible} onChange={(e) => setNewPlant({ ...newPlant, is_edible: e.target.checked })} /> Edible</label>
                    <label><input type="checkbox" checked={newPlant.is_medicinal} onChange={(e) => setNewPlant({ ...newPlant, is_medicinal: e.target.checked })} /> Medicinal</label>
                    <label><input type="checkbox" checked={newPlant.is_toxic} onChange={(e) => setNewPlant({ ...newPlant, is_toxic: e.target.checked })} /> Toxic</label>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Plant Species</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plants;
