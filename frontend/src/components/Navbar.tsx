import { Box, Flex, Button, Menu, MenuButton, MenuList, MenuItem, Image } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronDownIcon } from '@chakra-ui/icons';
import logo from '../assets/logo.png';

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
          <Image src={logo} alt="CodeScribble Logo" height="40px" />
        </RouterLink>
        <Flex gap={4}>
          {user ? (
            <Menu>
              <MenuButton as={Button} rightIcon={<ChevronDownIcon />} color="white" variant="ghost">
                {user.email}
              </MenuButton>
              <MenuList>
                <MenuItem as={RouterLink} to="/">
                  My Documents
                </MenuItem>
                <MenuItem as={RouterLink} to="/profile">
                  Profile
                </MenuItem>
                <MenuItem onClick={handleLogout} color="red.500">
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
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