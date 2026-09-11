import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="simple-page">
      <div className="simple-card" style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "48px", marginBottom: "10px" }}>404</h1>
        <h2>Page Not Found</h2>
        <p style={{ marginTop: "15px", marginBottom: "30px" }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="primary-btn full-btn" style={{ textDecoration: "none", display: "inline-block" }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
