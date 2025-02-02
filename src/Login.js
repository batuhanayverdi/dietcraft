import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, AlertCircle } from "lucide-react";
import './Login.css';

// Import the background image
import backgroundImage from './content/images/back.png';

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { email, password } = formData;
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/home");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!formData.email) {
      setError("Please enter your email address to reset your password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, formData.email);
      setError("Password reset email sent! Please check your inbox.");
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="login-container" style={{ 
      backgroundImage: `url(${backgroundImage})`, 
      backgroundSize: 'cover', 
      backgroundPosition: 'center center', 
      backgroundAttachment: 'fixed', 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div className="form-container" style={{ width: "500px", padding: "40px", borderRadius: "16px", backgroundColor: "rgba(255, 255, 255, 0.9)", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", border: "2px solid #4CAF50" }}>
        <h2 className="sign-in-header" style={{ fontSize: "36px", textAlign: "center", color: "#4CAF50" }}>Sign In</h2>
        {error && (
          <div className="error-message" style={{ display: "flex", alignItems: "center", color: "#D32F2F", marginBottom: "12px" }}>
            <AlertCircle style={{ marginRight: "8px" }} /> {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label><Mail style={{ color: "#4CAF50", marginRight: "8px" }} /> Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label><Lock style={{ color: "#4CAF50", marginRight: "8px" }} /> Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
            <div className="flex items-center">
              <input id="rememberMe" name="rememberMe" type="checkbox" checked={formData.rememberMe} onChange={handleChange} />
              <label htmlFor="rememberMe" style={{ marginLeft: "8px" }}>Remember me</label>
            </div>
            <button type="button" onClick={handleResetPassword} className="forgot-password" style={{ color: "#4CAF50", background: "none", border: "none", cursor: "pointer" }}>
              Forgot your password?
            </button>
          </div>
          <button type="submit" className={`submit-button ${loading ? 'loading' : ''}`} disabled={loading} style={{ backgroundColor: "#4CAF50", color: "white", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="text-link" style={{ marginTop: "16px", textAlign: "center" }}>
          <p>Don't have an account? <Link to="/signup" style={{ color: "#4CAF50" }}>Sign up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
