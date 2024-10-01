import React, { useState } from 'react';

const ViewReports = () => {
  const [selectedOption, setSelectedOption] = useState('');

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
    // Perform logic to fetch and display expenses based on the selected option
  };

  return (
    <div>
      <select value={selectedOption} onChange={handleOptionChange}>
        <option value="">Select an option</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="daily">Daily</option>
      </select>
      {/* Display expenses based on the selected option */}
    </div>
  );
};

export default ViewReports;