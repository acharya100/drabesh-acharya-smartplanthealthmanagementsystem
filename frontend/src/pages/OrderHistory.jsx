import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { eCommerceService } from "../services/api";
import { Package, Clock, CheckCircle, Truck, ArrowRight, ExternalLink, Calendar, Search, MapPin, RefreshCw } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useCart } from "../context/CartContext";

const OrderHistory = () => {
    const { t } = useLanguage();
    const { addToCart } = useCart();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [reorderedId, setReorderedId] = useState(null);

    const handleReorder = (order) => {
        if (!order.items?.length) return;
        order.items.forEach(item => {
            addToCart({ id: item.product, name: item.product_name || 'Product', price: parseFloat(item.price), image: item.product_image || '', quantity: 1 });
        });
        setReorderedId(order.id);
        setTimeout(() => setReorderedId(null), 3000);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const res = await eCommerceService.getOrders();
            setOrders(res.data.results || res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setLoading(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered': return { bg: 'var(--success-subtle)', color: 'var(--success)', icon: <CheckCircle size={16} /> };
            case 'shipped': return { bg: 'var(--primary-subtle)', color: 'var(--primary)', icon: <Truck size={16} /> };
            case 'pending': return { bg: 'var(--warning-subtle)', color: '#b45309', icon: <Clock size={16} /> };
            default: return { bg: 'var(--bg-surface-inner)', color: 'var(--text-muted)', icon: <Package size={16} /> };
        }
    };

    return (
        <div className="page-container">
            <Navbar activePage="store" />
            <div className="page-content animate-slide-up" style={{ padding: '2rem 3rem' }}>
                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Order History</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Track and manage your recent purchases and delivery updates.</p>
                </div>

                {loading ? (
                    <div className="loading-spinner-container">
                        <div className="spinner"></div>
                        <p>Loading your orders...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--bg-card)', borderRadius: '30px', border: '1px solid var(--border-light)' }}>
                        <Package size={64} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', opacity: 0.5 }} />
                        <h2>No orders yet</h2>
                        <p style={{ marginBottom: '2rem' }}>You haven't placed any orders from our store yet.</p>
                        <button onClick={() => window.location.href='/store'} className="btn-primary">Visit Store</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {orders.map(order => {
                            const statusStyle = getStatusStyle(order.status || 'Pending');
                            return (
                                <div key={order.id} className="professional-card" style={{ padding: '2.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                                <h3 style={{ margin: 0, fontWeight: 900 }}>Order #{order.id}</h3>
                                                <div style={{
                                                    background: statusStyle.bg, color: statusStyle.color,
                                                    padding: '0.4rem 1rem', borderRadius: '12px', fontSize: '0.75rem',
                                                    fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    textTransform: 'uppercase', letterSpacing: '0.05em'
                                                }}>
                                                    {statusStyle.icon} {order.status || 'PENDING'}
                                                </div>
                                            </div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Calendar size={14} /> Placed on {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>NPR {parseFloat(order.total_amount).toLocaleString()}</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Amount</div>
                                        </div>
                                    </div>

                                    <div style={{ background: 'var(--bg-app)', padding: '1.5rem', borderRadius: '20px', marginBottom: '2rem' }}>
                                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Items in this order</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            {order.items?.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                        <div style={{ width: '40px', height: '40px', background: 'var(--bg-surface-inner)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--primary)' }}>
                                                            {item.quantity}x
                                                        </div>
                                                        <span style={{ fontWeight: 600 }}>{item.product_name || `Product ID: ${item.product}`}</span>
                                                    </div>
                                                    <span style={{ fontWeight: 800 }}>NPR {parseFloat(item.price).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Truck size={16} className="text-primary" /> Standard Delivery
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <MapPin size={16} className="text-primary" /> {order.shipping_address || 'Home Address'}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <button
                                                    onClick={() => handleReorder(order)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-light)', background: reorderedId === order.id ? 'var(--primary-subtle)' : 'var(--bg-card)', color: reorderedId === order.id ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s' }}
                                                >
                                                    <RefreshCw size={15} /> {reorderedId === order.id ? 'Added ✓' : 'Reorder'}
                                                </button>
                                                <button className="btn-secondary" style={{ borderRadius: '12px', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    Details <ExternalLink size={16} />
                                                </button>
                                            </div>
                                        </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .professional-card { transition: all 0.3s ease; }
                .professional-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
            `}} />
        </div>
    );
};

export default OrderHistory;
