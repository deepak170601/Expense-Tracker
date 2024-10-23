import React, { useState, useEffect, useRef, useContext } from 'react';
import './styles/Home.css'; // Import a separate CSS file for Home component styles
import AuthContext from '../context/AuthContext'; // Assuming you're using AuthContext to get the user token
import axios from '../api/axios'; // For sending requests

function Home() {
  const { user } = useContext(AuthContext); // Get user from AuthContext
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

  // Fetch account balance from the backend before making transactions
  const fetchBalance = async (accountId) => {
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
      return null;
    }
  };


  
// Fetch expenses from the backend with pagination
const fetchExpenses = async (reset = false) => {
  setLoading(true); // Start loading state
  try {
    const response = await axios.get('/expenses/get', {
      params: {
        limit, // Fetch only 10 expenses
        offset: reset ? 0 : offset, // Reset offset to 0 if loading fresh, else use current offset
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
      setHasMore(false); // If fewer than 10 expenses were fetched, there are no more to load
    }
  } catch (error) {
    console.error('Error fetching expenses:', error.response?.data?.message || error.message);
  } finally {
    setLoading(false); // Stop loading state
  }
  
};
const handleSubmit = async (e) => {
  e.preventDefault();

  const accountId = getPaymentModeId(paymentMode); // Get account ID from payment mode

  // Check if there is sufficient balance
  const balance = await fetchBalance(accountId);
  if (balance !== null && balance < parseFloat(amount)) {
    alert('Transaction error: Insufficient balance');
    return;
  }

  const newExpense = { amount, description, category, paymentMode };
  
  try {
    const token = user?.token; // Get user token
    if (editingIndex !== null) {
      // If editing, update the expense
      
      // Get the expense to be updated
      const existingExpense = expenses[editingIndex];
      
      const updatedExpense = {
        ...newExpense,
        expenseId: existingExpense.expense_id, // Use existing expense's ID for the update
        prevPaymentMode: existingExpense.account_id, // Send previous payment mode for balance update
        user_id: existingExpense.user_id, // Send user ID for authentication
      };
      
      // Send updated expense to the backend
      await axios.put('/expenses/update', updatedExpense, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Replace the expense in the list
      const updatedExpenses = expenses.map((expense, index) =>
        index === editingIndex ? updatedExpense : expense
      );
      setExpenses(updatedExpenses);
      setEditingIndex(null);
    } else {
      // Add a new expense
      const response = await axios.post(
        '/expenses/add',
        {
          ...newExpense, // Spread newExpense object
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

      // Ensure the response includes expenseId
      const addedExpense = { ...newExpense, expense_id: response.data.expense_id }; // Expecting response to contain expenseId
      setExpenses((prevExpenses) => [addedExpense, ...prevExpenses]); // Prepend to the list
    }

    // Reset form fields
    setAmount('');
    setDescription('');
    setCategory('');
    setPaymentMode('');
  } catch (error) {
    console.error('Error processing expense:', error.response?.data?.message || error.message);
  }
};
// Handle expense delete
const handleDelete = async (index) => {
  const expenseId = expenses[index].expense_id; // Corrected from expens_id to expense_id
  const paymentMode = expenses[index].paymentMode;

  try {
    await axios.delete(`/expenses/delete/${expenseId}`, {
      data: { username: user?.username }, // Ensure the username is sent
      headers: {
        Authorization: `Bearer ${user?.token}`, // JWT Token for authentication
      },
    });

    // Remove the expense from the local list after deletion
    const updatedExpenses = expenses.filter((_, i) => i !== index);
    setExpenses(updatedExpenses);

  } catch (error) {
    console.error('Error deleting expense:', error.response?.data?.message || error.message);
  }
};

  const handleEdit = (index) => {
    const expenseToEdit = expenses[index];
    setAmount(expenseToEdit.amount);
    setDescription(expenseToEdit.description);
    setCategory(expenseToEdit.category);
    setPaymentMode(expenseToEdit.paymentMode);
    setEditingIndex(index);
    
    // Scroll to the form when edit is clicked
    window.scrollTo({
      top: formRef.current.offsetTop,
      behavior: 'smooth',
    });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setAmount('');
    setDescription('');
    setCategory('');
    setPaymentMode('');
  };
  useEffect(() => {
  }, [expenses]);
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
      >
        <option value="">Select Payment Mode</option>
        <option value="Cash in Hand">Cash in Hand</option>
        <option value="Debit Card">Debit Card</option>
        <option value="Credit Card">Credit Card</option>
      </select>
    </div>
    <div className="button-group">
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
      <li key={index} className="expense-item">
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
  <button className="show-more-button" onClick={fetchExpenses} disabled={loading}>
    {loading ? 'Loading...' : 'Show More'}
  </button>
)}
</div>
  );
}

export default Home;
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