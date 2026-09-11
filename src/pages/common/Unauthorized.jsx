import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleGoBack = () => {
    if (user) {
       switch (user.role) {
         case "BENEFICIARY": return navigate("/beneficiary/dashboard");
         case "ADMIN": return navigate("/admin/dashboard");
         case "LEVEL_1_OFFICER":
         case "LEVEL_2_OFFICER":
         case "LEVEL_3_OFFICER":
         case "FINAL_APPROVAL_OFFICER":
           return navigate("/officer/dashboard");
         default: return navigate("/");
       }
    }
    navigate("/");
  };

  return (
    <div className="simple-page">
      <div className="simple-card" style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "48px", marginBottom: "10px", color: "red" }}>403</h1>
        <h2>Access Denied</h2>
        <p style={{ marginTop: "15px", marginBottom: "30px" }}>
          You do not have permission to view this page.
        </p>
        <button onClick={handleGoBack} className="primary-btn full-btn">
          Go To My Dashboard
        </button>
      </div>
    </div>
  );
}

export default Unauthorized;
