import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import { User, Mail, Lock, AlertCircle, Check } from "lucide-react";
import "./Login.css";

// Import background image
import background from "./content/images/back.png";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        email,
        createdAt: new Date().toISOString(),
      });

      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ backgroundImage: `url(${background})`, backgroundSize: "cover", backgroundPosition: "center", width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="form-container" style={{ width: "500px", padding: "40px", borderRadius: "16px", backgroundColor: "rgba(255, 255, 255, 0.9)", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", border: "2px solid #4CAF50" }}>
        <h2 className="sign-in-header" style={{ fontSize: "36px", textAlign: "center", color: "#4CAF50" }}>Sign Up</h2>
        {error && (
          <div className="error-message" style={{ display: "flex", alignItems: "center", color: "#D32F2F", marginBottom: "12px" }}>
            <AlertCircle style={{ marginRight: "8px" }} /> {error}
          </div>
        )}
        <form onSubmit={handleSignup}>
          <div className="input-group">
            <label><User style={{ color: "#4CAF50", marginRight: "8px" }} /> First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label><User style={{ color: "#4CAF50", marginRight: "8px" }} /> Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label><Mail style={{ color: "#4CAF50", marginRight: "8px" }} /> Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label><Lock style={{ color: "#4CAF50", marginRight: "8px" }} /> Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label><Lock style={{ color: "#4CAF50", marginRight: "8px" }} /> Confirm Password</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
          <button type="submit" className={`submit-button ${loading ? "loading" : ""}`} disabled={loading} style={{ backgroundColor: "#4CAF50", color: "white", padding: "12px", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
        <div className="text-link" style={{ marginTop: "16px", textAlign: "center" }}>
          <p>Already have an account? <Link to="/login" style={{ color: "#4CAF50" }}>Log in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
