import { useAuth } from "../../context/AuthContext";

function AdminDashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="simple-page">
      <div className="simple-card">
        <h1>Admin Dashboard</h1>
        <p style={{ fontWeight: "bold" }}>Welcome, {user?.name}</p>
        <p>Role: <span style={{ color: "purple" }}>{user?.role}</span></p>

        {/* Dashboard Placeholder Content */}
        <div style={{ marginTop: "25px", padding: "15px", border: "1px dashed #ccc", borderRadius: "5px" }}>
          <h3>System Overview</h3>
          <p>Total Beneficiaries: 0</p>
          <p>Active Schemes: 0</p>
        </div>

        <div style={{ marginTop: "25px" }}>
          <button 
            className="primary-btn full-btn" 
            onClick={() => alert("Feature coming soon.")}
          >
            Manage Schemes
          </button>
        </div>

        <div style={{ marginTop: "15px" }}>
          <button className="back-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
