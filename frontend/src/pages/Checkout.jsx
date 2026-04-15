import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import { eCommerceService } from "../services/api";
import { useCart } from "../context/CartContext";
import SavedAddresses from "../components/SavedAddresses";
import {
  ShoppingCart, MapPin, Tag, CreditCard, CheckCircle,
  ChevronRight, ArrowLeft, Loader, AlertTriangle, Package
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const STEPS = [
  { label: "Cart Review", icon: ShoppingCart },
  { label: "Shipping", icon: MapPin },
  { label: "Coupon", icon: Tag },
  { label: "Payment", icon: CreditCard },
  { label: "Confirm", icon: CheckCircle },
];

const Checkout = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { cartItems, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [email, setEmail] = useState(sessionStorage.getItem("email") || "");
  const [phone, setPhone] = useState("");
  const [emailError, setEmailError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [notes, setNotes] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [error, setError] = useState("");

  const location = useLocation();
  const directBuyProduct = location.state?.directBuyProduct;

  // Use direct product if provided natively by the 'Buy Now' redirection, else fallback to standard cart
  const checkoutItems = directBuyProduct
    ? [{ ...directBuyProduct, quantity: 1, price: directBuyProduct.effective_price || directBuyProduct.price }]
    : cartItems;

  const checkoutTotal = directBuyProduct
    ? parseFloat(directBuyProduct.effective_price || directBuyProduct.price)
    : totalPrice;

  // Guard: only redirect on initial mount when cart is genuinely empty.
  // Using a ref prevents the redirect from firing again after an order is placed
  // (which clears the cart via clearCart()) or when the user presses browser back.
  const hasCheckedCart = useRef(false);
  useEffect(() => {
    if (!sessionStorage.getItem("access_token")) { navigate("/"); return; }
    if (!hasCheckedCart.current) {
      hasCheckedCart.current = true;
      if (checkoutItems.length === 0 && !placedOrder) {
        navigate("/cart");
      }
    }
    // If using Buy Now, jump to shipping step if no address is set yet
    if (directBuyProduct && !address && !selectedAddress) {
      setStep(0); // Start from step 0 (Cart Review) so shipping info is captured
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const discountAmount = couponInfo ? parseFloat(couponInfo.discount_amount) : 0;
  const finalTotal = checkoutTotal - discountAmount;



  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponInfo(null);
    try {
      const res = await eCommerceService.validateCoupon(couponCode, checkoutTotal);
      setCouponInfo(res.data);
    } catch (err) {
      setCouponError(err.response?.data?.error || "Invalid coupon code.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponInfo(null);
    setCouponError("");
  };

  const handlePlaceOrder = async () => {
    const shippingAddress = selectedAddress ? selectedAddress.full_address : address;
    if (!shippingAddress?.trim()) {
      setError("Please provide a shipping address.");
      setStep(1); // Auto-redirect to shipping step
      return;
    }
    // Validate email must match the logged-in user
    const sessionEmail = sessionStorage.getItem("email") || "";
    if (email.trim() && sessionEmail && email.trim().toLowerCase() !== sessionEmail.toLowerCase()) {
      setError("Email not registered. Please log in or create an account.");
      return;
    }
    setIsPlacingOrder(true);
    setError("");
    try {
      const payload = {
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        notes,
        total_amount: finalTotal.toFixed(2),
        discount_amount: discountAmount.toFixed(2),
        coupon_code: couponInfo?.code || "",
        items: checkoutItems.map(item => ({ product_id: item.id, quantity: item.quantity || 1 })),
      };
      const res = await eCommerceService.placeOrder(payload);
      setPlacedOrder(res.data);
      clearCart();
      setStep(4);
    } catch (err) {
      const errMsg = err.response?.data?.detail || err.response?.data?.shipping_address?.[0] || "Failed to place order. Please try again.";
      setError(errMsg);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Step 4: Confirmation
  if (step === 4 && placedOrder) {
    return (
      <div className="page-container">
        <Navbar activePage="store" />
        <div className="page-content animate-slide-up" style={{ padding: "4rem 3rem", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ width: "100px", height: "100px", background: "var(--primary-subtle)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 2rem" }}>
            <CheckCircle size={52} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--secondary)", marginBottom: "1rem" }}>Order Confirmed!</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "2rem", lineHeight: 1.7 }}>
            Your order <strong>#{placedOrder.id}</strong> has been placed successfully. We'll process it shortly and notify you once it's shipped.
          </p>
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "20px", padding: "2rem", textAlign: "left", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Order ID</span>
              <strong>#{placedOrder.id}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Total Paid</span>
              <strong style={{ color: "var(--primary)" }}>Rs. {parseFloat(placedOrder.total_amount).toLocaleString()}</strong>
            </div>
            {parseFloat(placedOrder.discount_amount) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <span style={{ color: "var(--text-muted)" }}>Discount Applied</span>
                <strong style={{ color: "#22c55e" }}>- Rs. {parseFloat(placedOrder.discount_amount).toLocaleString()}</strong>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Payment</span>
              <strong>{placedOrder.payment_method === "cod" ? "Cash on Delivery" : placedOrder.payment_method}</strong>
            </div>
          </div>

          <div style={{ background: "var(--info-subtle)", border: "1px solid var(--info)", borderRadius: "16px", padding: "1.5rem", textAlign: "left", marginBottom: "2rem" }}>
            <h4 style={{ color: "var(--info)", fontWeight: 800, margin: "0 0 0.5rem" }}>🔔 Notifications Sent</h4>
            {email?.trim() && <p style={{ margin: "0 0 0.25rem", color: "var(--info)", fontSize: "0.9rem", opacity: 0.9 }}>• Email receipt sent to: <strong>{email}</strong></p>}
            {(selectedAddress ? selectedAddress.phone : phone)?.trim() && <p style={{ margin: "0", color: "var(--info)", fontSize: "0.9rem", opacity: 0.9 }}>• SMS tracking link sent to: <strong>{selectedAddress ? selectedAddress.phone : phone}</strong></p>}
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <Link to="/orders" className="btn-primary" style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}>
              <Package size={18} /> Track Order
            </Link>
            <Link to="/store" className="btn-secondary" style={{ flex: 1, display: "flex", justifyContent: "center" }}>Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar activePage="store" />
      <div className="page-content animate-slide-up" style={{ padding: "2rem 3rem" }}>
        <h1 style={{ fontWeight: 900, fontSize: "2rem", color: "var(--secondary)", marginBottom: "2rem" }}>{t("store.checkoutTitle") || "Checkout"}</h1>

        {/* Step Indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", marginBottom: "3rem" }}>
          {STEPS.slice(0, 4).map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div
                onClick={() => { if (i < step) setStep(i); }}
                style={{
                  width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: i <= step ? "var(--primary)" : "var(--bg-card)",
                  border: `2px solid ${i <= step ? "var(--primary)" : "var(--border-light)"}`,
                  color: i <= step ? "white" : "var(--text-muted)",
                  fontWeight: 800, fontSize: "0.8rem", transition: "all 0.3s",
                  cursor: i < step ? "pointer" : "default"
                }}>
                <s.icon size={18} />
              </div>
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: i === step ? "var(--primary)" : "var(--text-muted)", marginLeft: "0.4rem", marginRight: "1.5rem", display: "none" }}>{s.label}</div>
              {i < 3 && <ChevronRight size={20} color="var(--border-light)" style={{ marginRight: "0.5rem" }} />}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "3rem" }}>
          {/* Main Content */}
          <div>
            {/* STEP 0: Cart Review */}
            {step === 0 && (
              <div>
                <h2 style={{ fontWeight: 800, marginBottom: "1.5rem" }}>{t("store.reviewItems") || "Review Items"}</h2>
                {checkoutItems.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "1rem", padding: "1.25rem", background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-light)", marginBottom: "1rem", alignItems: "center" }}>
                    <img
                      src={item.image ? (item.image.startsWith("http") ? item.image : `http://localhost:8000${item.image}`) : "https://via.placeholder.com/80"}
                      alt={item.name} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "12px" }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 800, margin: "0 0 0.25rem", color: "var(--text-main)" }}>{item.name}</p>
                      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>{t("store.qtyLabel") || "Qty"}: {item.quantity || 1}</p>
                    </div>
                    <p style={{ fontWeight: 900, color: "var(--primary)", margin: 0 }}>NPR {(parseFloat(item.price) * (item.quantity || 1)).toLocaleString()}</p>
                  </div>
                ))}
                <button onClick={() => setStep(1)} className="btn-primary" style={{ marginTop: "1.5rem", width: "100%", height: "52px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                  {t("store.continueToShipping") || "Continue to Shipping"} <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 1: Shipping */}
            {step === 1 && (
              <div>
                <h2 style={{ fontWeight: 800, marginBottom: "1.5rem" }}>{t("store.shippingAddress") || "Shipping Address"}</h2>
                <SavedAddresses onSelect={setSelectedAddress} selectedId={selectedAddress?.id} />
                <div style={{ marginTop: "1.5rem" }}>
                  <label style={{ display: "block", fontWeight: 700, marginBottom: "0.5rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>Or enter address manually</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} rows={3} style={{ width: "100%", padding: "0.75rem", borderRadius: "12px", border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", marginBottom: "1rem", resize: "none" }} placeholder="Street address, City, State" />

                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email Address</label>
                    <input
                      value={email}
                      onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                      type="email"
                      style={{ width: '100%', height: '48px', padding: '0 1rem', borderRadius: '12px', border: `1px solid ${emailError ? '#ef4444' : 'var(--border-light)'}`, background: 'var(--bg-main)', color: 'var(--text-main)' }}
                      placeholder="your@email.com"
                    />
                    {emailError && <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><AlertTriangle size={14} />{emailError}</p>}
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Must match your registered account email.</p>
                  </div>
                </div>
                {error && <p style={{ color: "#ef4444", marginTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}><AlertTriangle size={16} />{error}</p>}
                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                  <button onClick={() => setStep(0)} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><ArrowLeft size={16} /> {t("common.back") || "Back"}</button>
                  <button
                    onClick={() => {
                      const shippingAddr = selectedAddress ? selectedAddress.full_address : address;
                      if (!shippingAddr?.trim()) {
                        const msg = "Please provide a shipping address.";
                        setError(msg);
                        alert(msg);
                        return;
                      }
                      const sessionEmail = sessionStorage.getItem("email") || "";
                      if (!email.trim()) { setEmailError("Email is required for checkout."); return; }
                      if (sessionEmail && email.trim().toLowerCase() !== sessionEmail.toLowerCase()) {
                        setEmailError("Email not registered. Please log in or create an account."); return;
                      }
                      setEmailError(""); setError(""); setStep(2);
                    }}
                    className="btn-primary"
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
                  >
                    Continue <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Coupon */}
            {step === 2 && (
              <div>
                <h2 style={{ fontWeight: 800, marginBottom: "1.5rem" }}>{t("store.applyCoupon")}</h2>
                {couponInfo ? (
                  <div style={{ padding: "1.5rem", background: "var(--success-subtle)", border: "1px solid var(--success)", borderRadius: "16px", marginBottom: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontWeight: 800, color: "var(--success)", margin: 0 }}>✓ Coupon Applied: {couponInfo.code}</p>
                        <p style={{ color: "var(--success)", margin: "0.3rem 0 0", fontSize: "0.9rem", opacity: 0.9 }}>You saved NPR {parseFloat(couponInfo.discount_amount).toLocaleString()}!</p>
                      </div>
                      <button onClick={handleRemoveCoupon} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontWeight: 700, fontSize: "0.875rem" }}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                    <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Enter coupon code" style={{ flex: 1, height: "52px", padding: "0 1rem", borderRadius: "12px", border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", letterSpacing: "0.05em", fontWeight: 700 }} />
                    <button onClick={handleValidateCoupon} disabled={couponLoading} className="btn-primary" style={{ minWidth: "120px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                      {couponLoading ? <Loader size={18} className="animate-spin" /> : <><Tag size={16} /> Apply</>}
                    </button>
                  </div>
                )}
                {couponError && <p style={{ color: "#ef4444", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><AlertTriangle size={16} />{couponError}</p>}
                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                  <button onClick={() => setStep(1)} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><ArrowLeft size={16} /> Back</button>
                  <button onClick={() => setStep(3)} className="btn-primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>Continue <ChevronRight size={18} /></button>
                </div>
              </div>
            )}

            {/* STEP 3: Payment */}
            {step === 3 && (
              <div>
                <h2 style={{ fontWeight: 800, marginBottom: "1.5rem" }}>{t("store.paymentMethod")}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                  {[
                    { value: "cod", label: t("store.codLabel"), desc: t("orders.payment.cod") || "Pay when your order arrives", icon: "💵" },
                  ].map(m => (
                    <label key={m.value} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem", border: `2px solid ${paymentMethod === m.value ? "var(--primary)" : "var(--border-light)"}`, borderRadius: "16px", cursor: "pointer", background: paymentMethod === m.value ? "var(--primary-subtle)" : "var(--bg-card)", transition: "all 0.2s" }}>
                      <input type="radio" name="payment" value={m.value} checked={paymentMethod === m.value} onChange={() => setPaymentMethod(m.value)} style={{ display: "none" }} />
                      <span style={{ fontSize: "1.5rem" }}>{m.icon}</span>
                      <div>
                        <div style={{ fontWeight: 800, color: "var(--text-main)" }}>{m.label}</div>
                        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{m.desc}</div>
                      </div>
                      {paymentMethod === m.value && <CheckCircle size={20} color="var(--primary)" style={{ marginLeft: "auto" }} />}
                    </label>
                  ))}
                </div>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontWeight: 700, marginBottom: "0.5rem", fontSize: "0.875rem" }}>{t("store.orderNotes") || "Order Notes (optional)"}</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={{ width: "100%", padding: "0.75rem", borderRadius: "12px", border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", resize: "none" }} placeholder={t("store.orderNotesPlaceholder") || "Any special instructions for your order?"} />
                </div>
                {error && <p style={{ color: "#ef4444", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}><AlertTriangle size={16} />{error}</p>}
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button onClick={() => setStep(2)} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><ArrowLeft size={16} /> {t("orders.cancelBtn")}</button>
                  <button onClick={handlePlaceOrder} disabled={isPlacingOrder} className="btn-primary" style={{ flex: 1, height: "52px", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "var(--secondary)" }}>
                    {isPlacingOrder ? <><Loader size={18} className="animate-spin" /> {t("admin.loading")}</> : <><CheckCircle size={18} /> {t("store.placeOrderBtn")} — Rs. {finalTotal.toLocaleString()}</>}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div style={{ position: "sticky", top: "100px" }}>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: "24px", padding: "2rem" }}>
              <h3 style={{ fontWeight: 800, marginBottom: "1.5rem", margin: "0 0 1.5rem" }}>{t("store.orderSummary")}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {checkoutItems.map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                    <span style={{ color: "var(--text-muted)" }}>{item.name} × {item.quantity || 1}</span>
                    <span style={{ fontWeight: 700 }}>NPR {(parseFloat(item.price) * (item.quantity || 1)).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span>Subtotal</span><span>NPR {checkoutTotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#22c55e" }}>
                    <span>Discount</span><span>- NPR {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                  <span>Shipping</span><span style={{ color: "#22c55e" }}>Free</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: "1.1rem", marginTop: "0.5rem", borderTop: "1px solid var(--border-light)", paddingTop: "0.75rem" }}>
                  <span>Total</span><span style={{ color: "var(--primary)" }}>NPR {finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
