import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import { Eye, EyeOff, UserPlus, Phone, CheckCircle, RefreshCw } from "lucide-react";

const OTP_LENGTH = 6;

const SignUp = () => {
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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  // ── Form Submit ────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.username.trim() || !formData.password.trim()) {
      setError("Please fill in your Full Name and Password.");
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("Please provide an Email Address.");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      await authService.register({
        email: formData.email,
        username: formData.username,
        password: formData.password
      });
      navigate("/", { state: { message: "Account created successfully! Please sign in." } });
    } catch (err) {
      console.error(err);
      if (err.response?.data) {
        const errors = err.response.data;
        if (errors.email) setError(errors.email[0]);
        else if (errors.username) setError(errors.username[0]);
        else setError("Failed to create account. Please try again.");
      } else {
        setError("Server error. Please try again later.");
      }
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', height: '52px', fontSize: '1rem', padding: '0 1.25rem',
    borderRadius: '12px', border: '2px solid rgba(0,0,0,0.08)',
    background: 'var(--bg-card)', transition: 'all 0.2s', outline: 'none', boxSizing: 'border-box'
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      {/* Left branding */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: '#064e3b' }} className="hide-on-mobile">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'url(/login-bg.jpg) center/cover no-repeat', opacity: 0.6 }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, rgba(6,78,59,0.4), rgba(4,47,46,0.9))' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '4rem', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', color: 'white' }}>
          <div>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🌿</div>
            <h1 style={{ fontSize: '2.75rem', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
              Join the Future of<br />Agriculture
            </h1>
            <p style={{ fontSize: '1.15rem', opacity: 0.85, maxWidth: '420px', lineHeight: 1.6 }}>
              Create an account to gain access to AI disease detection, premium fertilizers, and local agricultural experts.
            </p>
          </div>
          <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a7f3d0' }}>Why Join Us?</h4>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', lineHeight: 1.8, opacity: 0.9, fontWeight: 500, fontSize: '0.95rem' }}>
              <li>Instant AI crop disease diagnosis</li>
              <li>Purchase verified organic fertilizers</li>
              <li>Track all your plant health history</li>
              <li>Chat with our AI Plant Expert</li>
            </ul>
          </div>
        </div>
        <style>{`@media (max-width: 900px) { .hide-on-mobile { display: none !important; } }`}</style>
      </div>

      {/* Right form */}
      <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'var(--bg-main)', overflowY: 'auto' }}>
        <div style={{ maxWidth: '480px', width: '100%' }} className="animate-slide-up">
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--secondary)', marginBottom: '0.4rem', letterSpacing: '-0.03em' }}>Create an Account</h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Get started with Smart Plant Health Management System</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#b91c1c', padding: '0.875rem 1rem', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Full Name + Email row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name *</label>
                <input type="text" name="username" placeholder="John Doe" value={formData.username} onChange={handleChange} required disabled={loading}
                  style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'} autoComplete="off" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address *</label>
                <input type="email" name="email" placeholder="john@example.com" value={formData.email} onChange={handleChange} disabled={loading} required
                  style={inputStyle} onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'} autoComplete="off" />
              </div>
            </div>



            {/* Password fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password *</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="Min. 8 characters" value={formData.password} onChange={handleChange} required disabled={loading}
                    style={{ ...inputStyle, paddingRight: '3rem' }} onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Confirm Password *</label>
                <div style={{ position: 'relative' }}>
                  <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Re-enter password" value={formData.confirmPassword} onChange={handleChange} required disabled={loading}
                    style={{ ...inputStyle, paddingRight: '3rem' }} onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.08)'} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit"
              style={{ width: '100%', height: '54px', background: 'var(--primary)', color: 'white', fontSize: '1.05rem', fontWeight: 800, borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 8px 20px -5px rgba(16,185,129,0.4)', transition: 'filter 0.2s' }}
              disabled={loading} onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.1)'} onMouseOut={e => e.currentTarget.style.filter = 'brightness(1)'}>
              {loading ? "Creating Account..." : <><UserPlus size={20} /> Create Account</>}
            </button>
          </form>

          <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Already have an account?
            <Link to="/" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'none', marginLeft: '0.4rem' }}>Sign In</Link>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SignUp;
