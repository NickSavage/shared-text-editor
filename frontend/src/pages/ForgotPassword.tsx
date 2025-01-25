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
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import logo from "../assets/logo.png";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await axios.post("/api/auth/password-reset/request", { email });
      setIsSubmitted(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Something went wrong",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
        <VStack spacing={4}>
          <Heading size="lg">Check Your Email</Heading>
          <Text textAlign="center">
            If an account exists with this email, you will receive password
            reset instructions.
          </Text>
          <RouterLink to="/login">Return to Login</RouterLink>
        </VStack>
      </Box>
    );
  }

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
      <VStack spacing={4} as="form" onSubmit={handleSubmit}>
        <Center mb={4}>
          <Image src={logo} alt="CodeScribble Logo" height="60px" />
        </Center>
        <Heading size="lg">Reset Password</Heading>

        <FormControl isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          width="full"
          isLoading={isLoading}
        >
          Send Reset Instructions
        </Button>

        <Text>
          Remember your password?{" "}
          <RouterLink to="/login">Login here</RouterLink>
        </Text>
      </VStack>
    </Box>
  );
};

export default ForgotPassword;
