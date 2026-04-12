/**
 * SeveritySelector — Standalone severity dropdown with dynamic cost display
 * Low → NPR 250 | Moderate → NPR 350 | Severe → NPR 450
 * Healthy status → "No treatment required"
 */
import { ChevronDown } from "lucide-react";

const SEVERITY_OPTIONS = [
  { value: "low",      label: "Low",       cost: 250, color: "#10b981" },
  { value: "moderate", label: "Moderate",  cost: 350, color: "#f59e0b" },
  { value: "severe",   label: "Severe",    cost: 450, color: "#ef4444" },
];

const COST_MAP = { low: 250, moderate: 350, severe: 450 };

const SeveritySelector = ({ severity, onChange, treatmentStatus }) => {
  const isHealthy = treatmentStatus === "healthy";
  const current = SEVERITY_OPTIONS.find(o => o.value === severity) || SEVERITY_OPTIONS[0];
  const cost = COST_MAP[severity] || 250;

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
        border: `1px solid ${isHealthy ? "#bbf7d0" : "#e2e8f0"}`,
        background: isHealthy ? "#f0fdf4" : "var(--bg-main, #f8fafc)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "0.5rem",
      }}>
        <span style={{
          fontSize: "0.73rem",
          color: "var(--text-muted, #64748b)",
          fontWeight: 600,
        }}>
          Estimated Treatment Cost (based on severity)
        </span>
        <span style={{
          fontWeight: 800,
          fontSize: "0.9rem",
          color: isHealthy ? "#15803d" : current.color,
          whiteSpace: "nowrap",
        }}>
          {isHealthy ? "No treatment required" : `NPR ${cost}`}
        </span>
      </div>
    </div>
  );
};

export { COST_MAP };
export default SeveritySelector;
