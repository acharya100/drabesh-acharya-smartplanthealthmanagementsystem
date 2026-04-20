import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { authService } from "../services/api";
import { User, Mail, Lock, Trash2, Moon, Sun, ShieldCheck, AlertTriangle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

/**
 * User Settings & Preferences
 */
const Settings = () => {
    const { t, language, setLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState({
        username: "",
        email: ""
    });
    const [passwords, setPasswords] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { data } = await authService.getProfile();
            setProfile({
                username: data.username,
                email: data.email
            });
        } catch (err) {
            console.error("Error loading profile:", err);
            setError(t("settings.loadProfileFailed") || "Failed to load profile details.");
        }
    };


    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const response = await authService.updateProfile(profile);
            setSuccess(t("settings.profileUpdated") || "Profile updated successfully!");
            sessionStorage.setItem("username", profile.username);
            // Reload to reflect changes in Navbar
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.error || t("settings.updateProfileFailed") || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setError(t("settings.passwordsNoMatch") || "New passwords do not match.");
            return;
        }
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            await authService.changePassword({
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            });
            setSuccess(t("settings.passwordChanged") || "Password changed successfully!");
            setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            setError(err.response?.data?.error || t("settings.passwordChangeFailed") || "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setError(t("common.passwordRequired") || "Password is required to confirm deletion.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            await authService.deleteAccount(deletePassword);
            sessionStorage.clear();
            navigate("/");
        } catch (err) {
            setError(err.response?.data?.error || t("settings.deleteAccountFailed") || "Failed to delete account. Incorrect password or server error.");
            setLoading(false);
            setShowDeleteModal(false);
            setDeletePassword("");
        }
    };

    return (
        <div className="page-container">
            <Navbar activePage="settings" />
            <div className="page-content animate-slide-up">
                <div className="page-header">
                    <div>
                        <h1>{t("settings.title")}</h1>
                        <p className="subtitle">{t("settings.subtitle")}</p>
                    </div>
                </div>

                {error && (
                    <div className="error-banner mb-8" style={{ padding: '1rem', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                        <AlertTriangle size={20} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="success-banner mb-8" style={{ padding: '1rem', background: '#dcfce7', color: '#166534', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                        <ShieldCheck size={20} />
                        <span>{success}</span>
                    </div>
                )}

                <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '3rem' }}>
                    {/* Left Column: Preferences */}
                    <div className="settings-section">
                        {/* Language Toggle Card */}
                        <div className="settings-card" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                {t("settings.langSection") || "Language / नेपाली"}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                {t("settings.displayDesc")}
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={() => setLanguage('en')}
                                    style={{
                                        flex: 1, height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        background: language === 'en' ? 'var(--primary)' : 'var(--bg-card)',
                                        color: language === 'en' ? 'white' : 'var(--text-muted)',
                                        border: language === 'en' ? '2px solid var(--primary)' : '2px solid var(--border-light)',
                                        borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.9rem',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    id="settings-lang-en-btn"
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => setLanguage('ne')}
                                    style={{
                                        flex: 1, height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                        background: language === 'ne' ? 'var(--primary)' : 'var(--bg-card)',
                                        color: language === 'ne' ? 'white' : 'var(--text-muted)',
                                        border: language === 'ne' ? '2px solid var(--primary)' : '2px solid var(--border-light)',
                                        borderRadius: 'var(--radius-sm)', fontWeight: 700, fontSize: '0.9rem',
                                        cursor: 'pointer', transition: 'all 0.2s'
                                    }}
                                    id="settings-lang-ne-btn"
                                >
                                    नेपाली (Local)
                                </button>
                            </div>
                        </div>

                        {/* Display/Theme Card */}
                        <div className="settings-card" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Sun size={24} className="text-primary" /> {t("settings.displayPref")}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                {t("settings.displayDesc")}
                            </p>
                            <button
                                className="btn-secondary"
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', height: '50px' }}
                                onClick={toggleTheme}
                            >
                                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                                <span>{theme === 'light' ? t("settings.darkMode") : t("settings.lightMode")}</span>
                            </button>
                        </div>

                        <div className="settings-card" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', borderColor: '#fee2e2' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#dc2626' }}>
                                <Trash2 size={24} /> {t("settings.dangerZone")}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                {t("settings.deleteDesc")}
                            </p>
                            <button
                                className="btn-secondary"
                                style={{ width: '100%', color: '#dc2626', borderColor: '#dc2626' }}
                                onClick={() => setShowDeleteModal(true)}
                            >
                                {t("settings.deleteAccount")}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Account Forms */}
                    <div className="settings-forms">
                        <div className="settings-card" style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', marginBottom: '3rem' }}>
                            <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <User size={24} className="text-primary" /> {t("settings.profileInfo")}
                            </h3>
                            <form onSubmit={handleProfileUpdate}>
                                <div className="form-group">
                                    <label>{t("settings.username")}</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            value={profile.username}
                                            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                            style={{ paddingLeft: '3rem' }}
                                            placeholder={t("settings.usernamePlaceholder")}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>{t("settings.email")}</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="email"
                                            value={profile.email}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            style={{ paddingLeft: '3rem' }}
                                            placeholder={t("settings.emailPlaceholder")}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                                    {loading ? t("settings.updating") : t("settings.saveChanges")}
                                </button>
                            </form>
                        </div>

                        <div className="settings-card" style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Lock size={24} className="text-primary" /> {t("settings.security")}
                            </h3>
                            <form onSubmit={handlePasswordChange}>
                                <div className="form-group">
                                    <label>{t("settings.currentPassword")}</label>
                                    <input
                                        type="password"
                                        value={passwords.oldPassword}
                                        onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group-row">
                                    <div className="form-group">
                                        <label>{t("settings.newPassword")}</label>
                                        <input
                                            type="password"
                                            value={passwords.newPassword}
                                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>{t("settings.confirmPassword")}</label>
                                        <input
                                            type="password"
                                            value={passwords.confirmPassword}
                                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                                    {loading ? t("settings.changing") : t("settings.updatePassword")}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Deletion Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="modal-content animate-slide-up" style={{ maxWidth: '450px', width: '90%', background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-light)' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ background: 'var(--danger-subtle)', color: 'var(--danger)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <AlertTriangle size={32} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>{t("common.areYouSure") || "Final Confirmation"}</h2>
                            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                                {t("settings.deleteAccountConfirm") || "This action is irreversible. Please enter your account password to permanently delete your data."}
                            </p>
                        </div>

                        <div className="form-group">
                            <label>{t("common.password") || "Your Password"}</label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="Enter password to confirm"
                                autoFocus
                                style={{ borderColor: 'var(--danger)' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                className="btn-secondary"
                                style={{ flex: 1 }}
                                onClick={() => { setShowDeleteModal(false); setDeletePassword(""); }}
                                disabled={loading}
                            >
                                {t("common.cancel") || "Go Back"}
                            </button>
                            <button
                                className="btn-primary"
                                style={{ flex: 1, background: 'var(--danger)', border: 'none' }}
                                onClick={handleDeleteAccount}
                                disabled={loading || !deletePassword}
                            >
                                {loading ? t("settings.deleting") || "Deleting..." : t("common.delete") || "Delete Account"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
