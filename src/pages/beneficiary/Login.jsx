import { useState } from "react";

function Login({ onLoginSuccess, onBack }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const text = await response.text();

      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(
          data.message || "Invalid email or password"
        );
      }

      console.log("Login response:", data);

      // Store JWT token
        // Store JWT token
    localStorage.setItem("token", data.token);

    // Store logged-in user information
    localStorage.setItem(
      "user",
      JSON.stringify({
        userId: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
      })
    );

      alert("Login successful!");

      // Open beneficiary dashboard
      if (onLoginSuccess) {
        onLoginSuccess();
      }

    } catch (error) {
      console.error("Login error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simple-page">

      <div className="simple-card">

        <h1>Beneficiary Login</h1>

        <p>
          Login using your registered email and password.
        </p>

        {error && (
          <div
            style={{
              color: "red",
              marginBottom: "15px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* EMAIL */}
          <input
            type="email"
            name="email"
            placeholder="Enter your registered email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {/* PASSWORD */}
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {/* LOGIN */}
          <button
            type="submit"
            className="primary-btn full-btn"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {/* BACK */}
        <button
          className="back-btn"
          onClick={onBack}
        >
          ← Back to Home
        </button>

      </div>

    </div>
  );
}

export default Login;