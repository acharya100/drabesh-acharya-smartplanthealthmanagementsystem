import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProductReviews from "../components/ProductReviews";
import { eCommerceService } from "../services/api";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import {
    ShoppingCart, Search, Filter, ShoppingBag, Star, X, Info,
    ShieldCheck, Truck, RotateCcw, Trash2, Edit2, Plus, Save,
    CheckCircle, AlertCircle, Heart, ArrowUpDown, Leaf
} from "lucide-react";

const EMPTY_FORM = {
    name: "", name_ne: "", description: "", description_ne: "", price: "", discount_price: "",
    stock: "", sku: "", tags: "", usage_instructions: "", usage_instructions_ne: "",
    is_featured: false, is_organic: false, is_active: true, category: ""
};

const Ecommerce = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const { addToCart, totalItems } = useCart();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [wishlistIds, setWishlistIds] = useState(new Set());

    // Admin state
    const isAdmin = sessionStorage.getItem("is_staff") === "true" || sessionStorage.getItem("is_superuser") === "true";
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [productForm, setProductForm] = useState(EMPTY_FORM);
    const [productImage, setProductImage] = useState(null);
    const [savingProduct, setSavingProduct] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deletingProduct, setDeletingProduct] = useState(false);
    const [adminToast, setAdminToast] = useState(null);

    useEffect(() => { loadData(); loadWishlist(); }, []);

    const loadData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            const [prodRes, catRes] = await Promise.all([
                eCommerceService.getProducts(),
                eCommerceService.getCategories()
            ]);
            setProducts(prodRes.data.results || prodRes.data);
            setCategories(catRes.data.results || catRes.data);
            
            if (!silent) setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error("Error loading shop data:", error);
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadWishlist = async () => {
        try {
            const { data } = await eCommerceService.getWishlistIds();
            setWishlistIds(new Set(data.product_ids || []));
        } catch (e) { console.error("Wishlist load error:", e); }
    };

    const toggleWishlist = async (productId) => {
        try {
            await eCommerceService.toggleWishlist(productId);
            setWishlistIds(prev => {
                const next = new Set(prev);
                if (next.has(productId)) next.delete(productId);
                else next.add(productId);
                return next;
            });
        } catch (e) { console.error("Wishlist toggle error:", e); }
    };

    const showToast = (msg, type = "success") => {
        setAdminToast({ msg, type });
        setTimeout(() => setAdminToast(null), 3200);
    };

    // ── Admin CRUD ────────────────────────────────────────────────
    const openAddForm = () => {
        setEditingProduct(null);
        setProductForm(EMPTY_FORM);
        setProductImage(null);
        setShowProductForm(true);
    };

    const openEditForm = (product) => {
        setEditingProduct(product);
        setProductForm({
            name: product.name || "",
            name_ne: product.name_ne || "",
            description: product.description || "",
            description_ne: product.description_ne || "",
            price: product.price || "",
            discount_price: product.discount_price || "",
            stock: product.stock || "",
            sku: product.sku || "",
            tags: product.tags || "",
            usage_instructions: product.usage_instructions || "",
            usage_instructions_ne: product.usage_instructions_ne || "",
            is_featured: product.is_featured || false,
            is_organic: product.is_organic || false,
            is_active: product.is_active !== false,
            category: product.category || "",
        });
        setProductImage(null);
        setShowProductForm(true);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        setSavingProduct(true);
        try {
            const fd = new FormData();
            Object.entries(productForm).forEach(([k, v]) => {
                if (v !== "" && v !== null && v !== undefined) fd.append(k, v);
            });
            if (productImage) fd.append("image", productImage);

            if (editingProduct) {
                await api.patch(`/ecommerce/products/${editingProduct.id}/`, fd, { headers: { "Content-Type": "multipart/form-data" } });
            } else {
                await api.post("/ecommerce/products/", fd, { headers: { "Content-Type": "multipart/form-data" } });
            }
            showToast(t("store.productSaved"), "success");
            setShowProductForm(false);
            loadData(true); // silent
        } catch (err) {
            showToast(err.response?.data?.detail || "Failed to save product.", "error");
        } finally {
            setSavingProduct(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!deleteTarget) return;
        setDeletingProduct(true);
        try {
            await api.delete(`/ecommerce/products/${deleteTarget.id}/`);
            showToast(t("store.productDeleted"), "success");
            setDeleteTarget(null);
            loadData(true); // silent
        } catch (err) {
            showToast("Failed to delete product.", "error");
        } finally {
            setDeletingProduct(false);
        }
    };

    // ── Filtering & Sorting ────────────────────────────────────────
    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === "all" || p.category === parseInt(selectedCategory);
        return matchesSearch && matchesCategory;
    }).sort((a, b) => {
        if (sortBy === "price_low") return parseFloat(a.effective_price || a.price) - parseFloat(b.effective_price || b.price);
        if (sortBy === "price_high") return parseFloat(b.effective_price || b.price) - parseFloat(a.effective_price || a.price);
        if (sortBy === "rating") return (b.average_rating || 0) - (a.average_rating || 0);
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return 0; // newest — default API order
    });

    const categoriesList = [
        { id: "all", name: t("store.allProductsLabel"), icon: <ShoppingBag size={18} /> },
        ...categories.map(c => ({ id: c.id.toString(), name: c.name, icon: <Filter size={18} /> }))
    ];

    const imgUrl = (img) => img
        ? (img.startsWith("http") ? img : `http://localhost:8000${img}`)
        : "https://via.placeholder.com/300x200";

    // ── Field helper ──────────────────────────────────────────────
    const fieldStyle = {
        width: "100%", padding: "0.7rem 0.875rem", borderRadius: 10,
        border: "1px solid var(--border-light)", background: "var(--bg-main)",
        color: "var(--text-main)", fontSize: "0.9rem", boxSizing: "border-box",
        fontFamily: "inherit", outline: "none"
    };

    return (
        <div className="page-container">
            <Navbar activePage="store" />
            <div className="page-content animate-slide-up" style={{ padding: "2rem 3rem" }}>

                {/* Admin Toast */}
                {adminToast && (
                    <div style={{
                        position: "fixed", top: "5.5rem", right: "2rem", zIndex: 9999,
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.875rem 1.25rem", borderRadius: 14,
                        background: adminToast.type === "success" ? "#d1fae5" : "#fef2f2",
                        border: `1px solid ${adminToast.type === "success" ? "#6ee7b7" : "#fca5a5"}`,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)", color: adminToast.type === "success" ? "#059669" : "#dc2626",
                        fontWeight: 700, fontSize: "0.9rem", minWidth: 260
                    }}>
                        {adminToast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {adminToast.msg}
                    </div>
                )}

                {/* Store Hero — ALL text uses t() */}
                <div style={{
                    background: "linear-gradient(135deg, #065f46, #064e3b)", borderRadius: 30,
                    padding: "4rem 3rem", color: "#fff", marginBottom: "3rem",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    position: "relative", overflow: "hidden", boxShadow: "0 20px 40px rgba(6,78,59,0.15)"
                }}>
                    <div style={{ position: "relative", zIndex: 2 }}>
                        <span className="badge" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", marginBottom: "1rem", display: "inline-block" }}>
                            {t("store.heroBadge")}
                        </span>
                        <h1 style={{ fontSize: "3.5rem", color: "#fff", margin: "0 0 1rem 0", fontWeight: 900 }}>
                            {t("store.heroTitle")} <span style={{ color: "#6ee7b7" }}>{t("store.heroHighlight")}</span>
                        </h1>
                        <p style={{ fontSize: "1.2rem", opacity: 0.9, maxWidth: 500 }}>
                            {t("store.heroDesc")}
                        </p>
                    </div>
                    <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "flex-end" }}>
                        {isAdmin && (
                            <button onClick={openAddForm} style={{
                                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)",
                                color: "#fff", padding: "0.75rem 1.5rem", borderRadius: 14, fontWeight: 800,
                                display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer",
                                backdropFilter: "blur(8px)", fontSize: "0.9rem", transition: "all 0.2s"
                            }}>
                                <Plus size={18} /> {t("store.addProduct")}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Admin Toolbar (sticky, always visible for admins) ── */}
                {isAdmin && (
                    <div style={{
                        position: "sticky", top: 0, zIndex: 100,
                        display: "flex", alignItems: "center", gap: "1rem",
                        padding: "0.875rem 1.5rem",
                        background: "linear-gradient(135deg,#065f46,#047857)",
                        borderRadius: 16, marginBottom: "1.5rem",
                        boxShadow: "0 4px 20px rgba(6,95,70,0.35)",
                    }}>
                        <ShieldCheck size={22} color="#6ee7b7" />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 900, color: "#fff", fontSize: "0.92rem" }}>
                                🛡️ Admin Mode — Product Management
                            </div>
                            <div style={{ color: "#a7f3d0", fontSize: "0.78rem", fontWeight: 600 }}>
                                Each product card has ✏️ Edit and 🗑️ Delete buttons below the cart button
                            </div>
                        </div>
                        <button onClick={openAddForm} style={{
                            display: "flex", alignItems: "center", gap: "0.5rem",
                            padding: "0.7rem 1.4rem", background: "#fff", color: "#065f46",
                            border: "none", borderRadius: 12, fontWeight: 900, cursor: "pointer",
                            fontSize: "0.88rem", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                            transition: "all 0.2s", whiteSpace: "nowrap",
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = "#d1fae5"}
                            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                        >
                            <Plus size={18} /> Add New Product
                        </button>
                    </div>
                )}

                <div className="store-layout" style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "3rem" }}>

                    {/* Sidebar */}
                    <aside className="store-sidebar">
                        <div className="sidebar-section" style={{ marginBottom: "2.5rem" }}>
                            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <Filter size={20} className="text-primary" /> {t("store.categoriesLabel")}
                            </h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                {categoriesList.map(cat => (
                                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className="category-btn" style={{
                                        display: "flex", alignItems: "center", gap: "1rem",
                                        padding: "1rem 1.25rem", borderRadius: 14, border: "none",
                                        background: selectedCategory === cat.id ? "var(--primary-subtle)" : "transparent",
                                        color: selectedCategory === cat.id ? "var(--primary)" : "var(--text-muted)",
                                        fontWeight: selectedCategory === cat.id ? 800 : 600,
                                        cursor: "pointer", transition: "all 0.2s", textAlign: "left"
                                    }}>
                                        {cat.icon} {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ background: "var(--bg-card)", padding: "1.5rem", borderRadius: 20, border: "1px solid var(--border-light)" }}>
                            <ShieldCheck size={32} className="text-primary" style={{ marginBottom: "1rem" }} />
                            <h4 style={{ marginBottom: "0.5rem", color: "var(--text-main)" }}>{t("store.qualityGuaranteed")}</h4>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{t("store.qualityDesc")}</p>
                        </div>
                    </aside>

                    {/* Main grid */}
                    <div className="store-main">
                        <div style={{ display: "flex", gap: "1rem", marginBottom: "2.5rem", alignItems: "center" }}>
                            <div style={{ flex: 1, position: "relative" }}>
                                <Search size={22} style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input type="text" placeholder={t("store.searchPlaceholder")} value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{ paddingLeft: "3.5rem", height: 56, borderRadius: 14, fontSize: "1rem", background: "var(--bg-card)", border: "1px solid var(--border-light)", width: "100%", color: "var(--text-main)" }} />
                            </div>
                            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <ArrowUpDown size={16} color="var(--text-muted)" />
                                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ height: 56, padding: "0 2.5rem 0 1rem", borderRadius: 14, border: "1px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer", appearance: "auto" }}>
                                    <option value="newest">Newest First</option>
                                    <option value="price_low">Price: Low → High</option>
                                    <option value="price_high">Price: High → Low</option>
                                    <option value="rating">Top Rated</option>
                                    <option value="name">Name A-Z</option>
                                </select>
                            </div>
                            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 700, whiteSpace: "nowrap" }}>
                                {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading-spinner-container">
                                <div className="spinner"></div>
                                <p style={{ color: "var(--text-muted)" }}>{t("store.loadingMarketplace")}</p>
                            </div>
                        ) : (
                            <div className="product-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "2rem" }}>
                                {filteredProducts.length > 0 ? filteredProducts.map(product => (
                                    <div key={product.id} className="professional-card product-card" style={{
                                        background: "var(--bg-card)", border: "1px solid var(--border-light)",
                                        display: "flex", flexDirection: "column", gap: 0, padding: 0, overflow: "hidden", position: "relative"
                                    }}>
                                        {/* Admin action buttons */}
                                        {isAdmin && (
                                            <div style={{
                                                position: "absolute", top: "0.6rem", left: "0.6rem", zIndex: 20,
                                                display: "flex", gap: "0.35rem"
                                            }}>
                                                <button
                                                    onClick={e => { e.stopPropagation(); openEditForm(product); }}
                                                    title={t("store.editProduct")}
                                                    style={{
                                                        width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                                                        background: "rgba(59,130,246,0.9)", color: "#fff",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        backdropFilter: "blur(4px)", boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
                                                    }}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={e => { e.stopPropagation(); setDeleteTarget(product); }}
                                                    title={t("store.deleteProduct")}
                                                    style={{
                                                        width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                                                        background: "rgba(239,68,68,0.9)", color: "#fff",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        backdropFilter: "blur(4px)", boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
                                                    }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}

                                        {/* Product image */}
                                        <div style={{ width: "100%", height: 240, background: "var(--bg-surface-2)", position: "relative", cursor: "pointer" }}
                                            onClick={() => navigate(`/store/product/${product.id}`)}>
                                            <img src={imgUrl(product.image)} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            {/* Price badge */}
                                            <div style={{ position: "absolute", top: "1rem", right: "1rem", background: "var(--bg-card)", padding: "0.5rem 1rem", borderRadius: 12, fontWeight: 900, boxShadow: "var(--shadow-lg)", border: "1px solid var(--border-light)", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                                <span style={{ color: "var(--primary)" }}>Rs. {parseFloat(product.effective_price || product.price).toLocaleString()}</span>
                                                {product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price) && (
                                                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textDecoration: "line-through" }}>Rs. {parseFloat(product.price).toLocaleString()}</span>
                                                )}
                                            </div>
                                            {/* Badges */}
                                            <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                                {product.is_featured && <span style={{ background: "#f59e0b", color: "white", padding: "0.15rem 0.5rem", borderRadius: 100, fontSize: "0.65rem", fontWeight: 800 }}>⭐ FEATURED</span>}
                                                {product.is_organic && <span style={{ background: "var(--primary)", color: "white", padding: "0.15rem 0.5rem", borderRadius: 100, fontSize: "0.65rem", fontWeight: 800 }}>🌿 ORGANIC</span>}
                                                {product.discount_price && parseFloat(product.discount_price) < parseFloat(product.price) && <span style={{ background: "#ef4444", color: "white", padding: "0.15rem 0.5rem", borderRadius: 100, fontSize: "0.65rem", fontWeight: 800 }}>SALE</span>}
                                            </div>
                                            <div className="quick-view-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s", color: "#fff", fontWeight: 800, gap: "0.5rem" }}>
                                                <Info size={20} /> {t("store.quickView")}
                                            </div>
                                        </div>

                                        {/* Card body */}
                                        <div style={{ padding: "1.5rem", flex: 1, display: "flex", flexDirection: "column" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                                                <div style={{ display: "flex", gap: "0.2rem" }}>
                                                    {[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < Math.round(product.average_rating || 4) ? "#f59e0b" : "none"} color="#f59e0b" />)}
                                                </div>
                                                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: product.stock > 0 ? "var(--success)" : "#ef4444" }}>
                                                    {product.stock > 0 ? t("store.inStock") : t("store.outOfStock")}
                                                </span>
                                            </div>
                                            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", fontWeight: 900, color: "var(--text-main)" }}>
                                                {(t.language === 'ne' && product.name_ne) ? product.name_ne : product.name}
                                            </h3>
                                            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: "1.5rem", lineHeight: 1.6 }}>
                                                {(t.language === 'ne' && product.description_ne) ? product.description_ne : product.description}
                                            </p>
                                            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                                <button onClick={() => addToCart(product)} disabled={product.stock === 0}
                                                    className="btn-primary"
                                                    style={{ width: "100%", justifyContent: "center", borderRadius: 14, padding: "1.1rem" }}>
                                                    <ShoppingCart size={18} /> {t("store.addToCart")}
                                                </button>
                                                <button onClick={() => toggleWishlist(product.id)}
                                                    style={{
                                                        width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                                                        padding: "0.85rem", borderRadius: 14, cursor: "pointer", fontWeight: 700, fontSize: "0.9rem",
                                                        border: wishlistIds.has(product.id) ? "1px solid #ef4444" : "1px solid var(--border-light)",
                                                        background: wishlistIds.has(product.id) ? "#fef2f2" : "var(--bg-main)",
                                                        color: wishlistIds.has(product.id) ? "#ef4444" : "var(--text-muted)",
                                                        transition: "all 0.2s"
                                                    }}>
                                                    <Heart size={16} fill={wishlistIds.has(product.id) ? "#ef4444" : "none"} />
                                                    {wishlistIds.has(product.id) ? t("store.inWishlist") : t("store.addToWishlist")}
                                                </button>
                                                {/* ── Admin Action Bar (always visible to admin) ── */}
                                                {isAdmin && (
                                                    <div style={{
                                                        display: "flex", gap: "0.4rem", marginTop: "0.35rem",
                                                        paddingTop: "0.75rem", borderTop: "1px solid var(--border-light)"
                                                    }}>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); openEditForm(product); }}
                                                            style={{
                                                                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                                                                gap: "0.35rem", padding: "0.6rem 0.5rem", borderRadius: 10,
                                                                background: "#eff6ff", color: "#2563eb",
                                                                border: "1px solid #bfdbfe", cursor: "pointer",
                                                                fontWeight: 800, fontSize: "0.78rem", transition: "all 0.2s",
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = "#dbeafe"}
                                                            onMouseLeave={e => e.currentTarget.style.background = "#eff6ff"}
                                                        >
                                                            <Edit2 size={13} /> Edit
                                                        </button>
                                                        <button
                                                            onClick={e => { e.stopPropagation(); setDeleteTarget(product); }}
                                                            style={{
                                                                flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                                                                gap: "0.35rem", padding: "0.6rem 0.5rem", borderRadius: 10,
                                                                background: "#fef2f2", color: "#dc2626",
                                                                border: "1px solid #fca5a5", cursor: "pointer",
                                                                fontWeight: 800, fontSize: "0.78rem", transition: "all 0.2s",
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                                                            onMouseLeave={e => e.currentTarget.style.background = "#fef2f2"}
                                                        >
                                                            <Trash2 size={13} /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "5rem", background: "var(--primary-subtle)", borderRadius: 30, border: "1px dashed var(--primary-light)" }}>
                                        <ShoppingBag size={64} style={{ color: "var(--primary)", marginBottom: "1.5rem", opacity: 0.5 }} />
                                        <h2 style={{ color: "var(--text-main)" }}>{t("store.noProductsFound")}</h2>
                                        <p style={{ color: "var(--text-muted)" }}>{t("store.noProductsDesc")}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Quick View Modal ─────────────────────────────────────── */}
                {quickViewProduct && (
                    <div className="modal-overlay" style={{ zIndex: 2000 }}>
                        <div className="modal-content animate-scale-up" style={{ maxWidth: 1000, padding: 0, overflow: "auto", maxHeight: "90vh" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                                {/* Left: image */}
                                <div style={{ position: "relative", minHeight: 350 }}>
                                    <img src={imgUrl(quickViewProduct.image)} alt={quickViewProduct.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    <button onClick={() => setQuickViewProduct(null)} style={{ position: "absolute", top: "1.5rem", left: "1.5rem", background: "rgba(0,0,0,0.55)", color: "#fff", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                        <X size={20} />
                                    </button>
                                </div>
                                {/* Right: info */}
                                <div style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "var(--bg-card)", color: "var(--text-main)" }}>
                                    <div>
                                        <h2 style={{ fontSize: "2rem", fontWeight: 900, marginBottom: "0.5rem", color: "var(--text-main)" }}>{(t.language === 'ne' && quickViewProduct.name_ne) ? quickViewProduct.name_ne : quickViewProduct.name}</h2>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                            <div style={{ display: "flex", gap: "0.2rem", fontSize: "1.2rem", color: "#f59e0b" }}>
                                                {[1, 2, 3, 4, 5].map(s => <span key={s}>{s <= Math.round(quickViewProduct.average_rating || 0) ? "★" : "☆"}</span>)}
                                            </div>
                                            <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                                {quickViewProduct.average_rating || 0} ({quickViewProduct.review_count || 0} {t("store.reviews")})
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: "2rem", fontWeight: 900, color: "var(--primary)" }}>
                                        Rs. {parseFloat(quickViewProduct.price).toLocaleString()}
                                    </div>
                                    <p style={{ color: "var(--text-secondary)", lineHeight: 1.8 }}>{(t.language === 'ne' && quickViewProduct.description_ne) ? quickViewProduct.description_ne : quickViewProduct.description}</p>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)", padding: "0.6rem 0.75rem", background: "var(--bg-main)", borderRadius: 10, border: "1px solid var(--border-light)" }}>
                                            <Truck size={16} color="var(--primary)" /> {t("store.freeShipping")}
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)", padding: "0.6rem 0.75rem", background: "var(--bg-main)", borderRadius: 10, border: "1px solid var(--border-light)" }}>
                                            <RotateCcw size={16} color="var(--primary)" /> {t("store.returns30Days")}
                                        </div>
                                    </div>
                                    <button onClick={() => { addToCart(quickViewProduct); setQuickViewProduct(null); }}
                                        className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "1rem", borderRadius: 14 }}>
                                        <ShoppingCart size={18} /> {t("store.addToCart")}
                                    </button>
                                    {isAdmin && (
                                        <div style={{ display: "flex", gap: "0.75rem" }}>
                                            <button onClick={() => { setQuickViewProduct(null); openEditForm(quickViewProduct); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.7rem", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
                                                <Edit2 size={15} /> {t("store.editProduct")}
                                            </button>
                                            <button onClick={() => { setQuickViewProduct(null); setDeleteTarget(quickViewProduct); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.7rem", background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }}>
                                                <Trash2 size={15} /> {t("store.deleteProduct")}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Reviews */}
                            <div style={{ padding: "2rem", borderTop: "1px solid var(--border-light)", background: "var(--bg-card)" }}>
                                <ProductReviews productId={quickViewProduct.id} productName={quickViewProduct.name} />
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Delete Confirm Modal ──────────────────────────────────── */}
                {deleteTarget && (
                    <div className="modal-overlay" style={{ zIndex: 3000 }}>
                        <div className="modal-content animate-scale-up" style={{ maxWidth: 440, textAlign: "center", padding: "2.5rem" }}>
                            <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#fef2f2", border: "1px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                                <Trash2 size={26} color="#dc2626" />
                            </div>
                            <h3 style={{ fontWeight: 900, marginBottom: "0.75rem", color: "var(--text-main)" }}>{t("store.deleteProduct")}?</h3>
                            <p style={{ color: "var(--text-muted)", marginBottom: "0.5rem" }}>{t("store.confirmDeleteProduct")}</p>
                            <p style={{ fontWeight: 800, color: "var(--text-main)", marginBottom: "2rem" }}>"{deleteTarget.name}"</p>
                            <div style={{ display: "flex", gap: "1rem" }}>
                                <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: "0.875rem", borderRadius: 12, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-muted)", cursor: "pointer", fontWeight: 700 }}>
                                    Cancel
                                </button>
                                <button onClick={handleDeleteProduct} disabled={deletingProduct} style={{ flex: 1, padding: "0.875rem", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", cursor: "pointer", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                    <Trash2 size={16} /> {deletingProduct ? "..." : t("store.deleteProduct")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Product Form Modal ────────────────────────────────────── */}
                {showProductForm && (
                    <div className="modal-overlay" style={{ zIndex: 3000 }}>
                        <div className="modal-content animate-scale-up" style={{ maxWidth: 680, padding: "2.5rem", maxHeight: "90vh", overflowY: "auto" }}>
                            {/* Header */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
                                <div>
                                    <h2 style={{ fontWeight: 900, margin: 0, color: "var(--text-main)" }}>
                                        {editingProduct ? t("store.editProductTitle") : t("store.addProductTitle")}
                                    </h2>
                                    <p style={{ margin: "0.25rem 0 0", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                                        {editingProduct ? editingProduct.name : ""}
                                    </p>
                                </div>
                                <button onClick={() => setShowProductForm(false)} style={{ width: 36, height: 36, borderRadius: "50%", border: "1px solid var(--border-light)", background: "var(--bg-main)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSaveProduct}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                                    <div>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product Name (English) *</label>
                                        <input required style={fieldStyle} value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Copper Fungicide Spray" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product Name (Nepali)</label>
                                        <input style={fieldStyle} value={productForm.name_ne} onChange={e => setProductForm(p => ({ ...p, name_ne: e.target.value }))} placeholder="उदाहरण: कपर फन्जिसाइड स्प्रे" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</label>
                                        <select style={fieldStyle} value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}>
                                            <option value="">-- Select Category --</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>SKU</label>
                                        <input style={fieldStyle} value={productForm.sku} onChange={e => setProductForm(p => ({ ...p, sku: e.target.value }))} placeholder="e.g. FNG-COP-001" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Price (Rs.) *</label>
                                        <input required type="number" style={fieldStyle} value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} placeholder="850" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Discount Price</label>
                                        <input type="number" style={fieldStyle} value={productForm.discount_price} onChange={e => setProductForm(p => ({ ...p, discount_price: e.target.value }))} placeholder="Optional" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Stock *</label>
                                        <input required type="number" style={fieldStyle} value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))} placeholder="100" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description (English) *</label>
                                        <textarea required rows={3} style={{ ...fieldStyle, resize: "vertical" }} value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the product..." />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description (Nepali)</label>
                                        <textarea rows={3} style={{ ...fieldStyle, resize: "vertical" }} value={productForm.description_ne} onChange={e => setProductForm(p => ({ ...p, description_ne: e.target.value }))} placeholder="उत्पादनको विवरण..." />
                                    </div>
                                    <div style={{ gridColumn: "1/-1" }}>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tags (comma separated)</label>
                                        <input style={fieldStyle} value={productForm.tags} onChange={e => setProductForm(p => ({ ...p, tags: e.target.value }))} placeholder="organic,fertilizer,neem" />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Usage Instructions (English)</label>
                                        <textarea rows={2} style={{ ...fieldStyle, resize: "vertical" }} value={productForm.usage_instructions} onChange={e => setProductForm(p => ({ ...p, usage_instructions: e.target.value }))} placeholder="How to use this product..." />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Usage Instructions (Nepali)</label>
                                        <textarea rows={2} style={{ ...fieldStyle, resize: "vertical" }} value={productForm.usage_instructions_ne} onChange={e => setProductForm(p => ({ ...p, usage_instructions_ne: e.target.value }))} placeholder="प्रयोग गर्ने तरिका..." />
                                    </div>
                                    {/* Checkboxes */}
                                    <div style={{ display: "flex", gap: "1.5rem", gridColumn: "1/-1" }}>
                                        {[["is_featured", "⭐ Featured"], ["is_organic", "🌿 Organic"], ["is_active", "✅ Active"]].map(([key, label]) => (
                                            <label key={key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem", color: "var(--text-muted)" }}>
                                                <input type="checkbox" checked={productForm[key]} onChange={e => setProductForm(p => ({ ...p, [key]: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "var(--primary)" }} />
                                                {label}
                                            </label>
                                        ))}
                                    </div>
                                    {/* Image upload */}
                                    <div style={{ gridColumn: "1/-1" }}>
                                        <label style={{ display: "block", fontWeight: 700, fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product Image</label>
                                        <input type="file" accept="image/*" onChange={e => setProductImage(e.target.files[0])} style={{ ...fieldStyle }} />
                                        {editingProduct?.image && !productImage && (
                                            <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <img src={imgUrl(editingProduct.image)} alt="" style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8 }} />
                                                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Current image</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                                    <button type="button" onClick={() => setShowProductForm(false)} style={{ flex: 1, padding: "0.875rem", borderRadius: 12, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-muted)", cursor: "pointer", fontWeight: 700 }}>
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={savingProduct} className="btn-primary" style={{ flex: 2, padding: "0.875rem", justifyContent: "center", fontWeight: 800 }}>
                                        <Save size={17} /> {savingProduct ? t("store.saving") : (editingProduct ? t("store.editProduct") : t("store.addProduct"))}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .product-card:hover { transform: translateY(-8px); box-shadow: var(--shadow-xl); }
                .product-card:hover .quick-view-overlay { opacity: 1; }
                .category-btn:hover { background: var(--bg-surface-inner) !important; color: var(--primary) !important; }
            ` }} />
        </div>
    );
};

export default Ecommerce;
