import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Heading, HStack, Button, useToast } from '@chakra-ui/react';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

interface Document {
  id: number;
  title: string;
  content: string;
  visibility: 'private' | 'public';
}

interface CursorPosition {
  userId: string | number;
  position: {
    lineNumber: number;
    column: number;
  };
}

const Editor = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const socketRef = useRef<Socket | null>(null);
  const documentRef = useRef<Document | null>(null);

  // Keep document ref in sync
  useEffect(() => {
    documentRef.current = document;
  }, [document]);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      if (id) {
        newSocket.emit('join-document', id);
      }
    });

    newSocket.on('reconnect', () => {
      console.log('Reconnected to WebSocket');
      if (id) {
        newSocket.emit('join-document', id);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast({
        title: 'Connection Error',
        description: 'Trying to reconnect...',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    });

    newSocket.on('document-change', (newContent: string) => {
      console.log('Received document change:', newContent);
      setDocument(prev => prev ? { ...prev, content: newContent } : null);
    });

    newSocket.on('cursor-update', (positions: CursorPosition[]) => {
      // TODO: Implement cursor decorations in Monaco
      console.log('Cursor positions:', positions);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [id, token]);

  // Fetch document data
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await axios.get(`/api/documents/${id}`);
        setDocument(response.data);
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.error || 'Failed to fetch document',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDocument();
    }
  }, [id]);

  // Debounced editor change handler
  const debouncedChange = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (value: string | undefined) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (!value || !socketRef.current || !documentRef.current) return;
          console.log('Sending document change:', value);
          socketRef.current.emit('document-change', {
            documentId: id,
            content: value,
          });
        }, 500); // 500ms debounce
      };
    })(),
    [id]
  );

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (!value) return;
    // Update local state immediately
    setDocument(prev => prev ? { ...prev, content: value } : null);
    // Debounce the socket emission
    debouncedChange(value);
  }, [debouncedChange]);

  const handleEditorMount = (editor: any) => {
    editor.onDidChangeCursorPosition((e: any) => {
      if (socketRef.current && user) {
        socketRef.current.emit('cursor-update', {
          documentId: id,
          position: e.position,
        });
      }
    });
  };

  if (isLoading) {
    return <Box p={6}>Loading...</Box>;
  }

  if (!document) {
    return <Box p={6}>Document not found</Box>;
  }

  return (
    <Box h="100vh" display="flex" flexDirection="column">
      <HStack p={4} bg="gray.100" justify="space-between">
        <Heading size="md">{document.title}</Heading>
        <Button onClick={() => navigate('/')}>Back to Documents</Button>
      </HStack>
      
      <Box flex={1}>
        <MonacoEditor
          height="100%"
          defaultLanguage="javascript"
          value={document.content}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            wordWrap: 'on',
          }}
        />
      </Box>
    </Box>
  );
};

export default Editor; 