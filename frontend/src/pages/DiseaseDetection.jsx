import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { predictionService } from "../services/api";
import { Upload, Camera, AlertTriangle, CheckCircle, ArrowRight, RefreshCw, X } from "lucide-react";

/**
 * AI Disease Detection Lab
 * Author: Drabesh Acharya
 */
const DiseaseDetection = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = (node) => {
    if (node && cameraActive && node.srcObject === null) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        .then(stream => {
          node.srcObject = stream;
          window.localStream = stream; // Store stream to stop it later
        })
        .catch(err => {
          console.error("Camera Error:", err);
          setError("Could not access camera. Please allow permissions.");
          setCameraActive(false);
        });
    }
  };

  const startCamera = () => {
    setCameraActive(true);
    setResult(null);
    setError("");
  };

  const stopCamera = () => {
    if (window.localStream) {
      window.localStream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const takePhoto = () => {
    const video = document.querySelector('video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Create blob/file from canvas
    canvas.toBlob(blob => {
      const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
      setSelectedFile(file);
      setPreview(canvas.toDataURL('image/jpeg'));
      stopCamera();
    }, 'image/jpeg');
  };

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

    // Extract PlantVillage folder name from file path if possible
    let processedFile = file;
    let folderName = null;

    // Try to get the parent folder name from webkitRelativePath (available when using directory picker)
    if (file.webkitRelativePath) {
      console.log(`[Upload] webkitRelativePath: ${file.webkitRelativePath}`);
      const pathParts = file.webkitRelativePath.split('/');
      if (pathParts.length > 1) {
        // Get the parent folder name (e.g., "Tomato___Bacterial_spot")
        folderName = pathParts[pathParts.length - 2];
        console.log(`[Upload] Extracted folder name: ${folderName}`);

        if (folderName.includes('___')) {
          // Found PlantVillage pattern - encode it in filename to help the backend
          const newFileName = `${folderName}__${file.name}`;
          processedFile = new File([file], newFileName, { type: file.type });
          console.log(`[Upload] Encoded folder name in filename: ${newFileName}`);
        }
      }
    }

    setSelectedFile(processedFile);
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
      const serverData = err.response?.data;
      const errorMsg = serverData?.message || serverData?.error || (serverData ? JSON.stringify(serverData) : null);
      setError(errorMsg || "An error occurred during diagnosis.");
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

      <div className="discovery-content animate-slide-up">
        <header className="discovery-header mb-8" style={{ textAlign: 'center' }}>
          {/* Badge is a nice tiny UI detail that makes the page feel premium */}
          <div className="header-badge" style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'var(--primary-subtle)', color: 'var(--primary)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1rem' }}>AI DISEASE DETECTION</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Detect Plant Disease</h1>
          <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1rem', color: 'var(--text-muted)' }}>Upload a photo of your plant for instant AI-based diagnosis.</p>
        </header>

        <div className="detection-layout">
          <div className="detection-main">
            <div className="upload-container-v2">
              {!preview && !cameraActive ? (
                <div className="upload-options" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="upload-dropzone" style={{ border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-card)', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <div onClick={() => document.getElementById('fileInput').click()} style={{ flex: 1 }}>
                      <Upload size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                      <h4 style={{ fontSize: '1rem' }}>Upload Image</h4>
                      <input id="fileInput" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </div>
                    <div style={{ width: '1px', background: 'var(--border-light)' }}></div>
                    <div onClick={() => document.getElementById('folderInput').click()} style={{ flex: 1 }}>
                      <Upload size={32} style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }} />
                      <h4 style={{ fontSize: '1rem' }}>Upload Folder</h4>
                      <input id="folderInput" type="file" webkitdirectory="true" directory="true" multiple onChange={handleFileChange} className="hidden" />
                    </div>
                  </div>

                  <div className="or-divider" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>OR</div>

                  <div
                    className="camera-zone"
                    onClick={startCamera}
                    style={{ border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}
                  >
                    <div style={{ background: 'var(--primary-subtle)', padding: '1rem', borderRadius: '50%', color: 'var(--primary)' }}>
                      <Camera size={32} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Use Camera</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Take a photo directly</p>
                    </div>
                  </div>
                </div>
              ) : cameraActive ? (
                <div className="camera-preview-stage" style={{ position: 'relative', background: '#000', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', display: 'block' }}></video>
                  <div className="camera-controls" style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button onClick={takePhoto} style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'white', border: '4px solid rgba(255,255,255,0.5)', cursor: 'pointer' }} aria-label="Take Photo"></button>
                    <button onClick={stopCamera} style={{ position: 'absolute', right: '20px', bottom: '10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}>
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="preview-stage">
                  <div className="preview-image-wrapper">
                    <img src={preview} alt="Plant to analyze" />
                    <button className="btn-close-preview" onClick={handleReset}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="preview-meta" style={{ width: '100%', maxWidth: '450px' }}>
                    <div className="preview-actions">
                      <button
                        className="btn-primary"
                        onClick={handleDetect}
                        disabled={loading}
                        style={{ width: '100%', height: '54px', fontSize: '1rem', fontWeight: 700 }}
                      >
                        {loading ? (
                          <div className="loader-inline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                            <RefreshCw className="animate-spin" size={20} />
                            <span>Analyzing...</span>
                          </div>
                        ) : (
                          <div className="loader-inline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                            <RefreshCw size={20} />
                            <span>Detect Disease</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="error-banner" style={{ marginTop: '2rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                  <AlertTriangle size={20} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <aside className="detection-sidebar">
              {/* If we have a result, we show it here in a beautiful card */}
              {result ? (
                <div className="result-card-v2 animate-slide-up" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                  <div className="result-header" style={{ padding: '2.5rem', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-light)' }}>
                    {/* Status pills help users quickly see if their plant is okay or not */}
                    <div className={`status-pill ${result.is_healthy ? 'healthy' : 'infected'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', background: result.is_healthy ? 'var(--primary-subtle)' : '#fee2e2', color: result.is_healthy ? 'var(--primary)' : '#dc2626' }}>
                      {result.is_healthy ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                      {result.is_healthy ? 'Plant is Healthy' : 'Disease Detected'}
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>{result.disease_name}</h2>
                    <div className="confidence-meter">
                      <div className="meter-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', opacity: 0.7 }}>
                        <span>AI CONFIDENCE</span>
                        <span>{result.confidence.toFixed(1)}%</span>
                      </div>
                      <div className="meter-bar" style={{ height: '8px', background: 'var(--border-light)', borderRadius: '100px', overflow: 'hidden' }}>
                        <div className="meter-fill" style={{ width: `${result.confidence}%`, height: '100%', background: 'var(--primary)', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="result-details" style={{ padding: '2.5rem' }}>
                    {!result.is_healthy && (
                      <div className="severity-info" style={{ marginBottom: '2.5rem' }}>
                        <span className="label" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Disease Severity:</span>
                        <span className={`value severity-${result.severity}`} style={{ fontSize: '1.25rem', fontWeight: 800, color: result.severity === 'critical' ? '#dc2626' : 'var(--secondary)' }}>
                          {result.severity.toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div className="action-steps">
                      {result.is_healthy ? (
                        <p className="healthy-tip" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>No diseases detected. Keep up with your regular plant care routine and monitor for any changes.</p>
                      ) : (
                        <div className="next-steps-container">
                          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '1.5rem' }}><ArrowRight size={18} /> Recommended Actions</h4>
                          <div className="treatment-preview">
                            {result.recommended_treatment ? (
                              <div className="treatment-cta" style={{ background: 'var(--bg-main)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                                <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>Recommended treatment: <strong style={{ color: 'var(--secondary)' }}>{result.recommended_treatment.name}</strong></p>
                                <Link to="/treatment" className="btn-primary" style={{ display: 'flex', justifyContent: 'center', padding: '0.8rem', fontSize: '0.9rem', width: '100%' }}>
                                  View Treatment Guide
                                </Link>
                              </div>
                            ) : (
                              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No specific treatment found in our database. Check the Disease Records for more information.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-result-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', textAlign: 'center', background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border-light)' }}>
                  <div className="icon-pulse" style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
                    <Camera size={80} style={{ opacity: 0.2 }} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--secondary)' }}>Ready for Detection</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '280px' }}>Upload a plant photo on the left to start the AI analysis.</p>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseDetection;
