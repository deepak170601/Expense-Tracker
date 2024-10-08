import React, { useEffect, useRef, useState, useContext } from 'react';
import { Chart, registerables } from 'chart.js';
import { Modal,Button } from 'react-bootstrap';
import axios from '../api/axios';
import './styles/ViewReports.css';
import AuthContext from '../context/AuthContext';

Chart.register(...registerables);

const DailyChart = ({ data, onBarClick }) => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        if (chartRef.current) {
            const chartData = {
                labels: data.map(row => row.date),
                datasets: [
                    {
                        label: 'Daily Totals (Last 10 Days)',
                        data: data.map(row => row.total),
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        type: 'bar',
                    },
                ],
            };

            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            chartInstanceRef.current = new Chart(chartRef.current, {
                type: 'bar',
                data: chartData,
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                        },
                    },
                    responsive: true,
                    maintainAspectRatio: true,
                    onClick: (event) => {
                        const activePoints = chartInstanceRef.current.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
                        if (activePoints.length > 0) {
                            const clickedIndex = activePoints[0].index;
                            const clickedDate = data[clickedIndex].date;
                            onBarClick(clickedDate);
                        }
                    },
                },
            });
        }
    }, [data, onBarClick]);

    return (
        <div className="chart">
            <canvas ref={chartRef} style={{ width: '100%', height: '100%' }}></canvas>
        </div>
    );
};
const WeeklyChart = ({ data, onBarClick }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
      if (chartRef.current) {
          // Log the data to debug
          console.log(data);

          // Ensure all date strings are valid
          const labels = data.map(row => {
              const date = new Date(row.date);
              if (isNaN(date)) {
                  console.error(`Invalid date: ${row.date}`);
                  return ''; // Return empty string or some default value
              }
              return date.toISOString().split('T')[0]; // Format to YYYY-MM-DD
          });

          const chartData = {
              labels,
              datasets: [
                  {
                      label: 'Weekly Totals',
                      data: data.map(row => row.total),
                      backgroundColor: 'rgba(255, 99, 132, 0.2)',
                      borderColor: 'rgba(255, 99, 132, 1)',
                      borderWidth: 1,
                      type: 'bar',
                  },
              ],
          };

          if (chartInstanceRef.current) {
              chartInstanceRef.current.destroy();
          }

          chartInstanceRef.current = new Chart(chartRef.current, {
              type: 'bar',
              data: chartData,
              options: {
                  scales: {
                      y: {
                          beginAtZero: true,
                      },
                  },
                  responsive: true,
                  maintainAspectRatio: true,
                  onClick: (event) => {
                      const activePoints = chartInstanceRef.current.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
                      if (activePoints.length > 0) {
                          const clickedIndex = activePoints[0].index;
                          const clickedDate = labels[clickedIndex];
                          onBarClick(clickedDate);
                      }
                  },
              },
          });
      }
  }, [data, onBarClick]);

  return (
      <div className="chart">
          <canvas ref={chartRef} style={{ width: '100%', height: '100%' }}></canvas>
      </div>
  );
};

const MonthlyChart = ({ data, onBarClick }) => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        if (chartRef.current) {
            const chartData = {
                labels: data.map(row => row.date),
                datasets: [
                    {
                        label: 'Monthly Totals (Last 6 Months)',
                        data: data.map(row => row.total),
                        backgroundColor: 'rgba(153, 102, 255, 0.2)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1,
                        type: 'bar',
                    },
                ],
            };

            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            chartInstanceRef.current = new Chart(chartRef.current, {
                type: 'bar',
                data: chartData,
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                        },
                    },
                    responsive: true,
                    maintainAspectRatio: true,
                    onClick: (event) => {
                        const activePoints = chartInstanceRef.current.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
                        if (activePoints.length > 0) {
                            const clickedIndex = activePoints[0].index;
                            const clickedDate = data[clickedIndex].date;
                            onBarClick(clickedDate);
                        }
                    },
                },
            });
        }
    }, [data, onBarClick]);

    return (
        <div className="chart">
            <canvas ref={chartRef} style={{ width: '100%', height: '100%' }}></canvas>
        </div>
    );
};

const CategorySplitPieChart = ({ data, isOpen, onClose }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
      if (chartRef.current && isOpen) {
          const categoryData = data.reduce((acc, row) => {
              acc[row.category] = (acc[row.category] || 0) + row.total;
              return acc;
          }, {});

          const chartData = {
              labels: Object.keys(categoryData),
              datasets: [{
                  data: Object.values(categoryData),
                  backgroundColor: [
                      'rgba(255, 99, 132, 0.7)',
                      'rgba(54, 162, 235, 0.7)',
                      'rgba(255, 206, 86, 0.7)',
                      'rgba(75, 192, 192, 0.7)',
                      'rgba(153, 102, 255, 0.7)',
                      'rgba(255, 159, 64, 0.7)',
                  ],
              }],
          };

          if (chartInstanceRef.current) {
              chartInstanceRef.current.destroy();
          }

          chartInstanceRef.current = new Chart(chartRef.current, {
              type: 'pie',
              data: chartData,
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
              },
          });
      }

      return () => {
          if (chartInstanceRef.current) {
              chartInstanceRef.current.destroy();
          }
      };
  }, [data, isOpen]);

  return (
      <Modal 
          show={isOpen} 
          onHide={onClose} 
          centered 
          size="lg" 
          backdrop="static" // Prevent backdrop dimming
          className="category-pie-modal"
          animation={false} // Disable Bootstrap's default animation
      >
          <Modal.Header closeButton>
              <Modal.Title>Category Split</Modal.Title>
              {/* Close Button */}
              <Button variant="close" onClick={onClose} />
          </Modal.Header>
          <Modal.Body>
              <div style={{ position: 'relative', width: '100%', height: '400px' }}>
                  <canvas ref={chartRef} style={{ width: '100%', height: '100%' }}></canvas>
              </div>
          </Modal.Body>
      </Modal>
  );
};


const ViewReports = () => {
    
  const [jsonData, setJsonData] = useState([]);
  const [showPieChart, setShowPieChart] = useState(false);
  const [currentPieData, setCurrentPieData] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
      const fetchData = async (type) => {
          if (!user || !user.username) {
              setError('User is not authenticated');
              return;
          }

          setLoading(true);
          setError(null);
          try {
              const response = await axios.get('/reports/reports', {
                  headers: {
                      Authorization: `Bearer ${user.token}`
                  },
                  params: {
                      type,
                      username: user.username,
                  },
              });
              setJsonData(response.data);
          } catch (error) {
              console.error('Error fetching data:', error);
              setError('Failed to fetch reports. Please try again later.');
          } finally {
              setLoading(false);
          }
      };

      if (selectedOption) {
          fetchData(selectedOption);
      }
  }, [user, selectedOption]);

  const aggregateDailyData = (data) => {
      const today = new Date();
      const last10Days = [];
      const dailyTotals = {};

      for (let i = 0; i < 10; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const formattedDate = date.toISOString().split('T')[0];
          last10Days.push(formattedDate);
          dailyTotals[formattedDate] = 0;
      }

      data.forEach(row => {
          const rowDate = new Date(row.day);
          if (!isNaN(rowDate)) {
              const formattedRowDate = rowDate.toISOString().split('T')[0];
              if (dailyTotals[formattedRowDate] !== undefined) {
                  dailyTotals[formattedRowDate] += parseFloat(row.total);
              }
          } else {
              console.warn(`Invalid date value: ${row.day}`);
          }
      });

      return last10Days.map(date => ({ date, total: dailyTotals[date] }));
  };
  const aggregateWeeklyData = (data) => {
    const today = new Date();
    const last7Days = [];
    const weeklyTotals = {};

    // Create an array of the last 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const formattedDate = date.toISOString().split('T')[0];
        last7Days.push(formattedDate);
        weeklyTotals[formattedDate] = 0;
    }

    // Aggregate totals for each valid date in the data
    data.forEach(row => {
        const rowDateString = row.day; // Assuming row.day is a string representing the date
        if (rowDateString) {
            const rowDate = new Date(rowDateString);
            if (!isNaN(rowDate.getTime())) { // Check if the date is valid
                const formattedRowDate = rowDate.toISOString().split('T')[0];
                if (weeklyTotals[formattedRowDate] !== undefined) {
                    weeklyTotals[formattedRowDate] += parseFloat(row.total);
                }
            } else {
                console.warn(`Invalid date value: ${rowDateString}`); // Log invalid date
            }
        } else {
            console.warn(`Row with None day value: ${row}`); // Log None values
        }
    });

    // Return the aggregated results
    return last7Days.map(date => ({ date, total: weeklyTotals[date] }));
};

  const aggregateMonthlyData = (data) => {
      const today = new Date();
      const last6Months = [];
      const monthlyTotals = {};

      for (let i = 0; i < 6; i++) {
          const date = new Date(today);
          date.setMonth(today.getMonth() - i);
          const formattedDate = date.toISOString().slice(0, 7); // 'YYYY-MM'
          last6Months.push(formattedDate);
          monthlyTotals[formattedDate] = 0;
      }

      data.forEach(row => {
          const rowDate = new Date(row.day);
          if (!isNaN(rowDate)) {
              const formattedRowDate = rowDate.toISOString().slice(0, 7);
              if (monthlyTotals[formattedRowDate] !== undefined) {
                  monthlyTotals[formattedRowDate] += parseFloat(row.total);
              }
          } else {
              console.warn(`Invalid date value: ${row.day}`);
          }
      });

      return last6Months.map(date => ({ date, total: monthlyTotals[date] }));
  };

  const handleBarClick = (date) => {
      const filteredData = jsonData.filter(item => new Date(item.day).toISOString().split('T')[0] === date);
      setCurrentPieData(filteredData);
      setShowPieChart(true);
  };

  return (
      <div className="view-reports">
          <h2>View Reports</h2>
          
          <div className="form-group">
              <label>Select Report Type:</label>
              <select className="form-control" value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
              </select>
          </div>

          {loading && <p>Loading...</p>}
          {error && <p className="error">{error}</p>}

          {selectedOption === 'daily' && jsonData.length > 0 && (
              <DailyChart data={aggregateDailyData(jsonData)} onBarClick={handleBarClick} />
          )}
          
          {selectedOption === 'weekly' && jsonData.length > 0 && (
              <WeeklyChart data={aggregateWeeklyData(jsonData)} onBarClick={handleBarClick} />
          )}
          
          {selectedOption === 'monthly' && jsonData.length > 0 && (
              <MonthlyChart data={aggregateMonthlyData(jsonData)} onBarClick={handleBarClick} />
          )}

          <CategorySplitPieChart data={currentPieData} isOpen={showPieChart} onClose={() => setShowPieChart(false)} />
      </div>
  );
};

export default ViewReports;
