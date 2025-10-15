const Dropdown = ({ options, value, onChange, label, id, required }) => (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={onChange} required={required}>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
  export default Dropdown;if (!validateUsername(username)) {
  alert("Username must be at least 3 characters long.");
  return;
}
if (!validatePasswords(password, confirmPassword)) {
  alert("Passwords do not match!");
  return;
}