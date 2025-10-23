import React, { useState, useEffect, useContext } from 'react';
import axios from '../api/axios.js';
import AuthContext from '../context/AuthContext.jsx';
import { useFlashMessage } from '../context/FlashMessageContext.jsx';
import './styles/Accounts.css';

// Constants to avoid magic strings and repeated literals
const ACCOUNT_ID_MAP = {
  cashInHand: 1,
  debitCardMoney: 2,
  creditCardMoney: 3,
};

const ACCOUNT_OPTIONS = [
  { value: '', label: 'Select' },
  { value: 'cashInHand', label: 'Cash in Hand' },
  { value: 'debitCardMoney', label: 'Debit Card Money' },
  { value: 'creditCardMoney', label: 'Credit Card Money' },
];

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
          // No token available; skip fetch
          return;
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
  
  useEffect(() => {
    const anyOpen = showAddMoneyModal || showTransferMoneyModal;
    if (anyOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showAddMoneyModal, showTransferMoneyModal]);

  const handleAddMoney = async () => {
    // Parse amount to float and validate
    const amount = parseFloat(amountToAdd);
    if (addMoneyAccountName && !Number.isNaN(amount) && amount > 0) {
      try {
        const accountId = getAccountId(addMoneyAccountName); // Map account name to ID
        const token = user?.token; // Get token from AuthContext
        const username = user?.username; // Get the username
        
        if (!token) {
          showMessage('User authentication token is missing.', 'error');
          return;
        }
  
        // Send username along with the data
        await axios.post('/accounts/add', {
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
        await axios.post('/accounts/transfer', {
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
          const fromAccountBalance = Number(prevBalances[transferFromAccountName]) || 0; // Get current balance as number
          const toAccountBalance = Number(prevBalances[transferToAccountName]) || 0; // Get current balance as number

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
  

  const getAccountId = (accountName) => ACCOUNT_ID_MAP[accountName] ?? null;

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

      {/* Backdrop for modals */}
      {(showAddMoneyModal || showTransferMoneyModal) && <div className="modal-backdrop" />}

      {/* Add Money Modal */}
      {showAddMoneyModal && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="addMoneyDialogTitle">
          <div className="modal-content">
            <h3 id="addMoneyDialogTitle">Add Money</h3>
            <label>
              Select Account:
              <select
                value={addMoneyAccountName}
                onChange={(e) => setAddMoneyAccountName(e.target.value)}
              >
                {ACCOUNT_OPTIONS.map((opt) => (
                  <option key={opt.value || 'placeholder'} value={opt.value}>{opt.label}</option>
                ))}
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
            <div className="modal-actions">
              <button onClick={handleAddMoney} className="modal-btn">
                Add
              </button>
              <button onClick={() => setShowAddMoneyModal(false)} className="modal-btn cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
{/* Transfer Money Modal */}
{showTransferMoneyModal && (
  <div className="modal" role="dialog" aria-modal="true" aria-labelledby="transferMoneyDialogTitle">
    <div className="modal-content">
      <h3 id="transferMoneyDialogTitle">Transfer Money</h3>
      <label>
        From:
        <select
          value={transferFromAccountName}
          onChange={(e) => setTransferFromAccountName(e.target.value)}
        >
          {ACCOUNT_OPTIONS.map((opt) => (
            <option key={`from-${opt.value || 'placeholder'}`} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </label>
      
      <label>
        To:
        <select
          value={transferToAccountName}
          onChange={(e) => setTransferToAccountName(e.target.value)}
        >
          {ACCOUNT_OPTIONS.map((opt) => (
            <option key={`to-${opt.value || 'placeholder'}`} value={opt.value}>{opt.label}</option>
          ))}
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

      <div className="modal-actions">
        <button onClick={handleTransferMoney} className="modal-btn">
          Transfer
        </button>
        <button onClick={() => setShowTransferMoneyModal(false)} className="modal-btn cancel-btn">
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Accounts;
