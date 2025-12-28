import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

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
     
      setTimeout(() => {
        setResult({
          disease: "Leaf Blight",
          confidence: 87.5,
          description: "Leaf blight is a common fungal disease that affects many plant species.",
          severity: "Moderate",
          recommendations: [
            "Remove and destroy infected leaves",
            "Apply fungicide containing copper",
            "Improve air circulation",
            "Avoid overhead watering"
          ]
        });
        setLoading(false);
      }, 1500);
    } catch (err) {
      setError("An error occurred");
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
    <div className="page-container">
      <Navbar activePage="disease" />
      <div className="page-content">
        <div className="page-header">
          <h1>Disease Detection</h1>
        </div>
        <div className="detection-container">
          <div className="upload-card">
            <h2>Upload Plant Image</h2>
            {!preview ? (
              <div className="upload-area">
                <div className="upload-icon">📷</div>
                <p>Select an image (JPG, PNG, Max 5MB)</p>
                <label className="file-input-label">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="file-input" />
                  Choose File
                </label>
              </div>
            ) : (
              <div className="preview-container">
                <div className="image-preview">
                  <img src={preview} alt="Preview" />
                  <button className="remove-image-btn" onClick={handleReset}>✕</button>
                </div>
                <p>{selectedFile.name}</p>
              </div>
            )}
            {error && <div className="error-message">{error}</div>}
            <div className="detection-actions">
              <button className="btn-primary" onClick={handleDetect} disabled={!selectedFile || loading}>
                {loading ? "Detecting..." : "Detect Disease"}
              </button>
              {preview && <button className="btn-secondary" onClick={handleReset}>Reset</button>}
            </div>
          </div>

          {result && (
            <div className="result-card">
              <h2>Detection Results</h2>
              <div className="result-header">
                <div>
                  <h3>{result.disease}</h3>
                  <p>{result.confidence}% confidence</p>
                </div>
                <span className={`severity-badge severity-${result.severity.toLowerCase()}`}>
                  {result.severity}
                </span>
              </div>
              <div className="result-content">
                <p>{result.description}</p>
                <h4>Recommendations:</h4>
                <ul className="recommendations-list">
                  {result.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
                <Link to="/treatment" className="btn-primary">View Treatments</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetection;
