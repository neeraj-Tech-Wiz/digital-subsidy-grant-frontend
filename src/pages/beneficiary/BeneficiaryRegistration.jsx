import { useState } from "react";

function BeneficiaryRegistration() {
  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    gender: "",
    age: "",
    email: "",
    mobile: "",
    governmentId: "",
    address: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
  e.preventDefault();

  const existingBeneficiaries =
    JSON.parse(localStorage.getItem("beneficiaries")) || [];

  const newBeneficiary = {
    id: `B${String(existingBeneficiaries.length + 1).padStart(3, "0")}`,
    ...formData,
  };

  const updatedBeneficiaries = [
    ...existingBeneficiaries,
    newBeneficiary,
  ];

  localStorage.setItem(
    "beneficiaries",
    JSON.stringify(updatedBeneficiaries)
  );

  console.log("Mock Beneficiary Data:", newBeneficiary);

  alert("Beneficiary registered successfully!");

  setFormData({
    name: "",
    fatherName: "",
    gender: "",
    age: "",
    email: "",
    mobile: "",
    governmentId: "",
    address: "",
  });
};

  return (
    <div className="beneficiary-page">
      <div className="page-header">
        <h1>Subsidy Management System</h1>
        <p>Beneficiary Registration</p>
      </div>

      <div className="form-card">
        <h2>Register Beneficiary</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter beneficiary name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Father Name</label>
            <input
              type="text"
              name="fatherName"
              placeholder="Enter father's name"
              value={formData.fatherName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              name="age"
              placeholder="Enter age"
              min="18"
              value={formData.age}
              onChange={handleChange}
              required
            />
            <small>Eligible age: 18 years and above</small>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="example@gmail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <input
              type="tel"
              name="mobile"
              placeholder="Enter 10-digit mobile number"
              maxLength="10"
              value={formData.mobile}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Government ID / Aadhaar Number</label>
            <input
              type="text"
              name="governmentId"
              placeholder="Enter 12-digit Aadhaar number"
              maxLength="12"
              value={formData.governmentId}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              name="address"
              placeholder="Enter address"
              rows="4"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="register-btn">
            Register Beneficiary
          </button>
        </form>
      </div>
    </div>
  );
}

export default BeneficiaryRegistration;