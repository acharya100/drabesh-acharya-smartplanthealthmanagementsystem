/**
 * User Login Page
 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

/**
 * Only unauthenticated users should see this.
 */
const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.username.trim() || !formData.password.trim()) {
      setError(t("login.errorEmpty"));
      setLoading(false);
      return;
    }

    try {
      const { data } = await authService.login({
        username: formData.username,
        password: formData.password
      });

      sessionStorage.setItem("access_token", data.access);
      sessionStorage.setItem("refresh_token", data.refresh);
      sessionStorage.setItem("username", data.username);
      sessionStorage.setItem("email", data.email || "");
      sessionStorage.setItem("user_id", data.user_id || "");
      sessionStorage.setItem("is_staff", data.is_staff ? "true" : "false");
      sessionStorage.setItem("is_superuser", data.is_superuser ? "true" : "false");
      sessionStorage.setItem("isAuthenticated", "true");

      if (data.is_staff || data.is_superuser) {
        navigate("/admin-panel");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError(t("login.errorInvalid"));
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <div className="login-card animate-slide-up" style={{ maxWidth: '440px', width: '100%', padding: '3rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', borderRadius: 'var(--radius-lg)', background: 'white' }}>
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="auth-logo" style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🌿</div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>{t("login.title")}</h1>
          <p className="subtitle" style={{ fontSize: '1.1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-banner mb-8" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--secondary)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t("login.usernameLabel")}
            </label>
            <input
              type="text"
              name="username"
              placeholder={t("login.usernamePlaceholder")}
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
              style={{ height: '52px', fontSize: '1rem', padding: '0 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', transition: 'all 0.2s' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--secondary)', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t("login.passwordLabel")}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={t("login.passwordPlaceholder")}
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                style={{ height: '52px', fontSize: '1rem', padding: '0 1rem', paddingRight: '48px', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', width: '100%', transition: 'all 0.2s' }}
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

          <button type="submit" className="btn-primary" style={{ width: '100%', height: '56px', fontSize: '1.1rem', fontWeight: 700, marginTop: '0.5rem', borderRadius: 'var(--radius-md)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', transition: 'transform 0.1s active' }} disabled={loading}>
            {loading ? t("login.loggingIn") : t("login.loginBtn")}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '3rem', textAlign: 'center', fontSize: '1rem', color: 'var(--text-muted)' }}>
          {t("login.noAccount")}
          <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none', marginLeft: '0.5rem', borderBottom: '2px solid transparent', transition: 'border-color 0.2s' }}>
            {t("login.signUp")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
