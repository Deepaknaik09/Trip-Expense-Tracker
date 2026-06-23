import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isRegister ? "/api/register" : "/api/login";
      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong.");
      }

      if (result.success) {
        localStorage.setItem("user", JSON.stringify(result.user));
        onLogin(result.user);
      } else {
        setError(result.error || "Authentication failed.");
      }
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError("Cannot connect to backend. Please ensure the backend server is running on port 5000.");
      } else {
        setError(err.message || "Failed to authenticate.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f0f2f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        background: "#fff",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        padding: "40px 32px 32px",
      }}>
        {/* Logo & Title */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "52px",
            height: "52px",
            background: "#4a90d9",
            borderRadius: "10px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "14px"
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: "22px",
            fontWeight: "700",
            color: "#1a1a2e",
            margin: "0 0 4px",
          }}>
            Trip Expense Tracker
          </h1>
          <p style={{
            fontSize: "13px",
            color: "#888",
            margin: 0,
          }}>
            Track and split your travel expenses
          </p>
        </div>

        {/* Tab Switch */}
        <div style={{
          display: "flex",
          marginBottom: "20px",
          borderBottom: "2px solid #eee",
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setError(""); }}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              background: "none",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              color: !isRegister ? "#4a90d9" : "#999",
              borderBottom: !isRegister ? "2px solid #4a90d9" : "2px solid transparent",
              marginBottom: "-2px",
              transition: "color 0.2s",
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setError(""); }}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              background: "none",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              color: isRegister ? "#4a90d9" : "#999",
              borderBottom: isRegister ? "2px solid #4a90d9" : "2px solid transparent",
              marginBottom: "-2px",
              transition: "color 0.2s",
            }}
          >
            Register
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "10px 12px",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            color: "#b91c1c",
            fontSize: "13px",
            marginBottom: "16px",
            lineHeight: "1.4",
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#444",
              marginBottom: "6px"
            }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#4a90d9"}
              onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block",
              fontSize: "13px",
              fontWeight: "600",
              color: "#444",
              marginBottom: "6px"
            }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#4a90d9"}
              onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
            />
          </div>

          {isRegister && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#444",
                marginBottom: "6px"
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => e.target.style.borderColor = "#4a90d9"}
                onBlur={(e) => e.target.style.borderColor = "#d1d5db"}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px 0",
              background: "#4a90d9",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: "8px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { if (!loading) e.target.style.background = "#3a7bc8"; }}
            onMouseLeave={(e) => { e.target.style.background = "#4a90d9"; }}
          >
            {loading ? "Please wait..." : (isRegister ? "Create Account" : "Login")}
          </button>
        </form>

        {/* Footer text */}
        <p style={{
          textAlign: "center",
          fontSize: "12px",
          color: "#aaa",
          marginTop: "24px",
          marginBottom: 0,
        }}>
          Trip Expense Tracker &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
