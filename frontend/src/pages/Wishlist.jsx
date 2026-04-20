import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { eCommerceService } from "../services/api";
import { useCart } from "../context/CartContext";
import { Heart, ShoppingCart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const Wishlist = () => {
    const { t } = useLanguage();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addedIds, setAddedIds] = useState({});

  useEffect(() => {
    if (!sessionStorage.getItem("access_token")) { navigate("/login"); return; }
    loadWishlist();
  }, [navigate]);

  const loadWishlist = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      const res = await eCommerceService.getWishlist();
      setItems(res.data.results || res.data);
      if (!silent) setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error("Failed to load wishlist:", err);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await eCommerceService.toggleWishlist(productId);
      setItems(prev => prev.filter(item => item.product.id !== productId));
    } catch (err) { console.error(err); }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedIds(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedIds(prev => ({ ...prev, [product.id]: false })), 2000);
  };

  return (
    <div className="page-container">
      <Navbar activePage="wishlist" />
      <div className="page-content animate-slide-up" style={{ padding: "2rem 3rem" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2.5rem" }}>
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: 0, fontSize: "2rem", fontWeight: 900, color: "var(--secondary)" }}>
              <Heart size={28} color="#ef4444" fill="#ef4444" /> {t("wishlist.title")}
            </h1>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
                {items.length === 1 ? t("wishlist.savedItems", { count: items.length }) : t("wishlist.savedItemsPlural", { count: items.length })}
            </p>
          </div>
          <Link to="/store" className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingBag size={18} /> {t("wishlist.continueShopping")}
          </Link>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
            <div className="spinner"></div>
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "6rem 2rem", background: "var(--bg-card)", borderRadius: "24px", border: "2px dashed var(--border-light)" }}>
            <Heart size={64} style={{ opacity: 0.2, marginBottom: "1.5rem" }} />
            <h2 style={{ color: "var(--secondary)", marginBottom: "1rem" }}>{t("wishlist.emptyTitle")}</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>{t("wishlist.emptyDesc")}</p>
            <Link to="/store" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
              {t("wishlist.browseStore")} <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "2rem" }}>
            {items.map(({ product, id: wishlistId }) => {
              const imgUrl = product.image
                ? (product.image.startsWith("http") ? product.image : `http://localhost:8000${product.image}`)
                : "https://via.placeholder.com/300x220";
              const price = parseFloat(product.discount_price || product.price);
              const hasDiscount = product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price);

              return (
                <div key={wishlistId} className="professional-card" style={{ background: "var(--bg-card)", border: "1px solid var(--border-light)", padding: 0, overflow: "hidden" }}>
                  {/* Image */}
                  <div style={{ position: "relative", height: "220px", background: "var(--bg-surface-2)" }}>
                    <img
                      src={imgUrl} alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }}
                      onClick={() => navigate(`/store/product/${product.id}`)}
                    />
                    {hasDiscount && (
                      <span style={{ position: "absolute", top: "0.75rem", left: "0.75rem", background: "#ef4444", color: "white", padding: "0.2rem 0.6rem", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 800 }}>SALE</span>
                    )}
                    {product.is_organic && (
                      <span style={{ position: "absolute", top: "0.75rem", right: "0.75rem", background: "var(--primary)", color: "white", padding: "0.2rem 0.6rem", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 800 }}>     ORGANIC</span>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding: "1.25rem" }}>
                    <h3
                      onClick={() => navigate(`/store/product/${product.id}`)}
                      style={{ margin: "0 0 0.4rem", fontWeight: 800, fontSize: "1rem", cursor: "pointer", color: "var(--text-main)" }}
                    >{(t.language === 'ne' && product.name_ne) ? product.name_ne : product.name}</h3>
                    <p style={{ margin: "0 0 0.25rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {(t.language === 'ne' && product.category_name_ne) ? product.category_name_ne : product.category_name}
                    </p>

                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", margin: "0.75rem 0" }}>
                      <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "var(--primary)" }}>NPR {price.toLocaleString()}</span>
                      {hasDiscount && <span style={{ color: "var(--text-muted)", textDecoration: "line-through", fontSize: "0.9rem" }}>NPR {parseFloat(product.price).toLocaleString()}</span>}
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem" }}>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="btn-primary"
                        style={{ flex: 1, padding: "0.6rem", fontSize: "0.85rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}
                      >
                        <ShoppingCart size={15} />
                        {addedIds[product.id] ? t("wishlist.addedToCart") : t("wishlist.addToCart")}
                      </button>
                      <button
                        onClick={() => handleRemove(product.id)}
                        style={{ width: "40px", height: "40px", border: "1px solid #fca5a5", background: "#fee2e2", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        title="Remove from Wishlist"
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </div>
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

export default Wishlist;
