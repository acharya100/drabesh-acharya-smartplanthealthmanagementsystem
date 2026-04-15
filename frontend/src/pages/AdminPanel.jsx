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
    Moon, Sun, Globe, AlertCircle
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
    const [refreshing, setRefreshing] = useState(false);
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
    const [systemPlants, setSystemPlants] = useState([]);
    const [showProductForm, setShowProductForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showCouponForm, setShowCouponForm] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [productForm, setProductForm] = useState({ name: "", category: "", description: "", price: "", discountPrice: "", stock: "", sku: "", tags: "", usageInstructions: "", isFeatured: false, isOrganic: false, isActive: true });
    const [couponForm, setCouponForm] = useState({ code: "", discountType: "percentage", discountValue: "", minOrderAmount: "0", maxUses: "", isActive: true, validUntil: "" });
    const [toast, setToast] = useState(null);

    const username = sessionStorage.getItem("username");
    const isSuperuser = sessionStorage.getItem("isSuperuser") === "true";

    const [tabHistory, setTabHistory] = useState(["dashboard"]);

    // Guard: only admins can access this page
    useEffect(() => {
        const isStaff = sessionStorage.getItem("isStaff") === "true";
        const isSu = sessionStorage.getItem("isSuperuser") === "true";
        if (!isStaff && !isSu) {
            navigate("/dashboard");
        }
    }, [navigate]);

    // ── Hash-based tab navigation (back/forward button support) ────────────────
    useEffect(() => {
        const hashTab = window.location.hash.replace("#", "");
        const validTabs = ["dashboard", "users", "predictions", "ecom-overview", "products", "orders", "coupons", "reviews", "user-detail", "system-plants"];
        if (hashTab && validTabs.includes(hashTab)) {
            setActiveTab(hashTab);
        } else {
            // Explicitly default to dashboard if no hash or invalid hash
            setActiveTab("dashboard");
            if (!hashTab) window.history.replaceState(null, "", "#dashboard");
        }
    }, []);

    // When tab changes externally (browser back/fwd), sync state
    useEffect(() => {
        const handleHashChange = () => {
            const hashTab = window.location.hash.replace("#", "");
            const validTabs = ["dashboard", "users", "predictions", "ecom-overview", "products", "orders", "coupons", "reviews", "user-detail", "system-plants"];
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




    const fetchDashboard = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            const { data } = await adminService.getDashboard();
            setDashboardData(data);
        } catch (e) {
            setError(t("admin.errorLoadDashboard") || "Failed to load dashboard data.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    const fetchUsers = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            const { data } = await adminService.getUsers();
            setUsers(data);
        } catch (e) {
            setError(t("admin.errorLoadUsers") || "Failed to load users.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    const fetchAllPredictions = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            const { data } = await adminService.getAllPredictions();
            setAllPredictions(data);
        } catch (e) {
            setError(t("admin.errorLoadPredictions") || "Failed to load predictions.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    const fetchSystemPlants = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            const { data } = await adminService.getAllPlants();
            setUsers(prev => prev); // Placeholder to trigger re-render if needed, but actually we need a state
            setSystemPlants(data);
        } catch (e) {
            setError("Failed to load system plants.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    const fetchUserDetail = useCallback(async (userId, silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);
            const { data } = await adminService.getUserDetail(userId);
            setUserDetail(data);
        } catch (e) {
            setError(t("admin.errorLoadUser") || "Failed to load user details.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    // ---- E-Commerce Fetch Handlers ----
    const fetchEcomOverview = useCallback(async (silent = false) => {
        try { if (!silent) setLoading(true); else setRefreshing(true); const { data } = await adminService.getEcommerceOverview(); setEcomOverview(data); }
        catch (e) { setError("Failed to load e-commerce overview."); } finally { setLoading(false); setRefreshing(false); }
    }, []);

    const fetchProducts = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true); else setRefreshing(true);
            const [pRes, cRes] = await Promise.all([adminService.adminGetAllProducts(), adminService.adminGetCategories()]);
            setProducts(Array.isArray(pRes.data) ? pRes.data : (pRes.data.results || []));
            setCategories(Array.isArray(cRes.data) ? cRes.data : (cRes.data.results || []));
        } catch (e) { setError("Failed to load products."); } finally { setLoading(false); setRefreshing(false); }
    }, []);

    const fetchOrders = useCallback(async (silent = false) => {
        try { if (!silent) setLoading(true); else setRefreshing(true); const { data } = await adminService.adminGetAllOrders(); setOrders(Array.isArray(data) ? data : (data.results || [])); }
        catch (e) { setError("Failed to load orders."); } finally { setLoading(false); setRefreshing(false); }
    }, []);

    const fetchCoupons = useCallback(async (silent = false) => {
        try { if (!silent) setLoading(true); else setRefreshing(true); const { data } = await adminService.adminGetCoupons(); setCoupons(Array.isArray(data) ? data : (data.results || [])); }
        catch (e) { setError("Failed to load coupons."); } finally { setLoading(false); setRefreshing(false); }
    }, []);

    const fetchReviews = useCallback(async (silent = false) => {
        try { if (!silent) setLoading(true); else setRefreshing(true); const { data } = await adminService.adminGetAllReviews(); setReviews(Array.isArray(data) ? data : (data.results || [])); }
        catch (e) { setError("Failed to load reviews."); } finally { setLoading(false); setRefreshing(false); }
    }, []);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const silent = !!dashboardData || users.length > 0 || products.length > 0;
        if (activeTab === "dashboard") { fetchDashboard(silent); fetchEcomOverview(silent); }
        else if (activeTab === "users") fetchUsers(silent);
        else if (activeTab === "predictions") fetchAllPredictions(silent);
        else if (activeTab === "ecom-overview") fetchEcomOverview(silent);
        else if (activeTab === "products") fetchProducts(silent);
        else if (activeTab === "orders") fetchOrders(silent);
        else if (activeTab === "coupons") fetchCoupons(silent);
        else if (activeTab === "reviews") fetchReviews(silent);
        else if (activeTab === "system-plants") fetchSystemPlants(silent);
    }, [activeTab, fetchDashboard, fetchUsers, fetchAllPredictions, fetchEcomOverview, fetchProducts, fetchOrders, fetchCoupons, fetchReviews, fetchSystemPlants]);

    const handleViewUser = (user) => {
        setSelectedUser(user);
        fetchUserDetail(user.id, false); // Not silent for first detail view
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
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isStaff: data.isStaff } : u));
            if (userDetail && userDetail.user.id === userId) {
                setUserDetail(prev => ({ ...prev, user: { ...prev.user, isStaff: data.isStaff } }));
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
        (u.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPredictions = allPredictions.filter(p => {
        const matchesSearch = (p.username || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.disease || "").toLowerCase().includes(searchQuery.toLowerCase());
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
                            { id: "system-plants", icon: <Leaf size={17} />, label: t("admin.tabPlants") || "Plants" },
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
                            <div style={{ marginBottom: "2.5rem" }}>
                                <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.5rem" }}>{t("admin.dashboardTitle")}</h1>
                                <p style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>{t("admin.dashboardDesc")}</p>
                            </div>

                            {dashboardData && (
                                <>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem", marginBottom: "3rem" }}>
                                        <StatCard icon={<Users size={22} />} label={t("admin.statTotalUsers")} value={dashboardData?.stats?.totalUsers || 0} color="#3b82f6" onClick={() => { setActiveTab("users"); window.location.hash = "users"; }} />
                                        <StatCard icon={<Leaf size={22} />} label={t("admin.statTotalPlants")} value={dashboardData?.stats?.totalPlants || 0} color="#10b981" onClick={() => { setActiveTab("system-plants"); window.location.hash = "system-plants"; }} />
                                        <StatCard icon={<Activity size={22} />} label={t("admin.statTotalScans")} value={dashboardData?.stats?.totalPredictions || 0} color="#8b5cf6" onClick={() => { setActiveTab("predictions"); window.location.hash = "predictions"; }} />
                                        <StatCard icon={<ShieldCheck size={22} />} label={t("dashboard.statOutOfScope") || "Out of Scope"} value={dashboardData?.stats?.outOfScopePredictions || 0} color="#f59e0b" onClick={() => { setActiveTab("predictions"); setScanFilter("out_of_scope"); window.location.hash = "predictions"; }} />
                                        <StatCard icon={<XCircle size={22} />} label={t("dashboard.statNonPlant") || "Non-Plant"} value={dashboardData?.stats?.nonPlantPredictions || 0} color="#64748b" onClick={() => { setActiveTab("predictions"); setScanFilter("non_plant"); window.location.hash = "predictions"; }} />
                                        <StatCard icon={<AlertCircle size={22} />} label={t("admin.statDiseasedScans")} value={dashboardData?.stats?.diseasedPredictions || 0} color="#ef4444" onClick={() => { setActiveTab("predictions"); setScanFilter("diseased"); window.location.hash = "predictions"; }} />
                                        <StatCard icon={<CheckCircle size={22} />} label={t("admin.statHealthyScans")} value={dashboardData?.stats?.healthyPredictions || 0} color="#059669" onClick={() => { setActiveTab("predictions"); setScanFilter("healthy"); window.location.hash = "predictions"; }} />
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2rem" }}>
                                        {/* Recent Activity */}
                                        <div style={{ background: "var(--bg-card)", borderRadius: 24, border: "1px solid var(--border-light)", padding: "1.75rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                                                <div style={{ padding: "0.5rem", background: "var(--primary-subtle)", color: "var(--primary)", borderRadius: 12 }}><Clock size={20} /></div>
                                                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>{t("admin.recentScans")}</h3>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                                {(dashboardData?.recentPredictions || []).map((s, i) => {
                                                    const imgUrl = s.image ? (s.image.startsWith('http') ? s.image : `${window.location.protocol}//${window.location.hostname}:8000${s.image.startsWith('/') ? '' : '/'}${s.image}`) : "/placeholder.png";
                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => setPreviewImage(imgUrl)}
                                                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
                                                            style={{
                                                                width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "1rem",
                                                                background: "var(--bg-main)", borderRadius: 16, border: "1px solid var(--border-light)",
                                                                textAlign: "left", cursor: "pointer", transition: "all 0.2s"
                                                            }}
                                                        >
                                                            <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", background: "var(--bg-card)", flexShrink: 0 }}>
                                                                <img src={imgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>{s.disease}</div>
                                                                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>{t("admin.byUser")} {s.username} · {new Date(s.createdAt).toLocaleDateString()}</div>
                                                            </div>
                                                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                                <div style={{ fontWeight: 800, color: !s.isHealthy ? "#ef4444" : "#10b981", fontSize: "0.9rem" }}>{Math.round(s.confidence * 100)}{t("admin.confSuffix")}</div>
                                                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>{!s.isHealthy ? "Infected" : "Healthy"}</div>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Top Users */}
                                        <div style={{ background: "var(--bg-card)", borderRadius: 24, border: "1px solid var(--border-light)", padding: "1.75rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                                                <div style={{ padding: "0.5rem", background: "var(--warning-subtle)", color: "#d97706", borderRadius: 12 }}><Crown size={20} /></div>
                                                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>{t("admin.topUsers")}</h3>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                                {(dashboardData?.top_users || []).map((u, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => handleViewUser(u)}
                                                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'var(--border-light)'; }}
                                                        style={{
                                                            width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "1rem",
                                                            background: "var(--bg-main)", borderRadius: 16, border: "1px solid var(--border-light)",
                                                            textAlign: "left", cursor: "pointer", transition: "all 0.2s"
                                                        }}
                                                    >
                                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #3b82f6, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: "0.9rem", flexShrink: 0 }}>
                                                            {u.username.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>{u.username}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{u.email}</div>
                                                        </div>
                                                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                                                            <div style={{ fontWeight: 800, color: "var(--primary)", fontSize: "1.1rem" }}>{u.pred_count}</div>
                                                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>{t("admin.scansCount")}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
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
                                                            background: u.isSuperuser ? "linear-gradient(135deg,#f59e0b,#d97706)" : u.isStaff ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#3b82f6,#2563eb)",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            color: "#fff", fontWeight: 800, fontSize: "0.85rem", flexShrink: 0
                                                        }}>
                                                            {u.username[0].toUpperCase()}
                                                        </div>
                                                        <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>{u.username}</span>
                                                    </td>
                                                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{u.email}</td>
                                                    <td style={{ padding: "1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>{u.plantCount}</td>
                                                    <td style={{ padding: "1rem", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>{u.predictionCount}</td>
                                                    <td style={{ padding: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                                        {new Date(u.dateJoined).toLocaleDateString()}
                                                    </td>
                                                    <td style={{ padding: "1rem" }}>
                                                        <span style={{
                                                            padding: "0.25rem 0.6rem", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700,
                                                            background: u.isSuperuser ? "#fef3c7" : u.isStaff ? "#d1fae5" : "#f1f5f9",
                                                            color: u.isSuperuser ? "#d97706" : u.isStaff ? "#059669" : "#64748b"
                                                        }}>
                                                            {u.isSuperuser ? t("admin.roleSuperuser") : u.isStaff ? t("admin.roleStaff") : t("admin.roleUser")}
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
                                                            {isSuperuser && !u.isSuperuser && (
                                                                <button
                                                                    onClick={() => handleToggleStaff(u.id)}
                                                                    title={u.isStaff ? t("admin.actionDemote") : t("admin.actionPromote")}
                                                                    style={{ padding: "0.4rem 0.75rem", background: u.isStaff ? "#fef3c7" : "#f0fdf4", color: u.isStaff ? "#d97706" : "#059669", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: 600 }}
                                                                >
                                                                    <ShieldCheck size={13} /> {u.isStaff ? t("admin.actionDemote") : t("admin.actionPromote")}
                                                                </button>
                                                            )}
                                                            {!u.isSuperuser && (
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
                                                {userDetail.user.isStaff && (
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
                                            {isSuperuser && !userDetail.user.isStaff && (
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
                                                { label: t("admin.tableJoined"), value: formatDate(userDetail.user.dateJoined) },
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
                                                    <div key={p.id} style={{ display: "flex", flexDirection: "column", padding: "0.75rem 1.5rem", borderBottom: "1px solid var(--border-light)" }}>
                                                        <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-main)" }}>{p.name}</span>
                                                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{p.species}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Activity Log */}
                                        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-light)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <Activity size={16} color="#8b5cf6" />
                                                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>{t("admin.recentScans")}</h3>
                                            </div>
                                            <div style={{ maxHeight: 400, overflowY: "auto" }}>
                                                {userDetail.predictions.length === 0 ? (
                                                    <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>{t("history.noPredictions")}</div>
                                                ) : userDetail.predictions.map(p => (
                                                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-light)" }}>
                                                        <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--bg-main)", overflow: "hidden" }}>
                                                            {p.image && <img src={p.image.startsWith('http') ? p.image : `http://localhost:8000${p.image.startsWith('/') ? '' : '/'}${p.image}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-main)" }}>{p.disease}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                        <div style={{ padding: "0.25rem 0.6rem", borderRadius: 99, fontSize: "0.72rem", fontWeight: 800, background: p.isHealthy ? "var(--success-subtle)" : "#fef2f2", color: p.isHealthy ? "#059669" : "#ef4444" }}>
                                                            {p.isHealthy ? t("history.badgeHealthy") : t("history.badgeDiseased")}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* === SYSTEM PLANTS TAB == */}
                    {activeTab === "system-plants" && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                <div>
                                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.25rem" }}>{t("admin.tabPlants") || "System Plants"}</h1>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{systemPlants.length} {t("admin.plantsDesc") || "Total plants across all users"}</p>
                                </div>
                                <button onClick={() => fetchSystemPlants()} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                                    <RefreshCw size={14} /> {t("admin.refreshBtn")}
                                </button>
                            </div>

                            {/* Search */}
                            <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                                <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input
                                    placeholder={t("admin.searchPlants") || "Search by plant name or owner..."}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: "2.75rem", width: "100%", height: 44, borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-main)" }}
                                />
                            </div>

                            {loading ? <LoadingSpinner t={t} /> : (
                                <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "var(--bg-main)" }}>
                                                {["Plant", "Owner", "Health", "Sunlight", "Water", "Joined", "Actions"].map((h, idx) => (
                                                    <th key={idx} style={{ padding: "0.875rem 1rem", textAlign: "left", fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-light)" }}>
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {systemPlants.filter(p => (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || (p.owner || "").toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                                                <tr key={p.id} style={{ borderBottom: "1px solid var(--border-light)", transition: "background 0.15s" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-main)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                >
                                                    <td style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                                                        <div style={{ width: 44, height: 44, borderRadius: 12, overflow: "hidden", background: "var(--bg-main)", flexShrink: 0, border: "1px solid var(--border-light)" }}>
                                                            <img src={p.image || "/placeholder.png"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>{p.name}</div>
                                                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>{p.scientificName}</div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "1rem" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text-main)" }}>
                                                            <Users size={14} style={{ color: "var(--primary)" }} />
                                                            {p.owner}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "1rem" }}>
                                                        <span style={{
                                                            padding: "0.25rem 0.6rem", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700,
                                                            background: p.healthStatus === 'healthy' ? "#d1fae5" : p.healthStatus === 'unhealthy' ? "#fee2e2" : "#f1f5f9",
                                                            color: p.healthStatus === 'healthy' ? "#059669" : p.healthStatus === 'unhealthy' ? "#ef4444" : "#64748b"
                                                        }}>
                                                            {p.healthStatus.charAt(0).toUpperCase() + p.healthStatus.slice(1)}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{p.sunlightDisplay}</td>
                                                    <td style={{ padding: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{p.waterFrequencyDisplay}</td>
                                                    <td style={{ padding: "1rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                                                        {new Date(p.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td style={{ padding: "1rem" }}>
                                                        <button
                                                            onClick={() => setPreviewImage(p.image)}
                                                            title={t("admin.actionView")}
                                                            style={{ padding: "0.4rem 0.75rem", background: "var(--primary-subtle)", color: "var(--primary)", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem", fontWeight: 600 }}
                                                        >
                                                            <Eye size={13} /> {t("admin.actionView")}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {systemPlants.length === 0 && <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No plants found.</div>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* === PREDICTIONS TAB (GLOBAL SCAN LOGS) == */}
                    {activeTab === "predictions" && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                <div>
                                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.25rem" }}>{t("admin.predictionsTitle")}</h1>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{t("admin.predictionsDesc")}</p>
                                </div>
                                <button onClick={() => fetchAllPredictions(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                                    <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> {t("admin.refreshBtn")}
                                </button>
                            </div>

                            <div style={{ position: "relative", marginBottom: "1rem" }}>
                                <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input
                                    placeholder={t("admin.searchPredictions")}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    style={{ paddingLeft: "2.75rem", height: 44, borderRadius: 10, width: "100%", border: "1px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-main)", outline: "none" }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                                {[
                                    { key: 'all', label: t("treatmentFilters.all") },
                                    { key: 'healthy', label: t("history.badgeHealthy") },
                                    { key: 'diseased', label: t("history.badgeDiseased") },
                                    { key: 'out_of_scope', label: t("history.badgeOutsideScope") || "Outside Scope" },
                                    { key: 'non_plant', label: t("history.badgeNonPlant") || "Non-Plant Image" }
                                ].map(f => (
                                    <button
                                        key={f.key}
                                        onClick={() => setScanFilter(f.key)}
                                        style={{
                                            padding: "0.4rem 1rem", borderRadius: 20, fontSize: "0.8rem", fontWeight: 700,
                                            border: "1px solid", cursor: "pointer", transition: "all 0.2s",
                                            background: scanFilter === f.key ? "var(--primary)" : "transparent",
                                            color: scanFilter === f.key ? "#fff" : "var(--text-muted)",
                                            borderColor: scanFilter === f.key ? "var(--primary)" : "var(--border-light)"
                                        }}
                                    >
                                        {f.label}
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
                                                        <StatusBadge
                                                            category={p.category}
                                                            healthy={p.isHealthy}
                                                            t={t}
                                                        />
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
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{Math.round(p.confidence * 100)}{t("admin.confSuffix")}</td>
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
                                                        {new Date(p.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        {p.image && (
                                                            <button onClick={() => setPreviewImage(p.image.startsWith('http') ? p.image : `http://localhost:8000${p.image.startsWith('/') ? '' : '/'}${p.image}`)} style={{ background: "none", border: "none", color: "var(--primary)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
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
                                        <StatCard icon={<ShoppingBag size={22} />} label={t("ecom.totalProducts")} value={ecomOverview?.products?.total} color="#3b82f6" onClick={() => { setActiveTab("products"); window.location.hash = "products"; }} />
                                        <StatCard icon={<Package size={22} />} label={t("ecom.totalOrders")} value={ecomOverview?.orders?.total} color="#8b5cf6" onClick={() => { setActiveTab("orders"); window.location.hash = "orders"; }} />
                                        <StatCard icon={<RefreshCw size={22} />} label={t("ecom.revenue")} value={`${Number(ecomOverview?.orders?.total_revenue || 0).toLocaleString()}`} color="#10b981" onClick={() => { setActiveTab("orders"); window.location.hash = "orders"; }} />
                                        <StatCard icon={<Clock size={22} />} label={t("ecom.pendingOrders")} value={ecomOverview?.orders?.pending} color="#f59e0b" onClick={() => { setActiveTab("orders"); setSearchQuery("pending"); window.location.hash = "orders"; }} />
                                        <StatCard icon={<TrendingUp size={22} />} label={t("ecom.activeCoupons")} value={ecomOverview?.coupons?.active} color="#ef4444" onClick={() => { setActiveTab("coupons"); window.location.hash = "coupons"; }} />
                                    </div>

                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
                                        {/* Low Stock Alerts */}
                                        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", padding: "1.25rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                                                <Activity size={18} color="#ef4444" />
                                                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>{t("ecom.lowStockAlerts")}</h3>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                                {(ecomOverview?.low_stock_products || []).length > 0 ? ecomOverview.low_stock_products.map(item => (
                                                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.75rem", background: "var(--bg-main)", borderRadius: 8 }}>
                                                        <span style={{ fontSize: "0.85rem", color: "var(--text-main)", fontWeight: 600 }}>{item.name}</span>
                                                        <span style={{ fontSize: "0.85rem", color: "#ef4444", fontWeight: 700 }}>{t("ecom.status.lowStock") || "Low Stock: "}{item.stock}</span>
                                                    </div>
                                                )) : <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>{t("ecom.noDataAvailable")}</div>}
                                            </div>
                                        </div>

                                        {/* Status Breakdown */}
                                        <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", padding: "1.25rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                                                <Activity size={18} color="var(--primary)" />
                                                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>{t("ecom.statusBreakdown")}</h3>
                                            </div>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                                                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => {
                                                    const count = ecomOverview?.orders?.[status] || 0;
                                                    const total = ecomOverview?.orders?.total || 1;
                                                    return (
                                                        <div key={status} style={{ width: "100%" }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem", fontSize: "0.8rem", fontWeight: 700 }}>
                                                                <span style={{ textTransform: "capitalize", color: "var(--text-muted)" }}>{t(`ecom.status.${status}`) || status}</span>
                                                                <span style={{ color: "var(--text-main)" }}>{count}</span>
                                                            </div>
                                                            <div style={{ height: 6, background: "var(--bg-main)", borderRadius: 3, overflow: "hidden" }}>
                                                                <div style={{ height: "100%", background: status === 'delivered' ? '#10b981' : status === 'pending' ? '#f59e0b' : 'var(--primary)', width: `${(count / total) * 100}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>
                    )}

                    {/* ===== PRODUCTS TAB ===== */}
                    {activeTab === "products" && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                <div>
                                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.25rem" }}>{t("admin.tabProducts")}</h1>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{products.length} {t("ecom.totalProducts")}</p>
                                </div>
                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                    <button onClick={() => fetchProducts(true)} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> {t("admin.refreshBtn")}
                                    </button>
                                    <button onClick={() => { setEditingProduct(null); setProductForm({ name: "", category: "", description: "", price: "", discountPrice: "", stock: "", sku: "", tags: "", usageInstructions: "", isFeatured: false, isOrganic: false, isActive: true }); setShowProductForm(true); }}
                                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}>
                                        <Plus size={15} /> {editingProduct ? t("ecom.productForm.editTitle") : t("ecom.productForm.create")}
                                    </button>
                                </div>
                            </div>

                            {loading ? <LoadingSpinner t={t} /> : (
                                <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "var(--bg-main)" }}>
                                                {[t("ecom.tableHeaders.image"), t("ecom.tableHeaders.product"), t("ecom.tableHeaders.category"), t("ecom.tableHeaders.price"), t("ecom.tableHeaders.stock"), t("ecom.tableHeaders.status"), t("ecom.tableHeaders.actions")].map((h, i) => (
                                                    <th key={i} style={{ padding: "0.875rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-light)" }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map(p => (
                                                <tr key={p.id} style={{ borderBottom: "1px solid var(--border-light)" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-main)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <div style={{ width: 44, height: 44, borderRadius: 8, background: "var(--bg-main)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-light)" }}>
                                                            {p.image ? <img src={p.image.startsWith('http') ? p.image : `${window.location.protocol}//${window.location.hostname}:8000${p.image.startsWith('/') ? '' : '/'}${p.image}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ShoppingBag size={20} color="var(--text-muted)" />}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-main)" }}>{p.name}</div>
                                                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>SKU: {p.sku || "N/A"}</div>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{categories.find(c => c.id === p.category)?.name || "Uncategorized"}</td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <div style={{ fontWeight: 800, color: "var(--text-main)", fontSize: "0.9rem" }}>₨ {p.price}</div>
                                                        {p.discountPrice && <div style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 700 }}>SALE: ₨ {p.discountPrice}</div>}
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: p.stock <= 5 ? "#ef4444" : "var(--text-main)" }}>{p.stock}</span>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <span style={{ padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.7rem", fontWeight: 700, background: p.isActive ? "var(--success-subtle)" : "#fef2f2", color: p.isActive ? "#059669" : "#ef4444" }}>{p.isActive ? t("ecom.status.active") : t("ecom.status.inactive")}</span>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <div style={{ display: "flex", gap: "0.4rem" }}>
                                                            <button onClick={() => { setEditingProduct(p); setProductForm({ name: p.name, category: p.category, description: p.description, price: p.price, discountPrice: p.discountPrice || "", stock: p.stock, sku: p.sku || "", tags: p.tags || "", usageInstructions: p.usageInstructions || "", isFeatured: p.isFeatured, isOrganic: p.isOrganic, isActive: p.isActive }); setShowProductForm(true); }}
                                                                style={{ padding: "0.35rem 0.65rem", background: "var(--primary-subtle)", color: "var(--primary)", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 600 }}>
                                                                <Edit2 size={12} /> {t("common.edit")}
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
                                    {products.length === 0 && <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>{t("ecom.noDataAvailable")}</div>}
                                </div>
                            )}
                            {showProductForm && (
                                <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
                                    <div style={{ background: "var(--bg-card)", borderRadius: 20, padding: "2rem", maxWidth: 640, width: "100%", maxHeight: "90vh", overflowY: "auto", border: "1px solid var(--border-light)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)" }}>{editingProduct ? t("ecom.productForm.edit") : t("ecom.productForm.create")}</h2>
                                            <button onClick={() => setShowProductForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <div style={{ gridColumn: "1/-1" }}>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("ecom.productForm.name")}</label>
                                                <input value={productForm.name} onChange={e => setProductForm(prev => ({ ...prev, name: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("ecom.productForm.price")}</label>
                                                <input type="number" value={productForm.price} onChange={e => setProductForm(prev => ({ ...prev, price: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("ecom.productForm.discountPrice")}</label>
                                                <input type="number" value={productForm.discountPrice} onChange={e => setProductForm(prev => ({ ...prev, discountPrice: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("ecom.productForm.stock")}</label>
                                                <input type="number" value={productForm.stock} onChange={e => setProductForm(prev => ({ ...prev, stock: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("ecom.productForm.sku")}</label>
                                                <input value={productForm.sku} onChange={e => setProductForm(prev => ({ ...prev, sku: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }} />
                                            </div>
                                            <div style={{ gridColumn: "1/-1" }}>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("ecom.productForm.category")}</label>
                                                <select value={productForm.category} onChange={e => setProductForm(prev => ({ ...prev, category: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }}>
                                                    <option value="">{t("ecom.productForm.selectCategory")}</option>
                                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                </select>
                                            </div>
                                            <div style={{ gridColumn: "1/-1" }}>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("ecom.productForm.description")}</label>
                                                <textarea value={productForm.description} onChange={e => setProductForm(prev => ({ ...prev, description: e.target.value }))} rows={3} style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem", resize: "vertical" }} />
                                            </div>
                                            <div style={{ gridColumn: "1/-1" }}>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("ecom.productForm.usage")}</label>
                                                <textarea value={productForm.usageInstructions} onChange={e => setProductForm(prev => ({ ...prev, usageInstructions: e.target.value }))} rows={2} style={{ width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem", resize: "vertical" }} />
                                            </div>
                                            <div style={{ gridColumn: "1/-1" }}>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("ecom.productForm.tags")}</label>
                                                <input value={productForm.tags} onChange={e => setProductForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="e.g. bestseller,organic,premium" style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }} />
                                            </div>
                                            <div style={{ gridColumn: "1/-1", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                                                {[{ key: "isFeatured", label: `⭐ ${t("ecom.status.featured")}` }, { key: "isOrganic", label: `🌿 ${t("ecom.status.organic")}` }, { key: "isActive", label: `✅ ${t("ecom.status.active")}` }].map(f => (
                                                    <label key={f.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>
                                                        <input type="checkbox" checked={productForm[f.key]} onChange={e => setProductForm(prev => ({ ...prev, [f.key]: e.target.checked }))} style={{ width: 16, height: 16 }} />
                                                        {f.label}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                                            <button onClick={() => setShowProductForm(false)} style={{ flex: 1, padding: "0.75rem", background: "var(--bg-main)", border: "1px solid var(--border-light)", borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "var(--text-muted)" }}>{t("common.cancel")}</button>
                                            <button onClick={async () => {
                                                try {
                                                    const fd = new FormData();
                                                    Object.entries(productForm).forEach(([k, v]) => {
                                                        if (v === null || v === undefined || v === "") return;
                                                        if (typeof v === 'boolean') fd.append(k, v ? 'true' : 'false');
                                                        else fd.append(k, v);
                                                    });
                                                    if (editingProduct) { await adminService.adminUpdateProduct(editingProduct.id, fd); showToast(t("store.productSaved")); }
                                                    else { await adminService.adminCreateProduct(fd); showToast(t("store.productSaved")); }
                                                    setShowProductForm(false); fetchProducts();
                                                } catch (e) { setError(e.response?.data?.detail || t("common.errorOccurred")); }
                                            }} style={{ flex: 1, padding: "0.75rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                                <Save size={16} /> {editingProduct ? t("ecom.productForm.save") : t("ecom.productForm.create")}
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
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{t("orders.totalOrdersPlural", { count: orders.length })}</p>
                                </div>
                                <button onClick={fetchOrders} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                                    <RefreshCw size={14} /> {t("admin.refreshBtn")}
                                </button>
                            </div>
                            <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                                <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input placeholder={t("orders.searchPlaceholder")} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "0.75rem 1rem 0.75rem 2.75rem", borderRadius: 10, background: "var(--bg-card)", border: "1px solid var(--border-light)", color: "var(--text-main)", outline: "none" }} />
                            </div>
                            {loading ? <LoadingSpinner t={t} /> : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {orders.filter(o => String(o.id).includes(searchQuery) || o.user_name?.toLowerCase().includes(searchQuery.toLowerCase())).map(o => {
                                        const statusColors = {
                                            pending: { bg: "var(--warning-subtle)", color: "#d97706" },
                                            processing: { bg: "var(--primary-subtle)", color: "var(--primary)" },
                                            shipped: { bg: "#ede9fe", color: "#7c3aed" },
                                            delivered: { bg: "var(--success-subtle)", color: "#059669" },
                                            cancelled: { bg: "#fef2f2", color: "#dc2626" }
                                        };
                                        const sc = statusColors[o.status] || { bg: "var(--bg-main)", color: "var(--text-muted)" };
                                        const payColors = {
                                            paid: { bg: "var(--success-subtle)", color: "#059669" },
                                            unpaid: { bg: "#fef2f2", color: "#dc2626" },
                                            refunded: { bg: "#ede9fe", color: "#7c3aed" }
                                        };
                                        const pc = payColors[o.payment_status] || { bg: "var(--bg-main)", color: "var(--text-muted)" };
                                        return (
                                            <div key={o.id} style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.5rem", flexWrap: "wrap" }}>
                                                    <div style={{ flex: "0 0 auto" }}>
                                                        <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--text-main)" }}>#{o.id}</div>
                                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: "150px" }}>
                                                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-main)" }}>{o.user_name}</div>
                                                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{o.payment_method?.toUpperCase()} · {o.items?.length || 0} {t("orders.itemsCount")}</div>
                                                    </div>
                                                    <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--text-main)" }}>₨ {Number(o.total_amount).toLocaleString()}</div>
                                                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                                        <select value={o.status} onChange={async e => {
                                                            try { await adminService.updateOrderStatus(o.id, { status: e.target.value }); showToast(`${t("orders.order")} #${o.id} → ${t(`orders.status.${e.target.value}`)}`); fetchOrders(); } catch { setError(t("orders.errorUpdateStatus")); }
                                                        }} style={{ padding: "0.3rem 0.6rem", borderRadius: 8, border: "none", fontWeight: 700, fontSize: "0.78rem", background: sc.bg, color: sc.color, cursor: "pointer", outline: "none" }}>
                                                            {["pending", "processing", "shipped", "delivered", "cancelled"].map(s => <option key={s} value={s}>{t(`orders.status.${s}`)}</option>)}
                                                        </select>
                                                        <select value={o.payment_status} onChange={async e => {
                                                            try { await adminService.updateOrderStatus(o.id, { payment_status: e.target.value }); showToast(`${t("orders.paymentStatus")} → ${t(`orders.payment.${e.target.value}`)}`); fetchOrders(); } catch { setError(t("orders.errorUpdatePayment")); }
                                                        }} style={{ padding: "0.3rem 0.6rem", borderRadius: 8, border: "none", fontWeight: 700, fontSize: "0.78rem", background: pc.bg, color: pc.color, cursor: "pointer", outline: "none" }}>
                                                            {["paid", "unpaid", "refunded"].map(s => <option key={s} value={s}>{t(`orders.payment.${s}`)}</option>)}
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
                                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                                                            <div>
                                                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>{t("orders.shippingAddress")}</div>
                                                                <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>{o.shipping_address}</div>
                                                                {o.phone_number && <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>📞 {o.phone_number}</div>}
                                                            </div>
                                                            {o.notes && <div>
                                                                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>{t("orders.notes")}</div>
                                                                <div style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>{o.notes}</div>
                                                            </div>}
                                                        </div>
                                                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.5rem" }}>{t("orders.orderItems")}</div>
                                                        {o.items?.map(item => (
                                                            <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--border-light)" }}>
                                                                <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>{item.product_name}</span>
                                                                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>x{item.quantity} · ₨ {Number(item.subtotal).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                        {o.coupon_code && <div style={{ marginTop: "0.75rem", fontSize: "0.82rem", color: "#059669", fontWeight: 600 }}>🏷️ {t("orders.couponApplied")}: {o.coupon_code} · {t("checkout.discount")}: ₨ {Number(o.discount_amount).toLocaleString()}</div>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {orders.length === 0 && <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)", borderRadius: 16 }}>{t("orders.noOrders")}</div>}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ===== COUPONS TAB ===== */}
                    {activeTab === "coupons" && (
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                <div>
                                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.25rem" }}>{t("admin.tabCoupons")}</h1>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{coupons.length} {t("ecom.activeCoupons")}</p>
                                </div>
                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                    <button onClick={fetchCoupons} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                                        <RefreshCw size={14} /> {t("admin.refreshBtn")}
                                    </button>
                                    <button onClick={() => { setEditingCoupon(null); setCouponForm({ code: "", discountType: "percentage", discountValue: "", minOrderAmount: "0", maxUses: "", isActive: true, validUntil: "" }); setShowCouponForm(true); }}
                                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 700 }}>
                                        <Plus size={15} /> {t("ecom.viewAllCoupons")}
                                    </button>
                                </div>
                            </div>
                            {loading ? <LoadingSpinner t={t} /> : (
                                <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "var(--bg-main)" }}>
                                                {[t("ecom.tableHeaders.code"), t("ecom.tableHeaders.type"), t("ecom.tableHeaders.value"), t("ecom.tableHeaders.minOrder"), t("ecom.tableHeaders.usage"), t("ecom.tableHeaders.expiry"), t("ecom.tableHeaders.status"), t("ecom.tableHeaders.actions")].map((h, i) => (
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
                                                        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.95rem", background: "var(--bg-main)", padding: "0.25rem 0.6rem", borderRadius: 6, color: "var(--primary)" }}>{c.code}</span>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)", textTransform: "capitalize" }}>{c.discountType}</td>
                                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--text-main)" }}>{c.discountType === "percentage" ? `${c.discountValue}%` : `₨ ${c.discountValue}`}</td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>₨ {c.minOrderAmount}</td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>{c.used_count} / {c.maxUses || "∞"}</td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>{c.validUntil ? new Date(c.validUntil).toLocaleDateString() : t("common.notAvailable")}</td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <span style={{ padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700, background: c.isActive ? "var(--success-subtle)" : "#fef2f2", color: c.isActive ? "#059669" : "#dc2626" }}>{c.isActive ? t("ecom.status.active") : t("ecom.status.inactive")}</span>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <div style={{ display: "flex", gap: "0.4rem" }}>
                                                            <button onClick={() => { setEditingCoupon(c); setCouponForm({ code: c.code, discountType: c.discountType, discountValue: c.discountValue, minOrderAmount: c.minOrderAmount, maxUses: c.maxUses || "", isActive: c.isActive, validUntil: c.validUntil ? c.validUntil.split("T")[0] : "" }); setShowCouponForm(true); }}
                                                                style={{ padding: "0.35rem 0.65rem", background: "var(--primary-subtle)", color: "var(--primary)", border: "none", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 600 }}>
                                                                <Edit2 size={12} /> {t("ecom.tableHeaders.edit")}
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
                                    {coupons.length === 0 && <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>{t("ecom.noDataAvailable")}</div>}
                                </div>
                            )}
                            {showCouponForm && (
                                <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
                                    <div style={{ background: "var(--bg-card)", borderRadius: 20, padding: "2rem", maxWidth: 520, width: "100%", border: "1px solid var(--border-light)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                                            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>{editingCoupon ? t("ecom.couponForm.editTitle") : t("ecom.couponForm.addTitle")}</h2>
                                            <button onClick={() => setShowCouponForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
                                        </div>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                            <div style={{ gridColumn: "1/-1" }}>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("ecom.couponForm.code")}</label>
                                                <input value={couponForm.code} onChange={e => setCouponForm(prev => ({ ...prev, code: e.target.value }))} placeholder={t("ecom.couponForm.codePlaceholder")} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("ecom.couponForm.value")}</label>
                                                <input type="number" value={couponForm.discountValue} onChange={e => setCouponForm(prev => ({ ...prev, discountValue: e.target.value }))} placeholder={t("ecom.couponForm.valuePlaceholder")} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("ecom.couponForm.minOrder")}</label>
                                                <input type="number" value={couponForm.minOrderAmount} onChange={e => setCouponForm(prev => ({ ...prev, minOrderAmount: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("ecom.couponForm.maxUses")}</label>
                                                <input type="number" value={couponForm.maxUses} onChange={e => setCouponForm(prev => ({ ...prev, maxUses: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>{t("ecom.couponForm.validUntil")}</label>
                                                <input type="date" value={couponForm.validUntil} onChange={e => setCouponForm(prev => ({ ...prev, validUntil: e.target.value }))} style={{ width: "100%", height: 40, padding: "0 0.75rem", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-main)", fontSize: "0.9rem" }} />
                                            </div>
                                            <div style={{ gridColumn: "1/-1", display: "flex", gap: "1rem" }}>
                                                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: 600, fontSize: "0.9rem", color: "var(--text-main)" }}>
                                                    <input type="checkbox" checked={couponForm.isActive} onChange={e => setCouponForm(prev => ({ ...prev, isActive: e.target.checked }))} style={{ width: 16, height: 16 }} />
                                                    {t("ecom.status.active")}
                                                </label>
                                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                                    <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-main)" }}>
                                                        <input type="radio" checked={couponForm.discountType === "percentage"} onChange={() => setCouponForm(prev => ({ ...prev, discountType: "percentage" }))} /> {t("ecom.couponForm.percent")}
                                                    </label>
                                                    <label style={{ display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer", fontSize: "0.85rem", color: "var(--text-main)" }}>
                                                        <input type="radio" checked={couponForm.discountType === "fixed"} onChange={() => setCouponForm(prev => ({ ...prev, discountType: "fixed" }))} /> {t("common.currency") || "NPR"}
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.5rem" }}>
                                            <button onClick={() => setShowCouponForm(false)} style={{ flex: 1, padding: "0.75rem", background: "var(--bg-main)", border: "1px solid var(--border-light)", borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "var(--text-muted)" }}>{t("common.cancel")}</button>
                                            <button onClick={async () => {
                                                try {
                                                    // Proactive uniqueness check
                                                    const codeExists = coupons.some(c => c.code.toUpperCase() === couponForm.code.toUpperCase() && (!editingCoupon || c.id !== editingCoupon.id));
                                                    if (codeExists) {
                                                        setError(`Coupon code "${couponForm.code}" already exists.`);
                                                        return;
                                                    }

                                                    const data = { ...couponForm, maxUses: couponForm.maxUses || null, validUntil: couponForm.validUntil || null };
                                                    if (editingCoupon) { await adminService.updateCoupon(editingCoupon.id, data); showToast(t("store.productSaved")); }
                                                    else { await adminService.createCoupon(data); showToast(t("store.productSaved")); }
                                                    setShowCouponForm(false); fetchCoupons();
                                                } catch (e) { setError(e.response?.data?.detail || t("common.errorOccurred")); }
                                            }} style={{ flex: 1, padding: "0.75rem", background: "var(--primary)", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
                                                <Save size={16} /> {editingCoupon ? t("ecom.productForm.save") : t("ecom.productForm.create")}
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
                                    <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.25rem" }}>{t("admin.tabReviews")}</h1>
                                    <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{reviews.length} {t("ecom.viewAllReviews")}</p>
                                </div>
                                <button onClick={fetchReviews} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "var(--bg-card)", border: "1px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>
                                    <RefreshCw size={14} /> {t("admin.refreshBtn")}
                                </button>
                            </div>
                            {loading ? <LoadingSpinner t={t} /> : (
                                <div style={{ background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border-light)", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "var(--bg-main)" }}>
                                                {[t("ecom.tableHeaders.product"), t("ecom.tableHeaders.user"), t("ecom.tableHeaders.rating"), t("ecom.tableHeaders.comment"), t("ecom.tableHeaders.date"), t("ecom.tableHeaders.status"), t("ecom.tableHeaders.actions")].map((h, i) => (
                                                    <th key={i} style={{ padding: "0.875rem 1rem", textAlign: "left", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-light)" }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reviews.map(r => (
                                                <tr key={r.id} style={{ borderBottom: "1px solid var(--border-light)" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "var(--bg-main)"}
                                                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "var(--text-main)", fontSize: "0.85rem" }}>{r.product_name}</td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-main)" }}>{r.user_name}</td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "0.2rem", color: "#f59e0b" }}>
                                                            <Star size={14} fill="#f59e0b" />
                                                            <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>{r.rating}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.comment}</td>
                                                    <td style={{ padding: "0.875rem 1rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <span style={{ padding: "0.2rem 0.6rem", borderRadius: 99, fontSize: "0.72rem", fontWeight: 700, background: r.is_approved ? "var(--success-subtle)" : "#fff7ed", color: r.is_approved ? "#059669" : "#f97316" }}>{r.is_approved ? t("ecom.status.approved") : t("ecom.status.pending")}</span>
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <div style={{ display: "flex", gap: "0.4rem" }}>
                                                            {!r.is_approved && (
                                                                <button onClick={async () => {
                                                                    try { await adminService.approveReview(r.id); showToast(t("ecom.reviewApproved")); fetchReviews(); } catch { setError(t("ecom.errorApproveReview")); }
                                                                }} style={{ padding: "0.35rem 0.65rem", background: "var(--success-subtle)", color: "#059669", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>{t("ecom.status.approved")}</button>
                                                            )}
                                                            <button onClick={() => setConfirmDelete({ ...r, username: `Review on ${r.product_name}`, _type: "review" })}
                                                                style={{ padding: "0.35rem 0.65rem", background: "#fef2f2", color: "#ef4444", border: "none", borderRadius: 6, cursor: "pointer", fontSize: "0.78rem", fontWeight: 600 }}>
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {reviews.length === 0 && <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>{t("ecom.noDataAvailable")}</div>}
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

            {/* ===== DELETE CONFIRMATION MODAL ===== */}
            {confirmDelete && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "1.5rem" }}>
                    <div style={{ background: "var(--bg-card)", borderRadius: 24, padding: "2.5rem", maxWidth: 440, width: "100%", textAlign: "center", border: "1px solid var(--border-light)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
                        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                            <AlertTriangle size={32} color="#ef4444" />
                        </div>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.75rem" }}>{t("common.areYouSure")}</h2>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "2rem" }}>
                            {t("admin.deleteConfirmMsg").replace("{{name}}", confirmDelete.username || confirmDelete.name || `#${confirmDelete.id}`)}
                        </p>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: "1rem", borderRadius: 12, border: "1px solid var(--border-light)", background: "var(--bg-main)", color: "var(--text-muted)", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                                {t("common.cancel")}
                            </button>
                            <button onClick={async () => {
                                try {
                                    const { id, _type } = confirmDelete;
                                    if (_type === "review") { await adminService.adminDeleteReview(id); showToast(t("ecom.reviewDeleted")); fetchReviews(); }
                                    else if (_type === "coupon") { await adminService.adminDeleteCoupon(id); showToast(t("ecom.couponDeleted")); fetchCoupons(); }
                                    else if (_type === "order") { await adminService.adminDeleteOrder(id); showToast(t("ecom.orderDeleted")); fetchOrders(); }
                                    else if (_type === "product") { await adminService.adminDeleteProduct(id); showToast(t("ecom.productDeleted")); fetchProducts(); }
                                    else { await handleDeleteUser(id); }
                                    setConfirmDelete(null);
                                } catch (e) { setError(t("common.errorOccurred")); }
                            }} style={{ flex: 1, padding: "1rem", borderRadius: 12, border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 4px 12px rgba(239,68,68,0.3)" }}>
                                {t("common.delete")}
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

const StatusBadge = ({ diseased, healthy, scope, nonleaf, category, t }) => {
    let config = { icon: <CheckCircle size={14} />, label: t("history.badgeHealthy") || "Healthy", color: "#10b981", bg: "var(--success-subtle)" };

    // Support both old boolean props and new category prop
    const cat = category || (diseased ? 'diseased' : scope ? 'out_of_scope' : nonleaf ? 'non_plant' : 'healthy');

    if (cat === 'diseased' || cat === 'infected' || diseased) config = { icon: <AlertTriangle size={14} />, label: t("history.badgeDiseased") || "Diseased", color: "#ef4444", bg: "#fef2f2" };
    else if (cat === 'out_of_scope' || cat === 'outside_scope' || scope) config = { icon: <ShieldCheck size={14} />, label: t("history.badgeOutsideScope") || "Outside Scope", color: "#f59e0b", bg: "#fff7ed" };
    else if (cat === 'non_plant' || cat === 'non_leaf' || nonleaf) config = { icon: <XCircle size={14} />, label: t("history.badgeNonPlant") || "Non-Plant Image", color: "#64748b", bg: "#f1f5f9" };

    return (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.25rem 0.65rem", borderRadius: 99, background: config.bg, color: config.color, fontSize: "0.72rem", fontWeight: 800 }}>
            {config.icon} {config.label}
        </div>
    );
};

export default AdminPanel;
