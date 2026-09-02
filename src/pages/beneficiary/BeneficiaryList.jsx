import { useEffect, useState } from "react";

function BeneficiaryList() {
  const [beneficiaries, setBeneficiaries] = useState([]);

  useEffect(() => {
    const storedBeneficiaries =
      JSON.parse(localStorage.getItem("beneficiaries")) || [];

    setBeneficiaries(storedBeneficiaries);
  }, []);

  return (
    <div className="beneficiary-page">
      <div className="page-header">
        <h1>Subsidy Management System</h1>
        <p>Beneficiary List</p>
      </div>

      <div className="list-card">
        <h2>Registered Beneficiaries</h2>

        {beneficiaries.length === 0 ? (
          <p className="no-data">
            No beneficiaries registered yet.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Father Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {beneficiaries.map((beneficiary) => (
                  <tr key={beneficiary.id}>
                    <td>{beneficiary.id}</td>
                    <td>{beneficiary.name}</td>
                    <td>{beneficiary.fatherName}</td>
                    <td>{beneficiary.age}</td>
                    <td>{beneficiary.gender}</td>
                    <td>{beneficiary.email}</td>
                    <td>{beneficiary.mobile}</td>
                    <td>
                      <span className="status">
                        Registered
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default BeneficiaryList;