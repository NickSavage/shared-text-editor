import { useState, useEffect } from "react";
import {
  Box,
  Button,
  VStack,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useDisclosure,
  Tooltip,
  HStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSubscription } from "../context/SubscriptionContext";
import { useAuth } from "../context/AuthContext";

interface Document {
  id: number;
  title: string;
  content: string;
  share_id: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
  expires_in: number | null;
}

const DocumentList = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newDocTitle, setNewDocTitle] = useState("");
  const { isLoading: authLoading } = useAuth();
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();
  const { subscriptionStatus } = useSubscription();

  const isProUser = subscriptionStatus?.status === "active";
  const documentCount = documents.length;
  const remainingDocs = isProUser ? null : 5 - documentCount;

  const fetchDocuments = async () => {
    try {
      const response = await axios.get("/api/documents");
      setDocuments(response.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to fetch documents",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    if (authLoading) return;

    console.log("getting docs");
    fetchDocuments();
  }, [authLoading]);

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the document",
        status: "error",
        duration: 3000,
      });
      return;
    }

    if (!isProUser && documentCount >= 5) {
      toast({
        title: "Document Limit Reached",
        description:
          "Free tier users are limited to 5 documents. Please upgrade to create more documents.",
        status: "warning",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsCreatingDoc(true);
    try {
      const response = await axios.post("/api/documents", {
        title: newDocTitle,
      });

      setDocuments([response.data, ...documents]);
      onClose();
      setNewDocTitle("");
      navigate(`/document/${response.data.share_id}`);
    } catch (error: any) {
      toast({
        title: "Error creating document",
        description: error.response?.data?.error || "Something went wrong",
        status: "error",
        duration: 3000,
      });
    } finally {
      setIsCreatingDoc(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    try {
      await axios.delete(`/api/documents/${id}`);
      fetchDocuments();
      toast({
        title: "Success",
        description: "Document deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete document",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxW="container.xl" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">My Documents</Heading>
          {!isProUser && (
            <HStack>
              <Text color={documentCount >= 4 ? "orange.500" : "gray.600"}>
                {remainingDocs} document{remainingDocs === 1 ? "" : "s"}{" "}
                remaining (Free Tier)
              </Text>
              {documentCount >= 4 && (
                <Button
                  size="sm"
                  colorScheme="green"
                  onClick={() => navigate("/pricing")}
                >
                  Upgrade to Pro
                </Button>
              )}
            </HStack>
          )}
        </HStack>
        <Tooltip
          label={
            !isProUser && documentCount >= 5
              ? "Free tier users are limited to 5 documents. Please upgrade to create more documents."
              : ""
          }
          isDisabled={isProUser || documentCount < 5}
        >
          <Box>
            <Button
              colorScheme="blue"
              onClick={
                !isProUser && documentCount >= 5
                  ? () => navigate("/pricing")
                  : onOpen
              }
              isDisabled={false}
            >
              {!isProUser && documentCount >= 5
                ? "Upgrade to Create More"
                : "Create New Document"}
            </Button>
          </Box>
        </Tooltip>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <Heading size="md">{doc.title}</Heading>
              </CardHeader>
              <CardBody>
                <Text color="gray.600">Share ID: {doc.share_id}</Text>
                {doc.expires_in !== null && (
                  <Text
                    color={doc.expires_in < 3600 ? "red.500" : "orange.500"}
                    fontWeight="medium"
                  >
                    Expires in:{" "}
                    {doc.expires_in > 3600
                      ? `${Math.floor(doc.expires_in / 3600)} hours`
                      : doc.expires_in > 60
                        ? `${Math.floor(doc.expires_in / 60)} minutes`
                        : `${doc.expires_in} seconds`}
                  </Text>
                )}
                <Text color="gray.600" mt={2}>
                  Created: {new Date(doc.created_at).toLocaleDateString()}{" "}
                  {new Date(doc.created_at).toLocaleTimeString()}
                </Text>
                <Text color="gray.600">
                  Last modified: {new Date(doc.updated_at).toLocaleDateString()}{" "}
                  {new Date(doc.updated_at).toLocaleTimeString()}
                </Text>
              </CardBody>
              <CardFooter>
                <Button
                  colorScheme="blue"
                  mr={3}
                  onClick={() => navigate(`/document/${doc.share_id}`)}
                >
                  Open
                </Button>
                <Button
                  colorScheme="green"
                  mr={3}
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/document/${doc.share_id}`;
                    navigator.clipboard.writeText(shareUrl);
                    toast({
                      title: "Share link copied!",
                      description: "You can now share this link with others",
                      status: "success",
                      duration: 3000,
                      isClosable: true,
                    });
                  }}
                >
                  Copy Share Link
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => handleDeleteDocument(doc.id)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </SimpleGrid>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Document</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Title</FormLabel>
              <Input
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="Enter document title"
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateDocument}
              isLoading={isCreatingDoc}
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DocumentList;
