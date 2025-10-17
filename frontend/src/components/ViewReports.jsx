import React, { useState, useContext } from 'react';
import axios from '../api/axios.js';
import AuthContext from '../context/AuthContext.jsx';
import { useFlashMessage } from '../context/FlashMessageContext.jsx';
import './styles/ViewReports.css';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Modal, Button } from 'react-bootstrap';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ViewReports = () => {
  const { user } = useContext(AuthContext);
  const { showMessage } = useFlashMessage();
  const [selectedOption, setSelectedOption] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPieChartModal, setShowPieChartModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryDataForPie, setCategoryDataForPie] = useState([]);

  const handleOptionChange = (event) => {
    const option = event.target.value;
    setSelectedOption(option);
    setShowPieChartModal(false);
    if (option) {
      fetchReports(option);
    }
  };

  const fetchReports = async (type) => {
    if (!user || !user.username) {
      showMessage('User is not authenticated', 'error');
      return;
    }

    setLoading(true);
    setReportData([]);

    try {
      const response = await axios.get('/reports/reports', {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        params: {
          type,
          username: user.username,
        },
      });

      const { data } = response;
      if (Array.isArray(data) && data.length > 0) {
        setReportData(data);
      } else {
        showMessage('No data available for the selected report type.', 'info');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch reports. Please try again.';
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (type, date) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    const dateObj = new Date(date);

    if (type === 'weekly') {
      const startOfWeek = new Date(dateObj);
      const endOfWeek = new Date(dateObj);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      return `${startOfWeek.toLocaleDateString(undefined, options)} - ${endOfWeek.toLocaleDateString(undefined, options)}`;
    } else if (type === 'monthly') {
      const month = dateObj.toLocaleString(undefined, { month: 'long' });
      return `${month} ${dateObj.getFullYear()}`;
    } else {
      return dateObj.toLocaleDateString(undefined, options);
    }
  };

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

  const handleBarClick = (element) => {
    if (element.length > 0) {
      const index = element[0].index;
      const aggregatedReports = aggregateReportData();
      const selectedData = aggregatedReports[index];

      const categoryData = reportData.filter((report) => {
        const key =
          selectedOption === 'daily' ? report.day :
          selectedOption === 'weekly' ? report.week :
          report.month;

        return key === selectedData.key;
      });

      setCategoryDataForPie(categoryData);
      setSelectedCategory(selectedData.category);
      setShowPieChartModal(true);
    }
  };

  const preparePieChartData = () => {
    const categoryLabels = [...new Set(categoryDataForPie.map((report) => report.category))];
    const categoryTotals = categoryLabels.map(
      (category) =>
        categoryDataForPie.filter((report) => report.category === category).reduce((sum, report) => sum + report.total, 0)
    );

    return {
      labels: categoryLabels,
      datasets: [
        {
          data: categoryTotals,
          backgroundColor: ['#FF6F94', '#4DA6E0', '#FFD26D', '#FFA74D', '#4BC6B0', '#A67BFF', '#FF9F40', '#4B8C77', '#A57CBA', '#C84B4D'],
          hoverBackgroundColor: ['#FF6F94', '#4DA6E0', '#FFD26D', '#FFA74D', '#4BC6B0', '#A67BFF', '#FF9F40', '#4B8C77', '#A57CBA', '#C84B4D'],
        },
      ],
    };
  };

  return (
    <div className="view-reports-container">
      <h2>View Reports</h2>

      <select className="report-dropdown" value={selectedOption} onChange={handleOptionChange}>
        <option value="">Select a report type</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
      </select>

      {loading && <p>Loading reports...</p>}

      {reportData.length > 0 && (
        <>
          <Bar
            data={prepareBarChartData()}
            options={{
              responsive: true,
              onClick: (event, element) => handleBarClick(element),
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

      {reportData.length === 0 && !loading && <p>No data available</p>}

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
