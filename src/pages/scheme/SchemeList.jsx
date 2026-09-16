import { useEffect, useState } from "react";
import "./SchemeList.css";

function SchemeList() {
  const [schemes, setSchemes] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Application states
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [eligibilityData, setEligibilityData] = useState({});
  const [applying, setApplying] = useState(false);
  const [applicationResult, setApplicationResult] = useState(null);

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

        const text = await response.text();

        let data = [];

        if (text) {
          data = JSON.parse(text);
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.error ||
              `Failed to load schemes. Status: ${response.status}`
          );
        }



        setSchemes(Array.isArray(data) ? data : []);

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
  // OPEN APPLICATION FORM
  // =========================
  const handleApplyClick = (scheme) => {

    const beneficiaryId =
      localStorage.getItem("beneficiaryId");

    if (!beneficiaryId) {
      alert(
        "Please register as a beneficiary before applying for a scheme."
      );
      return;
    }

    setSelectedScheme(scheme);
    setEligibilityData({});
    setApplicationResult(null);


  };


  // =========================
  // HANDLE FORM CHANGE
  // =========================
  const handleEligibilityChange = (
    fieldName,
    value
  ) => {

    setEligibilityData((previousData) => ({
      ...previousData,
      [fieldName]: value,
    }));
  };


  // =========================
  // SUBMIT APPLICATION
  // =========================
  const handleApplicationSubmit = async (e) => {

    e.preventDefault();

    try {

      setApplying(true);

      const token =
        localStorage.getItem("token");

      const beneficiaryId =
        localStorage.getItem("beneficiaryId");

      if (!token) {
        throw new Error("Please login first.");
      }

      if (!beneficiaryId) {
        throw new Error(
          "Beneficiary profile not found. Please register first."
        );
      }

      if (!selectedScheme?.id) {
        throw new Error("Please select a valid scheme.");
      }


      // =========================
      // VALIDATE MANDATORY FIELDS
      // =========================

      const activeCriteria =
        selectedScheme.criteriaList?.filter(
          (criterion) =>
            criterion.active !== false
        ) || [];

      for (const criterion of activeCriteria) {

        const fieldName =
          criterion.fieldName ||
          criterion.criterionName;

        if (
          criterion.mandatory &&
          (
            !eligibilityData[fieldName] ||
            eligibilityData[fieldName].trim() === ""
          )
        ) {

          throw new Error(
            `${criterion.criterionName} is required.`
          );
        }
      }





      // =========================
      // CALL APPLICATION API
      // =========================

      const response = await fetch(
        `http://localhost:8080/api/applications/apply/${beneficiaryId}/${selectedScheme.id}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            eligibilityData,
          }),
        }
      );


      const text = await response.text();

      let data = {};

      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            text || "Invalid response received from server."
          );
        }
      }


      if (!response.ok) {

        throw new Error(
          data.message ||
          data.error ||
          "Application submission failed."
        );
      }




      setApplicationResult(data);

    } catch (error) {

      console.error(
        "Application error:",
        error
      );

      alert(error.message);

    } finally {

      setApplying(false);
    }
  };


  // =========================
  // GET UNIQUE CATEGORIES
  // =========================
  const categories = [
    "All",
    ...new Set(
      schemes
        .map(
          (scheme) =>
            scheme.beneficiaryCategory
        )
        .filter(Boolean)
    ),
  ];


  // =========================
  // SEARCH + CATEGORY FILTER
  // =========================
  const filteredSchemes =
    schemes.filter((scheme) => {

      const schemeName =
        scheme.schemeName || "";

      const schemeCode =
        scheme.schemeCode || "";

      const schemeCategory =
        scheme.beneficiaryCategory || "";

      const matchesSearch =
        schemeName
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        schemeCode
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" ||
        schemeCategory === category;

      return (
        matchesSearch &&
        matchesCategory
      );
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

            <h3>
              Unable to load schemes
            </h3>

            <p>{error}</p>

          </div>

        </div>
      </div>
    );
  }


  return (

    <div className="scheme-page">

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div className="scheme-header">

        <div>

          <h1>
            Subsidy Management System
          </h1>

          <h2>
            Available Schemes
          </h2>

          <p>
            View active government subsidy and grant schemes
          </p>

        </div>

      </div>


      <div className="scheme-container">


        {/* ========================= */}
        {/* SEARCH + CATEGORY */}
        {/* ========================= */}

        <div className="scheme-toolbar">

          <input
            type="text"
            placeholder="Search scheme by name or code..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />


          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
          >

            {categories.map((item) => (

              <option
                key={item}
                value={item}
              >

                {item === "All"
                  ? "All Categories"
                  : item}

              </option>

            ))}

          </select>

        </div>


        {/* ========================= */}
        {/* COUNT */}
        {/* ========================= */}

        <div className="scheme-count">

          Showing {filteredSchemes.length} scheme
          {filteredSchemes.length !== 1
            ? "s"
            : ""}

        </div>


        {/* ========================= */}
        {/* SCHEME CARDS */}
        {/* ========================= */}

        <div className="scheme-grid">

          {filteredSchemes.map((scheme) => (

            <div
              className="scheme-card"
              key={scheme.id}
            >

              <div className="scheme-card-top">

                <span className="scheme-id">
                  {scheme.schemeCode}
                </span>


                <span
                  className={`status ${
                    scheme.status?.toLowerCase() ===
                    "active"
                      ? "active"
                      : "inactive"
                  }`}
                >

                  {scheme.status}

                </span>

              </div>


              <h3>
                {scheme.schemeName}
              </h3>


              <p className="scheme-description">
                {scheme.description}
              </p>


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


              {/* ========================= */}
              {/* ELIGIBILITY CRITERIA */}
              {/* ========================= */}

              <div className="eligibility-section">

                <h4>
                  Eligibility Criteria
                </h4>


                {scheme.criteriaList &&
                scheme.criteriaList.filter(
                  (criterion) =>
                    criterion.active !== false
                ).length > 0 ? (

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

                          <div className="criterion-header">

                            <div className="criterion-title">

                              <span className="criterion-check">
                                ✓
                              </span>

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


                          <div className="criterion-value">

                            {criterion.operator ===
                              "LESS_THAN_EQUAL" && (
                              <>≤ {criterion.expectedValue}</>
                            )}

                            {criterion.operator ===
                              "LESS_THAN" && (
                              <>&lt; {criterion.expectedValue}</>
                            )}

                            {criterion.operator ===
                              "GREATER_THAN_EQUAL" && (
                              <>≥ {criterion.expectedValue}</>
                            )}

                            {criterion.operator ===
                              "GREATER_THAN" && (
                              <>&gt; {criterion.expectedValue}</>
                            )}

                            {(criterion.operator ===
                              "EQUAL" ||
                              criterion.operator ===
                              "IN") && (
                              <>{criterion.expectedValue}</>
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


              {/* ========================= */}
              {/* APPLY BUTTON */}
              {/* ========================= */}

              <button
                className="apply-btn"
                onClick={() =>
                  handleApplyClick(scheme)
                }
              >
                Apply Now
              </button>

            </div>

          ))}

        </div>


        {filteredSchemes.length === 0 && (

          <div className="no-schemes">
            No schemes found.
          </div>

        )}

      </div>


      {/* =============================== */}
      {/* APPLICATION FORM MODAL */}
      {/* =============================== */}

      {selectedScheme &&
        !applicationResult && (

        <div className="application-modal-overlay">

          <div className="application-modal">

            <button
              type="button"
              className="close-modal"
              onClick={() => {
                setSelectedScheme(null);
                setEligibilityData({});
              }}
            >
              ×
            </button>


            <h2>
              Apply for {selectedScheme.schemeName}
            </h2>


            <p>
              Please provide the required eligibility information.
            </p>


            <form
              onSubmit={handleApplicationSubmit}
            >

              {selectedScheme.criteriaList
                ?.filter(
                  (criterion) =>
                    criterion.active !== false
                )
                .map((criterion) => {

                  const fieldName =
                    criterion.fieldName ||
                    criterion.criterionName;

                  return (

                    <div
                      className="form-group"
                      key={criterion.id}
                    >

                      <label>

                        {criterion.criterionName}

                        {criterion.mandatory && (
                          <span
                            style={{
                              color: "red",
                              marginLeft: "4px",
                            }}
                          >
                            *
                          </span>
                        )}

                      </label>


                      {/* BOOLEAN */}
                      {criterion.criterionType ===
                      "BOOLEAN" ? (

                        <select
                          required={criterion.mandatory}
                          value={
                            eligibilityData[fieldName] || ""
                          }
                          onChange={(e) =>
                            handleEligibilityChange(
                              fieldName,
                              e.target.value
                            )
                          }
                        >

                          <option value="">
                            Select
                          </option>

                          <option value="true">
                            Yes
                          </option>

                          <option value="false">
                            No
                          </option>

                        </select>


                      ) : criterion.criterionType ===
                        "ENUM" ? (

                        <select
                          required={criterion.mandatory}
                          value={
                            eligibilityData[fieldName] || ""
                          }
                          onChange={(e) =>
                            handleEligibilityChange(
                              fieldName,
                              e.target.value
                            )
                          }
                        >

                          <option value="">
                            Select
                          </option>

                          {criterion.expectedValue
                            ?.split(",")
                            .map((value) => (

                              <option
                                key={value.trim()}
                                value={value.trim()}
                              >
                                {value.trim()}
                              </option>

                            ))}

                        </select>


                      ) : (

                        <input
                          type={
                            criterion.criterionType ===
                            "NUMERIC"
                              ? "number"
                              : "text"
                          }

                          required={criterion.mandatory}

                          placeholder={
                            `Enter ${criterion.criterionName}`
                          }

                          value={
                            eligibilityData[fieldName] || ""
                          }

                          onChange={(e) =>
                            handleEligibilityChange(
                              fieldName,
                              e.target.value
                            )
                          }
                        />

                      )}

                    </div>

                  );
                })}


              <button
                type="submit"
                className="apply-btn"
                disabled={applying}
              >

                {applying
                  ? "Submitting Application..."
                  : "Submit Application"}

              </button>

            </form>

          </div>

        </div>

      )}


      {/* =============================== */}
      {/* APPLICATION RESULT */}
      {/* =============================== */}

      {applicationResult && (

        <div className="application-modal-overlay">

          <div className="application-modal result-modal">

            <h2>
              Application Result
            </h2>


            <div
              className={`application-status ${
                applicationResult.status === "ELIGIBLE"
                  ? "eligible"
                  : "not-eligible"
              }`}
            >

              {applicationResult.status === "ELIGIBLE"
                ? "✓ ELIGIBLE"
                : "✗ NOT ELIGIBLE"}

            </div>


            <h3>

              Eligibility Score:{" "}

              {applicationResult.eligibilityScore}/100

            </h3>


            <p>

              Application ID:{" "}

              {applicationResult.id}

            </p>


            <button
              className="apply-btn"
              onClick={() => {

                setApplicationResult(null);
                setSelectedScheme(null);
                setEligibilityData({});

              }}
            >

              Done

            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default SchemeList;