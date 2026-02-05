/**
 * User Registration Page
 * 
 * Allows new users to create an account in the system.
 * It includes real-time validation for passwords and handles communication
 * with the backend to create the new user record.
 * 
 * Author: Drabesh Acharya
 */
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
        <div className="login-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '90vh', padding: '2rem' }}>
            <div className="login-card animate-slide-up" style={{ maxWidth: '500px', width: '100%', padding: '3rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <div className="auth-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div className="auth-logo" style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🌿</div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.5rem' }}>Smart Plant Health</h1>
                    <p className="subtitle" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Create an account to manage your plants</p>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="error-banner mb-8" style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 600 }}>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 700 }}>Username</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="Choose a username"
                                style={{ height: '50px' }}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 700 }}>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="your.name@example.com"
                                style={{ height: '50px' }}
                            />
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 700 }}>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    placeholder="At least 8 characters"
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

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 700 }}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    placeholder="Repeat your password"
                                    style={{ paddingRight: '46px', height: '50px' }}
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
                                        alignItems: 'center'
                                    }}
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" style={{ width: '100%', height: '54px', fontSize: '1rem', marginTop: '1rem' }} disabled={loading}>
                            {loading ? "Creating account..." : "Sign Up"}
                        </button>
                    </form>
                </div>

                <div className="auth-footer" style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none', marginLeft: '0.5rem' }}>Login</Link>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
