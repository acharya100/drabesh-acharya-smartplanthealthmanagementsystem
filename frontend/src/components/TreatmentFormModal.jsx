import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Save, AlertTriangle } from "lucide-react";
import { eCommerceService } from "../services/api";
import { useLanguage } from "../context/LanguageContext";

const TreatmentFormModal = ({ isOpen, onClose, onSubmit, initialData = null, diseases = [], selectedDiseaseId = null }) => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        name: "",
        disease: "",
        treatment_type: "organic",
        description: "",
        instructions: "",
        products_needed: "",
        effectiveness_rate: 80,
        is_preventive: false,
        cost_estimate: "",
        expected_duration: "1-2 weeks"
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [useCustomDisease, setUseCustomDisease] = useState(false);
    const [customDiseaseName, setCustomDiseaseName] = useState("");

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData({
                    ...initialData,
                    disease: initialData.disease || initialData.disease_id || "",
                    related_product_ids: initialData.related_products ? initialData.related_products.map(p => p.id) : []
                });
            } else {
                // Reset for new entry
                setFormData({
                    name: "",
                    treatment_type: "organic",
                    description: "",
                    instructions: "",
                    products_needed: "",
                    effectiveness_rate: 80,
                    is_preventive: false,
                    cost_estimate: "",
                    expected_duration: "1-2 weeks",
                    disease: selectedDiseaseId || (diseases.length > 0 ? diseases[0].id : ""),
                    related_product_ids: []
                });
            }
            setError("");
        }
    }, [isOpen, initialData, selectedDiseaseId, diseases]);

    const [products, setProducts] = useState([]);
    
    useEffect(() => {
        if (isOpen) {
            loadProducts();
        }
    }, [isOpen]);

    const loadProducts = async () => {
        try {
            const { data } = await eCommerceService.getProducts();
            setProducts(data.results || data);
        } catch (err) {
            console.error("Failed to load products for treatment modal", err);
        }
    };

    const handleProductToggle = (productId) => {
        setFormData(prev => {
            const current = [...(prev.related_product_ids || [])];
            if (current.includes(productId)) {
                return { ...prev, related_product_ids: current.filter(id => id !== productId) };
            } else {
                return { ...prev, related_product_ids: [...current, productId] };
            }
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const djangoSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!formData.name || !formData.description || !formData.instructions) {
            setError(t("treatForm.errorRequired") || "Please fill in all required fields.");
            return;
        }

        if (formData.instructions.length < 20) {
            setError(t("treatForm.errorMinChars") || "Instructions must be at least 20 characters long.");
            return;
        }

        try {
            setLoading(true);
            const submitData = useCustomDisease
                ? { ...formData, disease: null, custom_disease_name: customDiseaseName }
                : formData;
            await onSubmit(submitData);
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.detail || t("treatForm.errorFailed") || "Failed to save treatment.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'var(--modal-overlay)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 3000
        }}>
            <div
                className="modal-content animate-slide-up"
                style={{
                    maxWidth: '600px', width: '90%', maxHeight: '90vh',
                    overflowY: 'auto', backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-md)', padding: '0',
                    border: '1px solid var(--border-light)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header" style={{
                    padding: '1.5rem', borderBottom: '1px solid var(--border-light)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 800 }}>
                        {initialData ? t("treatForm.editTitle") : t("treatForm.addTitle")}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={djangoSubmit} className="modal-body" style={{ padding: '1.5rem' }}>
                    {error && (
                        <div className="error-banner mb-4" style={{
                            background: 'var(--danger-subtle)', color: 'var(--danger)', padding: '0.75rem', marginBottom: '1rem',
                            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem',
                            border: '1px solid var(--danger)'
                        }}>
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t("treatForm.diseaseLabel")}</label>
                            {!initialData && (
                                <button
                                    type="button"
                                    onClick={() => setUseCustomDisease(!useCustomDisease)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--primary)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: 700,
                                        textDecoration: 'underline'
                                    }}>
                                    {useCustomDisease ? t("treatForm.selectExisting") : t("treatForm.addCustom")}
                                </button>
                            )}
                        </div>
                        {useCustomDisease ? (
                            <input
                                type="text"
                                value={customDiseaseName}
                                onChange={(e) => setCustomDiseaseName(e.target.value)}
                                placeholder={t("treatForm.customLabel")}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                            />
                        ) : (
                            <select
                                name="disease"
                                value={formData.disease}
                                onChange={handleChange}
                                disabled={!!initialData}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                            >
                                <option value="">{t("treatForm.selectDisease")}</option>
                                {diseases.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{t("treatForm.nameLabel")}</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder={t("treatForm.namePlaceholder")}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                        />
                    </div>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{t("treatForm.typeLabel")}</label>
                            <select
                                name="treatment_type"
                                value={formData.treatment_type}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                            >
                                <option value="organic">{t("treatForm.types.organic")}</option>
                                <option value="chemical">{t("treatForm.types.chemical")}</option>
                                <option value="cultural">{t("treatForm.types.cultural")}</option>
                                <option value="biological">{t("treatForm.types.biological")}</option>
                                <option value="mechanical">{t("treatForm.types.mechanical")}</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{t("treatForm.effectLabel")}</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input
                                    type="range"
                                    name="effectiveness_rate"
                                    min="0" max="100"
                                    value={formData.effectiveness_rate}
                                    onChange={handleChange}
                                    style={{ flex: 1, accentColor: 'var(--primary)' }}
                                />
                                <span style={{ fontWeight: 800, width: '3.5rem', color: 'var(--primary)' }}>{formData.effectiveness_rate}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{t("treatForm.costLabel")}</label>
                            <input
                                type="text"
                                name="cost_estimate"
                                value={formData.cost_estimate}
                                onChange={handleChange}
                                placeholder={t("treatForm.costPlaceholder")}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{t("treatForm.durationLabel")}</label>
                            <input
                                type="text"
                                name="expected_duration"
                                value={formData.expected_duration}
                                onChange={handleChange}
                                placeholder={t("treatForm.durationPlaceholder")}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{t("treatForm.descLabel")}</label>
                        <textarea
                            name="description"
                            rows="2"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder={t("treatForm.descPlaceholder")}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{t("treatForm.stepsLabel")}</label>
                        <textarea
                            name="instructions"
                            rows="4"
                            value={formData.instructions}
                            onChange={handleChange}
                            placeholder={t("treatForm.stepsPlaceholder")}
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-main)', fontFamily: 'monospace', fontSize: '0.9rem' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{t("treatForm.productsNeededLabel")}</label>
                        <input
                            type="text"
                            name="products_needed"
                            value={formData.products_needed}
                            onChange={handleChange}
                            placeholder={t("treatForm.productsNeededPlaceholder")}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'var(--bg-input)', color: 'var(--text-main)' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>{t("treatForm.linkMarketplaceLabel")}</label>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{t("treatForm.linkMarketplaceDesc")}</p>
                        <div className="product-selection-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto', padding: '1rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-inner)' }}>
                            {products.map(product => (
                                <div
                                    key={product.id}
                                    onClick={() => handleProductToggle(product.id)}
                                    style={{
                                        padding: '0.6rem', border: '1px solid var(--border-light)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                                        background: formData.related_product_ids?.includes(product.id) ? 'var(--primary-subtle)' : 'var(--bg-card)',
                                        color: formData.related_product_ids?.includes(product.id) ? 'var(--primary)' : 'inherit',
                                        borderColor: formData.related_product_ids?.includes(product.id) ? 'var(--primary)' : 'var(--border-light)',
                                        display: 'flex', flexDirection: 'column', gap: '0.25rem'
                                    }}
                                >
                                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</span>
                                    <span style={{ fontSize: '0.7rem', color: formData.related_product_ids?.includes(product.id) ? 'var(--primary)' : 'var(--text-muted)' }}>NPR {product.price}</span>
                                </div>
                            ))}
                            {products.length === 0 && (
                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '1rem', fontSize: '0.85rem' }}>
                                    {t("treatForm.noProducts")}
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)' }}>
                            <input
                                type="checkbox"
                                name="is_preventive"
                                checked={formData.is_preventive}
                                onChange={handleChange}
                                style={{ width: '1.2rem', height: '1.2rem', accentColor: 'var(--primary)' }}
                            />
                            {t("treatForm.isPreventiveLabel")}
                        </label>
                    </div>

                    <div className="modal-footer" style={{
                        display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem',
                        borderTop: '1px solid var(--border-light, #eee)'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary"
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem', border: '1px solid var(--border-light)', borderRadius: '8px',
                                background: 'var(--bg-card)', cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)'
                            }}
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px',
                                background: 'var(--primary)', color: 'white', cursor: 'pointer',
                                fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            {loading ? t("treatForm.saving") : <><Save size={18} /> {t("treatForm.saveBtn")}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default TreatmentFormModal;
