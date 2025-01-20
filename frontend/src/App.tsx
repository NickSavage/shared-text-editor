import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import DocumentList from './pages/DocumentList';
import Editor from './pages/Editor';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

// Set default axios base URL
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  return (
    <ChakraProvider>
      <AuthProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateRoute><DocumentList /></PrivateRoute>} />
            <Route path="/document/:share_id" element={<PrivateRoute><Editor /></PrivateRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default App;
