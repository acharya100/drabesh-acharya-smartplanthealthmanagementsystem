/**
 * Soil Analysis & Fertilizer Recommendation
 * Analyzes soil data and recommends products from the marketplace
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { soilService } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import {
    Leaf, FlaskConical, TrendingUp, AlertTriangle,
    CheckCircle, ShoppingCart, History, RotateCcw, ChevronRight,
    Droplets, Wind, Zap, Activity, Info, BookOpen, Target,
    ArrowRight, TestTube
} from "lucide-react";

const SOIL_TYPES = ["sandy", "loamy", "clay", "silty", "peaty", "chalky"];

const SOIL_TYPE_DESCRIPTIONS = {
    sandy: "Fast draining, low nutrients — needs frequent feeding",
    loamy: "Ideal balance of nutrients and drainage",
    clay: "High nutrients, poor drainage — add gypsum",
    silty: "Fertile but compacts easily — avoid heavy machinery",
    peaty: "Acidic, high organic matter — may need liming",
    chalky: "Alkaline, shallow — choose lime-tolerant crops",
};

// Optimal reference values
const OPTIMAL = {
    nitrogen: { low: 240, high: 280, unit: "kg/ha", description: "Essential for leaf/stem growth & chlorophyll" },
    phosphorus: { low: 50, high: 100, unit: "kg/ha", description: "Root development & energy transfer" },
    potassium: { low: 200, high: 300, unit: "kg/ha", description: "Disease resistance & fruit quality" },
    ph_level: { low: 6.0, high: 7.5, unit: "", description: "Controls nutrient availability to roots" },
    moisture: { low: 40, high: 65, unit: "%", description: "Water availability for plant uptake" },
};

const DEFAULT_FORM = {
    nitrogen: 200, phosphorus: 60, potassium: 180,
    ph_level: 6.5, moisture: 50, soil_type: "loamy",
};

// ── Score Gauge ────────────────────────────────────────────────────────────────
const ScoreGauge = ({ score }) => {
    const color = score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
    const label = score >= 75 ? "Excellent" : score >= 50 ? "Moderate" : "Poor";
    const labelDesc = score >= 75
        ? "Your soil is healthy and well-balanced"
        : score >= 50
            ? "Some nutrients need attention"
            : "Significant improvements needed";
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

// ── Parameter Slider with optimal range indicator ──────────────────────────────
const ParameterSlider = ({ paramKey, label, value, min, max, step, unit, icon: Icon, onChange, color = "var(--primary)" }) => {
    const opt = OPTIMAL[paramKey];
    const isLow = opt && value < opt.low;
    const isHigh = opt && value > opt.high;
    const status = isLow ? "⬇ Low" : isHigh ? "⬆ High" : "✓ Good";
    const statusColor = isLow ? "#ef4444" : isHigh ? "#f59e0b" : "#10b981";

    return (
        <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                <label style={{ fontWeight: 700, fontSize: "0.88rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {Icon && <Icon size={14} style={{ color }} />}
                    {label}
                </label>
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
                {opt && <span style={{ color: "#10b981", fontWeight: 700 }}>Optimal: {opt.low}–{opt.high}{unit}</span>}
                <span>{max}{unit}</span>
            </div>
        </div>
    );
};

// ── How-To Guide Panel ─────────────────────────────────────────────────────────
const HowToGuide = () => {
    const [open, setOpen] = useState(false);

    const DEFAULT_STEPS = [
        {
            icon: "🔬",
            title: "Collect Soil Sample",
            desc: "Take samples from 5–10 spots in your field at 0–20 cm depth. Mix them together in a clean bucket. Let it air-dry before testing.",
            tips: ["Sample before planting or after harvest", "Avoid areas near trees, compost bins, or paths", "Take at least 500g of mixed soil"]
        },
        {
            icon: "📊",
            title: "Measure Soil Parameters",
            desc: "Use a soil testing kit or send samples to a lab (NARC, agriculture office). Measure NPK, pH, and moisture.",
            tips: [
                "N (Nitrogen): Use colorimetric kit or Kjeldahl method",
                "P (Phosphorus): Olsen or Bray test",
                "K (Potassium): Ammonium acetate extraction",
                "pH: Digital pH meter or litmus paper (meter is more accurate)",
                "Moisture: Weigh wet vs dry sample after 24h oven drying"
            ]
        },
        {
            icon: "⚙️",
            title: "Enter Values in Sliders",
            desc: "Move each slider to match your measured values. The optimal range is shown in green below each slider.",
            tips: [
                "N slider: 0–600 kg/ha (optimal: 240–280)",
                "P slider: 0–300 kg/ha (optimal: 50–100)",
                "K slider: 0–600 kg/ha (optimal: 200–300)",
                "pH: 3–10 scale (optimal for most crops: 6.0–7.5)",
                "Moisture: 0–100% (optimal: 40–65%)"
            ]
        },
        {
            icon: "🌱",
            title: "Select Your Soil Type",
            desc: "Choose the soil type that best matches your field. This affects drainage, nutrient retention, and fertilizer advice.",
            tips: [
                "Sandy: gritty, drains quickly",
                "Loamy: dark, crumbly, best soil",
                "Clay: sticky when wet, hard when dry",
                "Silty: smooth, silky texture",
                "Peaty: dark, spongy, smells earthy",
                "Chalky: light, stony, effervesces with acid"
            ]
        },
        {
            icon: "🚀",
            title: "Click Analyze & Read Results",
            desc: "Your health score (0–100), deficiencies, and fertilizer recommendations will appear. Recommended products from our store are linked directly.",
            tips: [
                "Score 75–100: Excellent — maintain current practices",
                "Score 50–74: Moderate — apply recommended fertilizers",
                "Score 0–49: Poor — urgent treatment needed",
                "Re-analyze after 4–6 weeks of treatment to track improvement"
            ]
        },
    ];

    const [steps, setSteps] = useState(() => {
        try {
            const saved = localStorage.getItem("soilAnalysisSteps");
            return saved ? JSON.parse(saved) : DEFAULT_STEPS;
        } catch { return DEFAULT_STEPS; }
    });
    const [editMode, setEditMode] = useState(false);

    // Check if admin
    const isAdmin = sessionStorage.getItem("is_staff") === "true" || sessionStorage.getItem("is_superuser") === "true";

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
                        <div style={{ fontWeight: 900, fontSize: "0.95rem" }}>📖 How to Use Soil Analysis — Step-by-Step Guide</div>
                        <div style={{ fontSize: "0.75rem", color: "#a7f3d0", fontWeight: 600 }}>
                            Click to {open ? "hide" : "show"} instructions on collecting soil data and reading results
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
                            <Target size={16} /> Optimal Reference Values
                        </h4>
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                                <thead>
                                    <tr style={{ background: "var(--primary)", color: "#fff" }}>
                                        {["Parameter", "Your Slider", "Optimal Range", "What It Controls"].map(h => (
                                            <th key={h} style={{ padding: "0.5rem 0.75rem", textAlign: "left", fontWeight: 800 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { name: "Nitrogen (N)", range: "0 – 600 kg/ha", opt: "240 – 280 kg/ha", desc: "Leaf growth, chlorophyll, protein", color: "#8b5cf6" },
                                        { name: "Phosphorus (P)", range: "0 – 300 kg/ha", opt: "50 – 100 kg/ha", desc: "Root growth, energy (ATP)", color: "#3b82f6" },
                                        { name: "Potassium (K)", range: "0 – 600 kg/ha", opt: "200 – 300 kg/ha", desc: "Disease resistance, fruit quality", color: "#f59e0b" },
                                        { name: "pH Level", range: "3 – 10", opt: "6.0 – 7.5", desc: "Nutrient availability to roots", color: "#ec4899" },
                                        { name: "Moisture", range: "0 – 100%", opt: "40 – 65%", desc: "Water uptake, microbial activity", color: "#06b6d4" },
                                    ].map((row, i) => (
                                        <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg-surface-1)" }}>
                                            <td style={{ padding: "0.5rem 0.75rem", fontWeight: 800, color: row.color }}>{row.name}</td>
                                            <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-muted)" }}>{row.range}</td>
                                            <td style={{ padding: "0.5rem 0.75rem", color: "#10b981", fontWeight: 700 }}>✓ {row.opt}</td>
                                            <td style={{ padding: "0.5rem 0.75rem", color: "var(--text-main)" }}>{row.desc}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Steps */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h4 style={{ margin: 0, fontWeight: 900, fontSize: "1rem", color: "var(--text-main)" }}>Step-by-Step Instructions</h4>
                        {isAdmin && (
                            <button onClick={() => editMode ? handleSave() : setEditMode(true)} className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                                {editMode ? "Save Changes" : "Edit Guide ✏️"}
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
                                            <span style={{ color: "var(--primary)", fontWeight: 800, flexShrink: 0 }}>→</span>
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
                    <div style={{ marginTop: "1.25rem", padding: "1rem 1.25rem", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, display: "flex", gap: "0.75rem" }}>
                        <Info size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
                        <div style={{ fontSize: "0.82rem", color: "#92400e", lineHeight: 1.6 }}>
                            <strong>Quick Start:</strong> If you don't have lab results, use visual soil indicators: yellow leaves = likely nitrogen deficiency; purple-tinted leaves = phosphorus deficiency; brown leaf edges = potassium deficiency.
                            Contact your local <strong>NARC Agriculture Office</strong> or <strong>Agriculture Service Centre</strong> for free/subsidized soil testing in Nepal.
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
    const [form, setForm] = useState(DEFAULT_FORM);
    const [result, setResult] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => { loadHistory(); }, []);

    const loadHistory = async () => {
        try {
            const { data } = await soilService.getHistory();
            setHistory(Array.isArray(data) ? data : (data.results || []));
        } catch { /* silent */ }
    };

    const set = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setError(null);
        try {
            const { data } = await soilService.analyze(form);
            setResult(data);
            await loadHistory();
        } catch (e) {
            setError("Analysis failed. Please check your connection to the backend and try again.");
            console.error(e);
        } finally {
            setAnalyzing(false);
        }
    };

    const severityColor = (s) => s === "high" ? "#ef4444" : s === "medium" ? "#f59e0b" : "#3b82f6";
    const severityBg = (s) => s === "high" ? "#fef2f2" : s === "medium" ? "#fffbeb" : "#eff6ff";

    const scoreLabel = result
        ? result.health_score >= 75 ? "Excellent" : result.health_score >= 50 ? "Moderate" : "Poor"
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

                {/* ── HOW-TO GUIDE ── */}
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
                            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "1.5rem" }}>No previous analyses yet.</p>
                        ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
                                {history.map(h => (
                                    <div key={h.id} onClick={() => { setResult(h); setShowHistory(false); }}
                                        style={{ padding: "1rem", background: "var(--bg-surface-1)", borderRadius: 12, cursor: "pointer", border: "1px solid var(--border-light)", transition: "all 0.2s" }}
                                        onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
                                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-light)"}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                                            <span style={{ fontWeight: 800, textTransform: "capitalize" }}>{h.soil_type} Soil</span>
                                            <span style={{ fontWeight: 900, color: h.health_score >= 70 ? "#10b981" : h.health_score >= 50 ? "#f59e0b" : "#ef4444" }}>
                                                {h.health_score}/100
                                            </span>
                                        </div>
                                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: "0 0 0.5rem" }}>
                                            {new Date(h.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                            {(h.deficiencies || []).slice(0, 3).map((d, i) => (
                                                <span key={i} style={{ fontSize: "0.68rem", padding: "0.15rem 0.5rem", borderRadius: 20, background: "#fef2f2", color: "#dc2626", fontWeight: 700 }}>⚠ {d}</span>
                                            ))}
                                            {!h.deficiencies?.length && <span style={{ fontSize: "0.68rem", padding: "0.15rem 0.5rem", borderRadius: 20, background: "#d1fae5", color: "#065f46", fontWeight: 700 }}>✓ Healthy</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── MAIN GRID ── */}
                <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: "2rem", alignItems: "start" }}>

                    {/* INPUT PANEL */}
                    <div style={{ background: "var(--bg-card)", borderRadius: 20, padding: "1.75rem", border: "1px solid var(--border-light)", boxShadow: "var(--shadow-sm)", position: "sticky", top: "1rem" }}>
                        <h3 style={{ fontWeight: 900, fontSize: "1rem", marginBottom: "1.5rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Activity size={17} style={{ color: "var(--primary)" }} />
                            Enter Your Soil Values
                            <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
                                ✓ Good &nbsp; ⬇ Low &nbsp; ⬆ High
                            </span>
                        </h3>

                        <ParameterSlider paramKey="nitrogen" label={t("soil.nitrogen")} value={form.nitrogen} min={0} max={600} step={5} unit=" kg/ha" icon={Zap} onChange={set("nitrogen")} color="#8b5cf6" />
                        <ParameterSlider paramKey="phosphorus" label={t("soil.phosphorus")} value={form.phosphorus} min={0} max={300} step={5} unit=" kg/ha" icon={Zap} onChange={set("phosphorus")} color="#3b82f6" />
                        <ParameterSlider paramKey="potassium" label={t("soil.potassium")} value={form.potassium} min={0} max={600} step={5} unit=" kg/ha" icon={Zap} onChange={set("potassium")} color="#f59e0b" />
                        <ParameterSlider paramKey="ph_level" label={t("soil.ph")} value={form.ph_level} min={3} max={10} step={0.1} unit="" icon={FlaskConical} onChange={set("ph_level")} color="#ec4899" />
                        <ParameterSlider paramKey="moisture" label={t("soil.moisture")} value={form.moisture} min={0} max={100} step={1} unit="%" icon={Droplets} onChange={set("moisture")} color="#06b6d4" />

                        {/* Soil Type */}
                        <div style={{ marginBottom: "1.5rem" }}>
                            <label style={{ fontWeight: 800, fontSize: "0.88rem", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.75rem" }}>
                                <Wind size={14} style={{ color: "var(--primary)" }} />
                                {t("soil.soilType")}
                            </label>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                                {SOIL_TYPES.map(type => (
                                    <button key={type} onClick={() => setForm(p => ({ ...p, soil_type: type }))}
                                        title={SOIL_TYPE_DESCRIPTIONS[type]}
                                        style={{
                                            padding: "0.55rem 0.25rem", borderRadius: 10, cursor: "pointer", fontWeight: 700,
                                            fontSize: "0.78rem", textTransform: "capitalize", transition: "all 0.2s",
                                            border: form.soil_type === type ? "2px solid var(--primary)" : "1px solid var(--border-light)",
                                            background: form.soil_type === type ? "var(--primary-subtle)" : "var(--bg-main)",
                                            color: form.soil_type === type ? "var(--primary)" : "var(--text-muted)",
                                        }}>
                                        {type}
                                    </button>
                                ))}
                            </div>
                            {form.soil_type && (
                                <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", marginTop: "0.5rem", fontStyle: "italic" }}>
                                    {SOIL_TYPE_DESCRIPTIONS[form.soil_type]}
                                </p>
                            )}
                        </div>

                        <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary"
                            style={{ width: "100%", justifyContent: "center", padding: "1.1rem", fontSize: "1rem", fontWeight: 900, borderRadius: 14 }}>
                            {analyzing ? (
                                <><span style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: "0.5rem" }}>⟳</span>{t("soil.analyzing")}</>
                            ) : (
                                <><TestTube size={18} /> {t("soil.analyzeBtn")}</>
                            )}
                        </button>

                        {result && (
                            <button onClick={() => { setResult(null); setForm(DEFAULT_FORM); }} className="btn-secondary"
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
                                <div style={{ background: "var(--primary-subtle)", borderRadius: 20, padding: "3rem 2rem", textAlign: "center", border: "1px dashed var(--primary-light)" }}>
                                    <FlaskConical size={52} style={{ color: "var(--primary)", opacity: 0.5, marginBottom: "1rem" }} />
                                    <h3 style={{ color: "var(--text-main)", fontWeight: 900, marginBottom: "0.75rem" }}>
                                        Your Results Will Appear Here
                                    </h3>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: 400, margin: "0 auto 1.5rem" }}>
                                        Adjust the sliders on the left to match your soil test values, then click <strong>Analyze Soil</strong> to get personalized fertilizer recommendations.
                                    </p>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", maxWidth: 500, margin: "0 auto" }}>
                                        {[
                                            { icon: "🔬", text: "Soil health score (0–100)", action: handleAnalyze },
                                            { icon: "⚠️", text: "Nutrient deficiency detection", action: () => { setForm({ nitrogen: 20, phosphorus: 10, potassium: 15, ph_level: 5.0, moisture: 20, soil_type: "sandy" }); setTimeout(handleAnalyze, 100); } },
                                            { icon: "💊", text: "Fertilizer recommendations", action: () => { setForm({ nitrogen: 120, phosphorus: 20, potassium: 40, ph_level: 5.5, moisture: 30, soil_type: "clay" }); setTimeout(handleAnalyze, 100); } },
                                            { icon: "🛒", text: "Matched products from store", action: () => { setForm({ nitrogen: 50, phosphorus: 30, potassium: 20, ph_level: 6.2, moisture: 45, soil_type: "silty" }); setTimeout(handleAnalyze, 100); } },
                                        ].map((item, i) => (
                                            <button key={i} onClick={item.action} style={{ padding: "0.75rem 1rem", background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: "0.6rem", textAlign: "left", cursor: "pointer", transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.background = "var(--primary-subtle)"; }} onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.background = "var(--bg-card)"; }}>
                                                <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                                                <span style={{ fontSize: "0.8rem", color: "var(--text-main)", fontWeight: 600 }}>{item.text}</span>
                                            </button>
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
                                        <p style={{ color: "var(--text-muted)", lineHeight: 1.6, fontSize: "0.88rem", marginBottom: "1rem" }}>
                                            {result.health_score >= 75
                                                ? "Your soil is in excellent condition. Continue current management practices and re-test annually."
                                                : result.health_score >= 50
                                                    ? "Your soil has some deficiencies. Apply recommended fertilizers now and re-test after 4–6 weeks."
                                                    : "Your soil needs significant improvement. Apply treatments promptly and re-test within 4 weeks."}
                                        </p>
                                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                            {[
                                                { label: `N: ${form.nitrogen} kg/ha`, color: "#8b5cf6" },
                                                { label: `P: ${form.phosphorus} kg/ha`, color: "#3b82f6" },
                                                { label: `K: ${form.potassium} kg/ha`, color: "#f59e0b" },
                                                { label: `pH: ${form.ph_level}`, color: "#ec4899" },
                                                { label: `Moisture: ${form.moisture}%`, color: "#06b6d4" },
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
                                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem 1.5rem", background: "#d1fae5", border: "1px solid #6ee7b7", borderRadius: 16 }}>
                                        <CheckCircle size={28} style={{ color: "#10b981", flexShrink: 0 }} />
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 900, color: "#065f46", fontSize: "1rem" }}>🎉 Soil is Well-Balanced!</p>
                                            <p style={{ margin: 0, fontSize: "0.84rem", color: "#047857", marginTop: "0.15rem" }}>
                                                All nutrients are within optimal ranges. Maintain with annual organic compost additions.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Deficiencies */}
                                {result.deficiencies?.length > 0 && (
                                    <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: "1.5rem", border: "1px solid #fca5a5" }}>
                                        <h4 style={{ fontWeight: 900, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#dc2626" }}>
                                            <AlertTriangle size={18} /> {t("soil.deficiencies")}
                                        </h4>
                                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                                            {result.deficiencies.map((d, i) => (
                                                <span key={i} style={{ padding: "0.45rem 1.1rem", borderRadius: 20, background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", fontWeight: 800, fontSize: "0.85rem" }}>
                                                    ⚠ {d}
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
                                                    padding: "1.1rem 1.25rem", borderRadius: 14,
                                                    background: severityBg(rec.severity),
                                                    borderLeft: `4px solid ${severityColor(rec.severity)}`,
                                                    border: `1px solid ${severityColor(rec.severity)}30`,
                                                    borderLeftWidth: 4,
                                                }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                                        <span style={{ fontWeight: 900, color: severityColor(rec.severity), fontSize: "0.9rem" }}>{rec.nutrient}</span>
                                                        <span style={{ fontSize: "0.65rem", padding: "0.2rem 0.6rem", borderRadius: 10, background: severityColor(rec.severity), color: "#fff", fontWeight: 800, textTransform: "uppercase" }}>
                                                            {rec.severity}
                                                        </span>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-main)", lineHeight: 1.65 }}>{rec.suggestion}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommended Products */}
                                {result.suggested_products?.length > 0 && (
                                    <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: "1.5rem", border: "1px solid var(--border-light)" }}>
                                        <h4 style={{ fontWeight: 900, marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <ShoppingCart size={18} style={{ color: "var(--primary)" }} /> {t("soil.recommendedFertilizers")}
                                        </h4>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                             {result.suggested_products.map((p, i) => {
                                                 const prodImg = p.image ? (p.image.startsWith("http") ? p.image : `http://localhost:8000${p.image}`) : null;
                                                 return (
                                                     <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1rem", background: "var(--bg-surface-1)", borderRadius: 12, border: "1px solid var(--border-light)", transition: "all 0.2s" }}
                                                         onMouseEnter={e => e.currentTarget.style.borderColor = "var(--primary)"}
                                                         onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border-light)"}>
                                                         {prodImg ? (
                                                             <img src={prodImg} alt={p.name} style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", flexShrink: 0, background: "white" }} />
                                                         ) : (
                                                             <div style={{ width: 60, height: 60, borderRadius: 10, background: "var(--primary-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                                 <Leaf size={24} style={{ color: "var(--primary)" }} />
                                                             </div>
                                                         )}
                                                         <div style={{ flex: 1 }}>
                                                             <p style={{ margin: 0, fontWeight: 900, fontSize: "0.9rem", color: "var(--text-main)" }}>{p.name}</p>
                                                             <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--primary)", fontWeight: 700 }}>NPR {p.price}</p>
                                                         </div>
                                                         <button onClick={() => navigate(`/store/product/${p.id}`)} className="btn-primary"
                                                             style={{ padding: "0.5rem 1.1rem", fontSize: "0.8rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
                                                             {t("soil.buyNow")} <ChevronRight size={14} />
                                                         </button>
                                                     </div>
                                                 );
                                             })}
                                        </div>
                                        <div style={{ marginTop: "1rem", textAlign: "center" }}>
                                            <button onClick={() => navigate("/store")} className="btn-secondary"
                                                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem" }}>
                                                <ShoppingCart size={15} /> Browse All Products in Marketplace
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SoilAnalysis;
