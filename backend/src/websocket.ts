import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { query } from "./config/db";

interface Document {
  id: number;
  title: string;
  content: string;
  owner_id: number;
}

export const setupSocketIO = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    // If token is provided, verify it
    if (token) {
      try {
        const payload = jwt.verify(
          token,
          process.env.JWT_SECRET || "your-secret-key",
        ) as { userId: number };
        socket.data.userId = payload.userId;
      } catch (error) {
        return next(new Error("Invalid token"));
      }
    }

    // Allow connection to proceed even without token
    next();
  });

  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("join-document", async (documentId) => {
      // For numeric IDs (private documents), verify ownership
      if (!isNaN(Number(documentId)) && !socket.data.userId) {
        socket.emit("error", "Authentication required for private documents");
        return;
      }

      socket.join(documentId.toString());
      console.log(`Client joined document: ${documentId}`);
    });

    socket.on(
      "document-change",
      async (data: { documentId: string; content: string }) => {
        const MAX_CHARS = 50000;
        if (data.content.length > MAX_CHARS) {
          socket.emit(
            "error",
            `Document exceeds maximum limit of ${MAX_CHARS} characters`,
          );
          return;
        }
        try {
          // Try to find document by numeric ID first, then by share ID if that fails
          let updateQuery = "UPDATE documents SET content = $1 WHERE ";
          let params = [data.content];

          if (!isNaN(Number(data.documentId))) {
            updateQuery += "id = $2";
            params.push(data.documentId);
          } else {
            updateQuery += "share_id = $2";
            params.push(data.documentId);
          }

          await query<Document>(updateQuery, params);

          // Broadcast the change to all clients in the document room except the sender
          socket
            .to(data.documentId.toString())
            .emit("document-change", data.content);
        } catch (error) {
          console.error("Error updating document:", error);
        }
      },
    );

    socket.on(
      "cursor-update",
      (data: { documentId: string; position: any }) => {
        socket.to(data.documentId.toString()).emit("cursor-update", {
          userId: socket.data.userId,
          position: data.position,
        });
      },
    );

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  return io;
};
