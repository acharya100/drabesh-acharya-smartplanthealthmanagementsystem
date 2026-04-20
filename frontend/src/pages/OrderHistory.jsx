import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { eCommerceService } from "../services/api";
import { useCart } from "../context/CartContext";
import {
  Package, Clock, CheckCircle, Truck, ArrowRight, Calendar,
  Search, RefreshCw, X, AlertTriangle, ShoppingBag, ChevronDown, ChevronUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const STATUS_CONFIG = (t) => ({
  pending: { label: t("orders.status.pending"), color: "#f59e0b", bg: "#fef3c7", icon: Clock, step: 0 },
  processing: { label: t("orders.status.processing"), color: "#3b82f6", bg: "#eff6ff", icon: Package, step: 1 },
  shipped: { label: t("orders.status.shipped"), color: "#8b5cf6", bg: "#f5f3ff", icon: Truck, step: 2 },
  delivered: { label: t("orders.status.delivered"), color: "#10b981", bg: "#f0fdf4", icon: CheckCircle, step: 3 },
  cancelled: { label: t("orders.status.cancelled"), color: "#ef4444", bg: "#fef2f2", icon: X, step: -1 },
});

const TIMELINE_STEPS = (t) => [
  { key: "pending", label: t("orders.timeline.placed"), icon: Package },
  { key: "processing", label: t("orders.timeline.processing"), icon: Package },
  { key: "shipped", label: t("orders.timeline.shipped"), icon: Truck },
  { key: "delivered", label: t("orders.timeline.delivered"), icon: CheckCircle },
];

const OrderTimeline = ({ status, t }) => {
  const config = STATUS_CONFIG(t)[status] || {};
  const currentStep = config.step ?? 0;
  if (status === "cancelled") return null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0", marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-light)" }}>
      {TIMELINE_STEPS(t).map((tStep, i) => {
        const done = i <= currentStep;
        const Icon = tStep.icon;
        return (
          <div key={tStep.key} style={{ display: "flex", alignItems: "center", flex: i < TIMELINE_STEPS.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: done ? "var(--primary)" : "var(--bg-main)", border: `2px solid ${done ? "var(--primary)" : "var(--border-light)"}`, transition: "all 0.3s" }}>
                <Icon size={15} color={done ? "white" : "var(--text-muted)"} />
              </div>
              <span style={{ fontSize: "0.65rem", fontWeight: done ? 800 : 500, color: done ? "var(--primary)" : "var(--text-muted)", whiteSpace: "nowrap" }}>{tStep.label}</span>
            </div>
            {i < TIMELINE_STEPS.length - 1 && (
              <div style={{ flex: 1, height: "2px", background: i < currentStep ? "var(--primary)" : "var(--border-light)", margin: "0 8px 18px", transition: "all 0.3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
};

const OrderHistory = () => {
  const { t } = useLanguage();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [reorderedId, setReorderedId] = useState(null);

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const res = await eCommerceService.getOrders();
      setOrders(res.data.results || res.data);
      
      if (!silent) setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleReorder = (order) => {
    if (!order.items?.length) return;
    order.items.forEach(item => {
      addToCart({ id: item.product, name: item.product_name || "Product", price: parseFloat(item.price), image: item.product_image || "", quantity: 1 });
    });
    setReorderedId(order.id);
    setTimeout(() => setReorderedId(null), 3000);
  };

  const handleCancel = async (orderId) => {
    if (!window.confirm(t("orders.confirmCancel") || "Are you sure?")) return;
    setCancellingId(orderId);
    try {
      await eCommerceService.cancelOrder(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
    } catch (err) {
      alert(err.response?.data?.error || "Could not cancel order.");
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = orders.filter(o =>
    o.id.toString().includes(searchQuery) ||
    o.shipping_address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      <Navbar activePage="orders" />
      <div className="page-content animate-slide-up" style={{ padding: "2rem 3rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem" }}>
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: 0, fontWeight: 900, fontSize: "2rem", color: "var(--secondary)" }}>
              <Package size={28} color="var(--primary)" /> {t("orders.title")}
            </h1>
            <p style={{ margin: "0.5rem 0 0", color: "var(--text-muted)" }}>
                {orders.length === 1 ? t("orders.totalOrders", { count: orders.length }) : t("orders.totalOrdersPlural", { count: orders.length })}
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t("orders.searchPlaceholder")} style={{ paddingLeft: "40px", height: "40px", border: "1px solid var(--border-light)", borderRadius: "10px", background: "var(--bg-card)", color: "var(--text-main)", paddingRight: "1rem", minWidth: "220px" }} />
            </div>
            <button onClick={() => fetchOrders(true)} style={{ width: "40px", height: "40px", borderRadius: "10px", border: "1px solid var(--border-light)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title="Refresh">
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} color="var(--text-muted)" />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><div className="spinner"></div></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "6rem 2rem", background: "var(--bg-card)", borderRadius: "24px", border: "2px dashed var(--border-light)" }}>
            <ShoppingBag size={64} style={{ opacity: 0.2, marginBottom: "1.5rem" }} />
            <h2 style={{ color: "var(--secondary)", marginBottom: "1rem" }}>{searchQuery ? t("orders.noMatchingOrders") : t("orders.noOrdersTitle")}</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>{t("orders.noOrdersDesc")}</p>
            <Link to="/store" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>{t("wishlist.browseStore")} <ArrowRight size={18} /></Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {filtered.map(order => {
              const cfg = STATUS_CONFIG(t)[order.status] || STATUS_CONFIG(t).pending;
              const StatusIcon = cfg.icon;
              const isExpanded = expandedId === order.id;
              const canCancel = ["pending", "processing"].includes(order.status);

              return (
                <div key={order.id} className="professional-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", padding: "1.75rem" }}>
                  {/* Header Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.35rem" }}>
                        <h3 style={{ margin: 0, fontWeight: 900, fontSize: "1.1rem", color: "var(--text-main)" }}>{t("orders.orderNumber", { id: order.id })}</h3>
                        <span style={{ padding: "0.2rem 0.7rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800, background: cfg.bg, color: cfg.color, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                          <StatusIcon size={12} />{cfg.label}
                        </span>
                        {order.payment_status === "paid" && (
                          <span style={{ padding: "0.2rem 0.6rem", borderRadius: "100px", fontSize: "0.72rem", fontWeight: 800, background: "#f0fdf4", color: "#16a34a" }}>     {t("orders.payment.paid")}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "1.25rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Calendar size={13} />{new Date(order.created_at).toLocaleDateString(t.language === 'ne' ? "ne-NP" : "en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        <span>{order.items?.length || 0} {t("store.itemsLabel") || "items"}</span>
                        <span>{t(`orders.payment.${order.payment_method}`) || order.payment_method}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--primary)" }}>Rs. {parseFloat(order.total_amount).toLocaleString()}</div>
                      {parseFloat(order.discount_amount || 0) > 0 && (
                        <div style={{ fontSize: "0.78rem", color: "#22c55e", fontWeight: 700 }}>{t("orders.discount")}: -Rs. {parseFloat(order.discount_amount).toLocaleString()}</div>
                      )}
                    </div>
                  </div>

                  {/* Order Timeline */}
                  <OrderTimeline status={order.status} t={t} />

                  {/* Expand/Collapse Items */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    style={{ width: "100%", marginTop: "1rem", padding: "0.75rem", background: "var(--bg-main)", border: "1px solid var(--border-light)", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontWeight: 700, fontSize: "0.85rem", color: "var(--text-muted)", transition: "all 0.2s" }}
                  >
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {isExpanded ? t("orders.hideItems") : t("orders.showItems")}
                  </button>

                  {isExpanded && order.items?.length > 0 && (
                    <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "0.75rem", background: "var(--bg-main)", borderRadius: "12px" }}>
                          <img src={item.product_image ? (item.product_image.startsWith("http") ? item.product_image : `http://localhost:8000${item.product_image}`) : "https://via.placeholder.com/60"} alt={item.product_name} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "10px" }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 800, margin: 0, fontSize: "0.9rem" }}>
                                {(t.language === 'ne' && item.product_name_ne) ? item.product_name_ne : item.product_name}
                            </p>
                            <p style={{ color: "var(--text-muted)", margin: 0, fontSize: "0.8rem" }}>Qty: {item.quantity}    Rs. {parseFloat(item.price).toLocaleString()}</p>
                          </div>
                          <p style={{ fontWeight: 900, color: "var(--primary)", margin: 0 }}>Rs. {(parseFloat(item.price) * item.quantity).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "1rem", marginTop: "1.25rem" }}>
                    <button
                      onClick={() => handleReorder(order)}
                      className="btn-secondary"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.85rem" }}
                    >
                      <RefreshCw size={15} />
                      {reorderedId === order.id ? t("orders.reordered") : t("orders.reorder")}
                    </button>
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(order.id)}
                        disabled={cancellingId === order.id}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", fontSize: "0.85rem", padding: "0.6rem 1rem", borderRadius: "12px", border: "1px solid #fca5a5", background: "#fee2e2", color: "#ef4444", cursor: "pointer", fontWeight: 700 }}
                      >
                        {cancellingId === order.id ? <><AlertTriangle size={15} /> {t("orders.cancelling")}</> : <><X size={15} /> {t("orders.cancelOrder")}</>}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
