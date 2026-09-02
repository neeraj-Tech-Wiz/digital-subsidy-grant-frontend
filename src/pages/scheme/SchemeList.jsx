import { useEffect, useState } from "react";
import "./SchemeList.css";

function SchemeList() {
  const [schemes, setSchemes] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch active schemes from backend
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Please login first.");
        }

        const response = await fetch(
          "http://localhost:8080/api/schemes/active",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load schemes. Status: ${response.status}`
          );
        }

        const data = await response.json();

        console.log("Schemes API response:", data);

        setSchemes(data);
      } catch (err) {
        console.error("Scheme fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchemes();
  }, []);

  // Get unique categories from backend schemes
  const categories = [
    "All",
    ...new Set(
      schemes
        .map((scheme) => scheme.beneficiaryCategory)
        .filter(Boolean)
    ),
  ];

  // Search and category filtering
  const filteredSchemes = schemes.filter((scheme) => {
    const schemeName = scheme.schemeName || "";
    const schemeCode = scheme.schemeCode || "";
    const schemeCategory = scheme.beneficiaryCategory || "";

    const matchesSearch =
      schemeName.toLowerCase().includes(search.toLowerCase()) ||
      schemeCode.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || schemeCategory === category;

    return matchesSearch && matchesCategory;
  });

  // Loading
  if (loading) {
    return (
      <div className="scheme-page">
        <div className="scheme-container">
          <div className="no-schemes">
            Loading available schemes...
          </div>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="scheme-page">
        <div className="scheme-container">
          <div className="no-schemes">
            <h3>Unable to load schemes</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scheme-page">

      {/* HEADER */}
      <div className="scheme-header">
        <div>
          <h1>Subsidy Management System</h1>
          <h2>Available Schemes</h2>
          <p>
            View active government subsidy and grant schemes
          </p>
        </div>
      </div>

      <div className="scheme-container">

        {/* SEARCH + CATEGORY */}
        <div className="scheme-toolbar">

          <input
            type="text"
            placeholder="Search scheme by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "All"
                  ? "All Categories"
                  : item}
              </option>
            ))}
          </select>

        </div>

        {/* COUNT */}
        <div className="scheme-count">
          Showing {filteredSchemes.length} scheme
          {filteredSchemes.length !== 1 ? "s" : ""}
        </div>

        {/* SCHEME CARDS */}
        <div className="scheme-grid">

          {filteredSchemes.map((scheme) => (

            <div
              className="scheme-card"
              key={scheme.id}
            >

              {/* TOP */}
              <div className="scheme-card-top">

                <span className="scheme-id">
                  {scheme.schemeCode}
                </span>

                <span className="status active">
                  {scheme.status}
                </span>

              </div>

              {/* NAME */}
              <h3>
                {scheme.schemeName}
              </h3>

              {/* DESCRIPTION */}
              <p className="scheme-description">
                {scheme.description}
              </p>

              {/* BASIC DETAILS */}
              <div className="scheme-details">

                <div>
                  <span>Category</span>
                  <strong>
                    {scheme.beneficiaryCategory || "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Grant Amount</span>
                  <strong>
                    ₹
                    {Number(
                      scheme.grantAmount || 0
                    ).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div>
                  <span>Region</span>
                  <strong>
                    {scheme.applicableRegion || "N/A"}
                  </strong>
                </div>

              </div>

              {/* ELIGIBILITY CRITERIA */}
              <div className="eligibility-section">

                <h4>
                  Eligibility Criteria
                </h4>

                {scheme.criteriaList &&
                scheme.criteriaList.length > 0 ? (

                  <div className="criteria-list">

                    {scheme.criteriaList
                      .filter(
                        (criterion) =>
                          criterion.active !== false
                      )
                      .map((criterion) => (

                        <div
                          className="criterion-item"
                          key={criterion.id}
                        >

                          <div className="criterion-title">

                            <span className="criterion-check">
                              ✓
                            </span>

                            <strong>
                              {criterion.criterionName}
                            </strong>

                            {criterion.mandatory && (
                              <span className="mandatory-label">
                                Mandatory
                              </span>
                            )}

                          </div>

                          {criterion.description && (
                            <p>
                              {criterion.description}
                            </p>
                          )}

                          <div className="criterion-details">

                            {criterion.criterionType && (
                              <span>
                                Type:{" "}
                                {criterion.criterionType}
                              </span>
                            )}

                            {criterion.operator &&
                              criterion.expectedValue && (
                                <span>
                                  Requirement:{" "}
                                  {criterion.operator}{" "}
                                  {criterion.expectedValue}
                                </span>
                              )}

                          </div>

                        </div>

                      ))}

                  </div>

                ) : (

                  <p className="no-criteria">
                    No eligibility criteria available.
                  </p>

                )}

              </div>

            </div>

          ))}

        </div>

        {/* NO RESULTS */}
        {filteredSchemes.length === 0 && (
          <div className="no-schemes">
            No schemes found.
          </div>
        )}

      </div>
    </div>
  );
}

export default SchemeList;