import { useEffect, useState } from "react";
import "./SchemeList.css";

function SchemeList() {
  const [schemes, setSchemes] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // FORMAT CRITERIA VALUE
  // =========================
  const formatCriterionValue = (criterion) => {
    const name = criterion.criterionName?.toLowerCase() || "";
    const value = criterion.expectedValue;

    if (value === null || value === undefined || value === "") {
      return "";
    }

    // Income
    if (name.includes("income")) {
      return `≤ ₹${Number(value).toLocaleString("en-IN")}`;
    }

    // Land / Asset
    if (name.includes("land") || name.includes("asset")) {
      return `≤ ${value} Acres`;
    }

    // Category
    if (name.includes("category")) {
      return value;
    }

    // Document
    if (name.includes("document")) {
      return value === true || value === "true"
        ? "Required"
        : "Not Required";
    }

    // Region
    if (name.includes("region") || name.includes("location")) {
      return value;
    }

    // Previous Benefit
    if (name.includes("previous") || name.includes("benefit")) {
      return value === false || value === "false"
        ? "No Previous Benefit"
        : "Previous Benefit Allowed";
    }

    // Identity Verification
    if (name.includes("identity") || name.includes("verification")) {
      return value === true || value === "true"
        ? "Verified"
        : "Not Verified";
    }

    // Default
    return value;
  };

  // =========================
  // FETCH ACTIVE SCHEMES
  // =========================
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

  // =========================
  // GET UNIQUE CATEGORIES
  // =========================
  const categories = [
    "All",
    ...new Set(
      schemes
        .map((scheme) => scheme.beneficiaryCategory)
        .filter(Boolean)
    ),
  ];

  // =========================
  // SEARCH + CATEGORY FILTER
  // =========================
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

  // =========================
  // LOADING
  // =========================
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

  // =========================
  // ERROR
  // =========================
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

                <span
                  className={`status ${
                    scheme.status?.toLowerCase() === "active"
                      ? "active"
                      : "inactive"
                  }`}
                >
                  {scheme.status}
                </span>

              </div>

              {/* SCHEME NAME */}
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
              <h4>Eligibility Criteria</h4>

              {scheme.criteriaList &&
              scheme.criteriaList.filter(
                (criterion) => criterion.active !== false
              ).length > 0 ? (

                <div className="criteria-list">

                  {scheme.criteriaList
                    .filter(
                      (criterion) => criterion.active !== false
                    )
                    .map((criterion) => (

                      <div
                        className="criterion-item"
                        key={criterion.id}
                      >

                        {/* TOP ROW */}
                        <div className="criterion-header">

                          <div className="criterion-title">
                            <span className="criterion-check">✓</span>

                            <span className="criterion-name">
                              {criterion.criterionName}
                            </span>
                          </div>

                          {criterion.mandatory && (
                            <span className="mandatory-label">
                              Mandatory
                            </span>
                          )}

                        </div>

                        {/* REQUIREMENT */}
                        <div className="criterion-value">

                          {criterion.operator === "LESS_THAN_EQUAL" && (
                            <>
                              ≤ {criterion.expectedValue}
                            </>
                          )}

                          {criterion.operator === "LESS_THAN" && (
                            <>
                              &lt; {criterion.expectedValue}
                            </>
                          )}

                          {criterion.operator === "GREATER_THAN_EQUAL" && (
                            <>
                              ≥ {criterion.expectedValue}
                            </>
                          )}

                          {criterion.operator === "GREATER_THAN" && (
                            <>
                              &gt; {criterion.expectedValue}
                            </>
                          )}

                          {criterion.operator === "EQUAL" && (
                            <>
                              {criterion.expectedValue}
                            </>
                          )}

                          {!criterion.operator && (
                            <>
                              {criterion.expectedValue}
                            </>
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