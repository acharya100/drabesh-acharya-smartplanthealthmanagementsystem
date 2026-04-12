/**
 * Admin Panel - Full user activity monitoring for staff/admin users
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../services/api";
import {
    Users, Activity, Leaf, ShieldCheck, AlertTriangle,
    ChevronRight, ChevronLeft, Trash2, Eye, LogOut,
    TrendingUp, CheckCircle, XCircle, Crown, RefreshCw,
    BarChart2, Clock, Search, Package, ShoppingBag, Tag,
    Star, Store, Plus, Edit2, Save, X, ToggleLeft,
    ToggleRight, DollarSign, MoreVertical, ChevronDown,
    Moon, Sun, Globe
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

const AdminPanel = () => {
    const navigate = useNavigate();
    const { t, language, setLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [dashboardData, setDashboardData] = useState(null);
    const [users, setUsers] = useState([]);
    const [allPredictions, setAllPredictions] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetail, setUserDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [scanFilter, setScanFilter] = useState("all");
    const [previewImage, setPreviewImage] = useState(null);
    // E-Commerce state
    const [ecomOverview, setEcomOverview] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [orders, setOrders] = useState([]);
    const [coupons, setCoupons] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [productForm, setProductForm] = useState({ name: "", category: "", description: "", price: "", discount_price: "", stock: "", sku: "", tags: "", usage_instructions: "", is_featured: false, is_organic: false, is_active: true });
    const [couponForm, setCouponForm] = useState({ code: "", discount_type: "percentage", discount_value: "", min_order_amount: "0", max_uses: "", is_active: true, valid_until: "" });
    const [toast, setToast] = useState(null);

    const username = sessionStorage.getItem("username");
    const isSuperuser = sessionStorage.getItem("is_superuser") === "true";

    const [tabHistory, setTabHistory] = useState(["dashboard"]);

    // Guard: only admins can access this page
    useEffect(() => {
        const isStaff = sessionStorage.getItem("is_staff") === "true";
        const isSu = sessionStorage.getItem("is_superuser") === "true";
        if (!isStaff && !isSu) {
            navigate("/dashboard");
        }
    }, [navigate]);

    // ── Hash-based tab navigation (back/forward button support) ────────────────
    useEffect(() => {
        const hashTab = window.location.hash.replace("#", "");
        const validTabs = ["dashboard", "users", "predictions", "ecom-overview", "products", "orders", "coupons", "reviews", "user-detail"];
        if (hashTab && validTabs.includes(hashTab)) {
            setActiveTab(hashTab);
        }
    }, []);

    // When tab changes externally (browser back/fwd), sync state
    useEffect(() => {
        const handleHashChange = () => {
            const hashTab = window.location.hash.replace("#", "");
            const validTabs = ["dashboard", "users", "predictions", "ecom-overview", "products", "orders", "coupons", "reviews"];
            if (hashTab && validTabs.includes(hashTab)) {
                setActiveTab(hashTab);
                setSearchQuery("");
                setError("");
            } else if (!hashTab) {
                // No hash = user went back to base admin URL, so show dashboard
                setActiveTab("dashboard");
            }
        };
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, [navigate]);




    const fetchDashboard = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await adminService.getDashboard();
            setDashboardData(data);
        } catch (e) {
            setError(t("admin.errorLoadDashboard") || "Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    }, [t]);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await adminService.getUsers();
            setUsers(data);
        } catch (e) {
            setError(t("admin.errorLoadUsers") || "Failed to load users.");
        } finally {
            setLoading(false);
        }
    }, [t]);

    const fetchAllPredictions = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await adminService.getAllPredictions();
            setAllPredictions(data);
        } catch (e) {
            setError(t("admin.errorLoadPredictions") || "Failed to load predictions.");
        } finally {
            setLoading(false);
        }
    }, [t]);

    const fetchUserDetail = useCallback(async (userId) => {
        try {
            setLoading(true);
            const { data } = await adminService.getUserDetail(userId);
            setUserDetail(data);
        } catch (e) {
            setError(t("admin.errorLoadUser") || "Failed to load user details.");
        } finally {
            setLoading(false);
        }
    }, [t]);

    // ---- E-Commerce Fetch Handlers ----
    const fetchEcomOverview = useCallback(async () => {
        try { setLoading(true); const { data } = await adminService.getEcommerceOverview(); setEcomOverview(data); }
        catch (e) { setError("Failed to load e-commerce overview."); } finally { setLoading(false); }
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const [pRes, cRes] = await Promise.all([adminService.adminGetAllProducts(), adminService.adminGetCategories()]);
            setProducts(Array.isArray(pRes.data) ? pRes.data : (pRes.data.results || []));
            setCategories(Array.isArray(cRes.data) ? cRes.data : (cRes.data.results || []));
        } catch (e) { setError("Failed to load products."); } finally { setLoading(false); }
    }, []);

    const fetchOrders = useCallback(async () => {
        try { setLoading(true); const { data } = await adminService.adminGetAllOrders(); setOrders(Array.isArray(data) ? data : (data.results || [])); }
        catch (e) { setError("Failed to load orders."); } finally { setLoading(false); }
    }, []);

    const fetchCoupons = useCallback(async () => {
        try { setLoading(true); const { data } = await adminService.adminGetCoupons(); setCoupons(Array.isArray(data) ? data : (data.results || [])); }
        catch (e) { setError("Failed to load coupons."); } finally { setLoading(false); }
    }, []);

    const fetchReviews = useCallback(async () => {
        try { setLoading(true); const { data } = await adminService.adminGetAllReviews(); setReviews(Array.isArray(data) ? data : (data.results || [])); }
        catch (e) { setError("Failed to load reviews."); } finally { setLoading(false); }
    }, []);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (activeTab === "dashboard") { fetchDashboard(); fetchEcomOverview(); }
        else if (activeTab === "users") fetchUsers();
        else if (activeTab === "predictions") fetchAllPredictions();
        else if (activeTab === "ecom-overview") fetchEcomOverview();
        else if (activeTab === "products") fetchProducts();
        else if (activeTab === "orders") fetchOrders();
        else if (activeTab === "coupons") fetchCoupons();
        else if (activeTab === "reviews") fetchReviews();
    }, [activeTab, fetchDashboard, fetchUsers, fetchAllPredictions, fetchEcomOverview, fetchProducts, fetchOrders, fetchCoupons, fetchReviews]);

    const handleViewUser = (user) => {
        setSelectedUser(user);
        fetchUserDetail(user.id);
        setActiveTab("user-detail");
        window.location.hash = "user-detail";
    };

    const handleDeleteUser = async (userId) => {
        try {
            await adminService.deleteUser(userId);
            setConfirmDelete(null);
            setUsers(prev => prev.filter(u => u.id !== userId));
            if (activeTab === "user-detail") {
                setActiveTab("users");
                window.location.hash = "users";
                setUserDetail(null);
            }
        } catch (e) {
            setError(t("admin.errorDeleteUser") || "Failed to delete user.");
        }
    };

    const handleToggleStaff = async (userId) => {
        try {
            const { data } = await adminService.toggleStaff(userId);
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_staff: data.is_staff } : u));
            if (userDetail && userDetail.user.id === userId) {
                setUserDetail(prev => ({ ...prev, user: { ...prev.user, is_staff: data.is_staff } }));
            }
        } catch (e) {
            setError(e.response?.data?.error || t("admin.errorToggleStaff") || "Failed to toggle staff status.");
        }
    };

    const handleLogout = () => {
        sessionStorage.clear();
        navigate("/");
    };

    const formatDate = (iso) => {
        if (!iso) return "Never";
        return new Date(iso).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit"
        });
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPredictions = allPredictions.filter(p => {
        const matchesSearch = p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.disease.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = scanFilter === "all" || p.category === scanFilter;
        return matchesSearch && matchesCat;
    });

    const s = dashboardData?.stats;

    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-main)", fontFamily: "'Outfit', sans-serif" }}>
            {/* Sidebar + Main Layout */}
            <div style={{ display: "flex", minHeight: "100vh" }}>

                {/* Sidebar */}
                <aside style={{
                    width: "260px", flexShrink: 0,
                    background: "linear-gradient(180deg, #0f172a 0%, #1a2744 100%)",
                    display: "flex", flexDirection: "column",
                    borderRight: "1px solid rgba(255,255,255,0.07)",
                    position: "sticky", top: 0, height: "100vh", overflowY: "auto"
                }}>
                    {/* Logo */}
                    <div style={{ padding: "2rem 1.5rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                            <div style={{
                                width: 40, height: 40, borderRadius: 10,
                                background: "linear-gradient(135deg, #10b981, #059669)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.2rem"
                            }}>🌿</div>
                            <div>
                                <div style={{ color: "#fff", fontWeight: 800, fontSize: "0.95rem", lineHeight: 1.2 }}>{t("admin.title")}</div>
                                <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{t("admin.subtitle")}</div>
                            </div>
                        </div>
                        <div style={{
                            marginTop: "1rem", padding: "0.75rem 1rem",
                            background: "rgba(16,185,129,0.12)", borderRadius: 8,
                            border: "1px solid rgba(16,185,129,0.2)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <Crown size={14} color="#10b981" />
                                <span style={{ color: "#10b981", fontWeight: 700, fontSize: "0.8rem" }}>
                                    {isSuperuser ? t("admin.roleSuperuser") : t("admin.roleStaff")}
                                </span>
                            </div>
                            <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.2rem" }}>{username}</div>
                        </div>
                    </div>

                    {/* Nav Items */}
                    <nav style={{ flex: 1, padding: "0.75rem 0.75rem", overflowY: "auto" }}>
                        {/* Plant Management Group */}
                        <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.5rem 1rem 0.25rem" }}>{t("admin.sectionPlantSystem")}</div>
                        {[
                            { id: "dashboard", icon: <BarChart2 size={17} />, label: t("admin.tabDashboard") || "Dashboard" },
                            { id: "users", icon: <Users size={17} />, label: t("admin.tabUsers") || "Users" },
                            { id: "predictions", icon: <Activity size={17} />, label: t("admin.tabPredictions") || "Scan Logs" },
                        ].map(item => (
                            <button key={item.id} onClick={() => { window.location.hash = item.id; setActiveTab(item.id); setSearchQuery(""); setError(""); }}
                                style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 1rem", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: "0.15rem", textAlign: "left", fontSize: "0.85rem", fontWeight: 600, background: activeTab === item.id ? "rgba(16,185,129,0.15)" : "transparent", color: activeTab === item.id ? "#10b981" : "#94a3b8", transition: "all 0.2s ease" }}
                            >
                                {item.icon}{item.label}
                                {activeTab === item.id && <ChevronRight size={13} style={{ marginLeft: "auto" }} />}
                            </button>
                        ))}
                        {/* E-Commerce Group */}
                        <div style={{ fontSize: "0.65rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0.75rem 1rem 0.25rem", marginTop: "0.25rem" }}>{t("admin.sectionEcommerce")}</div>
                        {[
                            { id: "ecom-overview", icon: <Store size={17} />, label: t("admin.tabEcomOverview") },
                            { id: "products", icon: <ShoppingBag size={17} />, label: t("admin.tabProducts") },
                            { id: "orders", icon: <Package size={17} />, label: t("admin.tabOrders") },
                            { id: "coupons", icon: <Tag size={17} />, label: t("admin.tabCoupons") },
                            { id: "reviews", icon: <Star size={17} />, label: t("admin.tabReviews") },
                        ].map(item => (
                            <button key={item.id} onClick={() => { window.location.hash = item.id; setActiveTab(item.id); setSearchQuery(""); setError(""); }}
                                style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem 1rem", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: "0.15rem", textAlign: "left", fontSize: "0.85rem", fontWeight: 600, background: activeTab === item.id ? "rgba(59,130,246,0.15)" : "transparent", color: activeTab === item.id ? "#60a5fa" : "#94a3b8", transition: "all 0.2s ease" }}
                            >
                                {item.icon}{item.label}
                                {activeTab === item.id && <ChevronRight size={13} style={{ marginLeft: "auto" }} />}
                            </button>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        {/* Language & Theme Controls */}
                        <div style={{ padding: "0.75rem 0.5rem", marginBottom: "0.75rem", borderTop: "1px solid var(--border-light)", borderBottom: "1px solid var(--border-light)" }}>
                            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.6rem", paddingLeft: "0.5rem" }}>{t("admin.sectionSettings")}</div>
                            <div style={{ display: "flex", gap: "0.4rem" }}>
                                {/* Language Toggle */}
                                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "2px", background: "var(--bg-main)", borderRadius: 8, border: "1px solid var(--border-light)", padding: "2px" }}>
                                    <button
                                        onClick={() => language !== "en" && setLanguage("en")}
                                        title="English"
                                        style={{ flex: 1, padding: "0.4rem", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 800, background: language === "en" ? "linear-gradient(135deg, #10b981, #059669)" : "transparent", color: language === "en" ? "white" : "var(--text-muted)", transition: "all 0.2s" }}
                                    >EN</button>
                                    <button
                                        onClick={() => language !== "ne" && setLanguage("ne")}
                                        title="Nepali (नेपाली)"
                                        style={{ flex: 1, padding: "0.4rem", borderRadius: 6, border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 800, background: language === "ne" ? "linear-gradient(135deg, #10b981, #059669)" : "transparent", color: language === "ne" ? "white" : "var(--text-muted)", transition: "all 0.2s" }}
                                    >NP</button>
                                </div>
                                {/* Theme Toggle */}
                                <button
                                    onClick={toggleTheme}
                                    title={theme === "light" ? "Dark Mode" : "Light Mode"}
                                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", padding: "0.5rem 0.4rem", borderRadius: 8, border: "1px solid var(--border-light)", cursor: "pointer", background: "var(--bg-main)", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 800, transition: "all 0.2s" }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.color = "#7c3aed"; e.currentTarget.style.background = "#ede9fe"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "var(--bg-main)"; }}
                                >
                                    {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
                                    <span>{theme === "light" ? "Dark" : "Light"}</span>
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate("/dashboard")}
                            style={{
                                width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
                                padding: "0.75rem 1rem", borderRadius: 8, border: "none", cursor: "pointer",
                                background: "transparent", color: "#64748b", fontSize: "0.85rem", fontWeight: 600,
                                marginBottom: "0.5rem", textAlign: "left"
                            }}
                        >
                            <Leaf size={16} /> {t("admin.navUserDashboard")}
                        </button>
                        <button
                            onClick={handleLogout}
                            style={{
                                width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
                                padding: "0.75rem 1rem", borderRadius: 8, border: "none", cursor: "pointer",
                                background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: "0.85rem", fontWeight: 600,
                                textAlign: "left"
                            }}
                        >
                            <LogOut size={16} /> {t("admin.navLogout")}
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main style={{ flex: 1, overflowY: "auto", padding: "2rem 2.5rem" }}>

                    {/* Error Banner */}
                    {error && (
                        <div style={{
                            background: "#fef2f2", border: "1px solid #fee2e2", color: "#dc2626",
                            padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1.5rem",
                            display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem"
                        }}>
                            <AlertTriangle size={16} /> {error}
                            <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}>✕</button>
                        </div>
                    )}

                    {/* == DASHBOARD TAB ==*/}
                    {activeTab === "dashboard" && (
                        <div>
                            <div style={{ marginBottom: "2rem" }}>
                                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.25rem" }}>
                                    {t("admin.dashboardTitle")}
                                </h1>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                                    {t("admin.dashboardDesc")}
                                </p>
                            </div>

                            {loading ? (
                                <LoadingSpinner />
                            ) : dashboardData ? (
                                <>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
                                        <StatCard onClick={() => setActiveTab('users')} icon={<Users size={22} />} label={t("admin.statTotalUsers")} value={s.total_users} color="#3b82f6" />
                                        <StatCard onClick={() => { setActiveTab('predictions'); setScanFilter('all'); }} icon={<Leaf size={22} />} label={t("admin.statTotalPlants")} value={s.total_plants} color="#10b981" />
                                        <StatCard onClick={() => { setActiveTab('predictions'); setScanFilter('all'); window.location.hash = "predictions"; }} icon={<Activity size={22} />} label={t("admin.statTotalScans")} value={s.total_predictions} color="#8b5cf6" />
                                        <StatCard onClick={() => { setActiveTab('predictions'); setScanFilter('diseased'); window.location.hash = "predictions"; }} icon={<AlertTriangle size={22} />} label={t("admin.statDiseasedScans")} value={s.diseased_predictions} color="#ef4444" />
                                        <StatCard onClick={() => { setActiveTab('predictions'); setScanFilter('healthy'); window.location.hash = "predictions"; }} icon={<CheckCircle size={22} />} label={t("admin.statHealthyScans")} value={s.healthy_predictions} color="#10b981" />
                                        <StatCard onClick={() => { setActiveTab('predictions'); setScanFilter('out_of_scope'); window.location.hash = "predictions"; }} icon={<Activity size={22} />} label={t("treatmentFilters.out_of_scope")} value={s.out_of_scope_predictions} color="#f59e0b" />
                                        <StatCard onClick={() => { setActiveTab('predictions'); setScanFilter('non_plant'); window.location.hash = "predictions"; }} icon={<Activity size={22} />} label={t("treatmentFilters.non_plant")} value={s.non_plant_predictions} color="#64748b" />
                                        <StatCard onClick={() => setActiveTab('orders')} icon={<RefreshCw size={22} />} label={t("ecom.revenue")} value={ecomOverview ? `${parseFloat(ecomOverview.total_revenue).toLocaleString()}` : '...'} color="#10b981" />
                                        <StatCard onClick={() => setActiveTab('orders')} icon={<Package size={22} />} label={t("ecom.totalOrders")} value={ecomOverview ? ecomOverview.total_orders : '...'} color="#3b82f6" />
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                        {/* Recent Predictions */}
                                        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <Clock size={16} color="var(--primary)" />
                                                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>{t("admin.recentScans")}</h3>
                                            </div>
                                            <div style={{ maxHeight: 380, overflowY: "auto" }}>
                                                {dashboardData.recent_predictions.map(p => (
                                                    <div key={p.id} style={{
                                                        padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--border-light)",
                                                        display: "flex", alignItems: "center", gap: "0.75rem"
                                                    }}>
                                                        <div style={{
                                                            width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                                            background: p.is_healthy ? "#10b981" : "#ef4444"
                                                        }} />
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                {p.disease}
                                                            </div>
                                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                                {t("admin.byUser")} <strong>{p.username}</strong> · {p.confidence.toFixed(1)}{t("admin.confSuffix")}
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", flexShrink: 0 }}>
                                                            {new Date(p.created_at).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Top Users */}
                                        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <Crown size={16} color="#f59e0b" />
                                                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>{t("admin.topUsers")}</h3>
                                            </div>
                                            <div>
                                                {dashboardData.top_users.map((u, i) => (
                                                    <div key={u.id} style={{
                                                        padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-light)",
                                                        display: "flex", alignItems: "center", gap: "1rem"
                                                    }}>
                                                        <div style={{
                                                            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                                                            background: i === 0 ? "#fef3c7" : i === 1 ? "#f1f5f9" : "#fef3c7",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            fontWeight: 800, fontSize: "0.85rem",
                                                            color: i === 0 ? "#d97706" : "#64748b"
                                                        }}>
                                                            {i + 1}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>{u.username}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.email}</div>
                                                        </div>
                                                        <div style={{
                                                            background: "var(--primary-subtle)", color: "var(--primary)",
                                                            padding: "0.25rem 0.75rem", borderRadius: 99, fontSize: "0.8rem", fontWeight: 700
                                                        }}>
                                                            {u.pred_count} {t("admin.scansCount")}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    )}

                    {/* === USERS TAB == */}
                    {activeTab === "users" && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                <div>
                                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.25rem" }}>{t("admin.usersTitle")}</h1>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{users.length} {t("admin.usersDesc")}</p>
                                </div>
                                <button onClick={fetchUsers} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                                    <RefreshCw size={14} /> {t("admin.refreshBtn")}
                                </button>
                            </div>

                            {/* Search */}
                            <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                                <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input
                                    placeholder={t("admin.searchUsers")}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: "2.75rem", height: 44, borderRadius: 10 }}
                                />
                            </div>

                            {loading ? <LoadingSpinner t={t} /> : (
                                <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "var(--bg-main)" }}>
                                                {[t("admin.tableUser"), t("admin.tableEmail"), t("admin.tablePlants"), t("admin.tableScans"), t("admin.tableJoined"), t("admin.tableRole"), t("admin.tableActions")].map((h, idx) => (
                                                    <th key={idx} style={{ padding: "0.875rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-light)" }}>
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredUsers.map(u => (
                                                <tr key={u.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.15s" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-main)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                >
                                                    <td style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                        <div style={{
                                                            width: 36, height: 36, borderRadius: "50%",
                                                            background: u.is_superuser ? "linear-gradient(135deg,#f59e0b,#d97706)" : u.is_staff ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#3b82f6,#2563eb)",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            color: "#fff", fontWeight: 800, fontSize: "0.85rem", flexShrink: 0
                                                        }}>
                                                            {u.username[0].toUpperCase()}
                                                        </div>
                                                        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>{u.username}</span>
                                                    </td>
                                                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{u.email}</td>
                                                    <td style={{ padding: "1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>{u.plant_count}</td>
                                                    <td style={{ padding: "1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>{u.prediction_count}</td>
                                                    <td style={{ padding: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                                        {new Date(u.date_joined).toLocaleDateString()}
                                                    </td>
                                                    <td style={{ padding: "1rem" }}>
                                                        <span style={{
                                                            padding: "0.25rem 0.6rem", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700,
                                                            background: u.is_superuser ? "#fef3c7" : u.is_staff ? "#d1fae5" : "#f1f5f9",
                                                            color: u.is_superuser ? "#d97706" : u.is_staff ? "#059669" : "#64748b"
                                                        }}>
                                                            {u.is_superuser ? t("admin.roleSuperuser") : u.is_staff ? t("admin.roleStaff") : t("admin.roleUser")}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "1rem" }}>
                                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                                            <button
                                                                onClick={() => handleViewUser(u)}
                                                                title={t("admin.actionView")}
                                                                style={{ padding: "0.4rem 0.75rem", background: "var(--primary-subtle)", color: "var(--primary)", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: 600 }}
                                                            >
                                                                <Eye size={13} /> {t("admin.actionView")}
                                                            </button>
                                                            {isSuperuser && !u.is_superuser && (
                                                                <button
                                                                    onClick={() => handleToggleStaff(u.id)}
                                                                    title={u.is_staff ? t("admin.actionDemote") : t("admin.actionPromote")}
                                                                    style={{ padding: "0.4rem 0.75rem", background: u.is_staff ? "#fef3c7" : "#f0fdf4", color: u.is_staff ? "#d97706" : "#059669", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: 600 }}
                                                                >
                                                                    <ShieldCheck size={13} /> {u.is_staff ? t("admin.actionDemote") : t("admin.actionPromote")}
                                                                </button>
                                                            )}
                                                            {!u.is_superuser && (
                                                                <button
                                                                    onClick={() => setConfirmDelete(u)}
                                                                    title={t("admin.deleteUserBtn")}
                                                                    style={{ padding: "0.4rem 0.75rem", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: 600 }}
                                                                >
                                                                    <Trash2 size={13} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredUsers.length === 0 && (
                                        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>{t("admin.noUsers")}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* == USER DETAIL TAB == */}
                    {activeTab === "user-detail" && userDetail && (
                        <div>
                            <button
                                onClick={() => { setActiveTab("users"); window.location.hash = "users"; setUserDetail(null); }}
                                style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontWeight: 600, marginBottom: "1.5rem", fontSize: "0.9rem" }}
                            >
                                <ChevronLeft size={16} /> {t("admin.backToUsers")}
                            </button>

                            {loading ? <LoadingSpinner t={t} /> : (
                                <>
                                    {/* User Header */}
                                    <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", padding: "1.5rem 2rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1.5rem" }}>
                                        <div style={{
                                            width: 64, height: 64, borderRadius: "50%",
                                            background: "linear-gradient(135deg, #10b981, #059669)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            color: "#fff", fontWeight: 800, fontSize: "1.5rem"
                                        }}>
                                            {userDetail.user.username[0].toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.25rem" }}>
                                                {userDetail.user.username}
                                                {userDetail.user.is_staff && (
                                                    <span style={{ marginLeft: "0.75rem", padding: "0.2rem 0.6rem", background: "#d1fae5", color: "#059669", borderRadius: 99, fontSize: "0.7rem", fontWeight: 700 }}>STAFF</span>
                                                )}
                                            </h2>
                                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{userDetail.user.email}</p>
                                        </div>
                                        <div style={{ display: "flex", gap: "2rem", textAlign: "center" }}>
                                            <div>
                                                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--primary)" }}>{userDetail.plants.length}</div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Plants</div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#8b5cf6" }}>{userDetail.predictions.length}</div>
                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Scans</div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.5rem" }}>
                                            {isSuperuser && !userDetail.user.is_staff && (
                                                <button
                                                    onClick={() => handleToggleStaff(userDetail.user.id)}
                                                    style={{ padding: "0.6rem 1rem", background: "#f0fdf4", color: "#059669", border: "1px solid #d1fae5", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                                                >
                                                    <ShieldCheck size={14} /> {t("admin.makeStaff")}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setConfirmDelete(userDetail.user)}
                                                style={{ padding: "0.6rem 1rem", background: "#fef2f2", color: "#ef4444", border: "1px solid #fee2e2", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.4rem" }}
                                            >
                                                <Trash2 size={14} /> {t("admin.deleteUserBtn")}
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                                        {/* User Info */}
                                        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", padding: "1.5rem" }}>
                                            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-main)" }}>{t("admin.accountInfo")}</h3>
                                            {[
                                                { label: t("admin.tableJoined"), value: formatDate(userDetail.user.date_joined) },
                                                { label: t("admin.lastLogin"), value: formatDate(userDetail.user.last_login) },
                                                { label: t("admin.userId"), value: `#${userDetail.user.id}` },
                                            ].map(item => (
                                                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border-light)" }}>
                                                    <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>{item.label}</span>
                                                    <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-main)" }}>{item.value}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Plants */}
                                        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <Leaf size={16} color="var(--primary)" />
                                                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>{t("admin.userPlantsCount")} ({userDetail.plants.length})</h3>
                                            </div>
                                            <div style={{ maxHeight: 200, overflowY: "auto" }}>
                                                {userDetail.plants.length === 0 ? (
                                                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>{t("admin.noPlantsAdded")}</div>
                                                ) : userDetail.plants.map(p => (
                                                    <div key={p.id} style={{ padding: "0.75rem 1.5rem", borderBottom: "1px solid var(--border-light)", display: "flex", justifyContent: "space-between" }}>
                                                        <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-main)" }}>{p.name}</span>
                                                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(p.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Predictions History */}
                                    <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden", marginTop: "1.5rem" }}>
                                        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                            <Activity size={16} color="#8b5cf6" />
                                            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>{t("admin.scanHistory")} ({userDetail.predictions.length})</h3>
                                        </div>
                                        <div style={{ maxHeight: 400, overflowY: "auto" }}>
                                            {userDetail.predictions.length === 0 ? (
                                                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>{t("admin.noScansYet")}</div>
                                            ) : (
                                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                    <thead>
                                                        <tr style={{ background: "var(--bg-main)" }}>
                                                            {[t("admin.tableStatus"), t("admin.tableDisease"), t("admin.tableConfidence"), t("admin.tableSeverity"), t("admin.tableDate")].map((h, idx) => (
                                                                <th key={idx} style={{ padding: "0.75rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {userDetail.predictions.map(p => (
                                                            <tr key={p.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                                                                <td style={{ padding: "0.75rem 1rem" }}>
                                                                    {p.is_healthy
                                                                        ? <CheckCircle size={16} color="#10b981" />
                                                                        : <XCircle size={16} color="#ef4444" />}
                                                                </td>
                                                                <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>{p.disease}</td>
                                                                <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{p.confidence.toFixed(1)}%</td>
                                                                <td style={{ padding: "0.75rem 1rem" }}>
                                                                    <span style={{
                                                                        padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700,
                                                                        background: p.severity === "Critical" ? "#fef2f2" : p.severity === "High" ? "#fff7ed" : "#f0fdf4",
                                                                        color: p.severity === "Critical" ? "#ef4444" : p.severity === "High" ? "#f97316" : "#10b981"
                                                                    }}>
                                                                        {p.severity || "N/A"}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                                                    {new Date(p.created_at).toLocaleDateString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* ==ALL PREDICTIONS TAB ==== */}
                    {activeTab === "predictions" && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                <div>
                                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.25rem" }}>{t("admin.predictionsTitle")}</h1>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{t("admin.predictionsDesc")}</p>
                                </div>
                                <button onClick={fetchAllPredictions} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                                    <RefreshCw size={14} /> {t("admin.refreshBtn")}
                                </button>
                            </div>

                            <div style={{ position: "relative", marginBottom: "1rem" }}>
                                <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input
                                    placeholder={t("admin.searchPredictions")}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: "2.75rem", height: 44, borderRadius: 10, width: "100%", border: "1px solid var(--border-light)", background: "var(--bg-surface-1)", color: "var(--text-main)" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                                {['all', 'healthy', 'diseased', 'out_of_scope', 'non_plant'].map(filter => (
                                    <button
                                        key={filter}
                                        onClick={() => setScanFilter(filter)}
                                        style={{
                                            padding: "0.4rem 1rem", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700,
                                            border: "1px solid", textTransform: "capitalize", cursor: "pointer", transition: "all 0.2s",
                                            background: scanFilter === filter ? "var(--primary)" : "transparent",
                                            color: scanFilter === filter ? "#fff" : "var(--text-muted)",
                                            borderColor: scanFilter === filter ? "var(--primary)" : "var(--border-light)"
                                        }}
                                    >
                                        {filter.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>

                            {loading ? <LoadingSpinner t={t} /> : (
                                <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "var(--bg-main)" }}>
                                                {[t("admin.tableStatus"), t("admin.tableUser"), t("admin.tableDisease"), t("admin.tableConfidence"), t("admin.tableSeverity"), t("admin.tableDate"), t("admin.tableAction")].map((h, idx) => (
                                                    <th key={idx} style={{ padding: "0.875rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-light)" }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPredictions.map(p => (
                                                <tr key={p.id} style={{ borderBottom: "1px solid var(--border-light)" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-main)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                >
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        {p.category === "non_plant" ? (
                                                            <span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 700 }}>Not a Plant</span>
                                                        ) : p.category === "out_of_scope" ? (
                                                            <span style={{ color: "#f59e0b", fontSize: "0.75rem", fontWeight: 700 }}>Out of Scope</span>
                                                        ) : p.is_healthy ? (
                                                            <span style={{ color: "#10b981", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem" }}><CheckCircle size={14} /> Healthy</span>
                                                        ) : (
                                                            <span style={{ color: "#ef4444", fontSize: "0.75rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem" }}><XCircle size={14} /> Diseased</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <button
                                                            onClick={() => { const u = users.find(u => u.id === p.user_id); if (u) handleViewUser(u); else { setSelectedUser({ id: p.user_id, username: p.username }); fetchUserDetail(p.user_id); setActiveTab("user-detail"); window.location.hash = "user-detail"; } }}
                                                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontWeight: 700, fontSize: "0.85rem", textDecoration: "underline" }}
                                                        >
                                                            {p.username}
                                                        </button>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>{p.disease}</td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{p.confidence.toFixed(1)}%</td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <span style={{
                                                            padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700,
                                                            background: p.severity === "Critical" ? "#fef2f2" : p.severity === "High" ? "#fff7ed" : "#f0fdf4",
                                                            color: p.severity === "Critical" ? "#ef4444" : p.severity === "High" ? "#f97316" : "#10b981"
                                                        }}>
                                                            {p.severity || "N/A"}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                                        {new Date(p.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        {p.image && (
                                                            <button onClick={() => setPreviewImage(p.image)} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
                                                                {t("admin.viewImage")}
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredPredictions.length === 0 && (
                                        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>{t("admin.noPredictions")}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== E-COMMERCE OVERVIEW TAB ===== */}
                    {activeTab === "ecom-overview" && (
                        <div>
                            <div style={{ marginBottom: "2rem" }}>
                                <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.25rem" }}>{t("ecom.overviewTitle")}</h1>
                                <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>{t("ecom.overviewSubtitle")}</p>
                            </div>
                            {loading ? <LoadingSpinner t={t} /> : ecomOverview ? (
                                <>
                                    {/* KPI Cards */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
                                        <StatCard icon={<ShoppingBag size={22} />} label={t("ecom.totalProducts")} value={ecomOverview.products.total} color="#3b82f6" onClick={() => setActiveTab("products")} />
                                        <StatCard icon={<Package size={22} />} label={t("ecom.totalOrders")} value={ecomOverview.orders.total} color="#8b5cf6" onClick={() => setActiveTab("orders")} />
                                        <StatCard icon={<RefreshCw size={22} />} label={t("ecom.revenue")} value={`₨ ${Number(ecomOverview.orders.total_revenue).toLocaleString()}`} color="#10b981" onClick={() => setActiveTab("orders")} />
                                        <StatCard icon={<Clock size={22} />} label={t("ecom.pendingOrders")} value={ecomOverview.orders.pending} color="#f59e0b" onClick={() => { setActiveTab("orders"); setSearchQuery("pending"); window.location.hash = "orders"; }} />
                                        <StatCard icon={<AlertTriangle size={22} />} label={t("ecom.lowStockItems")} value={ecomOverview.products.low_stock} color="#ef4444" onClick={() => setActiveTab("products")} />
                                        <StatCard icon={<Tag size={22} />} label={t("ecom.activeCoupons")} value={ecomOverview.coupons.active} color="#06b6d4" onClick={() => setActiveTab("coupons")} />
                                        <StatCard icon={<Star size={22} />} label={t("ecom.totalReviews")} value={ecomOverview.reviews.total} color="#f59e0b" onClick={() => setActiveTab("reviews")} />
                                        <StatCard icon={<CheckCircle size={22} />} label={t("ecom.delivered")} value={ecomOverview.orders.delivered} color="#10b981" onClick={() => { setActiveTab("orders"); setSearchQuery("delivered"); window.location.hash = "orders"; }} />
                                    </div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
                                        {/* Order Status Breakdown */}
                                        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", padding: "1.5rem" }}>
                                            <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1rem", color: "var(--text-main)" }}>{t("ecom.statusBreakdown")}</h3>
                                            {[
                                                { label: "pending", value: ecomOverview.orders.pending, color: "#f59e0b" },
                                                { label: "processing", value: ecomOverview.orders.processing, color: "#3b82f6" },
                                                { label: "shipped", value: ecomOverview.orders.shipped, color: "#8b5cf6" },
                                                { label: "delivered", value: ecomOverview.orders.delivered, color: "#10b981" },
                                                { label: "cancelled", value: ecomOverview.orders.cancelled, color: "#ef4444" },
                                            ].map(s => (
                                                <div 
                                                    key={s.label} 
                                                    onClick={() => { setActiveTab("orders"); setSearchQuery(s.label); window.location.hash = "orders"; }}
                                                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", cursor: "pointer", padding: "0.4rem 0.6rem", borderRadius: "8px", transition: "background 0.2s" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-main)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                >
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
                                                        <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-main)" }}>{t(`ecom.status.${s.label}`)}</span>
                                                    </div>
                                                    <span style={{ fontWeight: 800, fontSize: "1rem", color: s.color }}>{s.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Top Selling Products */}
                                        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-light)" }}>
                                                <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-main)" }}>🏆 {t("ecom.topSellingProducts")}</h3>
                                            </div>
                                            {ecomOverview.top_products.map((p, i) => (
                                                <div 
                                                    key={p.product__id} 
                                                    onClick={() => { setActiveTab("products"); setSearchQuery(p.product__name); window.location.hash = "products"; }}
                                                    style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--border-light)", cursor: "pointer", transition: "background 0.2s" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-main)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                >
                                                    <span style={{ fontWeight: 800, fontSize: "1rem", color: i === 0 ? "#f59e0b" : "var(--text-muted)", minWidth: 20 }}>#{i + 1}</span>
                                                    <span style={{ flex: 1, fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>{p.product__name}</span>
                                                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 600 }}>{p.units_sold} {t("ecom.soldCount")}</span>
                                                </div>
                                            ))}
                                            {ecomOverview.top_products.length === 0 && <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>{t("ecom.noSalesData")}</div>}
                                        </div>
                                    </div>
                                    {/* Low Stock Alert */}
                                    {ecomOverview.low_stock_products.length > 0 && (
                                        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid #fee2e2", overflow: "hidden" }}>
                                            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #fee2e2", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <AlertTriangle size={16} color="#ef4444" />
                                                <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#ef4444" }}>{t("ecom.lowStockAlerts")}</h3>
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", padding: "1rem 1.5rem" }}>
                                                {ecomOverview.low_stock_products.map(p => (
                                                    <div 
                                                        key={p.id} 
                                                        onClick={() => { setActiveTab("products"); setSearchQuery(p.name); window.location.hash = "products"; }}
                                                        style={{ background: "#fef2f2", borderRadius: 10, padding: "0.875rem 1rem", border: "1px solid #fee2e2", cursor: "pointer" }}
                                                    >
                                                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#991b1b", marginBottom: "0.25rem" }}>{p.name}</div>
                                                        <div style={{ fontSize: "0.8rem", color: "#ef4444" }}>{p.stock === 0 ? "❌ Out of stock" : `⚠️ Only ${p.stock} left`}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* Monthly Revenue */}
                                    <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", padding: "1.5rem", marginTop: "1.5rem" }}>
                                        <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1.5rem", color: "var(--text-main)" }}>📈 {t("ecom.monthlyRevenue")}</h3>
                                        <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", height: 120 }}>
                                            {ecomOverview.monthly_revenue.map((m, i) => {
                                                const max = Math.max(...ecomOverview.monthly_revenue.map(x => x.revenue), 1);
                                                const h = Math.max((m.revenue / max) * 100, 4);
                                                return (
                                                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                                                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600 }}>₨{(m.revenue / 1000).toFixed(0)}k</span>
                                                        <div style={{ width: "100%", height: `${h}%`, background: "linear-gradient(180deg,#3b82f6,#1d4ed8)", borderRadius: "4px 4px 0 0", minHeight: 4, transition: "height 0.5s ease" }} />
                                                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", textAlign: "center" }}>{m.month}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            ) : <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>{t("ecom.noDataAvailable")}</div>}
                        </div>
                    )}

                    {/* ===== PRODUCTS TAB ===== */}
                    {activeTab === "products" && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                <div>
                                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.25rem" }}>Products</h1>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{products.length} products in catalog</p>
                                </div>
                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                    <button onClick={fetchProducts} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                                        <RefreshCw size={14} /> Refresh
                                    </button>
                                    <button onClick={() => { setEditingProduct(null); setProductForm({ name: "", category: categories[0]?.id || "", description: "", price: "", discount_price: "", stock: "", sku: "", tags: "", usage_instructions: "", is_featured: false, is_organic: false, is_active: true }); setShowProductForm(true); }}
                                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}>
                                        <Plus size={15} /> Add Product
                                    </button>
                                </div>
                            </div>
                            <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                                <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: "2.75rem", height: 44, borderRadius: 10, width: "100%" }} />
                            </div>
                            {loading ? <LoadingSpinner t={t} /> : (
                                <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "var(--bg-main)" }}>
                                                {["Product", "Category", "Price (NPR)", "Stock", "Tags", "Status", "Actions"].map((h, i) => (
                                                    <th key={i} style={{ padding: "0.875rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-light)" }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                                                <tr key={p.id} style={{ borderBottom: "1px solid var(--border-light)" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-main)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>{p.name}</div>
                                                        {p.sku && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>SKU: {p.sku}</div>}
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{p.category_name}</td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>₨{Number(p.effective_price).toLocaleString()}</div>
                                                        {p.discount_price && <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textDecoration: "line-through" }}>₨{Number(p.price).toLocaleString()}</div>}
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <span style={{ padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.78rem", fontWeight: 700, background: p.stock === 0 ? "#fef2f2" : p.is_low_stock ? "#fff7ed" : "#f0fdf4", color: p.stock === 0 ? "#ef4444" : p.is_low_stock ? "#f97316" : "#10b981" }}>
                                                            {p.stock === 0 ? "Out of Stock" : p.is_low_stock ? `Low: ${p.stock}` : p.stock}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                                                            {p.is_featured && <span style={{ padding: "0.15rem 0.5rem", borderRadius: 99, fontSize: "0.68rem", fontWeight: 700, background: "#fef3c7", color: "#d97706" }}>⭐ Featured</span>}
                                                            {p.is_organic && <span style={{ padding: "0.15rem 0.5rem", borderRadius: 99, fontSize: "0.68rem", fontWeight: 700, background: "#d1fae5", color: "#059669" }}>🌿 Organic</span>}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <span style={{ padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700, background: p.is_active ? "#d1fae5" : "#f1f5f9", color: p.is_active ? "#059669" : "#64748b" }}>{p.is_active ? "Active" : "Inactive"}</span>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <div style={{ display: "flex", gap: "0.4rem" }}>
                                                            <button onClick={() => { setEditingProduct(p); setProductForm({ name: p.name, category: p.category, description: p.description, price: p.price, discount_price: p.discount_price || "", stock: p.stock, sku: p.sku || "", tags: p.tags || "", usage_instructions: p.usage_instructions || "", is_featured: p.is_featured, is_organic: p.is_organic, is_active: p.is_active }); setShowProductForm(true); }}
                                                                style={{ padding: "0.35rem 0.65rem", background: "var(--primary-subtle)", color: "var(--primary)", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 600 }}>
                                                                <Edit2 size={12} /> Edit
                                                            </button>
                                                            <button onClick={() => setConfirmDelete({ ...p, _type: "product" })}
                                                                style={{ padding: "0.35rem 0.65rem", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", fontSize: "0.78rem", fontWeight: 600 }}>
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {products.length === 0 && <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No products found. Add your first product!</div>}
                                </div>
                            )}
                            {/* Product Form Modal */}
                            {showProductForm && (
                                <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
                                    <div style={{ background: "var(--bg-card)", borderRadius: 20, padding: "2rem", maxWidth: 640, width: "100%", border: "1px solid var(--border-light)", maxHeight: "90vh", overflowY: "auto" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
                                            <button onClick={() => setShowProductForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            {[{ label: "Product Name *", key: "name", full: true }, { label: "SKU", key: "sku" }, { label: "Price (NPR) *", key: "price", type: "number" }, { label: "Discount Price (NPR)", key: "discount_price", type: "number" }, { label: "Stock Quantity *", key: "stock", type: "number" }].map(f => (
                                                <div key={f.key} style={f.full ? { gridColumn: "1/-1" } : {}}>
                                                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</label>
                                                    <input type={f.type || "text"} value={productForm[f.key]} onChange={e => setProductForm(prev => ({ ...prev, [f.key]: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }} />
                                                </div>
                                            ))}
                                            <div style={{ gridColumn: "1/-1" }}>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Category *</label>
                                                <select value={productForm.category} onChange={e => setProductForm(prev => ({ ...prev, category: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }}>
                                                    <option value="">-- Select Category --</option>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ gridColumn: "1/-1" }}>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Description *</label>
                                                <textarea value={productForm.description} onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))} rows={3} style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem", resize: "vertical" }} />
                                            </div>
                                            <div style={{ gridColumn: "1/-1" }}>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Usage Instructions</label>
                                                <textarea value={productForm.usage_instructions} onChange={e => setProductForm(prev => ({ ...prev, usage_instructions: e.target.value }))} rows={2} style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem", resize: "vertical" }} />
                                            </div>
                                            <div style={{ gridColumn: "1/-1" }}>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tags (comma-separated)</label>
                                                <input value={productForm.tags} onChange={e => setProductForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="e.g. bestseller,organic,premium" style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }} />
                                            </div>
                                            <div style={{ gridColumn: "1/-1", display: "flex", gap: "1.5rem" }}>
                                                {[{ key: "is_featured", label: "⭐ Featured Product" }, { key: "is_organic", label: "🌿 Organic" }, { key: "is_active", label: "✅ Active" }].map(f => (
                                                    <label key={f.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>
                                                        <input type="checkbox" checked={productForm[f.key]} onChange={e => setProductForm(prev => ({ ...prev, [f.key]: e.target.checked }))} style={{ width: 16, height: 16 }} />
                                                        {f.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                                            <button onClick={() => setShowProductForm(false)} style={{ flex: 1, padding: "0.75rem", background: "var(--bg-main)", border: "1px solid var(--border-light)", borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "var(--text-muted)" }}>Cancel</button>
                                            <button onClick={async () => {
                                                try {
                                                    const fd = new FormData();
                                                    Object.entries(productForm).forEach(([k, v]) => { if (v !== "" && v !== null) fd.append(k, v); });
                                                    if (editingProduct) { await adminService.adminUpdateProduct(editingProduct.id, fd); showToast("Product updated!"); }
                                                    else { await adminService.adminCreateProduct(fd); showToast("Product created!"); }
                                                    setShowProductForm(false); fetchProducts();
                                                } catch (e) { setError(e.response?.data?.detail || "Failed to save product."); }
                                            }} style={{ flex: 1, padding: "0.75rem", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                                <Save size={16} /> {editingProduct ? "Save Changes" : "Create Product"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== ORDERS TAB ===== */}
                    {activeTab === "orders" && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                <div>
                                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.25rem" }}>{t("admin.tabOrders")}</h1>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{orders.length} {t("orders.totalOrdersPlural").replace("{{count}}", "")}</p>
                                </div>
                                <button onClick={fetchOrders} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                                    <RefreshCw size={14} /> {t("admin.refreshBtn")}
                                </button>
                            </div>
                            <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                                <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input placeholder={t("orders.searchPlaceholder")} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: "2.75rem", height: 44, borderRadius: 10, width: "100%" }} />
                            </div>
                            {loading ? <LoadingSpinner t={t} /> : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {orders.filter(o => String(o.id).includes(searchQuery) || o.user_name?.toLowerCase().includes(searchQuery.toLowerCase())).map(o => {
                                        const statusColors = { pending: { bg: "#fef3c7", color: "#d97706" }, processing: { bg: "#dbeafe", color: "#1d4ed8" }, shipped: { bg: "#ede9fe", color: "#7c3aed" }, delivered: { bg: "#d1fae5", color: "#059669" }, cancelled: { bg: "#fef2f2", color: "#dc2626" } };
                                        const sc = statusColors[o.status] || { bg: "#f1f5f9", color: "#475569" };
                                        const payColors = { paid: { bg: "#d1fae5", color: "#059669" }, unpaid: { bg: "#fef2f2", color: "#dc2626" }, refunded: { bg: "#ede9fe", color: "#7c3aed" } };
                                        const pc = payColors[o.payment_status] || { bg: "#f1f5f9", color: "#475569" };
                                        return (
                                            <div key={o.id} style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.5rem" }}>
                                                    <div style={{ flex: "0 0 auto" }}>
                                                        <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-main)" }}>#{o.id}</div>
                                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(o.created_at).toLocaleDateString()}</div>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>{o.user_name}</div>
                                                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{o.payment_method?.toUpperCase()} · {o.items?.length || 0} item(s)</div>
                                                    </div>
                                                    <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-main)" }}>₨{Number(o.total_amount).toLocaleString()}</div>
                                                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                                        <select value={o.status} onChange={async e => {
                                                            try { await adminService.updateOrderStatus(o.id, { status: e.target.value }); showToast(`Order #${o.id} → ${e.target.value}`); fetchOrders(); } catch { setError("Failed to update order status."); }
                                                        }} style={{ padding: "0.3rem 0.6rem", borderRadius: 8, border: "none", fontWeight: 700, fontSize: "0.78rem", background: sc.bg, color: sc.color, cursor: "pointer" }}>
                                                            {["pending", "delivered", "cancelled"].map(s => <option key={s} value={s}>{t(`orders.status.${s}`) || s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                                        </select>
                                                        <select value={o.payment_status} onChange={async e => {
                                                            try { await adminService.updateOrderStatus(o.id, { payment_status: e.target.value }); showToast(`Payment → ${e.target.value}`); fetchOrders(); } catch { setError("Failed to update payment status."); }
                                                        }} style={{ padding: "0.3rem 0.6rem", borderRadius: 8, border: "none", fontWeight: 700, fontSize: "0.78rem", background: pc.bg, color: pc.color, cursor: "pointer" }}>
                                                            {["paid", "refunded"].map(s => <option key={s} value={s}>{t(`orders.payment.${s}`) || s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                                        </select>
                                                    </div>
                                                    <div style={{ display: "flex", gap: "0.4rem" }}>
                                                        <button onClick={() => setConfirmDelete({ ...o, username: `Order #${o.id}`, _type: "order" })} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "0.4rem 0.6rem", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center" }}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                        <button onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)} style={{ background: "var(--bg-main)", border: "1px solid var(--border-light)", borderRadius: 8, padding: "0.4rem 0.6rem", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
                                                            <ChevronDown size={16} style={{ transform: expandedOrder === o.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                                                        </button>
                                                    </div>
                                                </div>
                                                {expandedOrder === o.id && (
                                                    <div style={{ borderTop: "1px solid var(--border-light)", background: "var(--bg-main)", padding: "1rem 1.5rem" }}>
                                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                                                            <div>
                                                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>Shipping Address</div>
                                                                <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>{o.shipping_address}</div>
                                                                {o.phone_number && <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>📞 {o.phone_number}</div>}
                                                            </div>
                                                            {o.notes && <div>
                                                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>Notes</div>
                                                                <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>{o.notes}</div>
                                                            </div>}
                                                        </div>
                                                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>Order Items</div>
                                                        {o.items?.map(item => (
                                                            <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-light)" }}>
                                                                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>{item.product_name}</span>
                                                                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>x{item.quantity} · ₨{Number(item.subtotal).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                        {o.coupon_code && <div style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "#059669", fontWeight: 600 }}>🏷️ Coupon: {o.coupon_code} · Discount: ₨{Number(o.discount_amount).toLocaleString()}</div>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {orders.length === 0 && <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: 16 }}>No orders yet.</div>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== COUPONS TAB ===== */}
                    {activeTab === "coupons" && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                <div>
                                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.25rem" }}>Coupons</h1>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{coupons.length} coupons created</p>
                                </div>
                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                    <button onClick={fetchCoupons} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                                        <RefreshCw size={14} /> Refresh
                                    </button>
                                    <button onClick={() => { setEditingCoupon(null); setCouponForm({ code: "", discount_type: "percentage", discount_value: "", min_order_amount: "0", max_uses: "", is_active: true, valid_until: "" }); setShowCouponForm(true); }}
                                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}>
                                        <Plus size={15} /> New Coupon
                                    </button>
                                </div>
                            </div>
                            {loading ? <LoadingSpinner t={t} /> : (
                                <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "var(--bg-main)" }}>
                                                {["Code", "Type", "Value", "Min Order", "Used / Max", "Valid Until", "Active", "Actions"].map((h, i) => (
                                                    <th key={i} style={{ padding: "0.875rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-light)" }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {coupons.map(c => (
                                                <tr key={c.id} style={{ borderBottom: "1px solid var(--border-light)" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-main)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.95rem", background: "var(--bg-main)", padding: "0.25rem 0.6rem", borderRadius: 6, color: "#8b5cf6" }}>{c.code}</span>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{c.discount_type}</td>
                                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--text-main)" }}>{c.discount_type === "percentage" ? `${c.discount_value}%` : `₨${c.discount_value}`}</td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>₨{c.min_order_amount}</td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{c.used_count} / {c.max_uses || "∞"}</td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>{c.valid_until ? new Date(c.valid_until).toLocaleDateString() : "No expiry"}</td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <span style={{ padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700, background: c.is_active ? "#d1fae5" : "#fef2f2", color: c.is_active ? "#059669" : "#dc2626" }}>{c.is_active ? "Active" : "Inactive"}</span>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <div style={{ display: "flex", gap: "0.4rem" }}>
                                                            <button onClick={() => { setEditingCoupon(c); setCouponForm({ code: c.code, discount_type: c.discount_type, discount_value: c.discount_value, min_order_amount: c.min_order_amount, max_uses: c.max_uses || "", is_active: c.is_active, valid_until: c.valid_until ? c.valid_until.split("T")[0] : "" }); setShowCouponForm(true); }}
                                                                style={{ padding: "0.35rem 0.65rem", background: "#ede9fe", color: "#7c3aed", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 600 }}>
                                                                <Edit2 size={12} /> Edit
                                                            </button>
                                                            <button onClick={() => setConfirmDelete({ ...c, username: c.code, _type: "coupon" })}
                                                                style={{ padding: "0.35rem 0.65rem", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", fontSize: "0.78rem", fontWeight: 600 }}>
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {coupons.length === 0 && <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No coupons yet. Create your first coupon!</div>}
                                </div>
                            )}
                            {/* Coupon Form Modal */}
                            {showCouponForm && (
                                <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
                                    <div style={{ background: "var(--bg-card)", borderRadius: 20, padding: "2rem", maxWidth: 520, width: "100%", border: "1px solid var(--border-light)" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>{editingCoupon ? "Edit Coupon" : "New Coupon"}</h2>
                                            <button onClick={() => setShowCouponForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            {[{ label: "Coupon Code *", key: "code", full: true, placeholder: "e.g. SAVE20" }, { label: "Discount Value *", key: "discount_value", type: "number", placeholder: "e.g. 20" }, { label: "Min Order (NPR)", key: "min_order_amount", type: "number" }, { label: "Max Uses (blank = unlimited)", key: "max_uses", type: "number" }, { label: "Valid Until", key: "valid_until", type: "date" }].map(f => (
                                                <div key={f.key} style={f.full ? { gridColumn: "1/-1" } : {}}>
                                                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</label>
                                                    <input type={f.type || "text"} value={couponForm[f.key]} onChange={e => setCouponForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder || ""} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }} />
                                                </div>
                                            ))}
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Discount Type *</label>
                                                <select value={couponForm.discount_type} onChange={e => setCouponForm(prev => ({ ...prev, discount_type: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }}>
                                                    <option value="percentage">Percentage (%)</option>
                                                    <option value="fixed">Fixed Amount (NPR)</option>
                                                </select>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingTop: "1.5rem" }}>
                                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>
                                                    <input type="checkbox" checked={couponForm.is_active} onChange={e => setCouponForm(prev => ({ ...prev, is_active: e.target.checked }))} style={{ width: 16, height: 16 }} />
                                                    Active
                                                </label>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                                            <button onClick={() => setShowCouponForm(false)} style={{ flex: 1, padding: "0.75rem", background: "var(--bg-main)", border: "1px solid var(--border-light)", borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "var(--text-muted)" }}>Cancel</button>
                                            <button onClick={async () => {
                                                try {
                                                    const payload = { ...couponForm, discount_value: Number(couponForm.discount_value), min_order_amount: Number(couponForm.min_order_amount) || 0 };
                                                    if (!payload.max_uses) delete payload.max_uses;
                                                    if (!payload.valid_until) delete payload.valid_until;
                                                    if (editingCoupon) { await adminService.adminUpdateCoupon(editingCoupon.id, payload); showToast("Coupon updated!"); }
                                                    else { await adminService.adminCreateCoupon(payload); showToast("Coupon created!"); }
                                                    setShowCouponForm(false); fetchCoupons();
                                                } catch (e) { setError(e.response?.data?.code?.[0] || "Failed to save coupon."); }
                                            }} style={{ flex: 1, padding: "0.75rem", background: "linear-gradient(135deg,#8b5cf6,#6d28d9)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                                <Save size={16} /> {editingCoupon ? "Save Changes" : "Create Coupon"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== REVIEWS TAB ===== */}
                    {activeTab === "reviews" && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                <div>
                                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.25rem" }}>Reviews</h1>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{reviews.length} total reviews</p>
                                </div>
                                <button onClick={fetchReviews} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)" }}>
                                    <RefreshCw size={14} /> Refresh
                                </button>
                            </div>
                            <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                                <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input placeholder="Search reviews..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: "2.75rem", height: 44, borderRadius: 10, width: "100%" }} />
                            </div>
                            {loading ? <LoadingSpinner t={t} /> : (
                                <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "var(--bg-main)" }}>
                                                {["Rating", "User", "Product", "Comment", "Date", "Actions"].map((h, i) => (
                                                    <th key={i} style={{ padding: "0.875rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-light)" }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reviews.filter(r => r.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) || (r.comment || "").toLowerCase().includes(searchQuery.toLowerCase())).map(r => (
                                                <tr key={r.id} style={{ borderBottom: "1px solid var(--border-light)" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-main)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <div style={{ display: "flex", gap: "2px" }}>
                                                            {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill={s <= r.rating ? "#f59e0b" : "none"} color={s <= r.rating ? "#f59e0b" : "#d1d5db"} />)}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-main)" }}>{r.user_name}</td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{r.product}</td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-main)", maxWidth: 240 }}>
                                                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.comment || <em style={{ color: "var(--text-muted)" }}>No comment</em>}</div>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(r.created_at).toLocaleDateString()}</td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <button onClick={() => setConfirmDelete({ ...r, username: `${r.user_name}'s review`, _type: "review" })}
                                                            style={{ padding: "0.35rem 0.65rem", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 600 }}>
                                                            <Trash2 size={12} /> Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {reviews.length === 0 && <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No reviews yet.</div>}
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* Toast Notification */}
            {toast && (
                <div style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 10000, background: toast.type === "success" ? "#10b981" : "#ef4444", color: "#fff", padding: "0.875rem 1.5rem", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", gap: "0.5rem", animation: "slideInRight 0.3s ease" }}>
                    <CheckCircle size={18} /> {toast.msg}
                    <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
                    <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: "2rem", maxWidth: 400, width: "90%", border: "1px solid var(--border-light)", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
                        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>⚠️</div>
                            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.5rem" }}>
                                {confirmDelete._type === "product" ? "Delete Product?" : confirmDelete._type === "coupon" ? "Delete Coupon?" : confirmDelete._type === "review" ? "Delete Review?" : t("admin.deleteUserModalTitle")}
                            </h3>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                You are about to permanently delete <strong>{confirmDelete.username || confirmDelete.name}</strong>. This action cannot be undone.
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: "0.75rem", background: "var(--bg-main)", border: "1px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontWeight: 600, color: "var(--text-muted)" }}>
                                Cancel
                            </button>
                            <button onClick={async () => {
                                try {
                                    if (confirmDelete._type === "product") {
                                        await adminService.adminDeleteProduct(confirmDelete.id);
                                        showToast("Product deleted.");
                                        setConfirmDelete(null);
                                        fetchProducts();
                                    } else if (confirmDelete._type === "coupon") {
                                        await adminService.adminDeleteCoupon(confirmDelete.id);
                                        showToast("Coupon deleted.");
                                        setConfirmDelete(null);
                                        fetchCoupons();
                                    } else if (confirmDelete._type === "review") {
                                        await adminService.adminDeleteReview(confirmDelete.id);
                                        showToast("Review deleted.");
                                        setConfirmDelete(null);
                                        fetchReviews();
                                    } else if (confirmDelete._type === "order") {
                                        await adminService.adminDeleteOrder(confirmDelete.id);
                                        showToast("Order deleted.");
                                        setConfirmDelete(null);
                                        fetchOrders();
                                    } else {
                                        await handleDeleteUser(confirmDelete.id);
                                    }
                                } catch (e) { setError("Delete failed. Please try again."); }
                            }} style={{ flex: 1, padding: "0.75rem", background: "#ef4444", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, color: "#fff" }}>
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Modal */}
            {previewImage && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.9)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000 }}>
                    <div style={{ position: "relative", maxWidth: "90%", maxHeight: "90%" }}>
                        <button onClick={() => setPreviewImage(null)} style={{ position: "absolute", top: "-3rem", right: 0, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}>
                            <X size={24} />
                        </button>
                        <img src={previewImage} alt="Preview" style={{ maxWidth: "100%", maxHeight: "calc(90vh - 4rem)", borderRadius: 12, boxShadow: "0 25px 50px rgba(0,0,0,0.5)", objectFit: "contain" }} />
                    </div>
                </div>
            )}
        </div>
    );
};

// ---- Helper Components ----

const StatCard = ({ icon, label, value, color, onClick }) => (
    <div
        onClick={onClick}
        onMouseEnter={onClick ? (e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.1)'; } : undefined}
        onMouseLeave={onClick ? (e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; } : undefined}
        style={{
            background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-light)",
            padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            cursor: onClick ? "pointer" : "default",
            transition: "all 0.2s"
        }}>
        <div style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: `${color}18`, color, display: "flex", alignItems: "center", justifyContent: "center"
        }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.1 }}>{value}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, marginTop: "0.1rem" }}>{label}</div>
        </div>
    </div>
);

const LoadingSpinner = ({ t }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem", gap: "0.75rem", color: "var(--text-muted)" }}>
        <div style={{
            width: 24, height: 24, border: "3px solid var(--border-light)",
            borderTopColor: "var(--primary)", borderRadius: "50%",
            animation: "spin 0.8s linear infinite"
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        {t ? t("admin.loading") : "Loading..."}
    </div>
);

export default AdminPanel;
