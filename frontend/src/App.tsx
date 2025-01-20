import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import DocumentList from './pages/DocumentList';
import Editor from './pages/Editor';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><DocumentList /></PrivateRoute>} />
          <Route path="/document/:id" element={<Editor />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}

export default App;
