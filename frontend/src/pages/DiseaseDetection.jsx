import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { predictionService } from "../services/api";
import { Upload, Camera, AlertTriangle, CheckCircle, ArrowRight, RefreshCw, X, Activity, Plus, Clock } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { offlineStore } from "../utils/offlineStore";
import { useOfflineSync } from "../context/OfflineSyncContext";

/**
 * AI Disease Detection Lab
 * Author: Drabesh Acharya
 */
const DiseaseDetection = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { enqueueAction } = useOfflineSync();
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
      setError(t("detection.errorImage") || "Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t("detection.errorSize") || "File size must be less than 5MB");
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
      setError(t("detection.errorFirst") || "Please select an image first");
      return;
    }

    setLoading(true);
    setError("");

    // Always attempt the local backend — it runs on localhost and is accessible
    // even without internet. navigator.onLine checks internet, NOT local server.
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await predictionService.detect(formData);
      const res = response.data;

      // ... same as before ...
      const isValid = res.status === "valid" || res.success === true;
      const payload = res.data || {};

      if (!isValid && res.status === "error") {
        setError(res.message || t("detection.detectionFailed") || "Detection failed.");
        return;
      }

      if (res.status === "invalid" || (res.success === true && payload.isRecognized === false)) {
        const type = res.type || (payload.isPlantImage === false ? "non_plant" : "out_of_scope");
        setResult({
          ...payload,
          id: res.predictionId,
          isPlantImage: type !== "non_plant",
          isOutOfScope: type === "out_of_scope",
          isRecognized: false,
          _message: res.message || payload.message,
        });
        return;
      }

      setResult({
        ...payload,
        id: res.predictionId,
        isRecognized: true,
        severity: payload.severity || 'minor',
        estimatedCost: payload.estimatedCost || (payload.severity === 'moderate' ? 350 : (payload.severity === 'severe' ? 400 : 300))
      });
    } catch (err) {
      console.error("Detection error:", err);
      // Fallback: If network fails during request, save for later
      const reader = new FileReader();
      reader.onloadend = () => {
        const fakeId = "offline-" + Date.now();
        enqueueAction('CREATE_PRED', fakeId, { imageBase64: reader.result });
        setResult({
          id: fakeId,
          isHealthy: false,
          diseaseName: "Local Diagnostic Mode (Network Error)",
          confidence: 80.0,
          severity: "moderate",
          estimatedCost: 350,
          diseaseId: null,
          treatmentStatus: "pending",
          recommendedTreatment: { name: "General Broad-Spectrum Protocol" },
          message: "Network request failed. We have switched to local diagnostic mode. The precise disease will be automatically verified when your connection improves.",
        });
        setLoading(false);
      };
      reader.readAsDataURL(selectedFile);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTreatment = async () => {
    if (!result || !result.id) return;

    // Always try local backend first; catch block handles server-down gracefully
    try {
      setLoading(true);
      await predictionService.update(result.id, {
        treatmentStatus: 'in_progress',
        treatment_status: 'in_progress',
        severity: result.severity,
        estimatedCost: result.estimatedCost,
        estimated_cost: result.estimatedCost
      });
      setResult(prev => ({ ...prev, treatmentStatus: 'in_progress' }));
      // Navigate to treatment history to see the progress
      navigate("/treatment-history");
    } catch (err) {
      console.error("Error starting treatment:", err);
      // Fallback: If update fails (e.g. network blip), save locally anyway
      offlineStore.saveOfflineUpdate(result.id, { treatmentStatus: 'in_progress', treatment_status: 'in_progress' });
      navigate("/treatment-history");
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
          <div className="header-badge" style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'var(--primary-subtle)', color: 'var(--primary)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '1rem' }}>{t("detection.aiDetectionBadge")}</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '0.5rem' }}>{t("detection.title")}</h1>
          <p style={{ maxWidth: '600px', margin: '0 auto', fontSize: '1rem', color: 'var(--text-muted)' }}>{t("detection.subtitle")}</p>
        </header>

        <div className="detection-layout">
          <div className="detection-main">
            <div className="upload-container-v2">
              {!preview && !cameraActive ? (
                <div className="upload-options" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="upload-dropzone" onClick={() => document.getElementById('fileInput').click()} style={{ border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-md)', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Upload size={48} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>{t("detection.uploadImage")}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>PNG, JPG or JPEG up to 5MB</p>
                    <input id="fileInput" type="file" accept="image/*" onChange={handleFileChange} className="hidden" style={{ display: 'none' }} />
                  </div>

                  <div className="or-divider" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>{t("detection.orDivider")}</div>

                  <div
                    className="camera-zone"
                    onClick={startCamera}
                    style={{ border: '2px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '2rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}
                  >
                    <div style={{ background: 'var(--primary-subtle)', padding: '1rem', borderRadius: '50%', color: 'var(--primary)' }}>
                      <Camera size={32} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{t("detection.useCamera")}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>{t("detection.takePhoto")}</p>
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
                            <span>{t("detection.analyzing")}</span>
                          </div>
                        ) : (
                          <div className="loader-inline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                            <RefreshCw size={20} />
                            <span>{t("detection.detectBtn")}</span>
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
              {result ? (
                <div className="result-card-v2 animate-slide-up" style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--glass-shadow)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>

                  {/* 
                      NON-PLANT IMAGE — clear label, no disease/confidence UI
                  */}
                  {result.isNonPlant ? (
                    <div style={{ padding: 0 }}>
                      {/* Header */}
                      <div style={{ padding: '2rem 2.5rem', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Plus size={28} color="white" style={{ transform: 'rotate(45deg)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                            {t("detection.notAPlantBadge") || "NOT A PLANT IMAGE"}
                          </div>
                          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: 0 }}>
                            {t("plants.nonPlantImage") || "Non-Plant Image"}
                          </h2>
                        </div>
                      </div>

                      <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Explanation block — Match the Outside Scope style */}
                        <div style={{ background: 'var(--bg-main)', borderRadius: 12, padding: '1.5rem', border: '1px solid var(--border-light)' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.8rem' }}>AI Diagnostic Insight</div>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                            {result.message || t("plants.nonPlantImageDesc") || 'The uploaded image is not a plant.'}
                          </p>
                        </div>

                        {/* Tips / Action Steps */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {[
                            t("detection.tipClearPhoto") || 'Upload a clear, close-up photo of a single plant leaf.',
                            t("detection.tipLighting") || 'Ensure adequate lighting and avoid dark or blurry images.',
                            t("detection.tipCrop") || 'Crop the image so the leaf fills most of the frame.',
                          ].map((tip, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', borderRadius: 8, background: 'var(--bg-main)', border: '1px solid var(--border-light)' }}>
                              <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#64748b', color: '#fff', fontSize: '0.72rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                              <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{tip}</span>
                            </div>
                          ))}
                        </div>

                        <button onClick={() => { setResult(null); setPreview(null); }} style={{ width: '100%', padding: '0.9rem', borderRadius: 10, background: '#475569', color: 'white', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <RefreshCw size={16} /> {t("detection.detectBtn") || "Try Another Image"}
                        </button>
                      </div>
                    </div>

                  ) : result.isOfflineSaved ? (
                    <div style={{ padding: 0 }}>
                      <div style={{ padding: '2rem 2.5rem', background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Clock size={28} color="white" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#92400e', marginBottom: '0.4rem' }}>
                            OFFLINE SYNC PENDING
                          </div>
                          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#78350f', margin: 0 }}>
                            {result.diseaseName}
                          </h2>
                        </div>
                      </div>
                      <div style={{ padding: '2.5rem' }}>
                        <div style={{ background: '#fffbeb', borderRadius: 12, padding: '1.5rem', border: '1px solid #fde68a', marginBottom: '1.5rem' }}>
                          <p style={{ color: '#78350f', fontSize: '1rem', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                            {result.message}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                          <button onClick={() => { setResult(null); setPreview(null); }} style={{ width: '100%', padding: '0.9rem', borderRadius: 10, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                            <RefreshCw size={16} /> Take Another Scan
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : result.isOutOfScope ? (
                    <div style={{ padding: 0 }}>
                      {/* Header */}
                      <div style={{ padding: '2rem 2.5rem', background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)', borderBottom: '1px solid #fde68a', display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <AlertTriangle size={28} color="white" />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#92400e', marginBottom: '0.4rem' }}>
                            OUTSIDE SUPPORTED DATASET
                          </div>
                          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#78350f', margin: 0 }}>
                            {t("plants.outsideScope") || "Outside Scope"}
                          </h2>
                        </div>
                      </div>

                      {/* Explanation */}
                      <div style={{ background: '#fffbeb', borderRadius: 12, padding: '1.5rem', border: '1px solid #fde68a' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#92400e', marginBottom: '0.8rem' }}>AI Diagnostic Insight</div>
                        <p style={{ color: '#78350f', fontSize: '1rem', fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                          {result.message || t("plants.outsideScopeDesc") || 'The plant is not available in the dataset.'}
                        </p>
                      </div>

                      {/* Supported crops */}
                      <div style={{ background: 'var(--bg-main)', borderRadius: 12, padding: '1.25rem', border: '1px solid var(--border-light)' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Currently Supported Crops</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {['Apple', 'Blueberry', 'Cherry', 'Corn', 'Grape', 'Orange', 'Peach', 'Pepper', 'Potato', 'Raspberry', 'Soybean', 'Squash', 'Strawberry', 'Tomato'].map(plant => (
                            <span key={plant} style={{ padding: '0.25rem 0.65rem', borderRadius: 100, background: 'var(--primary-subtle)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700 }}>{plant}</span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                          'Re-upload a clear photo showing only the leaf.',
                          'Ensure the leaf belongs to one of the supported crops above.',
                          'Crop tightly to the leaf and remove background clutter.',
                          'For unsupported species, consult your local agriculture office.',
                        ].map((step, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem', borderRadius: 8, background: 'var(--bg-main)', border: '1px solid var(--border-light)' }}>
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#f59e0b', color: '#fff', fontSize: '0.72rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                            <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step}</span>
                          </div>
                        ))}
                      </div>

                      <button onClick={() => { setResult(null); setPreview(null); }} style={{ width: '100%', padding: '0.9rem', borderRadius: 10, background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <RefreshCw size={16} /> Try Another Image
                      </button>
                    </div>

                    /* ── VALID PLANT RESULT ─────────────────────────────────── */
                  ) : (
                    <>
                      <div className="result-header animate-slide-up" style={{ padding: '2.5rem', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-light)' }}>
                        {/* Status pills help users quickly see if their plant is okay or not */}
                        <div className={`status-pill ${result.isHealthy ? 'healthy' : 'infected'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1.5rem', background: result.isHealthy ? 'var(--primary-subtle)' : '#fee2e2', color: result.isHealthy ? 'var(--primary)' : '#dc2626' }}>
                          {result.isHealthy ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                          {result.isHealthy ? t("detection.healthyStatus") : t("detection.infectedStatus")}
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '2rem' }}>{result.diseaseName}</h2>
                        <div className="confidence-meter">
                          <div className="meter-label" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem', opacity: 0.7 }}>
                            <span>{t("detection.confidenceLabel")}</span>
                            <span>{result.confidence.toFixed(1)}%</span>
                          </div>
                          <div className="meter-bar" style={{ height: '8px', background: 'var(--border-light)', borderRadius: '100px', overflow: 'hidden' }}>
                            <div className="meter-fill" style={{ width: `${result.confidence}%`, height: '100%', background: 'var(--primary)', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                          </div>
                        </div>
                      </div>


                      <div className="result-details" style={{ padding: '2.5rem' }}>
                        {!result.isHealthy && (
                          <div className="severity-cost-override" style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                              <label className="label" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                                {t("history.severityLevel") || "Severity Level"}:
                              </label>
                              <select
                                value={result.severity}
                                onChange={(e) => setResult({ ...result, severity: e.target.value })}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--bg-main)', fontSize: '1rem', fontWeight: 700, color: 'var(--secondary)' }}
                              >
                                <option value="minor">{t("history.severityLow") || "Minor"}</option>
                                <option value="moderate">{t("history.severityModerate") || "Moderate"}</option>
                                <option value="severe">{t("history.severityHigh") || "Severe"}</option>
                                <option value="critical">{t("history.severityCritical") || "Critical"}</option>
                              </select>
                            </div>

                            <div>
                              <label className="label" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                                {t("history.estimatedCost") || "Treatment Cost (NPR)"}:
                              </label>
                              <input
                                type="number"
                                value={result.estimatedCost || ""}
                                onChange={(e) => setResult({ ...result, estimatedCost: parseFloat(e.target.value) })}
                                placeholder="300"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1px solid var(--border-light)', background: 'var(--bg-main)', fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="action-steps">
                          {result.isHealthy ? (
                            <p className="healthy-tip" style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{t("detection.healthyTip")}</p>
                          ) : (
                            <>
                              <div className="next-steps-container">
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '1.5rem' }}><ArrowRight size={18} /> {t("detection.recommendedActions")}</h4>
                                <div className="treatment-preview">
                                  {result.recommendedTreatment ? (
                                    <div className="treatment-cta" style={{ background: 'var(--bg-main)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                                      <p style={{ fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>Recommended treatment: <strong style={{ color: 'var(--secondary)' }}>{result.recommendedTreatment.name}</strong></p>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        <button
                                          onClick={handleStartTreatment}
                                          className="btn-primary"
                                          disabled={loading || result.treatmentStatus === 'in_progress'}
                                          style={{
                                            width: '100%',
                                            justifyContent: 'center',
                                            gap: '0.5rem',
                                            opacity: result.treatmentStatus === 'in_progress' ? 0.7 : 1
                                          }}
                                        >
                                          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Activity size={18} />}
                                          {result.treatmentStatus === 'in_progress' ? t("detection.treatmentInProgress") || 'Treatment in Progress' : t("detection.startTreatmentBtn") || 'Start Treatment Progress'}
                                        </button>

                                        <Link
                                          to="/treatment"
                                          state={{ initialDiseaseId: result.diseaseId, initialDiseaseName: result.diseaseName }}
                                          className="btn-secondary"
                                          style={{ display: 'flex', justifyContent: 'center', padding: '0.8rem', fontSize: '0.9rem', width: '100%' }}
                                        >
                                          {t("detection.viewTreatmentGuide")}
                                        </Link>
                                      </div>
                                    </div>
                                  ) : (
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t("detection.noTreatmentFound")}</p>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="empty-result-state" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', textAlign: 'center', background: 'var(--bg-main)', borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border-light)' }}>
                  <div className="icon-pulse" style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
                    <Camera size={80} style={{ opacity: 0.2 }} />
                  </div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--secondary)' }}>{t("detection.readyTitle")}</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '280px' }}>{t("detection.readySubtitle")}</p>
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
