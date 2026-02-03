/**
 * Treatment Recommendations Page
 * 
 * Provides detailed guidance on managing plant diseases.
 * Connects to the backend Treatment API for verified protocols.
 * 
 * Author: Smart Plant Health Management System
 * Sprint: 3 - Plant and Disease Management
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { treatmentService, diseaseService } from "../services/api";
import { Search, Filter, ShieldCheck, List, Package, ArrowRight } from "lucide-react";

const Treatment = () => {
  const [treatments, setTreatments] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [selectedDisease, setSelectedDisease] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadTreatments();
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

  const handleSearch = (e) => {
    e.preventDefault();
    loadTreatments();
  };

  return (
    <div className="page-container">
      <Navbar activePage="treatment" />
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Treatment Protocols</h1>
            <p className="subtitle">Expert-verified methods for plant recovery</p>
          </div>
        </div>

        <div className="search-filter-section mb-8">
          <form onSubmit={handleSearch} className="search-bar-container">
            <div className="search-input-wrapper">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search by treatment name or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-search">Search</button>
            <select
              className="filter-select-v2"
              value={selectedDisease}
              onChange={(e) => setSelectedDisease(e.target.value)}
            >
              <option value="">All Diseases</option>
              {diseases.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </form>
        </div>

        {loading ? (
          <div className="loading-spinner-container">
            <div className="spinner"></div>
            <p>Loading medical protocols...</p>
          </div>
        ) : (
          <div className="treatments-grid">
            {treatments.length > 0 ? (
              treatments.map(t => (
                <div key={t.id} className="treatment-card-v2 animate-slide-up">
                  <div className="treatment-header-v2">
                    <div className="treatment-badge">
                      {t.is_preventive ? 'Preventive' : 'Curative'}
                    </div>
                    <div className={`effectiveness-meter efficacy-${Math.floor((t.effectiveness_rate || 0) / 20) * 20}`}>
                      {t.effectiveness_rate}% Effective
                    </div>
                  </div>

                  <div className="treatment-main">
                    <div className="disease-ctx">{t.disease_name}</div>
                    <h3>{t.name}</h3>
                    <p className="treatment-desc">{t.description}</p>
                  </div>

                  <div className="treatment-details-v2">
                    <div className="detail-section">
                      <h4><List size={16} /> Application Steps</h4>
                      <ul className="v2-steps-list">
                        {t.instruction_steps?.slice(0, 3).map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                        {t.instruction_steps?.length > 3 && <li className="more-steps">+{t.instruction_steps.length - 3} more steps...</li>}
                      </ul>
                    </div>

                    <div className="detail-section">
                      <h4><Package size={16} /> Products Needed</h4>
                      <div className="product-pills-v2">
                        {t.products_list?.map((p, i) => (
                          <span key={i} className="prod-pill">{p}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="treatment-footer-v2">
                    <div className="cost-est">Est. Cost: {t.cost_estimate || 'N/A'}</div>
                    <button className="btn-primary-sm">
                      <span>Full Protocol</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <ShieldCheck size={48} />
                <h3>No Treatments Found</h3>
                <p>We don't have a protocol matching your search yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Treatment;
