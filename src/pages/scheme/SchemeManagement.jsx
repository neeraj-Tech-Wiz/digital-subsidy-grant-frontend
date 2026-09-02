import { useState } from "react";
import "./SchemeManagement.css";

const initialSchemes = [
  {
    id: "S001",
    name: "Farmer Support Scheme",
    category: "Agriculture",
    amount: 50000,
    description:
      "Financial assistance for eligible farmers to support agricultural activities.",
    status: "Active",
  },
  {
    id: "S002",
    name: "Education Assistance Scheme",
    category: "Education",
    amount: 25000,
    description:
      "Financial support for eligible students to continue their education.",
    status: "Active",
  },
  {
    id: "S003",
    name: "Women Empowerment Scheme",
    category: "Women Welfare",
    amount: 30000,
    description:
      "Financial assistance to support women entrepreneurship and self-employment.",
    status: "Active",
  },
  {
    id: "S004",
    name: "Housing Support Scheme",
    category: "Housing",
    amount: 100000,
    description:
      "Financial assistance for eligible beneficiaries to improve housing facilities.",
    status: "Inactive",
  },
];

function SchemeManagement() {
  const [schemes, setSchemes] = useState(initialSchemes);
  const [selectedScheme, setSelectedScheme] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    category: "Agriculture",
    amount: "",
    description: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddScheme = (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.category ||
      !formData.amount ||
      !formData.description
    ) {
      alert("Please fill all fields.");
      return;
    }

    const newScheme = {
      id: `S${String(schemes.length + 1).padStart(3, "0")}`,
      name: formData.name,
      category: formData.category,
      amount: Number(formData.amount),
      description: formData.description,
      status: "Active",
    };

    setSchemes([...schemes, newScheme]);

    setFormData({
      name: "",
      category: "Agriculture",
      amount: "",
      description: "",
    });

    alert("Scheme added successfully!");
  };

  const handleEdit = (scheme) => {
    setSelectedScheme(scheme);

    setFormData({
      name: scheme.name,
      category: scheme.category,
      amount: scheme.amount,
      description: scheme.description,
    });
  };

  const handleUpdate = (e) => {
    e.preventDefault();

    const updatedSchemes = schemes.map((scheme) =>
      scheme.id === selectedScheme.id
        ? {
            ...scheme,
            name: formData.name,
            category: formData.category,
            amount: Number(formData.amount),
            description: formData.description,
          }
        : scheme
    );

    setSchemes(updatedSchemes);
    setSelectedScheme(null);

    setFormData({
      name: "",
      category: "Agriculture",
      amount: "",
      description: "",
    });

    alert("Scheme updated successfully!");
  };

  const handleToggleStatus = (id) => {
    const updatedSchemes = schemes.map((scheme) =>
      scheme.id === id
        ? {
            ...scheme,
            status: scheme.status === "Active" ? "Inactive" : "Active",
          }
        : scheme
    );

    setSchemes(updatedSchemes);
  };

  const cancelEdit = () => {
    setSelectedScheme(null);

    setFormData({
      name: "",
      category: "Agriculture",
      amount: "",
      description: "",
    });
  };

  return (
    <div className="management-page">
      <div className="management-header">
        <h1>Subsidy Management System</h1>
        <h2>Scheme Management</h2>
        <p>Create, update and manage subsidy schemes</p>
      </div>

      <div className="management-container">

        {/* Add / Edit Scheme Form */}
        <div className="form-card">
          <h2>
            {selectedScheme ? "Edit Scheme" : "Add New Scheme"}
          </h2>

          <form
            onSubmit={
              selectedScheme ? handleUpdate : handleAddScheme
            }
          >
            <div className="form-group">
              <label>Scheme Name</label>

              <input
                type="text"
                name="name"
                placeholder="Enter scheme name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Category</label>

              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="Agriculture">Agriculture</option>
                <option value="Education">Education</option>
                <option value="Women Welfare">
                  Women Welfare
                </option>
                <option value="Housing">Housing</option>
                <option value="Healthcare">Healthcare</option>
              </select>
            </div>

            <div className="form-group">
              <label>Grant Amount (₹)</label>

              <input
                type="number"
                name="amount"
                placeholder="Enter grant amount"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Description</label>

              <textarea
                name="description"
                placeholder="Enter scheme description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-buttons">
              <button type="submit" className="save-btn">
                {selectedScheme
                  ? "Update Scheme"
                  : "Add Scheme"}
              </button>

              {selectedScheme && (
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Existing Schemes */}
        <div className="existing-schemes">
          <h2>Existing Schemes</h2>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Scheme Name</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {schemes.map((scheme) => (
                  <tr key={scheme.id}>
                    <td>{scheme.id}</td>

                    <td>{scheme.name}</td>

                    <td>{scheme.category}</td>

                    <td>
                      ₹{scheme.amount.toLocaleString("en-IN")}
                    </td>

                    <td>
                      <span
                        className={
                          scheme.status === "Active"
                            ? "active-status"
                            : "inactive-status"
                        }
                      >
                        {scheme.status}
                      </span>
                    </td>

                    <td className="actions">
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(scheme)}
                      >
                        Edit
                      </button>

                      <button
                        className="status-btn"
                        onClick={() =>
                          handleToggleStatus(scheme.id)
                        }
                      >
                        {scheme.status === "Active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SchemeManagement;