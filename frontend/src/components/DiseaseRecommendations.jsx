import { useState, useEffect } from "react";
import { ShoppingBag, Leaf, ArrowRight, Loader } from "lucide-react";
import { eCommerceService } from "../services/api";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

/**
 * DiseaseRecommendations - shown on the disease detection result page
 * Shows products linked to the detected disease
 */
const DiseaseRecommendations = ({ diseaseName }) => {
    const { addToCart } = useCart();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState({});

    useEffect(() => {
        if (!diseaseName) return;
        setLoading(true);
        eCommerceService.getRecommendations(diseaseName)
            .then(res => {
                setRecommendations(res.data.results || res.data);
            })
            .catch(e => console.error('Recommendation error:', e))
            .finally(() => setLoading(false));
    }, [diseaseName]);

    const handleAddToCart = (product) => {
        addToCart(product);
        setAdded(prev => ({ ...prev, [product.id]: true }));
        setTimeout(() => setAdded(prev => ({ ...prev, [product.id]: false })), 2000);
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <Loader size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Finding recommended products...</p>
            </div>
        );
    }

    if (!recommendations.length) return null;

    return (
        <div style={{ marginTop: '2rem', padding: '2rem', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)' }}>
                        <ShoppingBag size={20} /> Recommended Treatment Products
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Curated for <strong>{diseaseName}</strong>
                    </p>
                </div>
                <Link to="/store" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
                    View All <ArrowRight size={16} />
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                {recommendations.map(({ product }) => (
                    <div key={product.id} style={{ borderRadius: '16px', border: '1px solid var(--border-light)', overflow: 'hidden', background: 'var(--bg-surface-inner)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <div style={{ height: '140px', background: 'var(--bg-surface-2)', overflow: 'hidden' }}>
                            <img
                                src={product.image ? (product.image.startsWith('http') ? product.image : `http://localhost:8000${product.image}`) : 'https://via.placeholder.com/220x140'}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        <div style={{ padding: '1rem' }}>
                            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{product.name}</p>
                            <p style={{ margin: '0 0 1rem 0', fontWeight: 900, color: 'var(--primary)', fontSize: '1.05rem' }}>NPR {parseFloat(product.price).toLocaleString()}</p>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => handleAddToCart(product)}
                                    className="btn-primary"
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.82rem', justifyContent: 'center' }}
                                >
                                    <ShoppingBag size={13} />
                                    {added[product.id] ? 'Added! ✓' : 'Add to Cart'}
                                </button>
                                <Link to="/store" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-light)', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.82rem' }}>
                                    Details
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DiseaseRecommendations;
