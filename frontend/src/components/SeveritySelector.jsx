/**
 * SeveritySelector — Standalone severity dropdown with dynamic cost display and i18n support
 * Low → NPR 300 | Moderate → NPR 350 | Severe → NPR 400
 * Healthy status → "No treatment required"
 */
import { ChevronDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const COST_MAP = { minor: 300, moderate: 350, severe: 400 };

const SeveritySelector = ({ severity, onChange, treatmentStatus }) => {
  const { t } = useLanguage();
  const isHealthy = treatmentStatus === "healthy";

  const SEVERITY_OPTIONS = [
    { value: "minor",    label: t("history.severityLow") || "Minor",     cost: 300, color: "#10b981" },
    { value: "moderate", label: t("history.severityModerate") || "Moderate",  cost: 350, color: "#f59e0b" },
    { value: "severe",   label: t("history.severityHigh") || "Severe",    cost: 400, color: "#ef4444" },
  ];

  const current = SEVERITY_OPTIONS.find(o => o.value === severity) || SEVERITY_OPTIONS[0];
  const cost = COST_MAP[severity] || 300;

  return (
    <div>
      {/* Severity Dropdown */}
      <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
        <select
          value={severity}
          onChange={e => onChange(e.target.value)}
          disabled={isHealthy}
          style={{
            appearance: "none",
            WebkitAppearance: "none",
            width: "100%",
            padding: "0.55rem 2.5rem 0.55rem 0.9rem",
            borderRadius: 10,
            border: `1.5px solid ${isHealthy ? "#10b981" : current.color}`,
            background: isHealthy ? "#dcfce7" : `${current.color}12`,
            color: isHealthy ? "#15803d" : current.color,
            fontWeight: 700,
            fontSize: "0.82rem",
            cursor: isHealthy ? "not-allowed" : "pointer",
            outline: "none",
            opacity: isHealthy ? 0.7 : 1,
            transition: "border-color 0.2s, background 0.2s",
            fontFamily: "inherit",
          }}
        >
          {SEVERITY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown
          size={14}
          style={{
            position: "absolute",
            right: "0.7rem",
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: isHealthy ? "#15803d" : current.color,
          }}
        />
      </div>

      {/* Dynamic Cost Display */}
      <div style={{
        marginTop: "0.5rem",
        padding: "0.55rem 0.9rem",
        borderRadius: 8,
        border: `1px solid ${isHealthy ? "#bbf7d0" : "var(--border-light)"}`,
        background: isHealthy ? "#f0fdf4" : "var(--bg-surface-inner)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "0.5rem",
      }}>
        <span style={{
          fontSize: "0.73rem",
          color: "var(--text-muted)",
          fontWeight: 600,
        }}>
          {t("treatmentHistory.totalEstimatedCost") || "Estimated Treatment Cost"}
        </span>
        <span style={{
          fontWeight: 800,
          fontSize: "0.9rem",
          color: isHealthy ? "#15803d" : current.color,
          whiteSpace: "nowrap",
        }}>
          {isHealthy ? (t("common.notNeeded") || "No treatment required") : `NPR ${cost}`}
        </span>
      </div>
    </div>
  );
};

export { COST_MAP };
export default SeveritySelector;
