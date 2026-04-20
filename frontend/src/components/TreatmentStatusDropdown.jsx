/**
 * TreatmentStatusDropdown - Standalone component with i18n support
 * Options: Not Started, Treatment In Progress, Mark as Treated,
 *          Healthy (No Treatment Needed), Non-Plant Image, Outside Scope
 */
import { ChevronDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const TreatmentStatusDropdown = ({ value, onChange, style = {} }) => {
  const { t } = useLanguage();

  const STATUS_OPTIONS = [
    { value: "untreated",    label: t("history.statusUntreated") || "Not Started",                  color: "#ef4444" },
    { value: "in_progress",  label: t("history.statusInProgress") || "Treatment In Progress",        color: "#f59e0b" },
    { value: "treated",      label: t("history.statusTreated") || "Mark as Treated",                 color: "#10b981" },
    { value: "healthy",      label: t("history.statusHealthy") || "Healthy (No Treatment Needed)",   color: "#22c55e" },
    { value: "non_plant",    label: t("history.badgeNonPlant") || "Non-Plant Image",                 color: "#64748b" },
    { value: "out_of_scope", label: t("history.badgeOutsideScope") || "Outside Scope",                color: "#8b5cf6" },
  ];

  const current = STATUS_OPTIONS.find(o => o.value === value) || STATUS_OPTIONS[0];

  return (
    <div style={{ position: "relative", display: "inline-block", width: "100%", ...style }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          width: "100%",
          padding: "0.55rem 2.5rem 0.55rem 0.9rem",
          borderRadius: 10,
          border: `1.5px solid ${current.color}`,
          background: `${current.color}12`,
          color: current.color,
          fontWeight: 700,
          fontSize: "0.82rem",
          cursor: "pointer",
          outline: "none",
          transition: "border-color 0.2s, background 0.2s",
          fontFamily: "inherit",
        }}
      >
        {STATUS_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {/* Custom chevron */}
      <ChevronDown
        size={14}
        style={{
          position: "absolute",
          right: "0.7rem",
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          color: current.color,
        }}
      />
    </div>
  );
};

export default TreatmentStatusDropdown;
