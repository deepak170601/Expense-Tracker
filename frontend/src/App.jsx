import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Reports from './components/ViewReports';
import About from './components/About';
import Accounts from './components/Accounts';
import SignIn from './components/SignIn';
import Register from './components/Register';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext'; // Make sure this is correct
import ProtectedRoute from './components/ProtectedRoute';
import ExpenseList from './components/ExpenseList';
function App() {
  return (
    <Router>
    <AuthProvider>
        <Navbar />
        <div className="app-container">
          <Routes>
            <Route path="/" element={<SignIn />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute> } />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute> } />
            <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute> } />
            <Route path="/about" element={<About />} />
            <Route path="/register" element={<Register />} />
            <Route path="/expenses" element={<ProtectedRoute><ExpenseList /></ProtectedRoute> } />
          </Routes>
        </div>
        </AuthProvider>
      </Router>
  );
}

export default App;
