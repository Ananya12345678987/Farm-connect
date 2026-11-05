import { Server } from "socket.io";
import env from "./env.js";
import logger from "../utils/logger.js";
import { verifyToken, COOKIE_NAME } from "../utils/generateToken.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import { SOCKET_EVENTS } from "../utils/constants.js";

/**
 * Socket.IO setup and authentication.
 *
 * Nothing is emitted to an anonymous socket. The handshake must carry a valid
 * JWT — via `auth.token`, an Authorization header, or the same httpOnly
 * cookie the REST API uses — and the user is loaded and checked for
 * suspension exactly as `protect` does.
 *
 * Every authenticated socket joins a private room named `user:<id>`. That is
 * the only room notifications are sent to, so addressing a user never means
 * broadcasting and filtering on the client.
 */

let io = null;

const readHandshakeToken = (socket) => {
  const { token } = socket.handshake.auth ?? {};
  if (token) return String(token).replace(/^Bearer\s+/i, "");

  const header = socket.handshake.headers?.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();

  const cookie = socket.handshake.headers?.cookie;
  if (cookie) {
    const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
};

export const userRoom = (userId) => `user:${userId}`;
export const conversationRoom = (conversationId) => `conversation:${conversationId}`;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: env.socketOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
    /* A client that never authenticates should not hold a connection open. */
    connectionStateRecovery: { maxDisconnectionDuration: 60_000 },
  });

  io.use(async (socket, next) => {
    try {
      const token = readHandshakeToken(socket);
      if (!token) return next(new Error("UNAUTHENTICATED"));

      const payload = verifyToken(token);
      const user = await User.findById(payload.sub).select("name role isActive avatar");

      if (!user || !user.isActive) return next(new Error("UNAUTHENTICATED"));

      socket.userId = String(user._id);
      socket.userRole = user.role;
      socket.userName = user.name;
      return next();
    } catch {
      return next(new Error("UNAUTHENTICATED"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(userRoom(socket.userId));
    logger.debug("Socket connected", { userId: socket.userId });

    /**
     * Joining a conversation room is authorised against the database, not
     * against what the client claims. Sending someone else's conversation id
     * gets an error, not their messages.
     */
    socket.on("conversation:join", async (conversationId, ack) => {
      try {
        const conversation = await Conversation.findById(conversationId).select("participants");
        const allowed = conversation?.participants.some(
          (participant) => String(participant) === socket.userId
        );

        if (!allowed) {
          ack?.({ success: false, message: "You are not part of this conversation" });
          return;
        }

        socket.join(conversationRoom(conversationId));
        ack?.({ success: true });
      } catch {
        ack?.({ success: false, message: "Could not join conversation" });
      }
    });

    socket.on("conversation:leave", (conversationId) => {
      socket.leave(conversationRoom(conversationId));
    });

    socket.on("disconnect", (reason) => {
      logger.debug("Socket disconnected", { userId: socket.userId, reason });
    });
  });

  logger.info("Socket.IO ready");
  return io;
};

export const getIO = () => io;

/** Emits to a single user's private room. Safe to call before io exists —
 *  REST behaviour must never depend on a socket being up. */
export const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return false;
  io.to(userRoom(userId)).emit(event, payload);
  return true;
};

export const emitToConversation = (conversationId, event, payload) => {
  if (!io || !conversationId) return false;
  io.to(conversationRoom(conversationId)).emit(event, payload);
  return true;
};

export const closeSocket = async () => {
  if (io) await io.close();
  io = null;
};

export { SOCKET_EVENTS };
