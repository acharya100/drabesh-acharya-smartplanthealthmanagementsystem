import { useState } from "react";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
import { eCommerceService } from "../services/api";
import { Trash2, Plus, Minus, CreditCard, Home, CheckCircle, ArrowLeft, ArrowRight, ShoppingBag, Truck, ShieldCheck, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import SavedAddresses from "../components/SavedAddresses";

const Cart = () => {
    const { t } = useLanguage();
    const { cartItems, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
    const navigate = useNavigate();
    
    const [step, setStep] = useState(1);
    const [address, setAddress] = useState("");
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [phone, setPhone] = useState("");
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        try {
            setIsPlacingOrder(true);
            const orderData = {
                items: cartItems.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                total_amount: totalPrice,
                shipping_address: selectedAddress ? selectedAddress.full_address : address,
                phone_number: selectedAddress ? selectedAddress.phone : phone,
                payment_method: 'cod'
            };
            await eCommerceService.placeOrder(orderData);
            clearCart();
            setStep(3);
            setIsPlacingOrder(false);
        } catch (error) {
            console.error("Order error:", error);
            setIsPlacingOrder(false);
            alert("Failed to place order. Please try again.");
        }
    };

    if (step === 3) {
        return (
            <div className="page-container">
                <Navbar />
                <div className="page-content animate-slide-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <div style={{ background: 'var(--primary-subtle)', padding: '3rem', borderRadius: '50%', marginBottom: '2rem' }}>
                        <CheckCircle size={80} style={{ color: 'var(--primary)' }} />
                    </div>
                    <h1 style={{ marginBottom: '1rem' }}>Order Placed Successfully!</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '500px', marginBottom: '2rem' }}>
                        Thank you for your purchase. Our team will start processing your order immediately.
                    </p>
                    <button onClick={() => navigate('/store')} className="btn-primary">
                        Return to Store
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <Navbar activePage="store" />
            <div className="page-content animate-slide-up" style={{ padding: '2rem 3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4rem' }}>
                    {[1, 2, 3].map((s) => (
                        <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: step >= s ? 'var(--primary)' : 'var(--bg-surface-inner)',
                                color: step >= s ? '#fff' : 'var(--text-muted)',
                                fontWeight: 800, fontSize: '1.1rem', transition: 'all 0.3s',
                                border: step === s ? '4px solid var(--primary-light)' : 'none'
                            }}>
                                {step > s ? <CheckCircle size={22} /> : s}
                            </div>
                            {s < 3 && (
                                <div style={{
                                    width: '100px', height: '4px',
                                    background: step > s ? 'var(--primary)' : 'var(--bg-surface-inner)',
                                    margin: '0 1rem', transition: 'all 0.3s'
                                }} />
                            )}
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                    <button onClick={() => step === 2 ? setStep(1) : navigate(-1)} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', cursor: 'pointer', color: 'var(--text-muted)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900 }}>{step === 1 ? 'Your Shopping Cart' : 'Checkout & Delivery'}</h1>
                        <p style={{ margin: 0, color: 'var(--text-muted)' }}>{step === 1 ? `${cartItems.length} items ready for checkout` : 'Enter your details to finalize your order'}</p>
                    </div>
                </div>

                {cartItems.length === 0 && step === 1 ? (
                    <div style={{ textAlign: 'center', padding: '5rem', background: 'var(--bg-card)', borderRadius: '30px', border: '1px solid var(--border-light)' }}>
                        <ShoppingBag size={64} style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }} />
                        <h2>Your cart is empty</h2>
                        <p style={{ marginBottom: '2rem' }}>Browse our store and add some essentials for your plants!</p>
                        <Link to="/store" className="btn-primary">Browse Store</Link>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '3rem', alignItems: 'start' }}>
                        {/* Left Side: Items or Form */}
                        <div>
                            {step === 1 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {cartItems.map(item => (
                                        <div key={item.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '1.5rem',
                                            padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '24px',
                                            border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)'
                                        }}>
                                            <img src={item.image ? (item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image}`) : 'https://via.placeholder.com/100'} alt="" style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover' }} />
                                            <div style={{ flex: 1 }}>
                                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.name}</h3>
                                                <p style={{ margin: 0, color: 'var(--primary)', fontWeight: 800 }}>NPR {parseFloat(item.price).toLocaleString()}</p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-app)', padding: '0.5rem', borderRadius: '12px' }}>
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Minus size={16} /></button>
                                                <span style={{ fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Plus size={16} /></button>
                                            </div>
                                            <button 
                                                onClick={() => removeFromCart(item.id)}
                                                style={{ padding: '0.75rem', borderRadius: '12px', background: 'var(--danger-subtle)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ background: 'var(--bg-card)', padding: '3rem', borderRadius: '24px', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)' }}>
                                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem', fontWeight: 900 }}>
                                        <MapPin size={28} className="text-primary" /> SHIPPING INFORMATION
                                    </h2>
                                    <form onSubmit={handlePlaceOrder}>
                                        {/* Saved Addresses */}
                                        <SavedAddresses
                                            selectedId={selectedAddress}
                                            onSelect={(addr) => {
                                                setSelectedAddress(addr);
                                                if (addr) { setAddress(addr.full_address); setPhone(addr.phone); }
                                            }}
                                        />
                                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ color: 'var(--secondary)', fontWeight: 800, marginBottom: '0.75rem', display: 'block' }}>Or Enter Address Manually</label>
                                            <textarea
                                                required
                                                rows="3"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="Full delivery address..."
                                                style={{ borderRadius: '14px', padding: '1rem', fontSize: '1rem', border: '1px solid var(--border-light)', background: 'var(--bg-app)', lineHeight: 1.6 }}
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                                            <label style={{ color: 'var(--secondary)', fontWeight: 800, marginBottom: '0.75rem', display: 'block' }}>Phone Number</label>
                                            <input
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                placeholder="98XXXXXXXX"
                                                style={{ borderRadius: '14px', padding: '1rem', width: '100%', fontSize: '1rem', border: '1px solid var(--border-light)', background: 'var(--bg-app)' }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.75rem', background: 'var(--primary-subtle)', borderRadius: '18px', border: '1px solid var(--primary-light)' }}>
                                            <div style={{ background: 'var(--primary)', color: '#fff', padding: '0.75rem', borderRadius: '12px' }}>
                                                <CreditCard size={24} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, color: 'var(--primary)', fontWeight: 800 }}>Payment Method</h4>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Cash on Delivery (COD) - Pay when you receive.</p>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>

                        {/* Right Side: Summary Card */}
                        <div style={{ 
                            background: 'var(--bg-card)', borderRadius: '24px', padding: '2.5rem', 
                            border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-md)',
                            position: 'sticky', top: '120px'
                        }}>
                            <h2 style={{ marginBottom: '1.5rem' }}>Summary</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                    <span>Subtotal</span>
                                    <span>NPR {totalPrice.toLocaleString()}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                                    <span>Shipping</span>
                                    <span style={{ color: 'var(--success)', fontWeight: 700 }}>FREE</span>
                                </div>
                                <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)' }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 900 }}>
                                    <span>Total</span>
                                    <span style={{ color: 'var(--primary)' }}>NPR {totalPrice.toLocaleString()}</span>
                                </div>
                            </div>

                            {step === 1 ? (
                                <button 
                                    onClick={() => setStep(2)}
                                    className="btn-primary" 
                                    style={{ width: '100%', justifyContent: 'center', padding: '1.25rem', borderRadius: '16px' }}
                                >
                                    Proceed to Checkout <ArrowRight size={20} />
                                </button>
                            ) : (
                                <button 
                                    onClick={handlePlaceOrder}
                                    disabled={!address || isPlacingOrder}
                                    className="btn-primary" 
                                    style={{ width: '100%', justifyContent: 'center', padding: '1.25rem', borderRadius: '16px', opacity: isPlacingOrder || !address ? 0.7 : 1 }}
                                >
                                    {isPlacingOrder ? 'Processing...' : 'Place Order'}
                                </button>
                            )}
                            
                            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
                                Prices include VAT where applicable. Secure checkout provided by Smart Plant Health.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Cart;
