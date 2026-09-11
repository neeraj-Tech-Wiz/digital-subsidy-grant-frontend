import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RoleBasedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="simple-page">
        <div style={{ textAlign: "center", marginTop: "50px" }}>Loading...</div>
      </div>
    );
  }

  // If we have a user but their role isn't in the allowed array
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If user is null (should normally not happen here because this is wrapped in ProtectedRoute)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default RoleBasedRoute;
