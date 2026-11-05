import {
  emitToUser,
  emitToConversation,
  getIO,
  userRoom,
  conversationRoom,
} from "../config/socket.js";
import { SOCKET_EVENTS } from "../utils/constants.js";

/**
 * Thin wrapper so controllers never import the socket config directly. That
 * keeps the transport swappable and makes these calls trivial to stub in a
 * test.
 */

export const notifyUser = (userId, notification) =>
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_NEW, notification);

export const orderUpdated = (userId, payload) =>
  emitToUser(userId, SOCKET_EVENTS.ORDER_UPDATED, payload);

export const productApproved = (userId, payload) =>
  emitToUser(userId, SOCKET_EVENTS.PRODUCT_APPROVED, payload);

export const farmerApproved = (userId, payload) =>
  emitToUser(userId, SOCKET_EVENTS.FARMER_APPROVED, payload);

export const messageCreated = (conversationId, receiverId, message) => {
  emitToConversation(conversationId, SOCKET_EVENTS.MESSAGE_NEW, message);
  /* Also to the receiver's own room, so an unread badge updates even when
     they do not have the thread open. */
  emitToUser(receiverId, SOCKET_EVENTS.MESSAGE_NEW, message);
};

export const messagesRead = (conversationId, payload) =>
  emitToConversation(conversationId, SOCKET_EVENTS.MESSAGE_READ, payload);

export const isLive = () => Boolean(getIO());

export { userRoom, conversationRoom, SOCKET_EVENTS };
