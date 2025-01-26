import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      loginWithToken(token);
      navigate('/documents');
    } else {
      navigate('/login');
    }
  }, []);

  return null; // Or loading spinner
};

export default AuthCallback;
