import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './components/Home.jsx';
import Reports from './components/ViewReports.jsx';
import About from './components/About.jsx';
import Accounts from './components/Accounts.jsx';
import SignIn from './components/SignIn.jsx';
import Register from './components/Register.jsx';
import Navbar from './components/Navbar.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { FlashMessageProvider } from './context/FlashMessageContext.jsx';
import FlashMessage from './components/FlashMessage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ExpenseList from './components/ExpenseList.jsx';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthProvider>
      <FlashMessageProvider>
        <FlashMessage />
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
      </FlashMessageProvider>
    </AuthProvider>
    </Router>
  );
}

export default App;
