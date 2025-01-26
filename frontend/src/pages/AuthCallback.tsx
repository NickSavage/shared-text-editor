import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      
      if (token) {
        await loginWithToken(token);
        navigate('/documents');
      } else {
        navigate('/login');
      }
    };

    handleCallback();
  }, []);

  return null; // Or loading spinner
};

export default AuthCallback;
