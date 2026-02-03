import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.username.trim() || !formData.password.trim()) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      // NOTE: Our backend uses 'email' as the username field, but the form uses 'username'.
      // If the user inputs a username, we map it to 'email' if valid, or just send it as is.
      // However, our backend explicitly expects 'email' in the login body if we use the default TokenObtainPairView
      // BUT we customized the User model to use 'email'. TokenObtainPairView expects 'username' key by default unless configured.
      // Let's check settings... defaulting to standard behavior: it sends 'username' and 'password'.
      // Django's authenticate() method uses the USERNAME_FIELD which is 'email'.
      // So sending JSON { "username": "user@example.com", "password": "..." } should work even if the field is 'email'.

      const { data } = await login({
        username: formData.username, // TokenObtainPairView expects 'username' key
        password: formData.password
      });

      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);
      localStorage.setItem("isAuthenticated", "true");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid credentials or server error");
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-slide-up">
        <div className="auth-header">
          <div className="auth-logo" style={{ fontSize: '3rem', marginBottom: '1rem' }}>�</div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--secondary)' }}>FloralIQ</h1>
          <p className="subtitle" style={{ fontSize: '1rem', opacity: 0.8 }}>Advanced Botanical Health Management</p>
        </div>

        <div style={{ marginTop: '2.5rem' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error-banner mb-8" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600 }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label style={{ color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>User Identifier</label>
              <input
                type="text"
                name="username"
                placeholder="registered@email.com"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={loading}
                style={{ height: '52px', fontSize: '1rem' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label style={{ color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Security Credential</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  style={{ paddingRight: '46px', height: '52px', fontSize: '1rem' }}
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
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', height: '56px', fontSize: '1rem', fontWeight: 700 }} disabled={loading}>
              {loading ? "Authenticating Architecture..." : "Establish Session"}
            </button>
          </form>
        </div>

        <div className="auth-footer" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)', fontSize: '0.9rem', color: 'var(--text-light)' }}>
          System enrollment pending? <Link to="/signup" className="nav-link" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', marginLeft: '0.5rem' }}>Initialize Account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
