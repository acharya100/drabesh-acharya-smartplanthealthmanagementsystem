/**
 * Treatment Form Modal Component
 */

import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { X, Save, AlertTriangle } from "lucide-react";
import { eCommerceService } from "../services/api";

const TreatmentFormModal = ({ isOpen, onClose, onSubmit, initialData = null, diseases = [], selectedDiseaseId = null }) => {
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
            setError("Please fill in all required fields.");
            return;
        }

        if (formData.instructions.length < 20) {
            setError("Instructions must be at least 20 characters long.");
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
            setError(err.response?.data?.detail || "Failed to save treatment.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 3000
        }}>
            <div
                className="modal-content animate-slide-up"
                style={{
                    maxWidth: '600px', width: '90%', maxHeight: '90vh',
                    overflowY: 'auto', backgroundColor: 'var(--bg-card, white)',
                    borderRadius: '12px', padding: '0'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal-header" style={{
                    padding: '1.5rem', borderBottom: '1px solid var(--border-light, #eee)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{initialData ? "Edit Treatment" : "Add New Treatment"}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={djangoSubmit} className="modal-body" style={{ padding: '1.5rem' }}>
                    {error && (
                        <div className="error-banner mb-4" style={{
                            background: '#fee2e2', color: '#dc2626', padding: '0.75rem', marginBottom: '1rem',
                            borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem'
                        }}>
                            <AlertTriangle size={16} />
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontWeight: 600 }}>Disease</label>
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
                                        textDecoration: 'underline'
                                    }}>
                                    {useCustomDisease ? '← Select Existing' : '+ Add Custom Disease'}
                                </button>
                            )}
                        </div>
                        {useCustomDisease ? (
                            <input
                                type="text"
                                value={customDiseaseName}
                                onChange={(e) => setCustomDiseaseName(e.target.value)}
                                placeholder="Enter custom disease name..."
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        ) : (
                            <select
                                name="disease"
                                value={formData.disease}
                                onChange={handleChange}
                                disabled={!!initialData}
                                required
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            >
                                <option value="">Select a Disease...</option>
                                {diseases.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Treatment Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Neem Oil Application"
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Type</label>
                            <select
                                name="treatment_type"
                                value={formData.treatment_type}
                                onChange={handleChange}
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            >
                                <option value="organic">Organic / Natural</option>
                                <option value="chemical">Chemical / Synthetic</option>
                                <option value="cultural">Cultural / Physical</option>
                                <option value="biological">Biological Control</option>
                                <option value="mechanical">Mechanical / Physical</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Effectiveness (%)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input
                                    type="range"
                                    name="effectiveness_rate"
                                    min="0" max="100"
                                    value={formData.effectiveness_rate}
                                    onChange={handleChange}
                                    style={{ flex: 1 }}
                                />
                                <span style={{ fontWeight: 'bold', width: '3rem' }}>{formData.effectiveness_rate}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Cost Estimate</label>
                            <input
                                type="text"
                                name="cost_estimate"
                                value={formData.cost_estimate}
                                onChange={handleChange}
                                placeholder="e.g. NPR 500 - 1500"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Expected Duration</label>
                            <input
                                type="text"
                                name="expected_duration"
                                value={formData.expected_duration}
                                onChange={handleChange}
                                placeholder="e.g. 1 week"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Description</label>
                        <textarea
                            name="description"
                            rows="2"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Brief overview of how this treatment works..."
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Detailed Steps (20+ chars)</label>
                        <textarea
                            name="instructions"
                            rows="4"
                            value={formData.instructions}
                            onChange={handleChange}
                            placeholder="1. Mix solution...&#10;2. Spray evenly...&#10;3. Repeat every 7 days..."
                            required
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'monospace', fontSize: '0.9rem' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Products Needed</label>
                        <input
                            type="text"
                            name="products_needed"
                            value={formData.products_needed}
                            onChange={handleChange}
                            placeholder="e.g. Neem oil, Spray bottle, Water"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd' }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Link Marketplace Products (Optional)</label>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Select products users can directly purchase for this treatment.</p>
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
                                    No marketplace products available.
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600 }}>
                            <input
                                type="checkbox"
                                name="is_preventive"
                                checked={formData.is_preventive}
                                onChange={handleChange}
                                style={{ width: '1.2rem', height: '1.2rem' }}
                            />
                            Is Preventive Measure?
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
                                padding: '0.75rem 1.5rem', border: '1px solid #ddd', borderRadius: '8px',
                                background: 'var(--bg-card)', cursor: 'pointer', fontWeight: 600
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                            style={{
                                padding: '0.75rem 1.5rem', border: 'none', borderRadius: '8px',
                                background: 'var(--primary, #0fa968)', color: 'white', cursor: 'pointer',
                                fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            {loading ? "Saving..." : <><Save size={18} /> Save Treatment</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default TreatmentFormModal;
