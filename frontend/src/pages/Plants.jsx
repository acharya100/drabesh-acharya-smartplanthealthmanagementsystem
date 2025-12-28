import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

const Plants = () => {
  const [plants, setPlants] = useState([]);
  const [formData, setFormData] = useState({ name: "", species: "", location: "", datePlanted: "", notes: "" });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
  
      setTimeout(() => {
        setPlants([
          { id: 1, name: "Tomato Plant", species: "Solanum lycopersicum", location: "Garden A", datePlanted: "2024-01-15", notes: "Healthy growth" },
          { id: 2, name: "Basil", species: "Ocimum basilicum", location: "Indoor", datePlanted: "2024-02-20", notes: "Needs more sunlight" },
        ]);
      }, 200);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingId) {
        
     
        setPlants(plants.map(p => p.id === editingId ? { ...p, ...formData } : p));
      } else {
       
        setPlants([...plants, { id: Date.now(), ...formData }]);
      }
      setFormData({ name: "", species: "", location: "", datePlanted: "", notes: "" });
      setEditingId(null);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const handleEdit = (plant) => {
    setFormData({ name: plant.name, species: plant.species, location: plant.location, datePlanted: plant.datePlanted, notes: plant.notes });
    setEditingId(plant.id);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this plant?")) {
      
      setPlants(plants.filter(p => p.id !== id));
    }
  };

  const filteredPlants = plants.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.species.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <Navbar activePage="plants" />
      <div className="page-content">
        <div className="page-header">
          <h1>Plant Management</h1>
        </div>
        <div className="plants-layout">
          <div className="form-card">
            <h2>{editingId ? "Edit Plant" : "Add Plant"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Plant Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Species *</label>
                <input type="text" name="species" value={formData.species} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Date Planted</label>
                <input type="date" name="datePlanted" value={formData.datePlanted} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Saving..." : editingId ? "Update" : "Add"}
                </button>
                {editingId && (
                  <button type="button" className="btn-secondary" onClick={() => {
                    setFormData({ name: "", species: "", location: "", datePlanted: "", notes: "" });
                    setEditingId(null);
                  }}>Cancel</button>
                )}
              </div>
            </form>
          </div>
          <div className="plants-list">
            <div className="list-header">
              <h2>Plants ({filteredPlants.length})</h2>
              <input
                type="text"
                className="search-input"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="plants-grid">
              {filteredPlants.length === 0 ? (
                <div className="empty-state"><p>No plants found</p></div>
              ) : (
                filteredPlants.map(plant => (
                  <div key={plant.id} className="plant-card">
                    <div className="plant-card-header">
                      <h3>{plant.name}</h3>
                      <div>
                        <button className="icon-btn" onClick={() => handleEdit(plant)}>✏️</button>
                        <button className="icon-btn" onClick={() => handleDelete(plant.id)}>🗑️</button>
                      </div>
                    </div>
                    <div className="plant-card-body">
                      <p className="plant-species">{plant.species}</p>
                      <p>📍 {plant.location || "Not specified"}</p>
                      {plant.datePlanted && <p>📅 {new Date(plant.datePlanted).toLocaleDateString()}</p>}
                      {plant.notes && <p className="plant-notes">{plant.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plants;
