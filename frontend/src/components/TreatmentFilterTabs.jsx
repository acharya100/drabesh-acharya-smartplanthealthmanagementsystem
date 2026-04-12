import { useLanguage } from "../context/LanguageContext";

const TreatmentFilterTabs = ({ activeFilter, onChange }) => {
  const { t } = useLanguage();

  const FILTER_TABS = [
    { key: "all", label: t("treatmentFilters.all"), activeColor: "#1a4d2e", activeBg: "#e8f3ee" },
    { key: "treated", label: t("treatmentFilters.treated"), activeColor: "#15803d", activeBg: "#dcfce7" },
    { key: "in_progress", label: t("treatmentFilters.in_progress"), activeColor: "#b45309", activeBg: "#fef3c7" },
    { key: "untreated", label: t("treatmentFilters.untreated"), activeColor: "#dc2626", activeBg: "#fee2e2" },
    { key: "healthy", label: t("treatmentFilters.healthy"), activeColor: "#059669", activeBg: "#d1fae5" },
    { key: "out_of_scope", label: t("treatmentFilters.out_of_scope"), activeColor: "#6d28d9", activeBg: "#ede9fe" },
    { key: "non_plant", label: t("treatmentFilters.non_plant"), activeColor: "#475569", activeBg: "#f1f5f9" },
  ];
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        gap: "0.4rem",
        flexWrap: "wrap",
        marginBottom: "1.75rem",
        padding: "0.35rem",
        background: "var(--bg-surface-1, #f8fafc)",
        borderRadius: 14,
        border: "1px solid var(--border-light, #e2e8f0)",
        width: "fit-content",
        maxWidth: "100%",
      }}
    >
      {FILTER_TABS.map(tab => {
        const isActive = activeFilter === tab.key;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            style={{
              padding: "0.42rem 0.9rem",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.8rem",
              fontWeight: isActive ? 700 : 600,
              color: isActive ? tab.activeColor : "var(--text-muted, #64748b)",
              background: isActive ? tab.activeBg : "transparent",
              boxShadow: isActive ? `0 1px 4px ${tab.activeColor}22` : "none",
              transition: "all 0.18s ease",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.background = tab.activeBg + "80";
                e.currentTarget.style.color = tab.activeColor;
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-muted, #64748b)";
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default TreatmentFilterTabs;
