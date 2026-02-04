import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { authService } from "../services/api";
import { User, Mail, Lock, Trash2, Moon, Sun, ShieldCheck, AlertTriangle } from "lucide-react";

/**
 * Settings Page
 * 
 * Provides account management (edit profile, change password, delete account)
 * and UI personalization (light/dark mode).
 */
const Settings = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
    const [profile, setProfile] = useState({
        username: "",
        email: ""
    });
    const [passwords, setPasswords] = useState({
        old_password: "",
        new_password: "",
        confirm_password: ""
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        loadProfile();
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const loadProfile = async () => {
        try {
            const { data } = await authService.getProfile();
            setProfile({
                username: data.username,
                email: data.email
            });
        } catch (err) {
            console.error("Error loading profile:", err);
            setError("Failed to load profile details.");
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            const response = await authService.updateProfile(profile);
            setSuccess("Profile updated successfully!");
            localStorage.setItem("username", profile.username);
            // Reload to reflect changes in Navbar
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.error || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.new_password !== passwords.confirm_password) {
            setError("New passwords do not match.");
            return;
        }
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            await authService.changePassword({
                old_password: passwords.old_password,
                new_password: passwords.new_password
            });
            setSuccess("Password changed successfully!");
            setPasswords({ old_password: "", new_password: "", confirm_password: "" });
        } catch (err) {
            setError(err.response?.data?.error || "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("CRITICAL: Are you sure you want to delete your account? This will permanently remove all your data, plants, and history. This action cannot be undone.")) {
            try {
                setLoading(true);
                await authService.deleteAccount();
                localStorage.clear();
                navigate("/");
            } catch (err) {
                setError("Failed to delete account. Please try again later.");
                setLoading(false);
            }
        }
    };

    return (
        <div className="page-container">
            <Navbar activePage="settings" />
            <div className="page-content animate-slide-up">
                <div className="page-header">
                    <div>
                        <h1>Settings</h1>
                        <p className="subtitle">Manage your account and app preferences</p>
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
                        <div className="settings-card" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Sun size={24} className="text-primary" /> Display Preference
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                Switch between Light and Dark themes for better visibility.
                            </p>
                            <button
                                className="btn-secondary"
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', height: '50px' }}
                                onClick={toggleTheme}
                            >
                                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                                <span>{theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}</span>
                            </button>
                        </div>

                        <div className="settings-card" style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', borderColor: '#fee2e2' }}>
                            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#dc2626' }}>
                                <Trash2 size={24} /> Danger Zone
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                Permanently delete your account and all associated data.
                            </p>
                            <button
                                className="btn-secondary"
                                style={{ width: '100%', color: '#dc2626', borderColor: '#dc2626' }}
                                onClick={handleDeleteAccount}
                            >
                                Delete Account
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Account Forms */}
                    <div className="settings-forms">
                        <div className="settings-card" style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)', marginBottom: '3rem' }}>
                            <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <User size={24} className="text-primary" /> Profile Information
                            </h3>
                            <form onSubmit={handleProfileUpdate}>
                                <div className="form-group">
                                    <label>Username</label>
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            value={profile.username}
                                            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                                            style={{ paddingLeft: '3rem' }}
                                            placeholder="Enter your username"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <div style={{ position: 'relative' }}>
                                        <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="email"
                                            value={profile.email}
                                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                            style={{ paddingLeft: '3rem' }}
                                            placeholder="Enter your email"
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                                    {loading ? "Updating..." : "Save Changes"}
                                </button>
                            </form>
                        </div>

                        <div className="settings-card" style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Lock size={24} className="text-primary" /> Security
                            </h3>
                            <form onSubmit={handlePasswordChange}>
                                <div className="form-group">
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        value={passwords.old_password}
                                        onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group-row">
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            value={passwords.new_password}
                                            onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm Password</label>
                                        <input
                                            type="password"
                                            value={passwords.confirm_password}
                                            onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
                                    {loading ? "Changing..." : "Update Password"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
