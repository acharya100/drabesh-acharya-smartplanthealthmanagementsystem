import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import { Eye, EyeOff, Leaf, ShieldCheck, Activity, Sprout, FlaskConical, ShoppingBag } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

/* ── 6-Box OTP Input ─────────────────────────────────────────── */
const OtpBoxes = ({ value, onChange, disabled }) => {
  const refs = useRef([]);
  const digits = (value || "").split("").slice(0, 6);
  while (digits.length < 6) digits.push("");

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      const next = [...digits];
      if (next[i]) { next[i] = ""; onChange(next.join("")); }
      else if (i > 0) { next[i - 1] = ""; onChange(next.join("")); refs.current[i - 1]?.focus(); }
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const next = [...digits]; next[i] = e.key; onChange(next.join(""));
    if (i < 5) refs.current[i + 1]?.focus();
  };
  const handlePaste = (e) => {
    e.preventDefault();
    const raw = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...digits];
    for (let j = 0; j < 6; j++) next[j] = raw[j] || "";
    onChange(next.join(""));
    refs.current[Math.min(raw.length, 5)]?.focus();
  };

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
      {digits.map((d, i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} type="text" inputMode="numeric"
          maxLength={1} value={d} onKeyDown={(e) => handleKeyDown(i, e)} onPaste={handlePaste}
          onChange={() => { }} disabled={disabled}
          style={{
            flex: 1, height: "52px", textAlign: "center", fontSize: "20px", fontWeight: "700",
            border: "1.5px solid var(--border-light)", borderRadius: "8px", background: "var(--bg-input)",
            outline: "none", color: "var(--text-main)"
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border-light)")} />
      ))}
    </div>
  );
};

const inputStyle = {
  width: "100%", height: "46px", fontSize: "14px", padding: "0 14px",
  border: "1.5px solid var(--border-light)", borderRadius: "8px",
  background: "var(--bg-input)", outline: "none", color: "var(--text-main)", boxSizing: "border-box",
};
const btnStyle = {
  width: "100%", height: "46px", background: "var(--primary)", color: "#fff",
  fontSize: "15px", fontWeight: 700, borderRadius: "8px", border: "none", cursor: "pointer",
  transition: "all 0.2s",
};
const labelStyle = { display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "6px" };
const errorBox = (msg) => msg ? (
  <div style={{
    background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
    padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "14px", lineHeight: 1.5
  }}>
    {msg}
  </div>
) : null;

/* ── Main Login Component ─────────────────────────────────────── */
const Login = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginLoading) return;
    setLoginError("");
    if (!username.trim() || !password.trim()) { setLoginError("Please fill in all fields."); return; }
    setLoginLoading(true);
    try {
      const { data } = await authService.login({ username, password });
      sessionStorage.setItem("access_token", data.access);
      sessionStorage.setItem("refresh_token", data.refresh);
      sessionStorage.setItem("username", data.username);
      sessionStorage.setItem("email", data.email || "");
      sessionStorage.setItem("userId", data.userId || "");
      sessionStorage.setItem("isStaff", data.isStaff ? "true" : "false");
      sessionStorage.setItem("isSuperuser", data.isSuperuser ? "true" : "false");
      sessionStorage.setItem("isAuthenticated", "true");
      if (data.isStaff || data.isSuperuser) navigate("/admin-panel");
      else navigate("/dashboard");
    } catch { setLoginError("Incorrect email or password."); setLoginLoading(false); }
  };

  useEffect(() => {
    let timer;
    if (forgotMode && forgotStep === "otp" && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    } else if (timeLeft === 0) setForgotError("The verification code has expired.");
    return () => clearInterval(timer);
  }, [forgotMode, forgotStep, timeLeft]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setForgotError("Please enter your email or phone number."); return; }
    setForgotError(""); setForgotLoading(true);
    try { await authService.forgotPassword(forgotEmail.trim()); setForgotStep("otp"); setTimeLeft(120); }
    catch (err) {
      const msg = err.response?.data?.error || "";
      setForgotError(msg === "invalid id" || msg === "User not found"
        ? "No account found with that email." : (msg || "Failed to send code."));
    } finally { setForgotLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.replace(/\s/g, "").length !== 6) { setForgotError("Enter the complete 6-digit code."); return; }
    if (timeLeft === 0) { setForgotError("Code expired. Please request a new one."); return; }
    setForgotError(""); setForgotLoading(true);
    try { await authService.verifyOtp(forgotEmail.trim(), otp.trim()); setForgotStep("password"); }
    catch (err) {
      const msg = err.response?.data?.error || "";
      setForgotError(msg === "wrong code" ? "Invalid code." : (msg || "Verification failed."));
    } finally { setForgotLoading(false); }
  };

  const handleFinalReset = async (e) => {
    e.preventDefault();
    if (newPwd.length < 8) { setForgotError("Password must be at least 8 characters."); return; }
    if (newPwd !== confirmPwd) { setForgotError("Passwords do not match."); return; }
    setForgotError(""); setForgotLoading(true);
    try { await authService.resetPassword(forgotEmail.trim(), otp.trim(), newPwd); setForgotStep("success"); }
    catch (err) { setForgotError(err.response?.data?.error || "Failed to reset password."); }
    finally { setForgotLoading(false); }
  };

  const resetForgot = () => {
    setForgotMode(false); setForgotStep("email"); setForgotEmail("");
    setOtp(""); setNewPwd(""); setConfirmPwd(""); setForgotError(""); setTimeLeft(120);
  };

  const features = [
    { icon: <Activity size={22} />, title: "AI Disease Detection", desc: "Instant leaf scan with 95%+ accuracy using deep learning models" },
    { icon: <Sprout size={22} />, title: "My Plants Manager", desc: "Track, monitor and manage all your plants in one dashboard" },
    { icon: <FlaskConical size={22} />, title: "Soil Analysis", desc: "Real-time soil health monitoring with expert recommendations" },
    { icon: <ShoppingBag size={22} />, title: "AgriMarketplace", desc: "Shop certified organic treatments and farming supplies" },
  ];

  const stats = [
    { value: "38+", label: "Plant Diseases Detected" },
    { value: "95%", label: "AI Accuracy Rate" },
    { value: "500+", label: "Farmers Helped" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-main)", display: "flex", flexDirection: "column" }}>

      {/* ── Top Navbar ── */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 3rem", height: "70px", background: "var(--bg-card)",
        borderBottom: "1px solid var(--border-light)", position: "sticky", top: 0, zIndex: 100,
      }}>
        {/* Left nav links */}
        <div style={{ display: "flex", gap: "2rem" }}>
          {[
            { label: "Dashboard", to: "/dashboard" },
            { label: "Detection", to: "/disease" },
            { label: "My Plants", to: "/plants" },
            { label: "Soil Analysis", to: "/soil" },
          ].map((item) => (
            <Link key={item.label} to={item.to}
              style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-muted)", cursor: "pointer", transition: "color 0.2s", textDecoration: "none" }}
              onMouseEnter={(e) => e.target.style.color = "var(--primary)"}
              onMouseLeave={(e) => e.target.style.color = "var(--text-muted)"}>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Center logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div style={{ width: 36, height: 36, background: "var(--primary)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Leaf size={20} color="white" />
          </div>
          <span style={{ fontWeight: 900, fontSize: "1.1rem", color: "var(--primary)", letterSpacing: "-0.02em" }}>
            SMART <span style={{ color: "var(--text-main)" }}>PLANT</span>
          </span>
        </div>

        {/* Right buttons */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <Link to="/signup" style={{
            padding: "0.5rem 1.25rem", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem",
            background: "var(--primary)", color: "white", textDecoration: "none", border: "none",
          }}>Sign Up</Link>
          <Link to="/" style={{
            padding: "0.5rem 1.25rem", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem",
            background: "transparent", color: "var(--primary)", border: "2px solid var(--primary)",
            cursor: "pointer", textDecoration: "none", display: "inline-block",
          }}>Sign In</Link>
        </div>
      </nav>

      {/* ── Main 3-Column Hero ── */}
      <div style={{
        flex: 1, display: "grid", gridTemplateColumns: "1fr auto 1fr",
        gap: "0", alignItems: "stretch", minHeight: "calc(100vh - 70px)",
      }}>

        {/* ── LEFT: Features ── */}
        <div style={{
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "4rem 3rem 4rem 4rem", gap: "2rem",
        }}>
          <div>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "var(--primary-subtle)", color: "var(--primary)",
              padding: "0.35rem 0.9rem", borderRadius: 100, fontSize: "0.75rem", fontWeight: 800,
              letterSpacing: "0.08em", marginBottom: "1.25rem",
            }}>
              🌿 AI-POWERED AGRICULTURE
            </div>
            <h1 style={{
              fontSize: "2.8rem", fontWeight: 900, lineHeight: 1.1, marginBottom: "1rem",
              color: "var(--text-main)", letterSpacing: "-0.03em",
            }}>
              Smart Plant<br />
              <span style={{ color: "var(--primary)" }}>Health</span> System
            </h1>
            <p style={{ fontSize: "1rem", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 380, marginBottom: "2rem" }}>
              Professional AI-powered agriculture analytics. Detect diseases, monitor soil health, and manage your farm instantly.
            </p>
          </div>

          {/* Feature list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {features.map((f, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: "1rem",
                padding: "1rem 1.25rem", background: "var(--bg-card)",
                borderRadius: 14, border: "1px solid var(--border-light)",
                transition: "all 0.2s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(16,185,129,0.1)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{
                  width: 40, height: 40, background: "var(--primary-subtle)", color: "var(--primary)",
                  borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--text-main)", marginBottom: "0.2rem" }}>{f.title}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
            {stats.map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: "1.75rem", fontWeight: 900, color: "var(--primary)", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600, marginTop: "0.2rem" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER: Plant Illustration ── */}
        <div style={{
          width: "340px", display: "flex", alignItems: "center", justifyContent: "center",
          background: "linear-gradient(180deg, var(--primary-subtle) 0%, transparent 100%)",
          borderLeft: "1px solid var(--border-light)", borderRight: "1px solid var(--border-light)",
          padding: "2rem", position: "relative", overflow: "hidden",
        }}>
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", width: 260, height: 260, borderRadius: "50%", background: "var(--primary-subtle)", zIndex: 0 }} />
          {/* Plant SVG Illustration */}
          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "10rem", lineHeight: 1, filter: "drop-shadow(0 20px 40px rgba(16,185,129,0.3))", marginBottom: "1.5rem" }}>
              🌱
            </div>
            <div style={{
              background: "var(--bg-card)", border: "1px solid var(--border-light)",
              borderRadius: 16, padding: "1rem 1.5rem", boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <ShieldCheck size={16} color="var(--primary)" />
                <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "var(--text-main)" }}>Plant Health Score</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ flex: 1, height: 8, background: "var(--border-light)", borderRadius: 100, overflow: "hidden" }}>
                  <div style={{ width: "87%", height: "100%", background: "var(--primary)", borderRadius: 100 }} />
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "var(--primary)" }}>87%</span>
              </div>
              <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                {["🌿 Healthy", "💧 Watered", "☀️ Good Light"].map((tag, i) => (
                  <span key={i} style={{
                    fontSize: "0.62rem", fontWeight: 700, padding: "0.2rem 0.5rem",
                    background: "var(--primary-subtle)", color: "var(--primary)", borderRadius: 100,
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Login Form ── */}
        <div style={{
          display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "4rem 4rem 4rem 3rem",
        }}>
          <div style={{
            background: "var(--bg-card)", borderRadius: 20, padding: "2.5rem",
            border: "1px solid var(--border-light)", boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            maxWidth: 400, width: "100%",
          }}>
            {forgotMode ? (
              /* ═══ FORGOT PASSWORD ═══ */
              <>
                {forgotStep === "email" && (
                  <>
                    <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)", marginBottom: "6px" }}>
                      {t("login.forgotTitle") || "Forgot Password?"}
                    </h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px", lineHeight: 1.6 }}>
                      Enter your account email and we'll send a reset code.
                    </p>
                    <form onSubmit={handleSendCode}>
                      {errorBox(forgotError)}
                      <div style={{ marginBottom: "16px" }}>
                        <label style={labelStyle}>Email or Phone</label>
                        <input type="text" placeholder="you@example.com" value={forgotEmail}
                          onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
                          required disabled={forgotLoading} style={inputStyle}
                          onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                          onBlur={(e) => e.target.style.borderColor = "var(--border-light)"} />
                      </div>
                      <button type="submit" style={btnStyle} disabled={forgotLoading}>
                        {forgotLoading ? "Sending..." : "Send Reset Code"}
                      </button>
                      <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--text-muted)" }}>
                        Remember it?{" "}
                        <span onClick={resetForgot} style={{ color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}>Sign in</span>
                      </p>
                    </form>
                  </>
                )}

                {forgotStep === "otp" && (
                  <>
                    <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)", marginBottom: "6px" }}>Verify Code</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px", lineHeight: 1.6 }}>
                      Code sent to <strong style={{ color: "var(--text-main)" }}>{forgotEmail}</strong>
                    </p>
                    <form onSubmit={handleVerifyOtp} autoComplete="off">
                      {errorBox(forgotError)}
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <label style={labelStyle}>Verification Code</label>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: timeLeft < 30 ? "#ef4444" : "var(--primary)" }}>
                          {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                        </span>
                      </div>
                      <OtpBoxes value={otp} onChange={setOtp} disabled={forgotLoading} />
                      <button type="submit" style={btnStyle} disabled={forgotLoading || timeLeft === 0}>
                        {forgotLoading ? "Verifying..." : "Verify Code"}
                      </button>
                      <p style={{ textAlign: "center", marginTop: "14px", fontSize: "13px", color: "var(--text-muted)" }}>
                        Didn't get it?{" "}
                        <span onClick={() => { setForgotStep("email"); setOtp(""); setForgotError(""); }}
                          style={{ color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}>Resend</span>
                      </p>
                    </form>
                  </>
                )}

                {forgotStep === "password" && (
                  <>
                    <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)", marginBottom: "6px" }}>New Password</h2>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Choose a strong new password.</p>
                    <form onSubmit={handleFinalReset} autoComplete="off">
                      {errorBox(forgotError)}
                      <div style={{ marginBottom: "14px" }}>
                        <label style={labelStyle}>New Password</label>
                        <div style={{ position: "relative" }}>
                          <input type={showNewPwd ? "text" : "password"} placeholder="At least 8 characters"
                            value={newPwd} onChange={(e) => { setNewPwd(e.target.value); setForgotError(""); }}
                            required disabled={forgotLoading} style={{ ...inputStyle, paddingRight: "44px" }}
                            onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                            onBlur={(e) => e.target.style.borderColor = "var(--border-light)"} />
                          <button type="button" onClick={() => setShowNewPwd(!showNewPwd)}
                            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                            {showNewPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                      </div>
                      <div style={{ marginBottom: "20px" }}>
                        <label style={labelStyle}>Confirm Password</label>
                        <div style={{ position: "relative" }}>
                          <input type={showConfirm ? "text" : "password"} placeholder="Confirm password"
                            value={confirmPwd} onChange={(e) => { setConfirmPwd(e.target.value); setForgotError(""); }}
                            required disabled={forgotLoading} style={{ ...inputStyle, paddingRight: "44px" }}
                            onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                            onBlur={(e) => e.target.style.borderColor = "var(--border-light)"} />
                          <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                            style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                            {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        </div>
                      </div>
                      <button type="submit" style={btnStyle} disabled={forgotLoading}>
                        {forgotLoading ? "Updating..." : "Update Password"}
                      </button>
                    </form>
                  </>
                )}

                {forgotStep === "success" && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 60, height: 60, background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)", marginBottom: "8px" }}>Password Reset!</h2>
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px" }}>
                      Your password has been updated. You can now sign in.
                    </p>
                    <button onClick={resetForgot} style={btnStyle}>Sign In</button>
                  </div>
                )}
              </>
            ) : (
              /* ═══ MAIN LOGIN ═══ */
              <>
                <div style={{ marginBottom: "1.5rem" }}>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-main)", marginBottom: "4px" }}>
                    {t("login.welcomeBack") || "Welcome back"}
                  </h2>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                    {t("login.subtitle") || "Sign in to manage your plant health"}
                  </p>
                </div>

                <form onSubmit={handleLogin} autoComplete="off">
                  {errorBox(loginError)}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={labelStyle}>{t("login.usernameLabel")}</label>
                    <input type="text" placeholder={t("login.usernamePlaceholder")}
                      value={username} onChange={(e) => { setUsername(e.target.value); setLoginError(""); }}
                      required disabled={loginLoading} style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border-light)"}
                      autoComplete="off" />
                  </div>
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <label style={labelStyle}>{t("login.passwordLabel")}</label>
                      <span onClick={() => {
                        if (!username.trim()) setLoginError(t("login.enterEmailFirst") || "Enter your email first.");
                        else { setForgotEmail(username.trim()); setForgotMode(true); setLoginError(""); }
                      }} style={{ fontSize: "12px", color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}>
                        {t("login.forgotPassword") || "Forgot password?"}
                      </span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <input type={showPwd ? "text" : "password"} placeholder={t("login.passwordPlaceholder")}
                        value={password} onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                        required disabled={loginLoading} style={{ ...inputStyle, paddingRight: "44px" }}
                        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--border-light)"}
                        autoComplete="new-password" />
                      <button type="button" onClick={() => setShowPwd(!showPwd)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
                        {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" style={btnStyle} disabled={loginLoading}
                    onMouseEnter={(e) => !loginLoading && (e.target.style.opacity = "0.9")}
                    onMouseLeave={(e) => (e.target.style.opacity = "1")}>
                    {loginLoading ? t("login.loggingIn") : t("login.loginBtn")}
                  </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "var(--text-muted)" }}>
                  {t("login.noAccount")}{" "}
                  <Link to="/signup" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
                    {t("login.signUp")}
                  </Link>
                </p>

                {/* Trust badges */}
                <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-light)", display: "flex", gap: "0.75rem" }}>
                  {[
                    { icon: "🔒", label: "SSL Secured" },
                    { icon: "🌿", label: "Eco Friendly" },
                    { icon: "🤖", label: "AI Powered" },
                  ].map((b, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center", padding: "0.5rem", background: "var(--bg-main)", borderRadius: 10, border: "1px solid var(--border-light)" }}>
                      <div style={{ fontSize: "1.1rem" }}>{b.icon}</div>
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-muted)", marginTop: "0.2rem" }}>{b.label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .login-center { display: none !important; }
          .login-left { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Login;
