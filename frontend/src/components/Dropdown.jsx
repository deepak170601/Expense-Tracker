import React from 'react';
import PropTypes from 'prop-types';

const Dropdown = ({ options, value, onChange, label, id, required, className }) => (
  <div className="form-group">
    <label htmlFor={id}>{label}</label>
    <select
      id={id}
      value={value}
      onChange={onChange}
      required={required}
      className={className}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

Dropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  required: PropTypes.bool,
  className: PropTypes.string,
};

Dropdown.defaultProps = {
  required: false,
  className: '',
};

export default React.memo(Dropdown);
