import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const Treatment = () => {
  const [treatments, setTreatments] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTreatments();
  }, []);

  const fetchTreatments = async () => {
    try {

      
      setTimeout(() => {
        setTreatments([
          {
            id: 1,
            disease: "Leaf Blight",
            treatment: "Fungicide Application",
            description: "Apply copper-based fungicide to affected areas. Repeat every 7-10 days.",
            steps: [
              "Remove infected leaves",
              "Mix fungicide according to instructions",
              "Apply evenly to all surfaces",
              "Repeat after 7-10 days if needed"
            ],
            products: ["Copper Fungicide", "Chlorothalonil"],
            severity: "Moderate"
          },
          {
            id: 2,
            disease: "Powdery Mildew",
            treatment: "Neem Oil Treatment",
            description: "Use neem oil or baking soda solution. Safe and effective organic treatment.",
            steps: [
              "Mix 1 tbsp neem oil with 1 gallon water",
              "Add dish soap as emulsifier",
              "Spray on affected leaves in morning",
              "Repeat every 5-7 days"
            ],
            products: ["Neem Oil", "Baking Soda Solution"],
            severity: "Mild"
          },
          {
            id: 3,
            disease: "Root Rot",
            treatment: "Soil Treatment & Repotting",
            description: "Remove affected roots and repot in fresh, well-draining soil.",
            steps: [
              "Remove plant from pot",
              "Trim brown, mushy roots",
              "Disinfect with hydrogen peroxide",
              "Repot in fresh soil"
            ],
            products: ["Hydrogen Peroxide", "Well-draining Potting Mix"],
            severity: "Severe"
          }
        ]);
        setLoading(false);
      }, 300);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const filteredTreatments = treatments.filter(t => {
    const matchesDisease = selectedDisease === "all" || t.disease.toLowerCase().includes(selectedDisease.toLowerCase());
    const matchesSearch = t.disease.toLowerCase().includes(searchTerm.toLowerCase()) || t.treatment.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDisease && matchesSearch;
  });

  const uniqueDiseases = ["all", ...new Set(treatments.map(t => t.disease))];

  return (
    <div className="page-container">
      <Navbar activePage="treatment" />
      <div className="page-content">
        <div className="page-header">
          <h1>Treatment Recommendations</h1>
        </div>
        <div className="treatment-filters">
          <div className="filter-group">
            <label>Filter by Disease:</label>
            <select value={selectedDisease} onChange={(e) => setSelectedDisease(e.target.value)} className="filter-select">
              {uniqueDiseases.map(d => (
                <option key={d} value={d}>{d === "all" ? "All Diseases" : d}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              className="search-input"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="treatments-grid">
            {filteredTreatments.length === 0 ? (
              <div className="empty-state"><p>No treatments found</p></div>
            ) : (
              filteredTreatments.map(t => (
                <div key={t.id} className="treatment-card">
                  <div className="treatment-header">
                    <div>
                      <h3>{t.disease}</h3>
                      <p className="treatment-name">{t.treatment}</p>
                    </div>
                    <span className={`severity-badge severity-${t.severity.toLowerCase()}`}>{t.severity}</span>
                  </div>
                  <div className="treatment-body">
                    <p>{t.description}</p>
                    <h4>Steps:</h4>
                    <ol className="treatment-steps">
                      {t.steps.map((step, i) => <li key={i}>{step}</li>)}
                    </ol>
                    <h4>Products:</h4>
                    <div className="products-list">
                      {t.products.map((product, i) => <span key={i} className="product-tag">{product}</span>)}
                    </div>
                  </div>
                  <div className="treatment-footer">
                    <Link to="/disease" className="btn-link">Detect Disease →</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Treatment;
