function RoleSelection({ onSelectRole, onBack }) {
  const roles = [
    {
      id: "beneficiary",
      title: "Register as Beneficiary",
      description: "Apply for government subsidies and grants.",
      icon: "👤",
    },
    {
      id: "field-officer",
      title: "Field Officer",
      description: "Verify beneficiary applications.",
      icon: "🔍",
    },
    {
      id: "district-officer",
      title: "District Officer",
      description: "Review and approve applications.",
      icon: "🏛️",
    },
    {
      id: "finance-officer",
      title: "Finance Officer",
      description: "Manage subsidy disbursement.",
      icon: "💰",
    },
    {
      id: "administrator",
      title: "Administrator",
      description: "Manage the complete platform.",
      icon: "⚙️",
    },
  ];

  return (
    <div className="role-page">

      <div className="role-card">

        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>

        <h1>Select Registration Type</h1>

        <p className="role-subtitle">
          Choose the role you want to register for
        </p>

        <div className="role-grid">

          {roles.map((role) => (
            <div
              className="role-option"
              key={role.id}
              onClick={() => onSelectRole(role.id)}
            >

              <div className="role-icon">
                {role.icon}
              </div>

              <h3>{role.title}</h3>

              <p>{role.description}</p>

              <button className="role-select-btn">
                Continue
              </button>

            </div>
          ))}

        </div>

      </div>

    </div>
  );
}

export default RoleSelection;