import { useState } from "react";

import Register from "./pages/beneficiary/Register";
import Login from "./pages/beneficiary/Login";

import BeneficiaryRegistration from "./pages/beneficiary/BeneficiaryRegistration";
import BeneficiaryList from "./pages/beneficiary/BeneficiaryList";

import SchemeList from "./pages/scheme/SchemeList";
import SchemeManagement from "./pages/scheme/SchemeManagement";

import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  return (
    <div className="app">

      {/* =====================================================
          HOME PAGE
      ===================================================== */}
      {currentPage === "home" && (
        <div className="home-page">

          {/* HEADER */}
          <header className="home-navbar">

            <div className="brand">
              <h2>Subsidy Management System</h2>
            </div>

            <div className="home-nav-buttons">

              {/* LOGIN */}
              <button
                className="login-btn"
                onClick={() => setCurrentPage("login")}
              >
                Login
              </button>

              {/* REGISTER */}
              <button
                className="register-btn-home"
                onClick={() => setCurrentPage("register")}
              >
                Register
              </button>

            </div>

          </header>


          {/* HERO SECTION */}
          <section className="hero-section">

            <div className="hero-content">

              <p className="hero-tag">
                DIGITAL SUBSIDY & GRANT PLATFORM
              </p>

              <h1>
                Transparent & Efficient
                <br />
                Subsidy Management
              </h1>

              <p className="hero-description">
                A digital platform for managing government subsidies
                and grants from beneficiary registration to approval,
                disbursement and utilization.
              </p>

            </div>

          </section>


          {/* FEATURES */}
          <section className="features-section">

            <h2>Platform Features</h2>

            <p className="features-subtitle">
              Manage the complete subsidy lifecycle through one platform.
            </p>

            <div className="features-grid">

              <div className="feature-card">
                <div className="feature-icon">👤</div>

                <h3>Beneficiary Management</h3>

                <p>
                  Register and maintain beneficiary information securely.
                </p>
              </div>


              <div className="feature-card">
                <div className="feature-icon">📋</div>

                <h3>Scheme Management</h3>

                <p>
                  Manage government schemes, eligibility criteria
                  and grant information.
                </p>
              </div>


              <div className="feature-card">
                <div className="feature-icon">✓</div>

                <h3>Verification & Approval</h3>

                <p>
                  Support field verification and multi-level
                  approval workflows.
                </p>
              </div>


              <div className="feature-card">
                <div className="feature-icon">💰</div>

                <h3>Fund Management</h3>

                <p>
                  Track subsidy disbursement and utilization
                  throughout the process.
                </p>
              </div>

            </div>

          </section>


          {/* FOOTER */}
          <footer className="home-footer">
            <p>
              © 2026 Subsidy Management System
            </p>
          </footer>

        </div>
      )}


      {/* =====================================================
          REGISTER PAGE
      ===================================================== */}
      {currentPage === "register" && (
        <Register
          onRegistered={() => setCurrentPage("login")}
          onBack={() => setCurrentPage("home")}
        />
      )}


      {/* =====================================================
          LOGIN PAGE
      ===================================================== */}
      {currentPage === "login" && (
        <Login
          onLoginSuccess={() =>
            setCurrentPage("beneficiary-dashboard")
          }
          onBack={() =>
            setCurrentPage("home")
          }
        />
      )}


      {/* =====================================================
          BENEFICIARY DASHBOARD
      ===================================================== */}
      {currentPage === "beneficiary-dashboard" && (
        <div className="simple-page">

          <div className="simple-card">

            <h1>Beneficiary Dashboard</h1>

            <p>
              Welcome to the Subsidy Management System.
            </p>

            {/* COMPLETE PROFILE */}
            <div style={{ marginTop: "25px" }}>

              <button
                className="primary-btn full-btn"
                onClick={() =>
                  setCurrentPage("beneficiary-registration")
                }
              >
                Complete Beneficiary Profile
              </button>

            </div>


            {/* VIEW SCHEMES */}
            <div style={{ marginTop: "15px" }}>

              <button
                className="primary-btn full-btn"
                onClick={() =>
                  setCurrentPage("schemes")
                }
              >
                View Available Schemes
              </button>

            </div>


            {/* LOGOUT */}
            <div style={{ marginTop: "15px" }}>

              <button
                className="back-btn"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  setCurrentPage("home");
                }}
              >
                Logout
              </button>

            </div>

          </div>

        </div>
      )}


      {/* =====================================================
          BENEFICIARY PROFILE
      ===================================================== */}
      {currentPage === "beneficiary-registration" && (
        <>
          <div className="back-home-container">

            <button
              className="back-home-btn"
              onClick={() =>
                setCurrentPage("beneficiary-dashboard")
              }
            >
              ← Back to Dashboard
            </button>

          </div>

          <BeneficiaryRegistration />

        </>
      )}


      {/* =====================================================
          BENEFICIARY LIST
      ===================================================== */}
      {currentPage === "list" && (
        <>
          <div className="back-home-container">

            <button
              className="back-home-btn"
              onClick={() =>
                setCurrentPage("home")
              }
            >
              ← Home
            </button>

          </div>

          <BeneficiaryList />

        </>
      )}


      {/* =====================================================
          SCHEME LIST
      ===================================================== */}
      {currentPage === "schemes" && (
        <>
          <div className="back-home-container">

            <button
              className="back-home-btn"
              onClick={() =>
                setCurrentPage("beneficiary-dashboard")
              }
            >
              ← Back to Dashboard
            </button>

          </div>

          <SchemeList />

        </>
      )}


      {/* =====================================================
          SCHEME MANAGEMENT
      ===================================================== */}
      {currentPage === "scheme-management" && (
        <>
          <div className="back-home-container">

            <button
              className="back-home-btn"
              onClick={() =>
                setCurrentPage("home")
              }
            >
              ← Home
            </button>

          </div>

          <SchemeManagement />

        </>
      )}

    </div>
  );
}

export default App;