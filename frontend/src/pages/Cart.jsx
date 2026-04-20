import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Truck, ShieldCheck, Tag, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const Cart = () => {
    const { t } = useLanguage();
    const { cartItems, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
    const navigate = useNavigate();

    const estimatedDelivery = () => {
        const d = new Date();
        d.setDate(d.getDate() + 5);
        return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    };

    return (
        <div className="page-container">
            <Navbar activePage="store" />
            <div className="page-content animate-slide-up" style={{ padding: '2rem 3rem' }}>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                    <ShoppingBag size={32} color="var(--primary)" />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: 'var(--secondary)' }}>{t('cart.title')}</h1>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>{cartItems.length} {cartItems.length !== 1 ? t('cart.itemCount_many') : t('cart.itemCount_one')}</p>
                    </div>
                    {cartItems.length > 0 && (
                        <button onClick={clearCart} style={{ marginLeft: "auto", background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: 10, padding: "0.5rem 1rem", cursor: "pointer", fontWeight: 700, fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <Trash2 size={14} /> {t('cart.clearAll')}
                        </button>
                    )}
                </div>

                {cartItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--bg-card)', borderRadius: '28px', border: '2px dashed var(--border-light)' }}>
                        <ShoppingBag size={72} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', opacity: 0.3 }} />
                        <h2 style={{ color: 'var(--secondary)', marginBottom: '0.75rem' }}>{t('cart.emptyTitle')}</h2>
                        <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>{t('cart.emptyDesc')}</p>
                        <Link to="/store" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>{t('cart.browseStore')} <ArrowRight size={18} /></Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem', alignItems: 'start' }}>
                        {/* Cart Items */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {cartItems.map(item => {
                                const imgSrc = item.image
                                    ? (item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image}`)
                                    : 'https://via.placeholder.com/100';
                                const itemTotal = parseFloat(item.price) * (item.quantity || 1);

                                return (
                                    <div key={item.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '1.5rem',
                                        padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '20px',
                                        border: '1px solid var(--border-light)', transition: "all 0.2s"
                                    }}>
                                        <img
                                            src={imgSrc} alt={item.name}
                                            style={{ width: '80px', height: '80px', borderRadius: '14px', objectFit: 'cover', cursor: "pointer" }}
                                            onClick={() => navigate(`/store/product/${item.id}`)}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', cursor: "pointer" }}
                                                onClick={() => navigate(`/store/product/${item.id}`)}
                                            >{item.name}</h3>
                                            <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                                Rs. {parseFloat(item.price).toLocaleString()} {t('cart.each')}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0', border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden' }}>
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ width: '38px', height: '38px', background: 'var(--bg-main)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Minus size={14} />
                                            </button>
                                            <span style={{ width: '38px', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ width: '38px', height: '38px', background: 'var(--bg-main)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <div style={{ textAlign: 'right', minWidth: '100px' }}>
                                            <p style={{ margin: 0, fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem' }}>
                                                Rs. {itemTotal.toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            style={{ padding: '0.6rem', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary Sidebar */}
                        <div style={{
                            background: 'var(--bg-card)', borderRadius: '24px', padding: '2rem',
                            border: '1px solid var(--border-light)', position: 'sticky', top: '100px'
                        }}>
                            <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', margin: "0 0 1.5rem" }}>{t('cart.orderSummary')}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                {cartItems.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>{item.name}    {item.quantity}</span>
                                        <span style={{ fontWeight: 700 }}>Rs. {(parseFloat(item.price) * item.quantity).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span>{t('cart.subtotal')}</span><span>Rs. {totalPrice.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span>{t('cart.shipping')}</span><span style={{ color: '#22c55e', fontWeight: 700 }}>{t('cart.shippingFree')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1.2rem', marginTop: '0.75rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                                    <span>{t('cart.total')}</span><span style={{ color: 'var(--primary)' }}>Rs. {totalPrice.toLocaleString()}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/checkout')}
                                className="btn-primary"
                                style={{ width: '100%', marginTop: '1.5rem', height: '54px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem' }}
                            >
                                {t('cart.proceedToCheckout')} <ArrowRight size={20} />
                            </button>

                            {/* Trust badges */}
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                                <div style={{ flex: 1, textAlign: 'center', padding: '0.6rem' }}>
                                    <Truck size={18} color="var(--primary)" style={{ marginBottom: '0.3rem' }} />
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('cart.freeShipping')}</div>
                                </div>
                                <div style={{ flex: 1, textAlign: 'center', padding: '0.6rem' }}>
                                    <ShieldCheck size={18} color="var(--primary)" style={{ marginBottom: '0.3rem' }} />
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('cart.secure')}</div>
                                </div>
                                <div style={{ flex: 1, textAlign: 'center', padding: '0.6rem' }}>
                                    <Tag size={18} color="var(--primary)" style={{ marginBottom: '0.3rem' }} />
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{t('cart.bestPrice')}</div>
                                </div>
                            </div>

                            {/* Quick Delivery Tag */}
                            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--primary-subtle)', borderRadius: '12px', border: '1px solid var(--primary)', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={14} /> {t('cart.quickDelivery')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
