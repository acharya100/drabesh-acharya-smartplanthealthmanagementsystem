/**
 * Soil Analysis & Fertilizer Recommendation
 * Analyzes soil data and recommends products from the marketplace
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { soilService, eCommerceService } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import {
    Leaf, FlaskConical, TrendingUp, AlertTriangle,
    CheckCircle, ShoppingCart, History, RotateCcw, ChevronRight,
    ArrowRight, TestTube, Zap, Droplets, Wind, Activity, Info,
    BookOpen, Target, X, ShieldCheck, Loader2, ChevronDown, Trash2
} from "lucide-react";

const SOIL_TYPES = ["sandy", "loamy", "clay", "silty", "peaty", "chalky"];

const OPTIMAL = {
    nitrogen: { low: 250, high: 300, unit: " kg/ha", description: "Primary driver of healthy vegetative growth & chlorophyll" },
    phosphorus: { low: 60, high: 120, unit: " kg/ha", description: "Critical for root development and energy (ATP) transfer" },
    potassium: { low: 220, high: 350, unit: " kg/ha", description: "Regulates water use, stomata and disease resistance" },
    phLevel: { low: 6.5, high: 7.2, unit: "", description: "Slightly acidic to neutral range optimizes nutrient uptake" },
    moisture: { low: 45, high: 70, unit: "%", description: "Required for mineral transport and microbial activity" },
    organicMatter: { low: 3.5, high: 7.0, unit: "%", description: "Foundation of fertile soil structure and carbon storage" },
};

const DEFAULT_FORM = {
    nitrogen: 200, phosphorus: 60, potassium: 180,
    phLevel: 6.5, moisture: 50, organicMatter: 4, soilType: "loamy",
};

// -- Score Gauge ----------------------------------------------------------------
const ScoreGauge = ({ score }) => {
    const { t } = useLanguage();
    const color = score >= 75 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--danger)";
    const labelKey = score >= 75 ? "excellent" : score >= 50 ? "moderate" : "poor";
    const label = t(`soil.${labelKey}`) || labelKey.charAt(0).toUpperCase() + labelKey.slice(1);
    const labelDesc = t(`soil.labels.${labelKey}`) || "";
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
            <svg width="140" height="140" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border-light)" strokeWidth="10" />
                <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="10"
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round" transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dashoffset 1.2s ease" }} />
                <text x="60" y="55" textAnchor="middle" fill={color} fontSize="26" fontWeight="900">{score}</text>
                <text x="60" y="73" textAnchor="middle" fill="var(--text-muted)" fontSize="9">/100</text>
            </svg>
            <span style={{ fontWeight: 900, color, fontSize: "1rem" }}>{label}</span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center", maxWidth: 140 }}>{labelDesc}</span>
        </div>
    );
};

// -- Parameter Slider with optimal range indicator ------------------------------
const ParameterSlider = ({ paramKey, label, value, min, max, step, unit, icon: Icon, onChange, color = "var(--primary)", isActive, onInfoClick }) => {
    const { t } = useLanguage();
    const opt = OPTIMAL[paramKey];
    const isLow = opt && value < opt.low;
    const isHigh = opt && value > opt.high;
    const status = isLow ? `    ${t("common.low") || "Low"}` : isHigh ? `    ${t("common.high") || "High"}` : `    ${t("common.good") || "Good"}`;
    const statusColor = isLow ? "var(--danger)" : isHigh ? "var(--warning)" : "var(--success)";

    return (
        <div style={{
            marginBottom: "1.25rem",
            padding: "0.75rem",
            borderRadius: "14px",
            transition: "all 0.3s",
            background: isActive ? "var(--primary-subtle)" : "transparent",
            border: `1px solid ${isActive ? "var(--primary-light)" : "transparent"}`
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <label style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        {Icon && <Icon size={14} style={{ color }} />}
                        {label}
                    </label>
                    <button
                        onClick={(e) => { e.preventDefault(); onInfoClick(); }}
                        style={{ background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", cursor: "pointer" }}
                        title="Click for professional guidance"
                    >
                        <Info size={18} strokeWidth={2.5} className="transition-all" style={{
                            color: isActive ? "#fff" : "var(--primary)",
                            background: isActive ? "var(--primary)" : "var(--primary-subtle)",
                            borderRadius: "50%", padding: "2px",
                            boxShadow: isActive ? "0 4px 12px var(--primary-light)" : "none"
                        }} />
                    </button>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.68rem", padding: "0.1rem 0.5rem", borderRadius: 10, background: `${statusColor}18`, color: statusColor, fontWeight: 800 }}>{status}</span>
                    <span style={{ fontWeight: 900, fontSize: "0.95rem", color, minWidth: 70, textAlign: "right" }}>
                        {value}{unit}
                    </span>
                </div>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: color, height: 6, cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.2rem", fontSize: "0.68rem", color: "var(--text-muted)" }}>
                <span>{min}{unit}</span>
                {opt && <span style={{ color: "var(--success)", fontWeight: 700 }}>{t("common.optimal") || "Optimal"}: {opt.low}-{opt.high}{unit}</span>}
                <span>{max}{unit}</span>
            </div>
        </div>
    );
};

// -- Nutrient to Marketplace Keyword Mapping ------------------------------
const NUTRIENT_KEYWORDS = {
    nitrogen: ["urea", "nitrogen", "npk"],
    phosphorus: ["dap", "phosphate", "phosphorus"],
    potassium: ["potash", "potassium", "mop"],
    phLevel: ["lime", "sulphur", "dolomite"],
    moisture: ["mulch", "drip", "irrigation"],
    organicMatter: ["compost", "manure", "organic"]
};

// -- NEW Detail Info Component ------------------------------
const ActiveParamInfo = ({ paramKey, onClose }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const tip = t(`soil.parameterTips.${paramKey}`, { returnObjects: true });
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!paramKey) return;
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const keywords = NUTRIENT_KEYWORDS[paramKey] || [paramKey];
                // Search for products matching the first keyword
                const { data } = await eCommerceService.getProducts({ q: keywords[0], pageSize: 3 });
                setProducts(data.results || []);
            } catch (err) {
                console.error("Failed to fetch products for nutrient:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [paramKey]);

    if (!tip) return null;

    return (
        <div style={{
            marginTop: "0.5rem", marginBottom: "2rem", padding: "2rem", borderRadius: "24px",
            background: "var(--bg-card)", border: "2px solid var(--primary-light)",
            boxShadow: "0 25px 50px -12px rgba(6, 95, 70, 0.15)",
            position: "relative",
            zIndex: 10
        }} className="animate-slide-up">
            {/* Top Close Button - Very Clear */}
            <button
                onClick={onClose}
                style={{
                    position: "absolute", top: "1.25rem", right: "1.25rem",
                    background: "var(--bg-surface-1)", border: "1px solid var(--border-light)",
                    borderRadius: "14px", width: 36, height: 36,
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    color: "var(--text-muted)", boxShadow: "var(--shadow-sm)", transition: "all 0.2s"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.1)"; e.currentTarget.style.color = "var(--danger)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                title={t("common.close") || "Close Guidance"}
            >
                <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div style={{ width: 44, height: 44, borderRadius: "12px", background: "var(--primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                    <BookOpen size={24} />
                </div>
                <div>
                    <h4 style={{ margin: 0, fontWeight: 900, color: "var(--text-dark)", fontSize: "1.15rem" }}>
                        {tip.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
                        {t("soil.expertAdvice") || "AI-Powered Professional Guidance"}
                    </p>
                </div>
            </div>

            <p style={{ margin: "0 0 1.5rem", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6, fontWeight: 500 }}>
                {tip.desc}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
                <div style={{ background: "var(--bg-surface-1)", padding: "1.25rem", borderRadius: "18px", border: "1px solid var(--border-light)" }}>
                    <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                        Probable Impact
                    </p>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-main)", fontStyle: "italic", lineHeight: 1.5, fontWeight: 600 }}>
                        {tip.impact}
                    </p>
                </div>
                <div style={{ background: "var(--success-subtle)", padding: "1.25rem", borderRadius: "18px", border: "1px solid var(--success-light)", borderLeft: "5px solid var(--success)" }}>
                    <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 900, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <ShieldCheck size={16} /> {t("soil.professionalTreatment") || "Recommended Treatment"}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-main)", fontWeight: 600, lineHeight: 1.6 }}>
                        {tip.treatment}
                    </p>
                </div>
            </div>

            {/* Marketplace Integration */}
            <div style={{ background: "var(--bg-surface-2)", borderRadius: "20px", padding: "1.5rem", border: "1px solid var(--border-light)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                    <h5 style={{ margin: 0, fontSize: "0.9rem", fontWeight: 900, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <ShoppingCart size={18} style={{ color: "var(--primary)" }} /> {t("soil.marketplaceTitle") || "Required Products"}
                    </h5>
                    <span style={{ fontSize: "0.65rem", fontWeight: 800, color: "var(--primary)", background: "var(--primary-subtle)", padding: "0.2rem 0.6rem", borderRadius: "8px" }}>
                        Verified for {tip.title.split(' ')[0]}
                    </span>
                </div>

                {loading ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>
                        <Loader2 size={24} style={{ animation: "spin 2s linear infinite", marginBottom: "0.75rem" }} />
                        <br />Matching best agricultural products...
                    </div>
                ) : products.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem" }}>
                        {products.map(p => (
                            <div key={p.id} onClick={() => navigate(`/store/product/${p.id}`)}
                                style={{
                                    display: "flex", alignItems: "center", gap: "1rem", padding: "1rem",
                                    background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border-light)",
                                    cursor: "pointer", transition: "all 0.25s", boxShadow: "var(--shadow-sm)"
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = "var(--primary)";
                                    e.currentTarget.style.transform = "translateX(5px)";
                                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "var(--border-light)";
                                    e.currentTarget.style.transform = "translateX(0)";
                                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                                }}
                            >
                                <div style={{ position: "relative" }}>
                                    <img src={p.image ? (p.image.startsWith('http') ? p.image : `http://localhost:8000${p.image}`) : ""}
                                        alt={p.name} style={{ width: 50, height: 50, borderRadius: "10px", objectFit: "cover", background: "var(--bg-surface-1)", border: "1px solid var(--border-light)" }} />
                                    <div style={{ position: "absolute", bottom: -5, right: -5, background: "var(--success)", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <CheckCircle size={10} />
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: "0 0 0.25rem", fontSize: "0.85rem", fontWeight: 800, color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</p>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <span style={{ fontSize: "0.8rem", color: "var(--primary)", fontWeight: 900 }}>NPR {p.price}</span>
                                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textDecoration: "line-through" }}>NPR {(parseFloat(p.price) * 1.2).toFixed(0)}</span>
                                    </div>
                                </div>
                                <div style={{ width: 32, height: 32, borderRadius: "10px", background: "var(--primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" }}>
                                    <ShoppingCart size={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "1.5rem", background: "var(--bg-surface-1)", borderRadius: "14px", border: "1px dashed var(--border-light)" }}>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>
                            {t("soil.noSpecificProducts") || "Professional Grade products are currently being restocked."}
                        </p>
                    </div>
                )}
            </div>

            <button onClick={onClose} style={{
                marginTop: "2rem", width: "100%", padding: "1rem", borderRadius: "16px",
                background: "var(--text-main)", border: "none",
                color: "#fff", fontSize: "0.9rem", fontWeight: 900, cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", transition: "all 0.2s"
            }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(0,0,0,0.2)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}>
                {t("soil.closeGuidance") || "I Understand, Close Guidance"}
            </button>
        </div>
    );
};

// -- Diagnostic Assistant Modal --------------------------------------------------
const DiagnosticAssistant = ({ isOpen, onClose, onApply }) => {
    const { t } = useLanguage();
    const [selections, setSelections] = useState({ symptoms: "healthy", texture: "buttery" });

    if (!isOpen) return null;

    const symptoms = [
        { id: "healthy", label: t("soil.assistant.symptomHealthy"), icon: "   ", values: { nitrogen: 280, phosphorus: 80, potassium: 250, ph: 6.8, moisture: 55 } },
        { id: "yellowing", label: t("soil.assistant.symptomYellowing"), icon: "    ", values: { nitrogen: 140, phosphorus: 90, potassium: 280, ph: 7.2, moisture: 50 } },
        { id: "purple", label: t("soil.assistant.symptomPurple"), icon: "    ", values: { nitrogen: 250, phosphorus: 40, potassium: 300, ph: 6.2, moisture: 55 } },
        { id: "brown", label: t("soil.assistant.symptomBrown"), icon: "    ", values: { nitrogen: 240, phosphorus: 100, potassium: 150, ph: 7.0, moisture: 45 } },
        { id: "veins", label: t("soil.assistant.symptomVeinYellow"), icon: "    ", values: { nitrogen: 260, phosphorus: 110, potassium: 240, ph: 8.2, moisture: 50 } },
    ];

    const textures = [
        { id: "gritty", label: t("soil.assistant.textureGritty"), icon: "   ", type: "sandy", moisture: 30 },
        { id: "smooth", label: t("soil.assistant.textureSmooth"), icon: "    ", type: "clay", moisture: 75 },
        { id: "buttery", label: t("soil.assistant.textureButtery"), icon: "    ", type: "loamy", moisture: 55 },
    ];

    const handleApply = () => {
        const s = symptoms.find(x => x.id === selections.symptoms).values;
        const t_ = textures.find(x => x.id === selections.texture);
        onApply({
            nitrogen: s.nitrogen,
            phosphorus: s.phosphorus,
            potassium: s.potassium,
            phLevel: s.ph,
            moisture: t_.moisture,
            soilType: t_.type
        });
        onClose();
    };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }} />
            <div style={{ position: "relative", width: "100%", maxWidth: 640, background: "var(--bg-card)", borderRadius: 32, border: "1px solid var(--border-light)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "90vh" }} className="animate-scale-in">

                {/* Header */}
                <div style={{ padding: "2rem", background: "linear-gradient(135deg, var(--primary) 0%, #065f46 100%)", color: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
                        <BookOpen size={28} color="#6ee7b7" />
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 900, margin: 0 }}>{t("soil.assistant.title")}</h2>
                    </div>
                    <p style={{ opacity: 0.9, fontSize: "0.95rem", margin: 0, lineHeight: 1.5 }}>{t("soil.assistant.subtitle")}</p>
                </div>

                <div style={{ padding: "2rem", maxHeight: "70vh", overflowY: "auto" }}>
                    {/* Symptoms */}
                    <h3 style={{ fontSize: "1rem", fontWeight: 900, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Activity size={18} className="text-primary" /> {t("soil.assistant.leafHealth")}
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "0.75rem", marginBottom: "2rem" }}>
                        {symptoms.map(s => (
                            <button key={s.id} onClick={() => setSelections(prev => ({ ...prev, symptoms: s.id }))}
                                style={{
                                    display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", borderRadius: 16, border: "2px solid",
                                    borderColor: selections.symptoms === s.id ? "var(--primary)" : "var(--border-light)",
                                    background: selections.symptoms === s.id ? "var(--primary-subtle)" : "transparent",
                                    transition: "all 0.2s", cursor: "pointer", textAlign: "left"
                                }}>
                                <span style={{ fontSize: "1.5rem" }}>{s.icon}</span>
                                <span style={{ fontWeight: 800, color: selections.symptoms === s.id ? "var(--primary)" : "var(--text-main)", fontSize: "0.9rem" }}>{s.label}</span>
                                {selections.symptoms === s.id && <CheckCircle size={18} style={{ marginLeft: "auto", color: "var(--primary)" }} />}
                            </button>
                        ))}
                    </div>

                    {/* Texture */}
                    <h3 style={{ fontSize: "1rem", fontWeight: 900, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Droplets size={18} className="text-primary" /> {t("soil.assistant.soilSigns")}
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
                        {textures.map(t_ => (
                            <button key={t_.id} onClick={() => setSelections(prev => ({ ...prev, texture: t_.id }))}
                                style={{
                                    display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1.25rem 1rem", borderRadius: 16, border: "2px solid",
                                    borderColor: selections.texture === t_.id ? "var(--primary)" : "var(--border-light)",
                                    background: selections.texture === t_.id ? "var(--primary-subtle)" : "transparent",
                                    transition: "all 0.2s", cursor: "pointer"
                                }}>
                                <span style={{ fontSize: "1.75rem" }}>{t_.icon}</span>
                                <span style={{ fontWeight: 800, color: selections.texture === t_.id ? "var(--primary)" : "var(--text-main)", fontSize: "0.8rem", textAlign: "center" }}>{t_.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Warning */}
                    <div style={{ padding: "1rem", background: "var(--warning-subtle)", borderRadius: 12, border: "1px solid var(--warning)", display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                        <AlertTriangle size={18} className="text-warning" style={{ flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-main)", lineHeight: 1.5 }}>{t("soil.assistant.warning")}</p>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ padding: "1.5rem 2.5rem", background: "var(--bg-surface-1)", borderTop: "1px solid var(--border-light)", display: "flex", gap: "1.25rem", alignItems: "center" }}>
                    <button onClick={onClose} style={{
                        flex: 1, padding: "1rem", borderRadius: "16px", border: "2px solid var(--border-light)",
                        background: "transparent", fontWeight: 800, color: "var(--text-muted)", cursor: "pointer",
                        transition: "all 0.2s"
                    }} onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--danger)"; e.currentTarget.style.color = "var(--danger)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                        {t("common.cancel") || "Dismiss"}
                    </button>
                    <button onClick={handleApply} style={{
                        flex: 2, padding: "1rem", borderRadius: "16px", border: "none",
                        background: "linear-gradient(135deg, var(--primary) 0%, #065f46 100%)",
                        color: "#fff", fontWeight: 900, cursor: "pointer", display: "flex",
                        alignItems: "center", justifyContent: "center", gap: "0.6rem",
                        boxShadow: "0 10px 15px -3px rgba(6, 95, 70, 0.3)", transition: "all 0.2s"
                    }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                        <Zap size={18} /> {t("soil.assistant.apply") || "Estimate Values"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// -- How-To Guide Panel ---------------------------------------------------------
const HowToGuide = () => {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const translationSteps = t("soil.guideSteps");
    const DEFAULT_STEPS = Array.isArray(translationSteps) ? translationSteps : [
        "Gather a small sample of soil from about 6 inches deep in your field.",
        "Mix the soil with distilled water and let it settle for 30 minutes.",
        "Use a professional NPK kit to measure nutrient concentrations.",
        "Enter the values into the form on the left for AI-based advisor recommendations."
    ];

    const [steps, setSteps] = useState(() => {
        try {
            const saved = localStorage.getItem("soilAnalysisSteps");
            return saved ? JSON.parse(saved) : DEFAULT_STEPS;
        } catch { return DEFAULT_STEPS; }
    });

    useEffect(() => {
        // Sync steps when language changes if not edited manually
        if (!localStorage.getItem("soilAnalysisSteps")) {
            setSteps(DEFAULT_STEPS);
        }
    }, [DEFAULT_STEPS]);
    const [editMode, setEditMode] = useState(false);

    // Check if admin
    const isAdmin = sessionStorage.getItem("isStaff") === "true" || sessionStorage.getItem("isSuperuser") === "true";

    const handleSave = () => {
        setEditMode(false);
        localStorage.setItem("soilAnalysisSteps", JSON.stringify(steps));
    };

    const updateStep = (i, field, value) => {
        const newSteps = [...steps];
        newSteps[i][field] = value;
        setSteps(newSteps);
    };

    const updateTip = (i, j, value) => {
        const newSteps = [...steps];
        newSteps[i].tips[j] = value;
        setSteps(newSteps);
    };

    return (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 20, overflow: "hidden", marginBottom: "2rem" }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "1.1rem 1.5rem", border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #065f46 0%, #047857 100%)",
                    color: "#fff", borderRadius: open ? "20px 20px 0 0" : 20,
                    transition: "border-radius 0.2s",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <BookOpen size={20} color="#6ee7b7" />
                    <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 900, fontSize: "0.95rem" }}>{t("soil.howToTitle")}</div>
                        <div style={{ fontSize: "0.75rem", color: "#a7f3d0", fontWeight: 600 }}>
                            {t("soil.howToSubtitle", { action: open ? t("soil.actionHide") : t("soil.actionShow") })}
                        </div>
                    </div>
                </div>
                <div style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.3s", flexShrink: 0 }}>
                    <ChevronRight size={20} color="#6ee7b7" />
                </div>
            </button>

            {open && (
                <div style={{ padding: "1.5rem 1.5rem 1.75rem" }}>
                    {/* Reference values table */}
                    <div style={{ background: "var(--primary-subtle)", borderRadius: 14, padding: "1.25rem", marginBottom: "1.5rem", border: "1px solid var(--primary-light)" }}>
                        <h4 style={{ fontWeight: 900, color: "var(--primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                            <Target size={16} /> {t("soil.optimalReference")}
                        </h4>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                                <thead>
                                    <tr style={{ background: "var(--primary)", color: "#fff" }}>
                                        {["Parameter", t("common.unit") || "Unit", "Optimal Range", "Function"].map(h => (
                                            <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 800 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { name: "Nitrogen (N)", range: "0 - 600 kg/ha", opt: "250 - 300 kg/ha", desc: "Vegetative vigor & leaf chlorophyll", color: "#8b5cf6" },
                                        { name: "Phosphorus (P)", range: "0 - 300 kg/ha", opt: "60 - 120 kg/ha", desc: "Energy transfer and root development", color: "#10b981" },
                                        { name: "Potassium (K)", range: "0 - 600 kg/ha", opt: "220 - 350 kg/ha", desc: "Water stress & disease resistance", color: "#3b82f6" },
                                        { name: "pH Level", range: "3 - 10", opt: "6.5 - 7.2", desc: "Controls mineral solubility for roots", color: "#ec4899" },
                                        { name: "Moisture", range: "0 - 100%", opt: "45 - 70%", desc: "Medium for nutrient mobility", color: "#06b6d4" },
                                    ].map((row, i) => (
                                        <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg-surface-1)" }}>
                                            <td style={{ padding: "0.5rem 0.75rem", fontWeight: 800, color: row.color }}>{row.name}</td>
                                            <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted)" }}>{row.range}</td>
                                            <td style={{ padding: "0.5rem 0.75rem", color: "#10b981", fontWeight: 700 }}>    {row.opt}</td>
                                            <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-main)" }}>{row.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Steps */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h4 style={{ margin: 0, fontWeight: 900, fontSize: "1rem", color: "var(--text-main)" }}>{t("soil.howToTitle")}</h4>
                        {isAdmin && (
                            <button onClick={() => editMode ? handleSave() : setEditMode(true)} className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                                {editMode ? t("common.save") : "Edit Guide       "}
                            </button>
                        )}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                        {steps.map((step, i) => (
                            <div key={i} style={{
                                padding: "1.25rem", borderRadius: 14, border: "1px solid var(--border-light)",
                                background: "var(--bg-surface-1)", transition: "all 0.2s",
                            }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
                                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-light)"}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: "50%",
                                        background: "var(--primary)", color: "#fff",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontWeight: 900, fontSize: "0.8rem", flexShrink: 0,
                                    }}>
                                        {i + 1}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        {editMode ? (
                                            <input value={step.title} onChange={e => updateStep(i, 'title', e.target.value)} style={{ width: "100%", padding: "0.3rem", borderRadius: 4, border: "1px solid var(--border-light)" }} />
                                        ) : (
                                            <>
                                                <div style={{ fontSize: "1rem" }}>{step.icon}</div>
                                                <div style={{ fontWeight: 900, fontSize: "0.88rem", color: "var(--text-main)" }}>{step.title}</div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {editMode ? (
                                    <textarea value={step.desc} onChange={e => updateStep(i, 'desc', e.target.value)} rows={3} style={{ width: "100%", padding: "0.5rem", borderRadius: 4, border: "1px solid var(--border-light)", marginBottom: "0.5rem", fontSize: "0.8rem" }} />
                                ) : (
                                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "0.75rem", whiteSpace: "pre-wrap" }}>
                                        {step.desc}
                                    </p>
                                )}
                                <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                                    {step.tips.map((tip, j) => (
                                        <li key={j} style={{ fontSize: "0.75rem", color: "var(--text-main)", padding: "0.2rem 0", display: "flex", gap: "0.4rem" }}>
                                            <span style={{ color: "var(--primary)", fontWeight: 800, flexShrink: 0 }}>{"->"}</span>
                                            {editMode ? (
                                                <input value={tip} onChange={e => updateTip(i, j, e.target.value)} style={{ width: "100%", padding: "0.2rem", borderRadius: 4, border: "1px solid var(--border-light)" }} />
                                            ) : tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    {/* Quick tips */}
                    <div style={{ marginTop: "1.25rem", padding: "1rem 1.25rem", background: "var(--warning-subtle)", border: "1px solid var(--warning)", borderRadius: 12, display: "flex", gap: "0.75rem" }}>
                        <Info size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div style={{ fontSize: "0.82rem", color: "var(--text-main)", lineHeight: 1.6 }}>
                            <strong>{t("soil.quickStart")}:</strong> {t("soil.quickStartDesc")}
                            <br />
                            {t("soil.labsContact")}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SoilAnalysis = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [form, setForm] = useState(() => {
        const saved = sessionStorage.getItem("soilForm");
        return saved ? JSON.parse(saved) : DEFAULT_FORM;
    });
    const [result, setResult] = useState(() => {
        const saved = sessionStorage.getItem("soilResult");
        return saved ? JSON.parse(saved) : null;
    });
    const [analyzing, setAnalyzing] = useState(false);
    const [showAssistant, setShowAssistant] = useState(false);
    const [activeParam, setActiveParam] = useState(null);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadHistory();
    }, []);

    // Sync state to session storage
    useEffect(() => {
        sessionStorage.setItem("soilForm", JSON.stringify(form));
        if (result) {
            sessionStorage.setItem("soilResult", JSON.stringify(result));
        } else {
            sessionStorage.removeItem("soilResult");
        }
    }, [form, result]);

    const loadHistory = async () => {
        try {
            const { data } = await soilService.getHistory();
            setHistory(Array.isArray(data) ? data : (data.results || []));
        } catch { /* silent */ }
    };

    const set = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleDeleteHistory = async (e, id) => {
        e.stopPropagation();
        if (window.confirm(t("soil.confirmDelete") || "Are you sure you want to delete this analysis?")) {
            try {
                await soilService.deleteHistory(id);
                setHistory(prev => prev.filter(h => h.id !== id));
                if (result && result.id === id) {
                    setResult(null);
                    setForm(DEFAULT_FORM);
                    sessionStorage.removeItem("soilResult");
                    sessionStorage.removeItem("soilForm");
                }
            } catch (err) {
                setError("Failed to delete analysis.");
            }
        }
    };

    const handleNewAnalysis = () => {
        setResult(null);
        setForm(DEFAULT_FORM);
        sessionStorage.removeItem("soilResult");
        sessionStorage.removeItem("soilForm");
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setError(null);
        try {
            const { data } = await soilService.analyze(form);
            setResult(data);
            await loadHistory();
        } catch (e) {
            const errDetails = e.response ? `[${e.response.status}] ${JSON.stringify(e.response.data)}` : e.message;
            setError(`Analysis failed: ${errDetails}`);
            console.error(e);
        } finally {
            setAnalyzing(false);
        }
    };

    const severityColor = (s) => s === "high" ? "#ef4444" : s === "medium" ? "#f59e0b" : "#3b82f6";
    const severityBg = (s) => s === "high" ? "#fef2f2" : s === "medium" ? "#fffbeb" : "#eff6ff";

    const scoreLabel = result
        ? t(`soil.${result.health_score >= 75 ? "excellent" : result.health_score >= 50 ? "moderate" : "poor"}`)
        : null;

    return (
        <div className="page-container">
            <Navbar activePage="soil" />
            <div className="page-content animate-slide-up" style={{ padding: "2rem 3rem", maxWidth: 1400, margin: "0 auto" }}>

                {/* Page Header */}
                <div className="page-header" style={{ marginBottom: "1.5rem" }}>
                    <div>
                        <h1 style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <FlaskConical size={28} style={{ color: "var(--primary)" }} />
                            {t("soil.title")}
                        </h1>
                        <p className="subtitle">{t("soil.subtitle")}</p>
                    </div>
                    <button onClick={() => setShowHistory(!showHistory)} className="btn-secondary"
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <History size={16} />
                        {t("soil.history")} ({history.length})
                    </button>
                </div>

                {/* -- HOW-TO GUIDE -- */}
                <HowToGuide />

                {/* Error */}
                {error && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, marginBottom: "1.5rem", color: "#dc2626", fontWeight: 600 }}>
                        <AlertTriangle size={18} /> {error}
                    </div>
                )}

                {/* History panel */}
                {showHistory && (
                    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 16, padding: "1.5rem", marginBottom: "2rem" }}>
                        <h3 style={{ marginBottom: "1rem", fontWeight: 800 }}>{t("soil.history")}</h3>
                        {history.length === 0 ? (
                            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "1.5rem" }}>{t("soil.noAnalyses")}</p>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                                {history.map(h => (
                                    <div key={h.id} onClick={() => { setResult(h); setShowHistory(false); }}
                                        style={{ padding: "1rem", background: "var(--bg-surface-1)", borderRadius: 12, cursor: "pointer", border: "1px solid var(--border-light)", transition: "all 0.2s" }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-light)"}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                            <span style={{ fontWeight: 800, textTransform: "capitalize" }}>{h.soil_type} Soil</span>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                <span style={{ fontWeight: 900, color: h.health_score >= 70 ? "#10b981" : h.health_score >= 50 ? "#f59e0b" : "#ef4444" }}>
                                                    {h.health_score}/100
                                                </span>
                                                <button
                                                    onClick={(e) => handleDeleteHistory(e, h.id)}
                                                    style={{ background: "none", border: "none", padding: "4px", cursor: "pointer", color: "var(--text-muted)", display: "flex", borderRadius: "6px", transition: "all 0.2s" }}
                                                    onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "var(--danger-subtle)"; }}
                                                    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "none"; }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>
                                            {new Date(h.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                            {(h.deficiencies || []).slice(0, 3).map((d, i) => (
                                                <span key={i} style={{ fontSize: "0.68rem", padding: "0.15rem 0.5rem", borderRadius: 20, background: "var(--danger-subtle)", color: "var(--danger)", fontWeight: 700 }}>    {d}</span>
                                            ))}
                                            {!h.deficiencies?.length && <span key="healthy" style={{ fontSize: "0.68rem", padding: "0.15rem 0.5rem", borderRadius: 20, background: "var(--primary-subtle)", color: "var(--primary)", fontWeight: 700 }}>    {t("common.safe") || "Safe"}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* -- MAIN GRID -- */}
                <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: "2rem", alignItems: "start" }}>

                    {/* INPUT PANEL */}
                    <div style={{ background: "var(--bg-card)", borderRadius: 20, padding: "1.75rem", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)", position: "sticky", top: "1rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                            <h3 style={{ fontWeight: 900, fontSize: "1rem", margin: 0, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Activity size={17} style={{ color: "var(--primary)" }} />
                                {t("soil.enterValues") || "Enter Soil Values"}
                            </h3>
                            <button
                                onClick={() => setShowAssistant(true)}
                                style={{
                                    padding: "0.4rem 0.75rem", borderRadius: 10, background: "var(--primary-subtle)",
                                    border: "1px solid var(--primary-light)", color: "var(--primary)",
                                    fontSize: "0.75rem", fontWeight: 800, cursor: "pointer",
                                    display: "flex", alignItems: "center", gap: "0.4rem"
                                }}
                            >
                                <Zap size={14} /> {t("soil.assistant.title")} ?
                            </button>
                        </div>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: "1.5rem" }}>
                            {t("common.good") || "Good"} &nbsp;     {t("common.low") || "Low"} &nbsp;     {t("common.high") || "High"}
                        </p>

                        <DiagnosticAssistant
                            isOpen={showAssistant}
                            onClose={() => setShowAssistant(false)}
                            onApply={(values) => setForm(prev => ({ ...prev, ...values }))}
                        />

                        {activeParam && <ActiveParamInfo paramKey={activeParam} onClose={() => setActiveParam(null)} />}

                        <ParameterSlider
                            paramKey="nitrogen" label={t("soil.nitrogen")} value={form.nitrogen} min={0} max={600} step={5} unit=" kg/ha" icon={Zap} color="#8b5cf6"
                            onChange={set("nitrogen")} isActive={activeParam === "nitrogen"} onInfoClick={() => setActiveParam(activeParam === "nitrogen" ? null : "nitrogen")}
                        />
                        <ParameterSlider
                            paramKey="phosphorus" label={t("soil.phosphorus")} value={form.phosphorus} min={0} max={300} step={5} unit=" kg/ha" icon={Leaf} color="#10b981"
                            onChange={set("phosphorus")} isActive={activeParam === "phosphorus"} onInfoClick={() => setActiveParam(activeParam === "phosphorus" ? null : "phosphorus")}
                        />
                        <ParameterSlider
                            paramKey="potassium" label={t("soil.potassium")} value={form.potassium} min={0} max={600} step={5} unit=" kg/ha" icon={TrendingUp} color="#3b82f6"
                            onChange={set("potassium")} isActive={activeParam === "potassium"} onInfoClick={() => setActiveParam(activeParam === "potassium" ? null : "potassium")}
                        />
                        <ParameterSlider
                            paramKey="phLevel" label={t("soil.ph")} value={form.phLevel} min={3} max={10} step={0.1} unit="" icon={TestTube} color="#ec4899"
                            onChange={set("phLevel")} isActive={activeParam === "phLevel"} onInfoClick={() => setActiveParam(activeParam === "phLevel" ? null : "phLevel")}
                        />
                        <ParameterSlider
                            paramKey="moisture" label={t("soil.moisture")} value={form.moisture} min={0} max={100} step={1} unit="%" icon={Droplets} color="#06b6d4"
                            onChange={set("moisture")} isActive={activeParam === "moisture"} onInfoClick={() => setActiveParam(activeParam === "moisture" ? null : "moisture")}
                        />
                        <ParameterSlider
                            paramKey="organicMatter" label={t("soil.organicMatter")} value={form.organicMatter} min={0} max={15} step={0.1} unit="%" icon={Activity} color="#f59e0b"
                            onChange={set("organicMatter")} isActive={activeParam === "organicMatter"} onInfoClick={() => setActiveParam(activeParam === "organicMatter" ? null : "organicMatter")}
                        />

                        {/* Soil Type */}
                        <div style={{ marginTop: "1rem" }}>
                            <label style={{ display: "block", fontWeight: 700, fontSize: "0.85rem", marginBottom: "0.6rem", color: "var(--text-main)" }}>{t("soil.soilType")}</label>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.6rem" }}>
                                {SOIL_TYPES.map(type => (
                                    <button key={type} onClick={() => setForm(f => ({ ...f, soilType: type }))}
                                        style={{
                                            padding: "0.6rem 0.4rem", borderRadius: "10px", border: "2px solid",
                                            borderColor: form.soilType === type ? "var(--primary)" : "var(--border-light)",
                                            background: form.soilType === type ? "var(--primary-subtle)" : "var(--card-bg)",
                                            color: form.soilType === type ? "var(--primary)" : "var(--text-muted)",
                                            fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
                                        }}>
                                        {t(`soil.${type}`) || type}
                                    </button>
                                ))}
                            </div>
                            {form.soil_type && (
                                <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: "0.5rem", fontStyle: "italic" }}>
                                    {t(`soil.types.${form.soil_type}Desc`)}
                                </p>
                            )}
                        </div>

                        <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary"
                            style={{ width: "100%", justifyContent: "center", padding: "1.1rem", fontSize: "1rem", fontWeight: 900, borderRadius: 14 }}>
                            {analyzing ? (
                                <><span style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: "0.5rem" }}>   </span>{t("soil.analyzing")}</>
                            ) : (
                                <><TestTube size={18} /> {t("soil.analyzeBtn")}</>
                            )}
                        </button>

                        {result && (
                            <button onClick={handleNewAnalysis} className="btn-secondary"
                                style={{ width: "100%", justifyContent: "center", padding: "0.75rem", marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <RotateCcw size={15} /> {t("soil.newAnalysis")}
                            </button>
                        )}
                    </div>

                    {/* RESULTS PANEL */}
                    <div>
                        {!result ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                {/* Empty state - mini guide */}
                                {/* Empty state - informational, no random demo buttons */}
                                <div style={{ background: "var(--primary-subtle)", borderRadius: 20, padding: "3rem 2rem", textAlign: "center", border: "1px dashed var(--primary-light)" }}>
                                    <FlaskConical size={52} style={{ color: "var(--primary)", opacity: 0.5, marginBottom: "1rem" }} />
                                    <h3 style={{ color: "var(--text-main)", fontWeight: 900, marginBottom: "0.75rem" }}>
                                        {t("soil.resultsTitle") || "Your Results Will Appear Here"}
                                    </h3>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: 400, margin: "0 auto 1.5rem" }}>
                                        {t("soil.resultsDesc") || "Adjust the sliders on the left to match your measured soil values."}
                                    </p>
                                    <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                                        {[
                                            { dot: "var(--success)", text: t("soil.healthScore") || "Health score (0-100)" },
                                            { dot: "var(--warning)", text: t("soil.deficiencyAlerts") || "Deficiency alerts" },
                                            { dot: "var(--info)", text: t("soil.expertAdvice") || "Expert advice" },
                                        ].map((item, i) => (
                                            <div key={i} style={{ padding: "0.65rem 1rem", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "var(--text-main)", fontWeight: 600 }}>
                                                <span style={{ width: 8, height: 8, borderRadius: "50%", background: item.dot, flexShrink: 0 }} />
                                                {item.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                                {/* Score card */}
                                <div style={{ background: "var(--bg-card)", borderRadius: 20, padding: "2rem", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-md)", display: "flex", alignItems: "center", gap: "2.5rem" }}>
                                    <ScoreGauge score={result.health_score} />
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontWeight: 900, fontSize: "1.2rem", marginBottom: "0.5rem", color: "var(--text-main)" }}>
                                            {t("soil.soilHealth")}
                                        </h3>
                                        {result.overall_explanation && (
                                            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, fontSize: "0.88rem", marginBottom: "1rem" }}>
                                                {result.overall_explanation}
                                            </p>
                                        )}
                                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                            {[
                                                { label: `N: ${form.nitrogen} kg/ha`, color: "#8b5cf6" },
                                                { label: `P: ${form.phosphorus} kg/ha`, color: "#3b82f6" },
                                                { label: `K: ${form.potassium} kg/ha`, color: "#f59e0b" },
                                                { label: `pH: ${form.ph_level}`, color: "#ec4899" },
                                                { label: `Moisture: ${form.moisture}%`, color: "#06b6d4" },
                                                { label: `OM: ${result.organic_matter ?? form.organic_matter}%`, color: "#84cc16" },
                                                { label: form.soil_type, color: "var(--primary)" },
                                            ].map((chip, i) => (
                                                <span key={i} style={{ padding: "0.25rem 0.7rem", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, background: `${chip.color}18`, color: chip.color, border: `1px solid ${chip.color}40` }}>
                                                    {chip.label}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* All-good banner */}
                                {!result.deficiencies?.length && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem 1.5rem", background: "var(--primary-subtle)", border: "1px solid var(--primary)", borderRadius: 16 }}>
                                        <CheckCircle size={28} style={{ color: "var(--success)", flexShrink: 0 }} />
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 900, color: "var(--primary)", fontSize: "1rem" }}>     {t("soil.safeTitle") || "Soil is Healthy!"}</p>
                                            <p style={{ margin: 0, fontSize: "0.84rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                                                {t("soil.safeDesc") || "All nutrients are within optimal ranges."}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Deficiencies */}
                                {result.deficiencies?.length > 0 && (
                                    <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: "1.5rem", border: "1px solid var(--danger)" }}>
                                        <h4 style={{ fontWeight: 900, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--danger)" }}>
                                            <AlertTriangle size={18} /> {t("soil.deficiencies")}
                                        </h4>
                                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                                            {result.deficiencies.map((d, i) => (
                                                <span key={i} style={{ padding: "0.45rem 1.1rem", borderRadius: 20, background: "var(--danger-subtle)", color: "var(--danger)", border: "1px solid var(--danger)", fontWeight: 800, fontSize: "0.85rem" }}>
                                                    {d}
                                                </span>
                                            ))}
                                        </div>
                                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                                            See the improvement suggestions below to learn how to treat each deficiency.
                                        </p>
                                    </div>
                                )}

                                {/* Recommendations */}
                                {result.recommendations?.length > 0 && (
                                    <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: "1.5rem", border: "1px solid var(--border-light)" }}>
                                        <h4 style={{ fontWeight: 900, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <TrendingUp size={18} style={{ color: "var(--primary)" }} /> {t("soil.suggestions")}
                                        </h4>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                            {result.recommendations.map((rec, i) => (
                                                <div key={i} style={{
                                                    padding: "1.25rem", borderRadius: 14,
                                                    background: severityBg(rec.severity),
                                                    border: `1px solid ${severityColor(rec.severity)}30`,
                                                    borderLeftWidth: 4, borderLeftStyle: "solid",
                                                    borderLeftColor: severityColor(rec.severity),
                                                }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                                        <span style={{ fontWeight: 900, color: severityColor(rec.severity), fontSize: "0.9rem" }}>{rec.nutrient}</span>
                                                        <span style={{ fontSize: "0.65rem", padding: "0.2rem 0.6rem", borderRadius: 10, background: severityColor(rec.severity), color: "#fff", fontWeight: 800, textTransform: "uppercase" }}>
                                                            {rec.severity || t("common.info") || "Info"}
                                                        </span>
                                                    </div>
                                                    {rec.explanation && (
                                                        <p style={{ margin: "0 0 0.6rem", fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.6, fontStyle: "italic", borderBottom: `1px solid ${severityColor(rec.severity)}20`, paddingBottom: "0.5rem" }}>
                                                            {rec.explanation}
                                                        </p>
                                                    )}
                                                    <div>
                                                        <p style={{ margin: "0 0 0.3rem", fontSize: "0.72rem", fontWeight: 800, color: "var(--success)", textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                                                            <ShieldCheck size={14} /> {t("soil.professionalTreatment") || "Professional Treatment"}
                                                        </p>
                                                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-main)", lineHeight: 1.65, fontWeight: 500 }}>{rec.suggestion}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommended Products */}
                                {result.suggested_products?.length > 0 && !showAssistant && (
                                    <div style={{ background: "var(--bg-card)", borderRadius: 24, padding: "2rem", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-md)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                                            <h4 style={{ margin: 0, fontWeight: 900, fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                <ShoppingCart size={22} style={{ color: "var(--primary)" }} /> {t("soil.recommendedFertilizers") || "Accurate Field Supplies"}
                                            </h4>
                                            <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "var(--success)", background: "var(--success-subtle)", padding: "0.3rem 0.8rem", borderRadius: "10px" }}>
                                                In-Stock Now
                                            </span>
                                        </div>

                                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                            {result.suggested_products.map((p, i) => {
                                                const prodImg = p.image ? (p.image.startsWith("http") ? p.image : `http://localhost:8000${p.image}`) : null;
                                                return (
                                                    <div key={i} onClick={() => navigate(`/store/product/${p.id}`)}
                                                        style={{
                                                            display: "flex", alignItems: "center", gap: "1.25rem", padding: "1.25rem",
                                                            background: "var(--bg-surface-1)", borderRadius: "18px", border: "1px solid var(--border-light)",
                                                            transition: "all 0.25s", cursor: "pointer", position: "relative", overflow: "hidden"
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>

                                                        <div style={{ width: 80, height: 80, borderRadius: 14, overflow: "hidden", flexShrink: 0, border: "1px solid var(--border-light)", background: "#fff" }}>
                                                            {prodImg ? (
                                                                <img src={prodImg} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                            ) : (
                                                                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--primary-subtle)" }}>
                                                                    <Leaf size={32} style={{ color: "var(--primary)" }} />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.4rem" }}>
                                                                <p style={{ margin: 0, fontWeight: 900, fontSize: "1rem", color: "var(--text-main)" }}>{p.name}</p>
                                                                <p style={{ margin: 0, fontWeight: 900, fontSize: "1.05rem", color: "var(--primary)" }}>NPR {p.price}</p>
                                                            </div>

                                                            {p.reason && (
                                                                <div style={{ display: "flex", gap: "0.4rem", alignItems: "flex-start", padding: "0.6rem 0.8rem", background: "var(--bg-surface-inner)", borderRadius: "10px", border: "1px solid var(--border-light)" }}>
                                                                    <ShieldCheck size={14} style={{ color: "var(--success)", marginTop: 2, flexShrink: 0 }} />
                                                                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.4, fontWeight: 500 }}>
                                                                        {p.reason}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 4px 10px rgba(6, 95, 70, 0.4)" }}>
                                                            <ShoppingCart size={18} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
                                            <button onClick={() => navigate("/store")} style={{
                                                width: "100%", background: "var(--bg-surface-2)", border: "1px solid var(--border-light)",
                                                padding: "0.9rem", borderRadius: "14px", fontWeight: 800, color: "var(--text-main)",
                                                cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem"
                                            }} onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"} onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-light)"}>
                                                <ShoppingCart size={17} /> {t("soil.browseMarketplace") || "Explore Full Marketplace Catalog"}
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                </div>

                {/* -- USER MANUAL SECTION -- */}
                <div style={{ marginTop: "4rem", borderTop: "2px solid var(--border-light)", paddingTop: "3rem" }}>
                    <div className="section-header" style={{ textAlign: "center", marginBottom: "3rem" }}>
                        <div style={{ display: "inline-flex", background: "var(--primary-subtle)", padding: "1rem", borderRadius: "1.5rem", marginBottom: "1rem" }}>
                            <BookOpen size={40} style={{ color: "var(--primary)" }} />
                        </div>
                        <h2 style={{ fontWeight: 900, fontSize: "2rem", color: "var(--text-main)" }}>
                            {t("soil.manual.title") || "Agricultural Advisory Manual"}
                        </h2>
                        <p style={{ color: "var(--text-muted)", maxWidth: 650, margin: "0.5rem auto 0", fontSize: "1.1rem", lineHeight: 1.6 }}>
                            {t("soil.manual.subtitle") || "How to use this system as a professional diagnostic tool for your field."}
                        </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "2.5rem" }}>
                        {/* Step 1: Expert Sampling */}
                        <div style={{ background: "var(--bg-card)", padding: "2.5rem", borderRadius: "2rem", border: "1px solid var(--border-light)", transition: "transform 0.3s ease", cursor: "default" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>    </div>
                            <h3 style={{ fontWeight: 900, marginBottom: "1.25rem", color: "var(--text-main)" }}>
                                1. {t("soil.manual.step1Title") || "Expert Soil Sampling"}
                            </h3>
                            <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
                                {t("soil.manual.step1Desc") || "Collect soil from 6-9 inches deep across several points in your field. Mix thoroughly and allow to air dry. This ensures that the diagnostic data represents the entire root zone of your crops."}
                            </p>
                        </div>

                        {/* Step 2: Intelligent Analysis */}
                        <div style={{ background: "var(--bg-card)", padding: "2.5rem", borderRadius: "2rem", border: "1px solid var(--border-light)", transition: "transform 0.3s ease" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>    </div>
                            <h3 style={{ fontWeight: 900, marginBottom: "1.25rem", color: "var(--text-main)" }}>
                                2. {t("soil.manual.step2Title") || "Intelligent Analysis"}
                            </h3>
                            <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
                                {t("soil.manual.step2Desc") || "Input your measured values into the advisor. Our system compares your data against global NARC/FAO agricultural benchmarks to identify critical nutrient deficiencies and pH imbalances."}
                            </p>
                        </div>

                        {/* Step 3: Targeted Correction */}
                        <div style={{ background: "var(--bg-card)", padding: "2.5rem", borderRadius: "2rem", border: "1px solid var(--border-light)", transition: "transform 0.3s ease" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>    </div>
                            <h3 style={{ fontWeight: 900, marginBottom: "1.25rem", color: "var(--text-main)" }}>
                                3. {t("soil.manual.step3Title") || "Targeted Correction"}
                            </h3>
                            <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
                                {t("soil.manual.step3Desc") || "Based on your results, the marketplace dynamically surfaces the exact fertilizers, conditioners, or organic amendments required to restore your soil's health and maximize your yield."}
                            </p>
                        </div>
                    </div>

                    <div style={{ marginTop: "3rem", padding: "2rem", background: "var(--primary-subtle)", borderRadius: "1.5rem", textAlign: "center", border: "1px solid var(--primary-light)" }}>
                        <p style={{ margin: 0, fontWeight: 800, color: "var(--primary)", fontSize: "1.1rem" }}>
                            {t("soil.manual.consistentTitle") || "Deterministic & Consistent Strategy"}
                        </p>
                        <p style={{ margin: "0.5rem 0 0", color: "var(--primary)", opacity: 0.8, fontSize: "0.9rem" }}>
                            {t("soil.manual.consistentDesc") || "The same inputs will always yield the same expert advice. No random outputs or placeholder data."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SoilAnalysis;
