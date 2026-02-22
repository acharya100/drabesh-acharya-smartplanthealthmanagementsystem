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

      // Redirect admins to admin panel, regular users to dashboard
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
    <div className="login-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="login-card animate-slide-up" style={{ maxWidth: '440px', width: '100%', padding: '3rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
        <div className="auth-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div className="auth-logo" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🌿</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>{t("login.title")}</h1>
          <p className="subtitle" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-banner mb-8" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600 }}>
              {error}
            </div>
          )}

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 700 }}>{t("login.usernameLabel")}</label>
            <input
              type="text"
              name="username"
              placeholder={t("login.usernamePlaceholder")}
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
              style={{ height: '50px' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 700 }}>{t("login.passwordLabel")}</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={t("login.passwordPlaceholder")}
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                style={{ paddingRight: '46px', height: '50px' }}
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
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', height: '54px', fontSize: '1rem', marginTop: '1rem' }} disabled={loading}>
            {loading ? t("login.loggingIn") : t("login.loginBtn")}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          {t("login.noAccount")} <Link to="/signup" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', marginLeft: '0.5rem' }}>{t("login.signUp")}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
