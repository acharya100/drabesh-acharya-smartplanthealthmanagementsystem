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

  return (
    <div className="page-container">
      <Navbar activePage="plants" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Plant Database</h1>
            <p className="subtitle">Discover and learn about various plant species</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
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
    </div>
  );
};

export default Plants;
