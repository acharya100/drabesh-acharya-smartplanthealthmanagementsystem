import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";

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
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Validation
        if (!formData.email.trim() || !formData.username.trim() || !formData.password.trim()) {
            setError("Please fill in all fields");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            setLoading(false);
            return;
        }

        try {
            await axios.post("http://localhost:8000/api/auth/register/", {
                email: formData.email,
                username: formData.username,
                password: formData.password
            });

            // Registration successful, redirect to login
            navigate("/", { state: { message: "Account created successfully! Please login." } });
        } catch (err) {
            console.error(err);
            if (err.response?.data) {
                const errors = err.response.data;
                if (errors.email) {
                    setError(errors.email[0]);
                } else if (errors.username) {
                    setError(errors.username[0]);
                } else {
                    setError("Registration failed. Please try again.");
                }
            } else {
                setError("Server error. Please try again later.");
            }
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card animate-slide-up">
                <div className="auth-header">
                    <div className="auth-logo" style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌿</div>
                    <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--secondary)' }}>FloralIQ</h1>
                    <p className="subtitle" style={{ fontSize: '1rem', opacity: 0.8 }}>Initialize Botanical Management Account</p>
                </div>

                <div style={{ marginTop: '2.5rem' }}>
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="error-banner mb-8" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', fontWeight: 600 }}>
                                {error}
                            </div>
                        )}

                        <div className="form-group-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Access ID (Username)</label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    placeholder="Username"
                                    style={{ height: '52px' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Electronic Mail</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    placeholder="name@company.com"
                                    style={{ height: '52px' }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label style={{ color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Security Passphrase</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    placeholder="Minimum 8 characters"
                                    style={{ paddingRight: '46px', height: '52px' }}
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

                        <div className="form-group" style={{ marginBottom: '2rem' }}>
                            <label style={{ color: 'var(--secondary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Authentication Verification</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    placeholder="Repeat passphrase"
                                    style={{ paddingRight: '46px', height: '52px' }}
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
                                        color: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" style={{ width: '100%', height: '56px', fontSize: '1rem', fontWeight: 700 }} disabled={loading}>
                            {loading ? "Constructing Profile..." : "Finalize Enrollment"}
                        </button>
                    </form>
                </div>

                <div className="auth-footer" style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                    Existing operative? <Link to="/" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', marginLeft: '0.5rem' }}>Authorize Session</Link>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
