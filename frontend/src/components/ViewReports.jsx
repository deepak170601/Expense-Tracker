import React, { useState, useContext } from 'react';
import axios from '../api/axios';
import AuthContext from '../context/AuthContext';
import './styles/ViewReports.css';
import { Bar, Pie } from 'react-chartjs-2'; // Import Bar and Pie charts from react-chartjs-2
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Modal, Button } from 'react-bootstrap'; // Import Bootstrap components for modal

// Register required chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ViewReports = () => {
  const { user } = useContext(AuthContext); // Get user from AuthContext
  const [selectedOption, setSelectedOption] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPieChartModal, setShowPieChartModal] = useState(false); // Modal visibility state
  const [selectedCategory, setSelectedCategory] = useState(null); // For category-specific pie chart
  const [categoryDataForPie, setCategoryDataForPie] = useState([]); // For pie chart data

  // Handle dropdown option change
  const handleOptionChange = (event) => {
    const option = event.target.value;
    setSelectedOption(option);
    setShowPieChartModal(false); // Reset modal on option change
    if (option) {
      fetchReports(option); // Fetch reports when an option is selected
    }
  };

  // Fetch reports from the backend
  const fetchReports = async (type) => {
    if (!user || !user.username) {
      setError('User is not authenticated');
      return;
    }

    setLoading(true);
    setError('');
    setReportData([]);

    try {
      const response = await axios.get('/reports/reports', {
        headers: {
          Authorization: `Bearer ${user.token}`, // Pass the token in the Authorization header
        },
        params: {
          type,
          username: user.username, // Send username as a query parameter
        },
      });

      const { data } = response;
      if (Array.isArray(data) && data.length > 0) {
        setReportData(data);
      } else {
        setError('No data available for the selected report type.');
      }
    } catch (err) {
      console.error('Error fetching report data:', err);
      setError('Failed to fetch report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date based on report type
  const formatDate = (type, date) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const dateObj = new Date(date);

    if (type === 'weekly') {
      const startOfWeek = new Date(dateObj);
      const endOfWeek = new Date(dateObj);
      endOfWeek.setDate(endOfWeek.getDate() + 6); // 7-day interval

      return `${startOfWeek.toLocaleDateString(undefined, options)} - ${endOfWeek.toLocaleDateString(undefined, options)}`;
    } else if (type === 'monthly') {
      const month = dateObj.toLocaleString(undefined, { month: 'long' });
      return `${month} ${dateObj.getFullYear()}`; // Monthly format like "January 2024"
    } else {
      return dateObj.toLocaleDateString(undefined, options); // For daily reports
    }
  };

  // Aggregate report data based on selected option
  const aggregateReportData = () => {
    const aggregatedData = {};

    reportData.forEach((report) => {
      const key =
        selectedOption === 'daily' ? report.day :
        selectedOption === 'weekly' ? report.week :
        report.month;

      if (!aggregatedData[key]) {
        aggregatedData[key] = { total: 0, category: report.category };
      }

      aggregatedData[key].total += report.total;
    });

    return Object.keys(aggregatedData).map(key => ({
      ...aggregatedData[key],
      key,
    }));
  };

  // Prepare data for the bar chart
  const prepareBarChartData = () => {
    const aggregatedReports = aggregateReportData();

    const labels = aggregatedReports.map(report => formatDate(selectedOption, report.key));
    const data = aggregatedReports.map(report => report.total);

    return {
      labels,
      datasets: [
        {
          label: `Total Amount (${selectedOption})`,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          hoverBackgroundColor: 'rgba(75, 192, 192, 0.8)',
          hoverBorderColor: 'rgba(75, 192, 192, 1)',
          data,
        },
      ],
    };
  };

  // Handle bar click to show Pie chart for category split in modal
  const handleBarClick = (element) => {
    if (element.length > 0) {
      const index = element[0].index;
      const aggregatedReports = aggregateReportData();
      const selectedData = aggregatedReports[index];

      // Filter out data for selected bar to show pie chart by category
      const categoryData = reportData.filter((report) => {
        const key =
          selectedOption === 'daily' ? report.day :
          selectedOption === 'weekly' ? report.week :
          report.month;

        return key === selectedData.key;
      });

      setCategoryDataForPie(categoryData); // Set the filtered data for the pie chart
      setSelectedCategory(selectedData.category); // Store the selected category
      setShowPieChartModal(true); // Show modal dialog
    }
  };

  // Prepare data for the pie chart
  const preparePieChartData = () => {
    const categoryLabels = [...new Set(categoryDataForPie.map((report) => report.category))]; // Get unique categories
    const categoryTotals = categoryLabels.map(
      (category) =>
        categoryDataForPie.filter((report) => report.category === category).reduce((sum, report) => sum + report.total, 0)
    );

    return {
      labels: categoryLabels,
      datasets: [
        {
          data: categoryTotals,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
          hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        },
      ],
    };
  };

  return (
    <div className="view-reports-container">
      <h2>View Reports</h2>

      {/* Dropdown to select report type */}
      <select className="report-dropdown" value={selectedOption} onChange={handleOptionChange}>
        <option value="">Select a report type</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>

      {/* Loading and error states */}
      {loading && <p>Loading reports...</p>}
      {error && <p className="error-text">{error}</p>}

      {/* Display report data in a table */}
      {reportData.length > 0 && (
        <>
          {/* Render Bar chart */}
          <Bar
            data={prepareBarChartData()}
            options={{
              responsive: true,
              onClick: (event, element) => handleBarClick(element), // Handle bar click to show pie chart
            }}
          />

            <table className="table table-striped table-bordered report-table">
            <thead className="thead-dark">
                <tr>
                <th>Total Amount</th>
                <th>{selectedOption === 'daily' ? 'Day' : selectedOption === 'weekly' ? 'Week' : 'Month'}</th>
                </tr>
            </thead>
            <tbody>
                {aggregateReportData().map((report, index) => (
                <tr key={index}>
                    <td className="text-right">₹{parseFloat(report.total).toFixed(2)}</td>
                    <td>{formatDate(selectedOption, report.key)}</td>
                </tr>
                ))}
            </tbody>
            </table>

        </>
      )}

      {/* No data message when reportData is empty */}
      {reportData.length === 0 && !loading && <p>No data available</p>}

      {/* Bootstrap modal for showing pie chart */}
      <Modal show={showPieChartModal} onHide={() => setShowPieChartModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Category Split for {selectedCategory}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Pie data={preparePieChartData()} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPieChartModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ViewReports;
