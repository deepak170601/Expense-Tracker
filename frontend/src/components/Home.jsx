import React, { useState, useEffect, useRef, useContext, useCallback, useMemo } from 'react';
import './styles/Home.css'; // Import a separate CSS file for Home component styles
import AuthContext from '../context/AuthContext.jsx'; // Assuming you're using AuthContext to get the user token
import { useFlashMessage } from '../context/FlashMessageContext.jsx';
import axios from '../api/axios.js'; // For sending requests

// Constants
const PAYMENT_MODE_MAPPING = {
  'Cash in Hand': 1,
  'Debit Card': 2,
  'Credit Card': 3,
};

const ACCOUNT_ID_MAPPING = {
  1: 'Cash in Hand',
  2: 'Debit Card',
  3: 'Credit Card',
};

const EXPENSE_LIMIT = 10;

function Home() {
  const { user } = useContext(AuthContext); // Get user from AuthContext
  const { showMessage } = useFlashMessage();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMode, setPaymentMode] = useState(''); // Added state for Payment Mode
  const [expenses, setExpenses] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [offset, setOffset] = useState(0); // Set initial offset to 0
  const [loading, setLoading] = useState(false); // Loading state for 'Show More'
  const [hasMore, setHasMore] = useState(true); // Whether there are more expenses to load

  const formRef = useRef(null); // Create a reference for the form

  // Helper function to map payment mode to account IDs
  const getPaymentModeId = useCallback((paymentMode) => {
    return PAYMENT_MODE_MAPPING[paymentMode] || 1; // Default to 'Cash in Hand'
  }, []);

  const getPaymentMode = useCallback((accountId) => {
    return ACCOUNT_ID_MAPPING[accountId] || 'Unknown'; // Default to 'Unknown' if no match
  }, []);

  // Reset form fields
  const resetForm = useCallback(() => {
    setAmount('');
    setDescription('');
    setCategory('');
    setPaymentMode('');
    setEditingIndex(null);
  }, []);

  // Fetch account balance from the backend before making transactions
  const fetchBalance = useCallback(async (accountId) => {
    try {
      const response = await axios.get(`/user/balances`, {
        params: {
          username: user?.username,
          account_id: accountId
        },
        headers: {
          Authorization: `Bearer ${user?.token}`, // Pass token for authentication
        },
      });
      return response.data.balance;
    } catch (error) {
      console.error('Error fetching balance:', error.response?.data?.message || error.message);
      showMessage('Error fetching balance', 'error');
      return null;
    }
  }, [user?.username, user?.token, showMessage]);

  // Fetch expenses from the backend with pagination
  const fetchExpenses = useCallback(async (reset = false) => {
    setLoading(true); // Start loading state
    try {
      const currentOffset = reset ? 0 : offset;
      const response = await axios.get('/expenses/get', {
        params: {
          limit: EXPENSE_LIMIT, // Fetch only 10 expenses
          offset: currentOffset, // Use the calculated offset
        },
        headers: {
          Authorization: `Bearer ${user?.token}`, // Pass token for authentication
        },
      });
      const newExpenses = response.data;

      if (reset) {
        setExpenses(newExpenses); // Reset the expenses if loading fresh
        setOffset(EXPENSE_LIMIT); // Reset offset to limit for next fetch
      } else {
        setExpenses((prevExpenses) => [...prevExpenses, ...newExpenses]); // Append new expenses to existing ones
        setOffset((prevOffset) => prevOffset + EXPENSE_LIMIT); // Update the offset
      }

      if (newExpenses.length < EXPENSE_LIMIT) {
        setHasMore(false); // If fewer than 10 expenses were fetched, there are no more to load
      } else if (reset) {
        setHasMore(true); // Reset hasMore when fetching fresh data
      }
    } catch (error) {
      console.error('Error fetching expenses:', error.response?.data?.message || error.message);
      showMessage('Error fetching expenses', 'error');
    } finally {
      setLoading(false); // Stop loading state
    }
  }, [offset, user?.token, showMessage]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const accountId = getPaymentModeId(paymentMode); // Get account ID from payment mode

    // Check if there is sufficient balance
    const balance = await fetchBalance(accountId);
    if (balance !== null && balance < parseFloat(amount)) {
      showMessage('Transaction error: Insufficient balance', 'error');
      return;
    }

    try {
      const token = user?.token; // Get user token
      if (editingIndex !== null) {
        // If editing, update the expense

        // Get the expense to be updated
        const existingExpense = expenses[editingIndex];

        const updatedExpense = {
          amount,
          description,
          category,
          expenseId: existingExpense.expense_id, // Use existing expense's ID for the update
          accountId, // New account ID based on selected payment mode
          prevAccountId: existingExpense.account_id, // Send previous account ID for balance update
          username: user?.username, // Send username for authentication
        };

        // Send updated expense to the backend
        await axios.put('/expenses/update', updatedExpense, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Fetch expenses again to get updated data from backend
        await fetchExpenses(true);
      } else {
        // Add a new expense
        await axios.post(
          '/expenses/add',
          {
            amount,
            description,
            category,
            accountId,
            expenseDate: new Date(), // Current date
            username: user?.username,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Fetch expenses again to get the complete updated list from backend
        await fetchExpenses(true);
      }

      // Reset form fields
      resetForm();
      showMessage(editingIndex !== null ? 'Expense updated successfully' : 'Expense added successfully', 'success');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Error processing expense:', errorMessage);
      showMessage(`Error: ${errorMessage}`, 'error');
    }
  }, [amount, description, category, paymentMode, editingIndex, expenses, user?.username, user?.token, getPaymentModeId, fetchBalance, fetchExpenses, resetForm, showMessage]);

  // Handle expense delete
  const handleDelete = useCallback(async (index) => {
    const expenseId = expenses[index].expense_id;
    const accountId = expenses[index].account_id; // Get account_id for proper deletion

    try {
      await axios.delete(`/expenses/delete/${expenseId}`, {
        data: {
          username: user?.username,
          accountId // Send accountId for proper balance restoration
        },
        headers: {
          Authorization: `Bearer ${user?.token}`, // JWT Token for authentication
        },
      });

      // Remove the expense from the local list after deletion
      setExpenses((prevExpenses) => prevExpenses.filter((_, i) => i !== index));
      showMessage('Expense deleted successfully', 'success');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Error deleting expense:', errorMessage);
      showMessage(`Error deleting expense: ${errorMessage}`, 'error');
    }
  }, [expenses, user?.username, user?.token, showMessage]);

  const handleEdit = useCallback((index) => {
    const expenseToEdit = expenses[index];
    setAmount(expenseToEdit.amount);
    setDescription(expenseToEdit.description);
    setCategory(expenseToEdit.category);
    setPaymentMode(getPaymentMode(expenseToEdit.account_id));
    setEditingIndex(index);
    
    // Scroll to the form when edit is clicked
    if (formRef.current) {
      window.scrollTo({
        top: formRef.current.offsetTop,
        behavior: 'smooth',
      });
    }
  }, [expenses, getPaymentMode]);

  const handleCancelEdit = useCallback(() => {
    resetForm();
  }, [resetForm]);

  // Fetch expenses on component mount
  useEffect(() => {
    fetchExpenses(true); // Load initial expenses when component mounts
  }, [user?.token]); // Only re-fetch if token changes

  return (
    <div className="home">
  <h2 className="home-title">{editingIndex !== null ? 'Edit Expense' : 'Add an Expense'}</h2>
  <form ref={formRef} className="expense-form" onSubmit={handleSubmit}>
    <div className="form-group">
      <label htmlFor="amount">Amount</label>
      <input
        id="amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min={0}
        step="0.01"
        required
      />
    </div>
    <div className="form-group">
      <label htmlFor="description">Description</label>
      <input
        id="description"
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
    </div>
    <div className="form-group">
  <label htmlFor="category">Category</label>
  <select
    id="category"
    value={category}
    onChange={(e) => setCategory(e.target.value)}
    required
    className="comic-font"
  >
    <option value="">Select Category</option>
    <option value="Food">Food</option>
    <option value="Transport">Transport</option>
    <option value="Entertainment">Entertainment</option>
    <option value="Utilities">Utilities</option>
    <option value="Healthcare">Healthcare</option>
    <option value="Other">Other</option>
    {/* New categories */}
    <option value="Rent">Rent</option>
    <option value="Water">Water</option>
    <option value="Grocery">Grocery</option>
    <option value="Beverages">Beverages</option>
    <option value="Office Food">Office Food</option>
  </select>
</div>

    <div className="form-group">
      <label htmlFor="paymentMode">Payment Mode</label>
      <select
        id="paymentMode"
        value={paymentMode}
        onChange={(e) => setPaymentMode(e.target.value)}
        required
        className="comic-font"
      >
        <option value="">Select Payment Mode</option>
        <option value="Cash in Hand">Cash in Hand</option>
        <option value="Debit Card">Debit Card</option>
        <option value="Credit Card">Credit Card</option>
      </select>
    </div>
    <div className="button-group" >
      <button type="submit" className="submit-button" id='submit-button'>
        {editingIndex !== null ? 'Update Expense' : 'Add Expense'}
      </button>
      {editingIndex !== null && (
        <button type="button" className="cancel-button" id='cancel-button' onClick={handleCancelEdit}>
          Cancel
        </button>
      )}
    </div>
  </form>
  <h2 className="expenses-title">Expenses</h2>
<ul className="expenses-list">
    {expenses.map((expense, index) => (
      <li key={expense.expense_id || index} className="expense-item">
        <div className="expense-details">
          <span className="expense-amount">${expense.amount}</span>
          <span className="expense-description">{expense.description}</span>
          <span className="expense-category">{expense.category}</span>
          {/* Use the helper function to set the payment mode */}
          <span className="expense-paymentMode">{getPaymentMode(expense.account_id)}</span>
        </div>
        <div className="button-group">
          <button className="edit-button" onClick={() => handleEdit(index)}>Edit</button>
          <button className="delete-button" onClick={() => handleDelete(index)}>Delete</button>
        </div>
      </li>
    ))}
</ul>

{hasMore && (
  <button className="show-more-button" onClick={() => fetchExpenses(false)} disabled={loading}>
    {loading ? 'Loading...' : 'Show More'}
  </button>
)}
</div>
  );
}

export default Home;
