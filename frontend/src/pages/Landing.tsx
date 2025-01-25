import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Add this import

import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  Stack,
  Icon,
  useColorModeValue,
  VStack,
  Image,
} from "@chakra-ui/react";
import { FaUsers, FaLock, FaBolt } from "react-icons/fa";

const Feature = ({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: any;
}) => {
  return (
    <Stack direction={"row"} align={"center"}>
      <Icon as={icon} color={"blue.500"} w={5} h={5} />
      <VStack align={"start"}>
        <Text fontWeight={600}>{title}</Text>
        <Text color={"gray.600"}>{text}</Text>
      </VStack>
    </Stack>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Add this line to get the user's auth status

  return (
    <Box>
      {/* Hero Section */}
      <Container maxW={"7xl"}>
        <Stack
          align={"center"}
          spacing={{ base: 8, md: 10 }}
          py={{ base: 20, md: 28 }}
          direction={{ base: "column", md: "row" }}
        >
          <Stack flex={1} spacing={{ base: 5, md: 10 }}>
            <Heading
              lineHeight={1.1}
              fontWeight={600}
              fontSize={{ base: "3xl", sm: "4xl", lg: "6xl" }}
            >
              <Text as={"span"}>Collaborative Code Editing</Text>
              <br />
              <Text as={"span"} color={"blue.400"}>
                Made Simple
              </Text>
            </Heading>
            <Text color={"gray.500"}>
              Edit code in real-time with your team. Share instantly with
              anyone. Perfect for pair programming, teaching, and quick code
              sharing.
            </Text>
            <Stack
              spacing={{ base: 4, sm: 6 }}
              direction={{ base: "column", sm: "row" }}
            >
              {user ? (
                // Show these buttons for logged-in users
                <>
                  <Button
                    rounded={"full"}
                    size={"lg"}
                    fontWeight={"normal"}
                    px={6}
                    colorScheme={"blue"}
                    onClick={() => navigate("/documents")}
                  >
                    My Documents
                  </Button>
                </>
              ) : (
                // Show these buttons for non-logged-in users
                <>
                  <Button
                    rounded={"full"}
                    size={"lg"}
                    fontWeight={"normal"}
                    px={6}
                    colorScheme={"blue"}
                    onClick={() => navigate("/register")}
                  >
                    Get Started
                  </Button>
                  <Button
                    rounded={"full"}
                    size={"lg"}
                    fontWeight={"normal"}
                    px={6}
                    onClick={() => navigate("/pricing")}
                  >
                    View Pricing
                  </Button>
                </>
              )}
            </Stack>
          </Stack>
          <Box flex={1} position={"relative"} w={"full"}>
            {/* You can add a screenshot or illustration of your editor here */}
            <Box
              position={"relative"}
              height={"300px"}
              rounded={"2xl"}
              boxShadow={"2xl"}
              width={"full"}
              overflow={"hidden"}
            >
              <Image
                alt={"Hero Image"}
                fit={"cover"}
                align={"center"}
                w={"100%"}
                h={"100%"}
                src={"/hero-image.png"} // Replace with your actual editor screenshot
              />
            </Box>
          </Box>
        </Stack>
      </Container>

      {/* Features Section */}
      <Box bg={useColorModeValue("gray.50", "gray.900")}>
        <Container maxW={"7xl"} py={16}>
          <VStack spacing={12}>
            <Stack spacing={0} align={"center"}>
              <Heading>Features that make a difference</Heading>
              <Text color={"gray.600"}>
                Everything you need for seamless code collaboration
              </Text>
            </Stack>
            <Stack
              direction={{ base: "column", md: "row" }}
              spacing={{ base: 10, md: 4, lg: 10 }}
            >
              <Feature
                icon={FaBolt}
                title={"Real-time Collaboration"}
                text={
                  "Edit code simultaneously with your team members. See changes instantly."
                }
              />
              <Feature
                icon={FaUsers}
                title={"Easy Sharing"}
                text={
                  "Share your code with anyone using a simple link. No sign-up required for viewers."
                }
              />
              <Feature
                icon={FaLock}
                title={"Secure Access"}
                text={
                  "Control who can view and edit your code with private and public sharing options."
                }
              />
            </Stack>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Landing;
