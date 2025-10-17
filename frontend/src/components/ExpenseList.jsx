import React, { useState, useEffect, useRef, useContext } from 'react';
import './styles/Home.css'; // Import a separate CSS file for Home component styles
import AuthContext from '../context/AuthContext.jsx'; // Assuming you're using AuthContext to get the user token
import { useFlashMessage } from '../context/FlashMessageContext.jsx';
import axios from '../api/axios.js'; // For sending requests

function ExpenseList() {
  const { user } = useContext(AuthContext); // Get user from AuthContext
  const { showMessage } = useFlashMessage();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMode, setPaymentMode] = useState(''); // Added state for Payment Mode
  const [expenses, setExpenses] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [limit] = useState(10); // Set limit to fetch 10 expenses at a time
  const [offset, setOffset] = useState(0); // Set initial offset to 0
  const [loading, setLoading] = useState(false); // Loading state for 'Show More'
  const [hasMore, setHasMore] = useState(true); // Whether there are more expenses to load
  const formRef = useRef(null); // Create a reference for the form

  // Helper function to map payment mode to account IDs
  const getPaymentModeId = (paymentMode) => {
    const paymentModeMapping = {
      'Cash in Hand': 1,
      'Debit Card': 2,
      'Credit Card': 3,
    };
    return paymentModeMapping[paymentMode] || 1; // Default to 'Cash in Hand'
  };

  const getPaymentMode = (accountId) => {
    const paymentModeMapping = {
      1: 'Cash in Hand',
      2: 'Debit Card',
      3: 'Credit Card',
    };
    return paymentModeMapping[accountId] || 'Unknown'; // Default to 'Unknown' if no match
  };

  // Fetch expenses from the backend with pagination
  const fetchExpenses = async (reset = false) => {
    setLoading(true); // Start loading state
    try {
      const response = await axios.get('/expenses/get', {
        params: {
          limit,
          offset: reset ? 0 : offset, // Reset offset to 0 if loading fresh
        },
        headers: {
          Authorization: `Bearer ${user?.token}`, // Pass token for authentication
        },
      });
      const newExpenses = response.data;

      if (reset) {
        setExpenses(newExpenses); // Reset the expenses if loading fresh
      } else {
        setExpenses((prevExpenses) => [...prevExpenses, ...newExpenses]); // Append new expenses to existing ones
      }

      setOffset((prevOffset) => prevOffset + limit); // Update the offset

      if (newExpenses.length < limit) {
        setHasMore(false); // If fewer than limit expenses were fetched, there are no more to load
      }
    } catch (error) {
      console.error('Error fetching expenses:', error.response?.data?.message || error.message);
      showMessage('Error fetching expenses. Please try again.', 'error');
    } finally {
      setLoading(false); // Stop loading state
    }
  };

  // Load initial expenses on component mount
  useEffect(() => {
    fetchExpenses(true); // Fetch expenses initially with reset true
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const accountId = getPaymentModeId(paymentMode); // Convert payment mode to account ID
    const newExpense = { amount, description, category, paymentMode, account_id: accountId };
    try {
      const token = user?.token; // Get user token
      if (editingIndex !== null) {
        // If editing, update the expense
        const existingExpense = expenses[editingIndex];
        await axios.put('/expenses/update', {
          amount,
          description,
          category,
          account_id: accountId,
          expenseId: existingExpense.expense_id
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const updatedExpenses = expenses.map((expense, index) =>
          index === editingIndex ? { ...expense, amount, description, category, account_id: accountId } : expense
        );
        setExpenses(updatedExpenses);
        setEditingIndex(null);
        showMessage('Expense updated successfully!', 'success');
      } else {
        // Add a new expense
        const response = await axios.post('/expenses/add', {
          amount,
          description,
          category,
          account_id: accountId,
          username: user?.username
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const addedExpense = { amount, description, category, account_id: accountId, expense_id: response.data.expense_id }; // Expecting response to contain expenseId
        setExpenses((prevExpenses) => [addedExpense, ...prevExpenses]); // Prepend to the list
        showMessage('Expense added successfully!', 'success');
      }
      
      // Reset form fields
      setAmount('');
      setDescription('');
      setCategory('');
      setPaymentMode('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Error processing expense:', errorMessage);
      showMessage(`Error: ${errorMessage}`, 'error');
    }
  };

  const handleDelete = async (index) => {
    const expenseId = expenses[index].expense_id; 
    try {
      await axios.delete(`/expenses/delete/${expenseId}`, {
        data: { username: user?.username },
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      const updatedExpenses = expenses.filter((_, i) => i !== index);
      setExpenses(updatedExpenses);
      showMessage('Expense deleted successfully!', 'success');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Error deleting expense:', errorMessage);
      showMessage(`Error deleting expense: ${errorMessage}`, 'error');
    }
  };

  const handleEdit = (index) => {
    const expenseToEdit = expenses[index];
    setAmount(expenseToEdit.amount);
    setDescription(expenseToEdit.description);
    setCategory(expenseToEdit.category);
    setPaymentMode(getPaymentMode(expenseToEdit.account_id)); // Convert account_id to payment mode name
    setEditingIndex(index);
    window.scrollTo({ top: formRef.current.offsetTop, behavior: 'smooth' });
  };

  return (
    <div>
      <h2 className="expenses-title">Expenses</h2>
      
      <ul className="expenses-list">
        {expenses.map((expense, index) => (
          <li key={index} className="expense-item">
            <div className="expense-details">
              <span className="expense-amount">${expense.amount}</span>
              <span className="expense-description">{expense.description}</span>
              <span className="expense-category">{expense.category}</span>
              <span className="expense-paymentMode">{getPaymentMode(expense.account_id)}</span>
            </div>
            <div className="button-group">
              <button className="edit-button" onClick={() => handleEdit(index)}>Edit</button>
              <button className="delete-button" onClick={() => handleDelete(index)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      {/* Show More Button */}
      {hasMore && (
        <button className="show-more-button" onClick={() => fetchExpenses()} disabled={loading}>
          {loading ? 'Loading...' : 'Show More'}
        </button>
      )}

      {/* Form for adding/editing an expense */}
      <form ref={formRef} onSubmit={handleSubmit}>
        {/* Add input fields for amount, description, category and payment mode */}
        {/* Example input fields */}
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" required />
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required />
        <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" required />
        <input type="text" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} placeholder="Payment Mode" required />
        
        <button type="submit">{editingIndex !== null ? 'Update Expense' : 'Add Expense'}</button>
      </form>
    </div>
  );
}

export default  ExpenseList;

