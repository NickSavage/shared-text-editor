import { Box, Flex, Button, Heading } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box bg="gray.800" px={4} py={2}>
      <Flex justify="space-between" align="center" maxW="container.xl" mx="auto">
        <RouterLink to="/">
          <Heading size="md" color="white">Code Editor</Heading>
        </RouterLink>
        <Flex gap={4}>
          {user ? (
            <>
              <Button as={RouterLink} to="/" variant="ghost" color="white">
                My Documents
              </Button>
              <Button onClick={handleLogout} colorScheme="red">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button as={RouterLink} to="/login" variant="ghost" color="white">
                Login
              </Button>
              <Button as={RouterLink} to="/register" colorScheme="blue">
                Register
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar; 