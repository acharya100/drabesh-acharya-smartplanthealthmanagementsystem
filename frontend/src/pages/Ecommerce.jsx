import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import ProductReviews from "../components/ProductReviews";
import { eCommerceService } from "../services/api";
import { useCart } from "../context/CartContext";
import { ShoppingCart, Search, Filter, ShoppingBag, ArrowRight, Star, X, Info, ShieldCheck, Truck, RotateCcw } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const Ecommerce = () => {
    const { t } = useLanguage();
    const { addToCart, totalItems } = useCart();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [quickViewProduct, setQuickViewProduct] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [prodRes, catRes] = await Promise.all([
                eCommerceService.getProducts(),
                eCommerceService.getCategories()
            ]);
            setProducts(prodRes.data.results || prodRes.data);
            setCategories(catRes.data.results || catRes.data);
            setLoading(false);
        } catch (error) {
            console.error("Error loading shop data:", error);
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                             p.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === "all" || p.category === parseInt(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    const categoriesList = [
        { id: 'all', name: 'All Products', icon: <ShoppingBag size={18} /> },
        ...categories.map(c => ({ id: c.id.toString(), name: c.name, icon: <Filter size={18} /> }))
    ];

    return (
        <div className="page-container">
            <Navbar activePage="store" />
            <div className="page-content animate-slide-up" style={{ padding: '2rem 3rem' }}>
                
                {/* Store Hero */}
                <div className="store-hero" style={{
                    background: 'linear-gradient(135deg, #065f46, #064e3b)',
                    borderRadius: '30px',
                    padding: '4rem 3rem',
                    color: '#fff',
                    marginBottom: '3rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(6,78,59,0.15)'
                }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', marginBottom: '1rem', display: 'inline-block' }}>
                            PREMIUM SELECTION
                        </span>
                        <h1 style={{ fontSize: '3.5rem', color: '#fff', margin: '0 0 1rem 0', fontWeight: 900 }}>Plant Care <span style={{ color: '#6ee7b7' }}>Store</span></h1>
                        <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '500px' }}>
                            Professional grade fertilizers, organic seeds, and laboratory-tested pesticides for your garden.
                        </p>
                    </div>
                    {/* Cart Quick Access */}
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <button onClick={() => window.location.href='/cart'} style={{
                            background: '#fff', color: '#064e3b', border: 'none', 
                            padding: '1rem 2rem', borderRadius: '16px', fontWeight: 800,
                            display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                        }}>
                            <ShoppingBag size={24} />
                            Your Cart ({totalItems})
                        </button>
                    </div>
                </div>

                <div className="store-layout" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '3rem' }}>
                    {/* Sidebar Filters */}
                    <aside className="store-sidebar">
                        <div className="sidebar-section" style={{ marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Filter size={20} className="text-primary" /> CATEGORIES
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {categoriesList.map(cat => (
                                    <button 
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                            padding: '1rem 1.25rem', borderRadius: '14px', border: 'none',
                                            background: selectedCategory === cat.id ? 'var(--primary-subtle)' : 'transparent',
                                            color: selectedCategory === cat.id ? 'var(--primary)' : 'var(--text-muted)',
                                            fontWeight: selectedCategory === cat.id ? 800 : 600,
                                            cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                                        }}
                                        className="category-btn"
                                    >
                                        {cat.icon}
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="sidebar-card" style={{ 
                            background: 'var(--bg-surface-inner)', padding: '1.5rem', borderRadius: '20px',
                            border: '1px solid var(--border-light)'
                        }}>
                            <ShieldCheck size={32} className="text-primary" style={{ marginBottom: '1rem' }} />
                            <h4 style={{ marginBottom: '0.5rem' }}>{t('store.qualityGuaranteed') || "Quality Guaranteed"}</h4>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                                {t('store.qualityDesc') || "All products are ISO certified and tested for safety and efficacy."}
                            </p>
                        </div>
                    </aside>

                    <div className="store-main">
                        <div className="search-bar" style={{ marginBottom: '2.5rem', position: 'relative' }}>
                            <Search size={22} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder={t('store.searchPlaceholder') || "Search products..."}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{ 
                                    paddingLeft: '3.5rem', height: '60px', borderRadius: '18px',
                                    fontSize: '1.1rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                                    width: '100%'
                                }}
                            />
                        </div>

                        {loading ? (
                            <div className="loading-spinner-container">
                                <div className="spinner"></div>
                                <p>Loading marketplace...</p>
                            </div>
                        ) : (
                            <div className="product-grid" style={{
                                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem'
                            }}>
                                {filteredProducts.length > 0 ? filteredProducts.map(product => (
                                    <div key={product.id} className="professional-card product-card" style={{
                                        background: 'var(--bg-card)', border: '1px solid var(--border-light)',
                                        display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden'
                                    }}>
                                        <div style={{ width: '100%', height: '240px', background: 'var(--bg-surface-2)', position: 'relative', cursor: 'pointer' }} onClick={() => setQuickViewProduct(product)}>
                                            <img src={product.image ? (product.image.startsWith('http') ? product.image : `http://localhost:8000${product.image}`) : 'https://via.placeholder.com/300x200'} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '12px', fontWeight: 900, boxShadow: 'var(--shadow-lg)', color: 'var(--primary)', border: '1px solid var(--border-light)' }}>
                                                NPR {parseFloat(product.price).toLocaleString()}
                                            </div>
                                            <div className="quick-view-overlay" style={{
                                                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                opacity: 0, transition: 'opacity 0.2s', color: '#fff', fontWeight: 800
                                            }}>
                                                <Info size={20} /> QUICK VIEW
                                            </div>
                                        </div>
                                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                                <div style={{ display: 'flex', gap: '0.2rem', color: '#f59e0b' }}>
                                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < 4 ? '#f59e0b' : 'none'} />)}
                                                </div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--success)' }}>IN STOCK</span>
                                            </div>
                                            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 900 }}>{product.name}</h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                                                {product.description}
                                            </p>
                                            <div style={{ marginTop: 'auto' }}>
                                                <button 
                                                    onClick={() => addToCart(product)}
                                                    className="btn-primary" 
                                                    style={{ width: '100%', justifyContent: 'center', borderRadius: '14px', padding: '1.1rem' }}
                                                >
                                                    <ShoppingCart size={18} />
                                                    Add to Cart
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '5rem', background: 'var(--primary-subtle)', borderRadius: '30px', border: '1px dashed var(--primary-light)' }}>
                                        <ShoppingBag size={64} style={{ color: 'var(--primary)', marginBottom: '1.5rem', opacity: 0.5 }} />
                                        <h2>No products found</h2>
                                        <p>We couldn't find any items matching your criteria.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick View Modal */}
                {quickViewProduct && (
                    <div className="modal-overlay" style={{ zIndex: 2000 }}>
                        <div className="modal-content animate-scale-up" style={{ maxWidth: '1000px', padding: 0, overflow: 'auto', maxHeight: '90vh' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                <div style={{ position: 'relative', minHeight: '350px' }}>
                                    <img src={quickViewProduct.image ? (quickViewProduct.image.startsWith('http') ? quickViewProduct.image : `http://localhost:8000${quickViewProduct.image}`) : 'https://via.placeholder.com/300x200'} alt={quickViewProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button onClick={() => setQuickViewProduct(null)} style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    <div>
                                        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>{quickViewProduct.name}</h2>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ display: 'flex', gap: '0.2rem', color: '#f59e0b', fontSize: '1.2rem' }}>
                                                {[1,2,3,4,5].map(s => <span key={s}>{s <= Math.round(quickViewProduct.average_rating || 0) ? '★' : '☆'}</span>)}
                                            </div>
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{quickViewProduct.average_rating || 0} ({quickViewProduct.review_count || 0} reviews)</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary)' }}>NPR {parseFloat(quickViewProduct.price).toLocaleString()}</div>
                                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>{quickViewProduct.description}</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}><Truck size={16} /> Free Shipping</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}><RotateCcw size={16} /> 30-Day Returns</div>
                                    </div>
                                    <button onClick={() => { addToCart(quickViewProduct); setQuickViewProduct(null); }} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem', borderRadius: '14px' }}>
                                        <ShoppingCart size={18} /> Add to Cart
                                    </button>
                                </div>
                            </div>
                            {/* Live Reviews Section */}
                            <div style={{ padding: '2rem', borderTop: '1px solid var(--border-light)' }}>
                                <ProductReviews productId={quickViewProduct.id} productName={quickViewProduct.name} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .product-card:hover { transform: translateY(-10px); }
                .product-card:hover .quick-view-overlay { opacity: 1; }
                .category-btn:hover { background: var(--bg-surface-inner) !important; color: var(--primary) !important; }
            `}} />
        </div>
    );
};

export default Ecommerce;
