import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

const SignUp = () => {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        email: "",
        username: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!formData.email.trim() || !formData.username.trim() || !formData.password.trim()) {
            setError(t("signup.signupFailed"));
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t("signup.passwordMismatch"));
            setLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError(t("signup.passwordTooShort") || "Password must be at least 8 characters long");
            setLoading(false);
            return;
        }

        try {
            await authService.register({
                email: formData.email,
                username: formData.username,
                password: formData.password
            });

            navigate("/", { state: { message: t("signup.title") + " successful! Please login." } });
        } catch (err) {
            console.error(err);
            if (err.response?.data) {
                const errors = err.response.data;
                if (errors.email) {
                    setError(errors.email[0]);
                } else if (errors.username) {
                    setError(errors.username[0]);
                } else {
                    setError(t("signup.signupFailed"));
                }
            } else {
                setError(t("login.serverError") || "Server error.");
            }
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: 'var(--bg-main)' }}>
            <div className="login-card animate-slide-up" style={{ maxWidth: '500px', width: '100%', padding: '3rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)' }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div className="auth-logo" style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🌿</div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>{t("signup.title")}</h1>
                    <p className="subtitle" style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{t("signup.subtitle")}</p>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="error-banner mb-8" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span>⚠️</span> {error}
                            </div>
                        )}

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--secondary)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("signup.firstNameLabel")}</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder={t("signup.firstNamePlaceholder")}
                                style={{ height: '52px', fontSize: '1rem', padding: '0 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--secondary)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("signup.emailLabel")}</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder={t("signup.emailPlaceholder")}
                                style={{ height: '52px', fontSize: '1rem', padding: '0 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--secondary)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("signup.passwordLabel")}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    placeholder={t("signup.passwordPlaceholder")}
                                    style={{ height: '52px', fontSize: '1rem', padding: '0 1rem', paddingRight: '48px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', width: '100%' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px',
                                        borderRadius: '50%'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--secondary)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t("signup.confirmPasswordLabel")}</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    placeholder={t("signup.confirmPasswordPlaceholder")}
                                    style={{ height: '52px', fontSize: '1rem', padding: '0 1rem', paddingRight: '48px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', width: '100%' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px',
                                        borderRadius: '50%'
                                    }}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" style={{ width: '100%', height: '56px', fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} disabled={loading}>
                            {loading ? t("signup.creatingAccount") : t("signup.signupBtn")}
                        </button>
                    </form>
                </div>

                <div className="auth-footer" style={{ marginTop: '3rem', textAlign: 'center', fontSize: '1rem', color: 'var(--text-muted)' }}>
                    {t("signup.haveAccount")}
                    <Link to="/" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none', marginLeft: '0.5rem', borderBottom: '2px solid transparent' }}>
                        {t("signup.loginLink")}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
