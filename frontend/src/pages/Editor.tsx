import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  HStack,
  Button,
  useToast,
  VStack,
  Text,
} from "@chakra-ui/react";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

interface Document {
  id: number;
  title: string;
  content: string;
  visibility: "private" | "public";
  created_at: string;
}

interface CursorPosition {
  userId: string | number;
  position: {
    lineNumber: number;
    column: number;
  };
}

const Editor = () => {
  const { share_id } = useParams<{ share_id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
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
    console.log("API URL:", import.meta.env.VITE_WS_URL);
    console.log("API URL:", import.meta.env.VITE_API_URL);

    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: token
        ? {
            token,
          }
        : undefined,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      console.log("Connected to WebSocket");
      if (share_id) {
        newSocket.emit("join-document", share_id);
      }
    });

    newSocket.on("error", (error: string) => {
      console.error("Socket error:", error);
      toast({
        title: "Error",
        description: error,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      if (error.includes("Authentication required")) {
        navigate("/login");
      }
    });

    newSocket.on("reconnect", () => {
      console.log("Reconnected to WebSocket");
      if (share_id) {
        newSocket.emit("join-document", share_id);
      }
    });

    newSocket.on("document-change", (newContent: string) => {
      console.log("Received document change:", newContent);
      setDocument((prev) => (prev ? { ...prev, content: newContent } : null));
    });

    newSocket.on("cursor-update", (positions: CursorPosition[]) => {
      // TODO: Implement cursor decorations in Monaco
      console.log("Cursor positions:", positions);
    });

    socketRef.current = newSocket;

    return () => {
      console.log("Cleaning up socket connection");
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [share_id, token]);

  // Fetch document data
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await axios.get(`/api/documents/shared/${share_id}`);
        setDocument(response.data);
      } catch (error: any) {
        toast({
          title: "Document Not Found",
          description:
            "This document does not exist or you do not have permission to view it.",
          status: "error",
          duration: null,
          isClosable: true,
        });
        setDocument(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (share_id) {
      fetchDocument();
    }
  }, [share_id]);

  // Debounced editor change handler
  const debouncedChange = useCallback(
    (() => {
      let timeout: NodeJS.Timeout;
      return (value: string | undefined) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          if (!value || !socketRef.current || !documentRef.current) return;
          console.log("Sending document change:", value);
          socketRef.current.emit("document-change", {
            documentId: share_id,
            content: value,
          });
        }, 500); // 500ms debounce
      };
    })(),
    [share_id],
  );

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!value) return;
      const MAX_CHARS = 50000;
      // Update local state immediately
      // Check character limit
      if (value.length > MAX_CHARS) {
        toast({
          title: "Character Limit Exceeded",
          description: `Document cannot exceed ${MAX_CHARS.toLocaleString()} characters`,
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        const truncatedValue = value.slice(0, MAX_CHARS);
        // Update local state with truncated content
        setDocument((prev) =>
          prev ? { ...prev, content: truncatedValue } : null,
        );

        // Emit truncated content
        debouncedChange(truncatedValue);
        return;
      }
      setDocument((prev) => (prev ? { ...prev, content: value } : null));
      // Debounce the socket emission
      debouncedChange(value);
    },
    [debouncedChange],
  );

  const handleEditorMount = (editor: any) => {
    editor.onDidChangeCursorPosition((e: any) => {
      if (socketRef.current && user) {
        socketRef.current.emit("cursor-update", {
          documentId: share_id,
          position: e.position,
        });
      }
    });
  };

  if (isLoading) {
    return <Box p={6}>Loading...</Box>;
  }

  if (!document) {
    return (
      <Box p={6}>
        <Heading size="md" mb={4}>
          Document Not Found
        </Heading>
        <Button onClick={() => navigate("/")}>Back to Documents</Button>
      </Box>
    );
  }

  return (
    <Box h="100vh" display="flex" flexDirection="column">
      <VStack p={4} bg="gray.100" spacing={2} align="stretch">
        <HStack justify="space-between">
          <Heading size="md">{document.title}</Heading>
          <HStack>
            <Button
              colorScheme="green"
              size="sm"
              onClick={() => {
                const shareUrl = `${window.location.origin}/document/${share_id}`;
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
            <Button size="sm" onClick={() => navigate("/")}>
              Back to Documents
            </Button>
          </HStack>
        </HStack>
        <Text color="gray.600" fontSize="sm">
          Created: {new Date(document.created_at).toLocaleDateString()}{" "}
          {new Date(document.created_at).toLocaleTimeString()}
        </Text>
      </VStack>

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
            wordWrap: "on",
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            parameterHints: { enabled: false },
            // Disable error highlighting
            renderValidationDecorations: "off",
            suggest: {
              showMethods: false,
              showFunctions: false,
              showConstructors: false,
              showFields: false,
              showVariables: false,
              showClasses: false,
              showStructs: false,
              showInterfaces: false,
              showModules: false,
              showProperties: false,
              showEvents: false,
              showOperators: false,
              showUnits: false,
              showValues: false,
              showConstants: false,
              showEnums: false,
              showEnumMembers: false,
              showKeywords: false,
              showWords: false,
              showColors: false,
              showFiles: false,
              showReferences: false,
              showFolders: false,
              showTypeParameters: false,
              showSnippets: false,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default Editor;
