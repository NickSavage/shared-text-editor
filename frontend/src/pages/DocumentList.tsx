import { useState, useEffect } from 'react';
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
  RadioGroup,
  Radio,
  Stack,
  Tooltip,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSubscription } from '../context/SubscriptionContext';

interface Document {
  id: number;
  title: string;
  content: string;
  share_id: string;
  visibility: 'private' | 'public';
  created_at: string;
  updated_at: string;
}

const DocumentList = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocVisibility, setNewDocVisibility] = useState<'private' | 'public'>('public');
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();
  const { subscriptionStatus } = useSubscription();

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('/api/documents');
      setDocuments(response.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to fetch documents',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCreateDocument = async () => {
    if (!newDocTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title for the document',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (newDocVisibility === 'private' && (!subscriptionStatus || subscriptionStatus.status !== 'active')) {
      toast({
        title: 'Pro Subscription Required',
        description: 'You need a pro subscription to create private documents',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/api/documents', {
        title: newDocTitle,
        visibility: newDocVisibility,
      });
      
      setDocuments([response.data, ...documents]);
      onClose();
      setNewDocTitle('');
      navigate(`/editor/${response.data.id}`);
    } catch (error: any) {
      toast({
        title: 'Error creating document',
        description: error.response?.data?.error || 'Something went wrong',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    try {
      await axios.delete(`/api/documents/${id}`);
      fetchDocuments();
      toast({
        title: 'Success',
        description: 'Document deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to delete document',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxW="container.xl" mx="auto" p={6}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">My Documents</Heading>
        <Button colorScheme="blue" onClick={onOpen}>
          Create New Document
        </Button>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <Heading size="md">{doc.title}</Heading>
              </CardHeader>
              <CardBody>
                <Text color="gray.600">
                  Share ID: {doc.share_id}
                </Text>
                <Text color="gray.600">
                  Visibility: {doc.visibility}
                </Text>
                <Text color="gray.600" mt={2}>
                  Created: {new Date(doc.created_at).toLocaleDateString()} {new Date(doc.created_at).toLocaleTimeString()}
                </Text>
                <Text color="gray.600">
                  Last modified: {new Date(doc.updated_at).toLocaleDateString()} {new Date(doc.updated_at).toLocaleTimeString()}
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
                      title: 'Share link copied!',
                      description: 'You can now share this link with others',
                      status: 'success',
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
            <FormControl mt={4}>
              <FormLabel>Visibility</FormLabel>
              <RadioGroup value={newDocVisibility} onChange={(value: 'private' | 'public') => setNewDocVisibility(value)}>
                <Stack direction="row">
                  <Radio value="public">Public</Radio>
                  <Tooltip label={!subscriptionStatus || subscriptionStatus.status !== 'active' ? 'Pro subscription required for private documents' : ''}>
                    <Radio value="private" isDisabled={!subscriptionStatus || subscriptionStatus.status !== 'active'}>Private</Radio>
                  </Tooltip>
                </Stack>
              </RadioGroup>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateDocument}
              isLoading={isLoading}
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