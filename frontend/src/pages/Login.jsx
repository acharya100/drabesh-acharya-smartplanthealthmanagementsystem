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
          <div className="auth-logo">🌱</div>
          <h1>Welcome Back</h1>
          <p className="subtitle">Sign in to manage your plant health</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-banner mb-8">{error}</div>}
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="text"
              name="username"
              placeholder="name@company.com"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                style={{ paddingRight: '46px' }}
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
                  color: 'var(--text-light)',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1.5rem', height: '50px' }} disabled={loading}>
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup" className="nav-link" style={{ color: 'var(--primary)', display: 'inline', padding: 0 }}>Create one</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
