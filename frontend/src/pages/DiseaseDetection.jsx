import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { predictionService } from "../services/api";
import { Upload, Camera, AlertTriangle, CheckCircle, ArrowRight, RefreshCw, X } from "lucide-react";

/**
 * Disease Detection Page
 * 
 * Allows users to upload or capture plant photos for AI-based diagnosis.
 * Connects to the backend Prediction API and displays results with treatment links.
 * 
 * Author: Smart Plant Health Management System
 * Sprint: 4 - Disease Detection
 */
const DiseaseDetection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);
    setError("");
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDetect = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await predictionService.detect(formData);

      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError(response.data.message || "Detection failed");
      }
    } catch (err) {
      console.error("Detection error:", err);
      setError(err.response?.data?.message || "An error occurred during diagnosis.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError("");
  };

  return (
    <div className="discovery-page">
      <Navbar activePage="disease" />

      <div className="discovery-content">
        <header className="discovery-header">
          <div className="header-badge">AI DIAGNOSTICS</div>
          <h1>Plant Disease Detection</h1>
          <p>Upload a photo of your plant's leaves for instant health analysis and treatment advice.</p>
        </header>

        <div className="detection-layout">
          <div className="detection-main">
            <div className="upload-container-v2">
              {!preview ? (
                <div className="upload-dropzone" onClick={() => document.getElementById('fileInput').click()}>
                  <div className="dropzone-icon">
                    <Upload size={48} />
                  </div>
                  <h3>Select Plant Photo</h3>
                  <p>JPEG or PNG up to 5MB</p>
                  <div className="btn-primary mt-6">
                    Browse Files
                  </div>
                  <input
                    id="fileInput"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="preview-stage">
                  <div className="preview-image-wrapper">
                    <img src={preview} alt="Plant to analyze" />
                    <button className="btn-close-preview" onClick={handleReset}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="preview-meta">
                    <span className="file-name">{selectedFile.name}</span>
                    <div className="preview-actions">
                      <button
                        className="btn-primary flex-1 py-3"
                        onClick={handleDetect}
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="loader-inline">
                            <RefreshCw className="animate-spin" size={20} />
                            <span>Analyzing...</span>
                          </div>
                        ) : (
                          <div className="loader-inline">
                            <Camera size={20} />
                            <span>Run Diagnosis</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="error-banner">
                  <AlertTriangle size={20} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>

          <aside className="detection-sidebar">
            {result ? (
              <div className="result-card-v2 animate-fade-in">
                <div className="result-header">
                  <div className={`status-pill ${result.is_healthy ? 'healthy' : 'infected'}`}>
                    {result.is_healthy ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {result.is_healthy ? 'Plant is Healthy' : 'Infection Detected'}
                  </div>
                  <h2>{result.disease_name}</h2>
                  <div className="confidence-meter">
                    <div className="meter-label">AI Confidence: {result.confidence.toFixed(1)}%</div>
                    <div className="meter-bar">
                      <div className="meter-fill" style={{ width: `${result.confidence}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="result-details">
                  {!result.is_healthy && (
                    <div className="severity-info">
                      <span className="label">Severity Level:</span>
                      <span className={`value severity-${result.severity}`}>
                        {result.severity.toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="action-steps">
                    {result.is_healthy ? (
                      <p className="healthy-tip">Your plant looks great! Continue your current care routine to maintain its health.</p>
                    ) : (
                      <div className="next-steps-container">
                        <h4 className="flex items-center gap-2"><ArrowRight size={18} /> Next Steps</h4>
                        <div className="treatment-preview">
                          {result.recommended_treatment ? (
                            <div className="treatment-cta">
                              <p>We found a treatment protocol: <strong>{result.recommended_treatment.name}</strong></p>
                              <Link to="/treatment" className="btn-link">
                                View Full Protocol <ArrowRight size={16} />
                              </Link>
                            </div>
                          ) : (
                            <p>Suggested Action: Search for treatments in our database or consult our plant experts.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-result-state">
                <div className="icon-pulse">
                  <Camera size={48} />
                </div>
                <h3>Awaiting Analysis</h3>
                <p>Diagnostic results and treatment steps will appear here after you run the analysis.</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetection;
