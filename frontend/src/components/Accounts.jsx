import React, { useState, useEffect, useContext } from 'react';
import axios from '../api/axios.js';
import AuthContext from '../context/AuthContext.jsx';
import { useFlashMessage } from '../context/FlashMessageContext.jsx';
import './styles/Accounts.css';

const Accounts = () => {
  const [accountBalances, setAccountBalances] = useState({
    cashInHand: 0,
    debitCardMoney: 0,
    creditCardMoney: 0,
  });

  const { user } = useContext(AuthContext);
  const { showMessage } = useFlashMessage();
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showTransferMoneyModal, setShowTransferMoneyModal] = useState(false);

  // States to track account names and amounts
  const [addMoneyAccountName, setAddMoneyAccountName] = useState('');
  const [amountToAdd, setAmountToAdd] = useState(''); // Initialize as string to handle input better
  
  const [transferFromAccountName, setTransferFromAccountName] = useState('');
  const [transferToAccountName, setTransferToAccountName] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  useEffect(() => {
    const fetchAccountBalances = async () => {
      try {
        const token = user?.token; // Ensure token is available
        if (!token) {
          throw new Error('No token available');
        }
  
        const response = await axios.get('/accounts/balances', {
          headers: {
            Authorization: `Bearer ${token}`, // Send JWT token in Authorization header
          },
        });
  
        // Use the correct account names from your response
        const balances = response.data.reduce((acc, account) => {
          switch (account.accountName) {
            case 'cashInHand':
              acc.cashInHand = account.balance;
              break;
            case 'debitCardMoney':
              acc.debitCardMoney = account.balance;
              break;
            case 'creditCardMoney':
              acc.creditCardMoney = account.balance;
              break;
            default:
              break;
          }
          return acc;
        }, {
          cashInHand: 0, 
          debitCardMoney: 0, 
          creditCardMoney: 0
        });
  
        setAccountBalances(balances);
        
      } catch (error) {
        console.error('Error fetching account balances:', error);
      }
    };
  
    fetchAccountBalances();
  }, [user]);
  
  const handleAddMoney = async () => {
    if (amountToAdd > 0 && addMoneyAccountName) {
      try {
        const accountId = getAccountId(addMoneyAccountName); // Map account name to ID
        const token = user?.token; // Get token from AuthContext
        const username = user?.username; // Get the username
        
        // Parse amount to float and send to backend
        const amount = parseFloat(amountToAdd);
        if (isNaN(amount) || amount <= 0) {
          showMessage('Invalid amount entered', 'error');
          return;
        }
  
        // Send username along with the data
        const response = await axios.post('/accounts/add', {
          accountId,
          amount, // Send the parsed float value
          accountName: addMoneyAccountName,
          username, // Include the username in the request
        }, {
          headers: {
            Authorization: `Bearer ${token}`, // Send JWT token in Authorization header
          },
        });
  
        setAccountBalances((prevBalances) => {
          const balance = parseFloat(prevBalances[addMoneyAccountName]) || 0; // Ensure balance is a number
          return {
            ...prevBalances,
            [addMoneyAccountName]: balance + amount, // Correctly add the amount to the existing balance
          };
        });
        
        showMessage('Money added successfully!', 'success');
      } catch (error) {
        console.error('Error adding money:', error);
        showMessage('Error adding money. Please try again.', 'error');
      } finally {
        setShowAddMoneyModal(false);
        setAmountToAdd(''); // Clear the input after adding
        setAddMoneyAccountName('');
      }
    } else {
      showMessage('Please enter a valid amount and select an account.', 'warning');
    }
  };
  

  const handleTransferMoney = async () => {
    if (transferFromAccountName && transferToAccountName && transferAmount > 0 && transferFromAccountName !== transferToAccountName) {
      try {
        const token = user?.token;
        if (!token) {
          showMessage('User authentication token is missing.', 'error');
          return;
        }
  
        const fromAccountId = getAccountId(transferFromAccountName);
        const toAccountId = getAccountId(transferToAccountName);
  
        // Parse transfer amount to float
        const amount = parseFloat(transferAmount);
        if (isNaN(amount) || amount <= 0) {
          showMessage('Invalid transfer amount.', 'error');
          return;
        }
  
        // Send transfer request to backend
        const response = await axios.post('/accounts/transfer', {
          fromAccountId,
          toAccountId,
          amount, // Send parsed float value
        }, {
          headers: {
            Authorization: `Bearer ${token}`, // Send JWT token in Authorization header
          },
        });
  
        // Update balances if transfer was successful
        setAccountBalances((prevBalances) => {
          const fromAccountBalance = parseFloat(prevBalances[transferFromAccountName], 10) || 0; // Get current balance as integer
          const toAccountBalance = parseFloat(prevBalances[transferToAccountName], 10) || 0; // Get current balance as integer

          return {
            ...prevBalances,
            [transferFromAccountName]: fromAccountBalance - amount, // Deduct the amount
            [transferToAccountName]: toAccountBalance + amount, // Add the amount
          };
        });
          
        // Clear input fields and close modal
        setShowTransferMoneyModal(false);
        setTransferFromAccountName('');
        setTransferToAccountName('');
        setTransferAmount('');
  
        showMessage('Transfer completed successfully!', 'success');
      } catch (error) {
        console.error('Error transferring money:', error);
        showMessage('Error transferring money. Please try again.', 'error');
      }
    } else {
      showMessage('Invalid transfer details.', 'warning');
    }
  };
  

  const getAccountId = (accountName) => {
    switch (accountName) {
      case 'cashInHand':
        return 1;
      case 'debitCardMoney':
        return 2;
      case 'creditCardMoney':
        return 3;
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <h2>Manage Accounts</h2>
      <div className="accounts-container">
        <div className="account-box">
          <h3>Cash in Hand</h3>
          <p>Amount: ₹{accountBalances.cashInHand}</p>
        </div>
        <div className="account-box">
          <h3>Debit Card Money</h3>
          <p>Amount: ₹{accountBalances.debitCardMoney}</p>
        </div>
        <div className="account-box">
          <h3>Credit Card Money</h3>
          <p>Amount: ₹{accountBalances.creditCardMoney}</p>
        </div>
      </div>

      {/* Button Group for Add Money and Transfer Money */}
      <div className="button-group">
        <button onClick={() => setShowAddMoneyModal(true)} className="btn add-money-btn">
          Add Money
        </button>
        <button onClick={() => setShowTransferMoneyModal(true)} className="btn transfer-money-btn">
          Transfer Money
        </button>
      </div>

      {/* Add Money Modal */}
      {showAddMoneyModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Money</h3>
            <label>
              Select Account:
              <select
                value={addMoneyAccountName}
                onChange={(e) => setAddMoneyAccountName(e.target.value)}
                style={{ fontFamily: "'Comic Sans MS', sans-serif" }}
              >
                <option value="">Select</option>
                <option value="cashInHand">Cash in Hand</option>
                <option value="debitCardMoney">Debit Card Money</option>
                <option value="creditCardMoney">Credit Card Money</option>
              </select>
            </label>
            <label>
              Enter Amount:
              <input
                type="number"
                value={amountToAdd}
                onChange={(e) => setAmountToAdd(e.target.value)} // Keep the value as a string initially
              />
            </label>
            <button onClick={handleAddMoney} className="modal-btn">
              Add
            </button>
            <button onClick={() => setShowAddMoneyModal(false)} className="modal-btn cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      )}
{/* Transfer Money Modal */}
{showTransferMoneyModal && (
  <div className="modal">
    <div className="modal-content">
      <h3>Transfer Money</h3>
      <label>
        From:
        <select
          value={transferFromAccountName}
          onChange={(e) => setTransferFromAccountName(e.target.value)}
          style={{ fontFamily: "'Comic Sans MS', sans-serif" }}
        >
          <option value="">Select</option>
          <option value="cashInHand">Cash in Hand</option>
          <option value="debitCardMoney">Debit Card Money</option>
          <option value="creditCardMoney">Credit Card Money</option>
        </select>
      </label>
      
      <label>
        To:
        <select
          value={transferToAccountName}
          onChange={(e) => setTransferToAccountName(e.target.value)}
          style={{ fontFamily: "'Comic Sans MS', sans-serif" }}
        >
          <option value="">Select</option>
          <option value="cashInHand">Cash in Hand</option>
          <option value="debitCardMoney">Debit Card Money</option>
          <option value="creditCardMoney">Credit Card Money</option>
        </select>
      </label>

      <label>
        Enter Amount:
        <input
          type="number"
          value={transferAmount}
          onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
        />
      </label>

      <button onClick={handleTransferMoney} className="modal-btn">
        Transfer
      </button>
      <button onClick={() => setShowTransferMoneyModal(false)} className="modal-btn cancel-btn">
        Cancel
      </button>
    </div>
  </div>
)}
    </div>
  );
};

export default Accounts;
