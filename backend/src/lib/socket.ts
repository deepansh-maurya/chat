import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";
import { Env } from "../config/env.config";
import { validateChatParticipant } from "../services/chat.service";
import * as cookie from "cookie";
interface AuthenticatedSocket extends Socket {
  userId?: string;
}

let io: Server | null = null;

const onlineUsers = new Map<string, string>();

export const initializeSocket = (httpServer: HTTPServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: Env.FRONTEND_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.engine.on("connection_error", (err) => {
    console.log("ENGINE ERROR", err.message);
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      console.log(rawCookie, 31);
      if (!rawCookie) return next(new Error("Unauthorized"));
      const cookies = cookie.parse(rawCookie);

      const token = cookies.accessToken;
      if (!token) return next(new Error("Unauthorized"));
      console.log(token, 36);
      const decodedToken = jwt.verify(token, Env.JWT_SECRET) as {
        userId: string;
      };

      console.log(decodedToken, 41);
      if (!decodedToken) return next(new Error("Unauthorized"));
      socket.userId = decodedToken.userId;
      console.log(socket.userId, 44);
      next();
    } catch (error) {
      next(new Error("Internal server error"));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    // console.log("connection", socket);

    const userId = socket.userId!;
    const newSocketId = socket.id;
    if (!socket.userId) {
      socket.disconnect(true);
      return;
    }

    //register socket for the user
    onlineUsers.set(userId, newSocketId);

    //BroadCast online users to all socket
    io?.emit("online:users", Array.from(onlineUsers.keys()));

    //create personnal room for user
    socket.join(`user:${userId}`);

    socket.on(
      "chat:join",
      async (chatId: string, callback?: (err?: string) => void) => {
        try {
          await validateChatParticipant(chatId, userId);
          socket.join(`chat:${chatId}`);
          console.log(`User ${userId} join room chat:${chatId}`);

          callback?.();
        } catch (error) {
          callback?.("Error joining chat");
        }
      }
    );

    socket.on("call:webrtc:send_offer", async ({ activeChatId, offer }) => {
      socket
        .to(`chat:${activeChatId}`)
        .emit("call:webrtc:recieve_offer", offer);
      console.log("sent offer", activeChatId);
    });

    socket.on("call-accepted", async (activeChatId) => {
      console.log(activeChatId, "call accepted~");

      socket.to(`chat:${activeChatId}`).emit("request_accepted");
    });

    socket.on("call:end", (activeChatId) => {
      socket.to(`chat:${activeChatId}`).emit("call:end:accepted");
    });

    socket.on("video:request", async (activeChatId) => {
      socket.to(`chat:${activeChatId}`).emit("video:accept");
    });

    socket.on("call:webrtc:send_answer", async ({ activeChatId, answer }) => {
      socket
        .to(`chat:${activeChatId}`)
        .emit("call:webrtc:recieve_answer", answer);
      console.log("sent answer", activeChatId);
    });

    socket.on("call:webrtc:send_ice", async ({ activeChatId, candidate }) => {
      socket
        .to(`chat:${activeChatId}`)
        .emit("call:webrtc:recieve_ice", candidate);
      console.log("send ice");
    });

    socket.on(
      "call:request",
      async (chatId: string, callback?: (err?: string) => void) => {
        try {
          console.log(chatId, userId, 90);

          await validateChatParticipant(chatId, userId);
          socket.join(`chat:${chatId}`);

          socket.to(`chat:${chatId}`).emit("call:incoming", {
            chatId,
            from: userId
          });

          callback?.();
        } catch (error) {
          callback?.("Error joining chat");
        }
      }
    );

    socket.on(
      "call:rejected",
      async (chatId: string, callback?: (err?: string) => void) => {
        console.log("call rejected", chatId);

        socket.to(`chat:${chatId}`).emit("call:declined", {
          chatId,
          from: userId
        });
        callback?.();
      }
    );

    socket.on("chat:leave", (chatId: string) => {
      if (chatId) {
        socket.leave(`chat:${chatId}`);
        console.log(`User ${userId} left room chat:${chatId}`);
      }
    });

    socket.on("disconnect", () => {
      if (onlineUsers.get(userId) === newSocketId) {
        if (userId) onlineUsers.delete(userId);

        io?.emit("online:users", Array.from(onlineUsers.keys()));

        console.log("socket disconnected", {
          userId,
          newSocketId
        });
      }
    });
  });
};

function getIO() {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

export const emitNewChatToParticpants = (
  participantIds: string[] = [],
  chat: any
) => {
  const io = getIO();
  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:new", chat);
  }
};

export const emitNewMessageToChatRoom = (
  senderId: string, //userId that sent the message
  chatId: string,
  message: any
) => {
  const io = getIO();
  const senderSocketId = onlineUsers.get(senderId?.toString());

  console.log(senderId, "senderId");
  console.log(senderSocketId, "sender socketid exist");
  console.log("All online users:", Object.fromEntries(onlineUsers));

  if (senderSocketId) {
    io.to(`chat:${chatId}`).except(senderSocketId).emit("message:new", message);
  } else {
    io.to(`chat:${chatId}`).emit("message:new", message);
  }
};

export const emitLastMessageToParticipants = (
  participantIds: string[],
  chatId: string,
  lastMessage: any
) => {
  const io = getIO();
  const payload = { chatId, lastMessage };

  for (const participantId of participantIds) {
    io.to(`user:${participantId}`).emit("chat:update", payload);
  }
};
