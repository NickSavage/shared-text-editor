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
import {
  Link as RouterLink,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import logo from "../assets/logo.png";
import axios from "axios";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      await axios.post("/api/auth/password-reset/reset", {
        token,
        newPassword,
      });

      toast({
        title: "Success",
        description: "Your password has been reset successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to reset password",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius="lg">
        <VStack spacing={4}>
          <Heading size="lg">Invalid Reset Link</Heading>
          <Text>This password reset link is invalid or has expired.</Text>
          <RouterLink to="/forgot-password">
            Request a new reset link
          </RouterLink>
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
        <Heading size="lg">Set New Password</Heading>

        <FormControl isRequired>
          <FormLabel>New Password</FormLabel>
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </FormControl>

        <FormControl isRequired>
          <FormLabel>Confirm New Password</FormLabel>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          width="full"
          isLoading={isLoading}
        >
          Reset Password
        </Button>

        <Text>
          Remember your password?{" "}
          <RouterLink to="/login">Login here</RouterLink>
        </Text>
      </VStack>
    </Box>
  );
};

export default ResetPassword;
