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
    BarChart2, Clock, Search
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const AdminPanel = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
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

    const username = sessionStorage.getItem("username");
    const isSuperuser = sessionStorage.getItem("is_superuser") === "true";

    // Guard: only admins can access this page
    useEffect(() => {
        const isStaff = sessionStorage.getItem("is_staff") === "true";
        const isSu = sessionStorage.getItem("is_superuser") === "true";
        if (!isStaff && !isSu) {
            navigate("/dashboard");
        }
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

    useEffect(() => {
        if (activeTab === "dashboard") fetchDashboard();
        else if (activeTab === "users") fetchUsers();
        else if (activeTab === "predictions") fetchAllPredictions();
    }, [activeTab, fetchDashboard, fetchUsers, fetchAllPredictions]);

    const handleViewUser = (user) => {
        setSelectedUser(user);
        fetchUserDetail(user.id);
        setActiveTab("user-detail");
    };

    const handleDeleteUser = async (userId) => {
        try {
            await adminService.deleteUser(userId);
            setConfirmDelete(null);
            setUsers(prev => prev.filter(u => u.id !== userId));
            if (activeTab === "user-detail") {
                setActiveTab("users");
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

    const filteredPredictions = allPredictions.filter(p =>
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.disease.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                    <nav style={{ flex: 1, padding: "1rem 0.75rem" }}>
                        {[
                            { id: "dashboard", icon: <BarChart2 size={18} />, label: t("admin.tabDashboard") },
                            { id: "users", icon: <Users size={18} />, label: t("admin.tabUsers") },
                            { id: "predictions", icon: <Activity size={18} />, label: t("admin.tabPredictions") },
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); setSearchQuery(""); setError(""); }}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center", gap: "0.75rem",
                                    padding: "0.75rem 1rem", borderRadius: 8, border: "none", cursor: "pointer",
                                    marginBottom: "0.25rem", textAlign: "left", fontSize: "0.9rem", fontWeight: 600,
                                    background: activeTab === item.id ? "rgba(16,185,129,0.15)" : "transparent",
                                    color: activeTab === item.id ? "#10b981" : "#94a3b8",
                                    transition: "all 0.2s ease"
                                }}
                            >
                                {item.icon}
                                {item.label}
                                {activeTab === item.id && <ChevronRight size={14} style={{ marginLeft: "auto" }} />}
                            </button>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div style={{ padding: "1rem 0.75rem", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
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
                                    {/* Stats Grid */}
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
                                        <StatCard icon={<Users size={22} />} label={t("admin.statTotalUsers")} value={s.total_users} color="#3b82f6" />
                                        <StatCard icon={<Leaf size={22} />} label={t("admin.statTotalPlants")} value={s.total_plants} color="#10b981" />
                                        <StatCard icon={<Activity size={22} />} label={t("admin.statTotalScans")} value={s.total_predictions} color="#8b5cf6" />
                                        <StatCard icon={<AlertTriangle size={22} />} label={t("admin.statDiseasedScans")} value={s.diseased_predictions} color="#ef4444" />
                                        <StatCard icon={<CheckCircle size={22} />} label={t("admin.statHealthyScans")} value={s.healthy_predictions} color="#10b981" />
                                        <StatCard icon={<TrendingUp size={22} />} label={t("admin.statNewUsers7d")} value={s.new_users_7d} color="#f59e0b" />
                                        <StatCard icon={<Activity size={22} />} label={t("admin.statScans7d")} value={s.new_predictions_7d} color="#06b6d4" />
                                        <StatCard icon={<BarChart2 size={22} />} label={t("admin.statScans30d")} value={s.new_predictions_30d} color="#ec4899" />
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
                                onClick={() => { setActiveTab("users"); setUserDetail(null); }}
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

                            <div style={{ position: "relative", marginBottom: "1.5rem" }}>
                                <Search size={16} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input
                                    placeholder={t("admin.searchPredictions")}
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
                                                        {p.is_healthy
                                                            ? <CheckCircle size={16} color="#10b981" />
                                                            : <XCircle size={16} color="#ef4444" />}
                                                    </td>
                                                    <td style={{ padding: "0.875rem 1rem" }}>
                                                        <button
                                                            onClick={() => { const u = users.find(u => u.id === p.user_id); if (u) handleViewUser(u); else { setSelectedUser({ id: p.user_id, username: p.username }); fetchUserDetail(p.user_id); setActiveTab("user-detail"); } }}
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
                                                            <a href={p.image} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", fontSize: "0.8rem", fontWeight: 600 }}>
                                                                {t("admin.viewImage")}
                                                            </a>
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
                </main>
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDelete && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(15,23,42,0.8)", backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
                }}>
                    <div style={{ background: "var(--bg-card)", borderRadius: 16, padding: "2rem", maxWidth: 400, width: "90%", border: "1px solid var(--border-light)", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
                        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>⚠️</div>
                            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "0.5rem" }}>{t("admin.deleteUserModalTitle")}</h3>
                            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                {t("admin.deleteUserModalDesc1")} <strong>{confirmDelete.username}</strong> {t("admin.deleteUserModalDesc2")}
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: "0.75rem" }}>
                            <button
                                onClick={() => setConfirmDelete(null)}
                                style={{ flex: 1, padding: "0.75rem", background: "var(--bg-main)", border: "1px solid var(--border-light)", borderRadius: 8, cursor: "pointer", fontWeight: 600, color: "var(--text-muted)" }}
                            >
                                {t("admin.cancelBtn")}
                            </button>
                            <button
                                onClick={() => handleDeleteUser(confirmDelete.id)}
                                style={{ flex: 1, padding: "0.75rem", background: "#ef4444", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, color: "#fff" }}
                            >
                                {t("admin.deletePermanently")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ---- Helper Components ----

const StatCard = ({ icon, label, value, color }) => (
    <div style={{
        background: "var(--bg-card)", borderRadius: 14, border: "1px solid var(--border-light)",
        padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
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
