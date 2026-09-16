import { useEffect, useState } from "react";
import "./SchemeManagement.css";

const API_URL = "http://localhost:8080/api/schemes";

function SchemeManagement() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================
  // SCHEME FORM
  // =========================

  const [showForm, setShowForm] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);

  // =========================
  // CRITERION FORM
  // =========================

  const [showCriterionForm, setShowCriterionForm] =
    useState(false);

  const [criterionScheme, setCriterionScheme] =
    useState(null);

  // =========================
  // SCHEME DATA
  // =========================

  const [formData, setFormData] = useState({
    schemeCode: "",
    schemeName: "",
    description: "",
    grantAmount: "",
    totalBudget: "",
    applicableRegion: "All India",
    beneficiaryCategory: "GENERAL",
    status: "DRAFT",
  });

  // =========================
  // CRITERION DATA
  // =========================

  const [criterionData, setCriterionData] = useState({
    criterionName: "",
    fieldName: "",
    criterionType: "TEXT",
    operator: "EQUAL",
    expectedValue: "",
    weight: 10,
    mandatory: true,
    active: true,
    description: "",
  });

  // =====================================================
  // GET AUTH HEADERS
  // =====================================================

  const getHeaders = () => {
    const token = localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };

  // =====================================================
  // LOAD SCHEMES
  // =====================================================

  const loadSchemes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "GET",
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to load schemes");
      }

      const data = await response.json();



      setSchemes(data);

    } catch (err) {

      console.error(err);
      setError(err.message);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadSchemes();
  }, []);

  // =====================================================
  // SCHEME INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // CRITERION INPUT CHANGE
  // =====================================================

  const handleCriterionChange = (e) => {
    const { name, value, type, checked } = e.target;

    setCriterionData((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // =====================================================
  // OPEN ADD SCHEME FORM
  // =====================================================

  const openAddForm = () => {

    setSelectedScheme(null);

    setFormData({
      schemeCode: "",
      schemeName: "",
      description: "",
      grantAmount: "",
      totalBudget: "",
      applicableRegion: "All India",
      beneficiaryCategory: "GENERAL",
      status: "DRAFT",
    });

    setShowForm(true);

    setMessage("");
    setError("");
  };

  // =====================================================
  // OPEN EDIT SCHEME FORM
  // =====================================================

  const openEditForm = (scheme) => {

    setSelectedScheme(scheme);

    setFormData({
      schemeCode: scheme.schemeCode || "",
      schemeName: scheme.schemeName || "",
      description: scheme.description || "",
      grantAmount: scheme.grantAmount || "",
      totalBudget: scheme.totalBudget || "",
      applicableRegion:
        scheme.applicableRegion || "All India",
      beneficiaryCategory:
        scheme.beneficiaryCategory || "GENERAL",
      status: scheme.status || "DRAFT",
    });

    setShowForm(true);

    setMessage("");
    setError("");
  };

  // =====================================================
  // CREATE / UPDATE SCHEME
  // =====================================================

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      setError("");
      setMessage("");

      const requestData = {

        schemeCode:
          formData.schemeCode.trim(),

        schemeName:
          formData.schemeName.trim(),

        description:
          formData.description.trim(),

        grantAmount:
          Number(formData.grantAmount),

        totalBudget:
          Number(formData.totalBudget),

        applicableRegion:
          formData.applicableRegion.trim(),

        beneficiaryCategory:
          formData.beneficiaryCategory,

        status:
          formData.status,
      };

      let url = API_URL;
      let method = "POST";

      if (selectedScheme) {

        url =
          `${API_URL}/${selectedScheme.id}`;

        method = "PUT";
      }

      const response = await fetch(url, {

        method,

        headers: getHeaders(),

        body: JSON.stringify(requestData),
      });

      if (!response.ok) {

        const errorData =
          await response.text();

        throw new Error(
          errorData ||
          "Failed to save scheme"
        );
      }

      setMessage(
        selectedScheme
          ? "Scheme updated successfully!"
          : "Scheme created successfully!"
      );

      setShowForm(false);

      await loadSchemes();

    } catch (err) {

      console.error(err);

      setError(err.message);

    }
  };

  // =====================================================
  // CHANGE STATUS
  // =====================================================

  const changeStatus = async (
    schemeId,
    status
  ) => {

    try {

      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/${schemeId}/status?status=${status}`,
        {
          method: "PATCH",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {

        const errorText =
          await response.text();

        throw new Error(
          errorText ||
          "Failed to change scheme status"
        );
      }

      setMessage(
        `Scheme status changed to ${status}`
      );

      await loadSchemes();

    } catch (err) {

      console.error(err);

      setError(err.message);

    }
  };

  // =====================================================
  // DELETE SCHEME
  // =====================================================

  const deleteScheme = async (
    schemeId
  ) => {

    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this scheme?"
      );

    if (!confirmDelete) return;

    try {

      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/${schemeId}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {

        const errorText =
          await response.text();

        throw new Error(
          errorText ||
          "Failed to delete scheme"
        );
      }

      setMessage(
        "Scheme deleted successfully!"
      );

      await loadSchemes();

    } catch (err) {

      console.error(err);

      setError(err.message);

    }
  };

  // =====================================================
  // OPEN CRITERION FORM
  // =====================================================

  const openCriterionForm = (
    scheme
  ) => {

    setCriterionScheme(scheme);

    setCriterionData({

      criterionName: "",

      fieldName: "",

      criterionType: "TEXT",

      operator: "EQUAL",

      expectedValue: "",

      weight: 10,

      mandatory: true,

      active: true,

      description: "",
    });

    setShowCriterionForm(true);

    setError("");
    setMessage("");
  };

  // =====================================================
  // SAVE CRITERION
  // =====================================================

  const handleCriterionSubmit = async (
    e
  ) => {

    e.preventDefault();

    if (!criterionScheme) return;

    try {

      setError("");
      setMessage("");

      const requestData = {

        criterionName:
          criterionData.criterionName.trim(),

        fieldName:
          criterionData.fieldName.trim(),

        criterionType:
          criterionData.criterionType,

        operator:
          criterionData.operator,

        expectedValue:
          criterionData.expectedValue.trim(),

        weight:
          Number(criterionData.weight),

        mandatory:
          criterionData.mandatory,

        active:
          criterionData.active,

        description:
          criterionData.description.trim(),
      };



      const response = await fetch(
        `${API_URL}/${criterionScheme.id}/criteria`,
        {
          method: "POST",

          headers: getHeaders(),

          body:
            JSON.stringify(requestData),
        }
      );

      if (!response.ok) {

        const errorText =
          await response.text();

        throw new Error(
          errorText ||
          "Failed to add criterion"
        );
      }

      setMessage(
        "Eligibility criterion added successfully!"
      );

      setShowCriterionForm(false);

      setCriterionScheme(null);

      await loadSchemes();

    } catch (err) {

      console.error(err);

      setError(err.message);

    }
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {

    if (!status) return "draft";

    return status.toLowerCase();
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div className="scheme-management-page">

        <div className="management-loading">
          Loading scheme management...
        </div>

      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="scheme-management-page">

      {/* ================= HEADER ================= */}

      <div className="management-header">

        <div>

          <h1>
            Scheme Management
          </h1>

          <p>
            Create and manage government subsidy
            and grant schemes
          </p>

        </div>

        <button
          className="add-scheme-btn"
          onClick={openAddForm}
        >
          + Add New Scheme
        </button>

      </div>


      <div className="management-container">

        {/* SUCCESS */}

        {message && (

          <div className="success-message">
            ✓ {message}
          </div>

        )}


        {/* ERROR */}

        {error && (

          <div className="error-message">
            {error}
          </div>

        )}


        {/* =====================================================
            ADD / EDIT SCHEME FORM
        ===================================================== */}

        {showForm && (

          <div className="scheme-form-card">

            <div className="form-header">

              <h2>

                {selectedScheme
                  ? "Edit Scheme"
                  : "Create New Scheme"}

              </h2>

              <button
                type="button"
                className="close-form-btn"
                onClick={() =>
                  setShowForm(false)
                }
              >
                ×
              </button>

            </div>


            <form onSubmit={handleSubmit}>

              <div className="form-grid">


                {/* SCHEME CODE */}

                <div className="form-group">

                  <label>
                    Scheme Code *
                  </label>

                  <input
                    type="text"
                    name="schemeCode"
                    placeholder="Example: PM-KISAN-2026"
                    value={formData.schemeCode}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* SCHEME NAME */}

                <div className="form-group">

                  <label>
                    Scheme Name *
                  </label>

                  <input
                    type="text"
                    name="schemeName"
                    placeholder="Enter scheme name"
                    value={formData.schemeName}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* GRANT */}

                <div className="form-group">

                  <label>
                    Grant Amount (₹) *
                  </label>

                  <input
                    type="number"
                    name="grantAmount"
                    min="1"
                    placeholder="Enter grant amount"
                    value={formData.grantAmount}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* BUDGET */}

                <div className="form-group">

                  <label>
                    Total Budget (₹) *
                  </label>

                  <input
                    type="number"
                    name="totalBudget"
                    min="1"
                    placeholder="Enter total budget"
                    value={formData.totalBudget}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* CATEGORY */}

                <div className="form-group">

                  <label>
                    Beneficiary Category *
                  </label>

                  <select
                    name="beneficiaryCategory"
                    value={formData.beneficiaryCategory}
                    onChange={handleChange}
                  >

                    <option value="GENERAL">
                      General Citizen
                    </option>

                    <option value="FARMER">
                      Farmer & Agricultural Worker
                    </option>

                    <option value="STUDENT">
                      Student & Youth Scholar
                    </option>

                    <option value="WOMEN_ENTREPRENEUR">
                      Women Entrepreneur & Self Help Group
                    </option>

                    <option value="SENIOR_CITIZEN">
                      Senior Citizen & Pensioner
                    </option>

                    <option value="BPL_FAMILY">
                      Below Poverty Line (BPL) Family
                    </option>

                    <option value="ARTISAN">
                      Artisan & Traditional Craftsman
                    </option>

                  </select>

                </div>


                {/* STATUS */}

                <div className="form-group">

                  <label>
                    Status *
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >

                    <option value="DRAFT">
                      Draft - Under Configuration
                    </option>

                    <option value="ACTIVE">
                      Active - Open for Applications
                    </option>

                    <option value="INACTIVE">
                      Inactive - Temporarily Suspended
                    </option>

                    <option value="CLOSED">
                      Closed - Budget Exhausted or Expired
                    </option>

                  </select>

                </div>


                {/* REGION */}

                <div className="form-group full-width">

                  <label>
                    Applicable Region *
                  </label>

                  <input
                    type="text"
                    name="applicableRegion"
                    placeholder="Example: All India"
                    value={formData.applicableRegion}
                    onChange={handleChange}
                    required
                  />

                </div>


                {/* DESCRIPTION */}

                <div className="form-group full-width">

                  <label>
                    Description
                  </label>

                  <textarea
                    name="description"
                    rows="4"
                    placeholder="Enter scheme description..."
                    value={formData.description}
                    onChange={handleChange}
                  />

                </div>

              </div>


              <div className="form-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() =>
                    setShowForm(false)
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="save-btn"
                >

                  {selectedScheme
                    ? "Update Scheme"
                    : "Create Scheme"}

                </button>

              </div>

            </form>

          </div>

        )}


        {/* =====================================================
            ADD CRITERION MODAL
        ===================================================== */}

        {showCriterionForm && (

          <div className="criterion-modal-overlay">

            <div className="criterion-modal">


              {/* MODAL HEADER */}

              <div className="form-header">

                <div>

                  <h2>
                    Add Eligibility Criterion
                  </h2>

                  <p>
                    {criterionScheme?.schemeName}
                  </p>

                </div>


                <button
                  type="button"
                  className="close-form-btn"
                  onClick={() => {

                    setShowCriterionForm(false);

                    setCriterionScheme(null);

                  }}
                >
                  ×
                </button>

              </div>


              <form onSubmit={handleCriterionSubmit}>

                <div className="form-grid">


                  {/* CRITERION NAME */}

                  <div className="form-group full-width">

                    <label>
                      Criterion Name *
                    </label>

                    <input
                      type="text"
                      name="criterionName"
                      placeholder="Example: Annual Family Income"
                      value={criterionData.criterionName}
                      onChange={handleCriterionChange}
                      required
                    />

                  </div>


                  {/* FIELD NAME */}

                  <div className="form-group full-width">

                    <label>
                      Field Name *
                    </label>

                    <input
                      type="text"
                      name="fieldName"
                      placeholder="Example: income"
                      value={criterionData.fieldName}
                      onChange={handleCriterionChange}
                      required
                    />

                    <small>
                      This field name is used by the
                      applicant eligibility form.
                      Example: income, landArea,
                      category, kycVerified.
                    </small>

                  </div>


                  {/* CRITERION TYPE */}

                  <div className="form-group">

                    <label>
                      Criterion Type *
                    </label>

                    <select
                      name="criterionType"
                      value={criterionData.criterionType}
                      onChange={handleCriterionChange}
                    >

                      <option value="TEXT">
                        TEXT
                      </option>

                      <option value="NUMERIC">
                        NUMERIC
                      </option>

                      <option value="BOOLEAN">
                        BOOLEAN
                      </option>

                    </select>

                  </div>


                  {/* OPERATOR */}

                  <div className="form-group">

                    <label>
                      Operator *
                    </label>

                    <select
                      name="operator"
                      value={criterionData.operator}
                      onChange={handleCriterionChange}
                    >

                      <option value="EQUAL">
                        EQUAL
                      </option>

                      <option value="LESS_THAN_EQUAL">
                        LESS THAN OR EQUAL
                      </option>

                      <option value="GREATER_THAN_EQUAL">
                        GREATER THAN OR EQUAL
                      </option>

                      <option value="LESS_THAN">
                        LESS THAN
                      </option>

                      <option value="GREATER_THAN">
                        GREATER THAN
                      </option>

                    </select>

                  </div>


                  {/* EXPECTED VALUE */}

                  <div className="form-group full-width">

                    <label>
                      Expected Value *
                    </label>

                    <input
                      type="text"
                      name="expectedValue"
                      placeholder="Example: 300000, FARMER, true"
                      value={criterionData.expectedValue}
                      onChange={handleCriterionChange}
                      required
                    />

                    <small>
                      The value required to satisfy
                      this criterion.
                    </small>

                  </div>


                  {/* WEIGHT */}

                  <div className="form-group">

                    <label>
                      Weight *
                    </label>

                    <input
                      type="number"
                      name="weight"
                      min="1"
                      max="100"
                      value={criterionData.weight}
                      onChange={handleCriterionChange}
                      required
                    />

                  </div>


                  {/* DESCRIPTION */}

                  <div className="form-group full-width">

                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      rows="3"
                      placeholder="Explain this eligibility criterion..."
                      value={criterionData.description}
                      onChange={handleCriterionChange}
                    />

                  </div>


                  {/* CHECKBOXES */}

                  <div className="criterion-checkbox-group">

                    <label className="checkbox-label">

                      <input
                        type="checkbox"
                        name="mandatory"
                        checked={criterionData.mandatory}
                        onChange={handleCriterionChange}
                      />

                      Mandatory Criterion

                    </label>


                    <label className="checkbox-label">

                      <input
                        type="checkbox"
                        name="active"
                        checked={criterionData.active}
                        onChange={handleCriterionChange}
                      />

                      Active

                    </label>

                  </div>

                </div>


                <div className="form-actions">

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {

                      setShowCriterionForm(false);

                      setCriterionScheme(null);

                    }}
                  >
                    Cancel
                  </button>


                  <button
                    type="submit"
                    className="save-btn"
                  >
                    + Add Criterion
                  </button>

                </div>

              </form>

            </div>

          </div>

        )}


        {/* =====================================================
            SCHEME TABLE
        ===================================================== */}

        <div className="scheme-management-card">

          <div className="scheme-management-title">

            <h2>
              All Schemes
            </h2>

            <span>

              {schemes.length} Scheme
              {schemes.length !== 1 ? "s" : ""}

            </span>

          </div>


          {schemes.length === 0 ? (

            <div className="empty-schemes">

              <h3>
                No Schemes Available
              </h3>

              <p>
                Start by creating your first
                government scheme.
              </p>

              <button
                className="add-scheme-btn"
                onClick={openAddForm}
              >
                + Create First Scheme
              </button>

            </div>

          ) : (

            <div className="scheme-table-wrapper">

              <table className="scheme-table">

                <thead>

                  <tr>

                    <th>Code</th>
                    <th>Scheme Name</th>
                    <th>Category</th>
                    <th>Grant Amount</th>
                    <th>Budget</th>
                    <th>Status</th>
                    <th>Criteria</th>
                    <th>Actions</th>

                  </tr>

                </thead>


                <tbody>

                  {schemes.map((scheme) => (

                    <tr key={scheme.id}>


                      <td>

                        <strong className="table-code">

                          {scheme.schemeCode}

                        </strong>

                      </td>


                      <td>

                        <div className="table-scheme-name">

                          {scheme.schemeName}

                        </div>

                        <small>

                          {scheme.applicableRegion}

                        </small>

                      </td>


                      <td>

                        {scheme.beneficiaryCategory}

                      </td>


                      <td>

                        ₹

                        {Number(
                          scheme.grantAmount || 0
                        ).toLocaleString("en-IN")}

                      </td>


                      <td>

                        ₹

                        {Number(
                          scheme.totalBudget || 0
                        ).toLocaleString("en-IN")}

                      </td>


                      <td>

                        <select
                          className={`status-select ${getStatusClass(
                            scheme.status
                          )}`}
                          value={scheme.status}
                          onChange={(e) =>
                            changeStatus(
                              scheme.id,
                              e.target.value
                            )
                          }
                        >

                          <option value="DRAFT">
                            DRAFT
                          </option>

                          <option value="ACTIVE">
                            ACTIVE
                          </option>

                          <option value="INACTIVE">
                            INACTIVE
                          </option>

                          <option value="CLOSED">
                            CLOSED
                          </option>

                        </select>

                      </td>


                      {/* CRITERIA */}

                      <td>

                        <button
                          className="criteria-count-btn"
                          onClick={() =>
                            openCriterionForm(scheme)
                          }
                        >
                          + Add Criterion
                        </button>

                        <small className="criteria-count">

                          {scheme.criteriaList?.length || 0}
                          {" "}added

                        </small>

                      </td>


                      {/* ACTIONS */}

                      <td>

                        <div className="action-buttons">

                          <button
                            className="edit-btn"
                            onClick={() =>
                              openEditForm(scheme)
                            }
                          >
                            Edit
                          </button>


                          <button
                            className="delete-btn"
                            onClick={() =>
                              deleteScheme(scheme.id)
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

    </div>
  );
}

export default SchemeManagement;