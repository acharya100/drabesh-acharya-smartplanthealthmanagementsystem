import { useState } from "react";

import { useNavigate } from "react-router-dom";
import { login } from "../api";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
        email: formData.username, // mapping to 'email' key as expected by backend model
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
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">🌱</div>
          <h1>Plant Health System</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="login-footer">Default: admin@example.com / superuser</p>
      </div>
    </div>
  );
};

export default Login;
