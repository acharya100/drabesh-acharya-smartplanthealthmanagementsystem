import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/api";
import { Eye, EyeOff } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";

/* -- 6-Box OTP Input ------------------------------------------- */
const OtpBoxes = ({ value, onChange, disabled }) => {
  const refs = useRef([]);
  const digits = (value || "").split("").slice(0, 6);
  while (digits.length < 6) digits.push("");

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      const next = [...digits];
      if (next[i]) {
        next[i] = "";
        onChange(next.join(""));
      } else if (i > 0) {
        next[i - 1] = "";
        onChange(next.join(""));
        refs.current[i - 1]?.focus();
      }
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const next = [...digits];
    next[i] = e.key;
    onChange(next.join(""));
    if (i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const raw = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...digits];
    for (let j = 0; j < 6; j++) next[j] = raw[j] || "";
    onChange(next.join(""));
    const focus = Math.min(raw.length, 5);
    refs.current[focus]?.focus();
  };

  return (
    <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onChange={() => { }}
          disabled={disabled}
          style={{
            flex: 1,
            height: "56px",
            textAlign: "center",
            fontSize: "22px",
            fontWeight: "700",
            border: "1.5px solid var(--border-light)",
            borderRadius: "8px",
            background: "var(--bg-input)",
            outline: "none",
            color: "var(--text-main)",
            cursor: disabled ? "not-allowed" : "text",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--border-focus)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border-light)")}
        />
      ))}
    </div>
  );
};

/* -- Shared Styles (CSS vars for dark/light mode) ------------- */
const inputStyle = {
  width: "100%",
  height: "48px",
  fontSize: "15px",
  padding: "0 14px",
  border: "1.5px solid var(--border-light)",
  borderRadius: "8px",
  background: "var(--bg-input)",
  outline: "none",
  color: "var(--text-main)",
  boxSizing: "border-box",
};

const btnStyle = {
  width: "100%",
  height: "48px",
  background: "var(--primary)",
  color: "#fff",
  fontSize: "16px",
  fontWeight: 700,
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
};

const labelStyle = {
  display: "block",
  fontSize: "14px",
  fontWeight: 600,
  color: "var(--text-secondary)",
  marginBottom: "8px",
};


const errorBox = (msg) =>
  msg ? (
    <div
      style={{
        background: "#fef2f2",
        border: "1px solid #fecaca",
        color: "#b91c1c",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "14px",
        marginBottom: "16px",
        lineHeight: 1.5,
      }}
    >
      {msg}
    </div>
  ) : null;

/* -- Main Login Component - */
const Login = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  /* Login state */
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  /* Forgot password state */
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState("email"); // email | otp | password | success
  const [forgotEmail, setForgotEmail] = useState(""); // Stores email OR phone
  const [otp, setOtp] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds

  /* -- Login submit -- */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (loginLoading) return;
    setLoginError("");
    if (!username.trim() || !password.trim()) {
      setLoginError("Please fill in all fields.");
      return;
    }
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
    } catch {
      setLoginError("Incorrect email or password. Please check your credentials.");
      setLoginLoading(false);
    }
  };

  /* -- Countdown Timer for OTP -- */
  useEffect(() => {
    let timer;
    if (forgotMode && forgotStep === "otp" && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setForgotError("The verification code has expired. Please request a new one.");
    }
    return () => clearInterval(timer);
  }, [forgotMode, forgotStep, timeLeft]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your email or phone number.");
      return;
    }
    setForgotError("");
    setForgotLoading(true);
    try {
      await authService.forgotPassword(forgotEmail.trim());
      setForgotStep("otp");
      setTimeLeft(120); // Reset timer to 2 minutes
    } catch (err) {
      const msg = err.response?.data?.error || "";
      if (msg === "invalid id" || msg === "User not found") setForgotError("Incorrect details. No account found with that email or phone number.");
      else setForgotError(msg || "Failed to send code. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  /* -- Stage 2: Verify OTP -- */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.replace(/\s/g, "").length !== 6) {
      setForgotError("Please enter the complete 6-digit verification code.");
      return;
    }
    if (timeLeft === 0) {
      setForgotError("This code has expired. Please request a new one.");
      return;
    }
    setForgotError("");
    setForgotLoading(true);
    try {
      await authService.verifyOtp(forgotEmail.trim(), otp.trim());
      setForgotStep("password");
    } catch (err) {
      const msg = err.response?.data?.error || "";
      setForgotError(msg === "wrong code" ? "Invalid code. Please check and try again." : (msg || "Verification failed."));
    } finally {
      setForgotLoading(false);
    }
  };

  /* -- Stage 3: Set New Password -- */
  const handleFinalReset = async (e) => {
    e.preventDefault();
    if (newPwd.length < 8) {
      setForgotError("Password must be at least 8 characters long.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setForgotError("Passwords do not match.");
      return;
    }
    setForgotError("");
    setForgotLoading(true);
    try {
      await authService.resetPassword(forgotEmail.trim(), otp.trim(), newPwd);
      setForgotStep("success");
    } catch (err) {
      setForgotError(err.response?.data?.error || "Failed to reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgot = () => {
    setForgotMode(false);
    setForgotStep("email");
    setForgotEmail("");
    setOtp("");
    setNewPwd("");
    setConfirmPwd("");
    setForgotError("");
    setTimeLeft(120);
  };

  const cardStyle = {
    background: "var(--bg-card)",
    borderRadius: "16px",
    padding: "48px 40px",
    boxShadow: "0 4px 32px rgba(0,0,0,0.09)",
    maxWidth: "460px",
    width: "100%",
    border: "1px solid var(--border-light)",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-main)" }}>
      {/* -- Left green panel -- */}
      <div
        className="hide-on-mobile"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          background: "#064e3b",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "url(/login-bg.jpg) center/cover no-repeat",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(6,78,59,0.4), rgba(4,47,46,0.9))",
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 1,
            padding: "4rem",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "space-between",
            color: "white",
          }}
        >
          <div>
            <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>    </div>
            <h1
              style={{
                fontSize: "3rem",
                fontWeight: 900,
                lineHeight: 1.1,
                marginBottom: "1.5rem",
                letterSpacing: "-0.03em",
              }}
            >
              Smart Plant Health
              <br />
              Management System
            </h1>
            <p style={{ fontSize: "1.25rem", opacity: 0.85, maxWidth: "450px", lineHeight: 1.6 }}>
              Professional AI-powered agriculture analytics. Detect diseases, monitor soil health, and manage your
              e-commerce workflow instantly.
            </p>
          </div>
        </div>
        <style>{`@media(max-width:900px){.hide-on-mobile{display:none!important}}`}</style>
      </div>

      {/* -- Right content panel -- */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "var(--bg-main)",
        }}
      >
        {forgotMode ? (
          /* =========== FORGOT PASSWORD =========== */
          <div style={cardStyle}>

            {/* Step 1: Enter email */}
            {forgotStep === "email" && (
              <>
                <h2 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)", marginBottom: "8px", textAlign: "center" }}>
                  {t("login.forgotTitle") || "Forgot your password?"}
                </h2>
                <p style={{ fontSize: "15px", color: "var(--text-muted)", textAlign: "center", marginBottom: "28px", lineHeight: 1.6 }}>
                  {t("login.forgotDesc") || "Enter your account email or phone number and we'll send you a reset code."}
                </p>
                <form onSubmit={handleSendCode}>
                  {errorBox(forgotError)}
                  <div style={{ marginBottom: "20px" }}>
                    <label style={labelStyle}>{t("login.usernameLabel") || "Email or Phone Number"}</label>
                    <input
                      type="text"
                      placeholder={t("login.usernamePlaceholder") || "you@example.com or +977 980..."}
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
                      required
                      disabled={forgotLoading}
                      style={inputStyle}
                      onFocus={(e) => { e.target.style.borderColor = "var(--border-focus)"; e.target.style.background = "var(--bg-card)"; }}
                      onBlur={(e) => { e.target.style.borderColor = "var(--border-light)"; e.target.style.background = "var(--bg-input)"; }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={btnStyle}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (t("login.loggingIn") || "Sending...") : (t("login.sendCode") || "Send Reset Code")}
                  </button>
                  <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--text-muted)" }}>
                    {t("login.rememberPassword") || "Remember your password?"}{" "}
                    <span onClick={resetForgot} style={{ color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}>
                      {t("login.loginBtn") || "Sign in"}
                    </span>
                  </p>
                </form>
              </>
            )}

            {/* Step 2: Enter OTP Code */}
            {forgotStep === "otp" && (
              <>
                <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", marginBottom: "8px", textAlign: "center" }}>
                  {t("login.verifyTitle") || "Verify it's you"}
                </h2>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", textAlign: "center", marginBottom: "24px", lineHeight: 1.6 }}>
                  {t("login.verifyDesc") || "Enter the 6-digit code sent to"}{" "}
                  <strong style={{ color: "var(--text-main)" }}>{forgotEmail}</strong>
                </p>
                <form onSubmit={handleVerifyOtp} autoComplete="off">
                  {errorBox(forgotError)}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <label style={labelStyle}>{t("login.verificationCode") || "Verification Code"}</label>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: timeLeft < 30 ? "#ef4444" : "var(--text-main)" }}>
                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')} {t("login.remaining") || "remaining"}
                      </span>
                    </div>
                    <OtpBoxes value={otp} onChange={setOtp} disabled={forgotLoading} />
                  </div>
                  <button
                    type="submit"
                    style={btnStyle}
                    disabled={forgotLoading || timeLeft === 0}
                  >
                    {forgotLoading ? (t("login.loggingIn") || "Verifying...") : (t("login.verifyCode") || "Verify Code")}
                  </button>
                  <p style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "var(--text-muted)" }}>
                    {t("login.didntGetCode") || "Didn't get the code?"}{" "}
                    <span
                      onClick={() => { setForgotStep("email"); setOtp(""); setForgotError(""); }}
                      style={{ color: "var(--primary)", fontWeight: 700, cursor: "pointer" }}
                    >
                      {t("login.resendCode") || "Resend code"}
                    </span>
                  </p>
                </form>
              </>
            )}

            {/* Step 3: Enter new password */}
            {forgotStep === "password" && (
              <>
                <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", marginBottom: "8px", textAlign: "center" }}>
                  {t("login.secureTitle") || "Secure your account"}
                </h2>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", textAlign: "center", marginBottom: "24px", lineHeight: 1.6 }}>
                  {t("login.secureDesc") || "Code verified! Please choose a strong new password for your account."}
                </p>
                <form onSubmit={handleFinalReset} autoComplete="off">
                  {errorBox(forgotError)}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={labelStyle}>{t("login.newPassword") || "New Password"}</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showNewPwd ? "text" : "password"}
                        placeholder={t("login.newPasswordPlaceholder") || "At least 8 characters"}
                        value={newPwd}
                        onChange={(e) => { setNewPwd(e.target.value); setForgotError(""); }}
                        required
                        disabled={forgotLoading}
                        style={{ ...inputStyle, paddingRight: "44px" }}
                        onFocus={(e) => { e.target.style.borderColor = "var(--border-focus)"; e.target.style.background = "var(--bg-card)"; }}
                        onBlur={(e) => { e.target.style.borderColor = "var(--border-light)"; e.target.style.background = "var(--bg-input)"; }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                      >
                        {showNewPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div style={{ marginBottom: "24px" }}>
                    <label style={labelStyle}>{t("signup.confirmPasswordLabel") || "Confirm Password"}</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder={t("signup.confirmPasswordPlaceholder") || "Confirm your new password"}
                        value={confirmPwd}
                        onChange={(e) => { setConfirmPwd(e.target.value); setForgotError(""); }}
                        required
                        disabled={forgotLoading}
                        style={{ ...inputStyle, paddingRight: "44px" }}
                        onFocus={(e) => { e.target.style.borderColor = "var(--border-focus)"; e.target.style.background = "var(--bg-card)"; }}
                        onBlur={(e) => { e.target.style.borderColor = "var(--border-light)"; e.target.style.background = "var(--bg-input)"; }}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                      >
                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    style={btnStyle}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? (t("settings.updating") || "Updating...") : (t("settings.updatePassword") || "Update Password")}
                  </button>
                </form>
              </>
            )}

            {/* Step 4: Success */}
            {forgotStep === "success" && (
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    background: "#dcfce7",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text-main)", marginBottom: "8px" }}>{t("login.resetSuccess") || "Password Reset!"}</h2>
                <p style={{ fontSize: "15px", color: "var(--text-muted)", marginBottom: "32px" }}>
                  {t("login.resetSuccessDesc") || "Your password has been successfully updated. You can now sign in."}
                </p>
                <button
                  onClick={resetForgot}
                  style={btnStyle}
                >
                  {t("login.loginBtn") || "Sign In"}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* =========== MAIN LOGIN =========== */
          <div style={cardStyle}>
            <h2 style={{ fontSize: "26px", fontWeight: 800, color: "var(--text-main)", marginBottom: "6px", textAlign: "center" }}>
              {t("login.welcomeBack") || "Welcome back"}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", textAlign: "center", marginBottom: "32px" }}>
              {t("login.subtitle") || "Sign in to manage your plant health"}
            </p>
            <form onSubmit={handleLogin} autoComplete="off">
              {errorBox(loginError)}
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle}>{t("login.usernameLabel")}</label>
                <input
                  type="text"
                  placeholder={t("login.usernamePlaceholder")}
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setLoginError(""); }}
                  required
                  disabled={loginLoading}
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "var(--border-focus)"; e.target.style.background = "var(--bg-card)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-light)"; e.target.style.background = "var(--bg-input)"; }}
                  autoComplete="off"
                />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={labelStyle}>{t("login.passwordLabel")}</label>
                  <span
                    onClick={() => {
                      if (!username.trim()) {
                        setLoginError(t("login.enterEmailFirst") || "Please enter your email address before resetting your password.");
                      } else {
                        setForgotEmail(username.trim());
                        setForgotMode(true);
                        setLoginError("");
                      }
                    }}
                    style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 600, cursor: "pointer" }}
                  >
                    {t("login.forgotPassword") || "Forgot your password?"}
                  </span>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder={t("login.passwordPlaceholder")}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setLoginError(""); }}
                    required
                    disabled={loginLoading}
                    style={{ ...inputStyle, paddingRight: "44px" }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--border-focus)"; e.target.style.background = "var(--bg-card)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--border-light)"; e.target.style.background = "var(--bg-input)"; }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex" }}
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                style={btnStyle}
                disabled={loginLoading}
              >
                {loginLoading ? t("login.loggingIn") : t("login.loginBtn")}
              </button>
            </form>
            <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px", color: "var(--text-muted)" }}>
              {t("login.noAccount")}{" "}
              <Link to="/signup" style={{ color: "var(--primary)", fontWeight: 700, textDecoration: "none" }}>
                {t("login.signUp")}
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
