import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Image,
  Center,
  HStack,
  Divider,
} from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import { FaGithub } from "react-icons/fa";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleGitHubLogin = () => {
    window.location.href = '/api/auth/github';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to login",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
      <VStack spacing={4} as="form" onSubmit={handleSubmit}>
        <Center mb={4}>
          <Image src={logo} alt="CodeScribble Logo" height="60px" />
        </Center>
        <Heading size="lg">Login</Heading>
        <Button
          leftIcon={<FaGithub />}
          width="full"
          onClick={handleGitHubLogin}
          colorScheme="gray"
        >
          Continue with GitHub
        </Button>

        <HStack width="full">
          <Divider />
          <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
            or login with email
          </Text>
          <Divider />
        </HStack>

        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          width="full"
          isLoading={isLoading}
        >
          Login
        </Button>

        <VStack spacing={2} width="full">
          <Text>
            Don't have an account?{" "}
            <RouterLink to="/register">Register here</RouterLink>
          </Text>
          <Text>
            <RouterLink to="/forgot-password">Forgot your password?</RouterLink>
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};

export default Login;
