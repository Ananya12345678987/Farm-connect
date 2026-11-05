import asyncHandler from "../utils/asyncHandler.js";
import { ok, created, paginated } from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { readPageParams, buildPagination } from "../utils/pagination.js";
import { getQuery } from "../middleware/validationMiddleware.js";

import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { messageCreated, messagesRead } from "../services/socketService.js";
import { notifyNewMessage } from "../services/notificationService.js";

/**
 * Participation is checked against the stored `participants` array on every
 * single operation. There is no code path where a conversation id alone is
 * enough to read a thread.
 */
const loadParticipantConversation = async (conversationId, userId) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw ApiError.notFound("That conversation does not exist", "CONVERSATION_NOT_FOUND");
  }
  if (!conversation.participants.some((id) => String(id) === String(userId))) {
    throw ApiError.forbidden("You are not part of this conversation", "NOT_PARTICIPANT");
  }

  return conversation;
};

/** GET /api/conversations */
export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate("participants", "name avatar role")
    .populate("relatedProduct", "name slug images")
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean();

  const shaped = conversations.map((conversation) => ({
    _id: conversation._id,
    /* The other person, resolved server-side so the client does not have to
       work out which participant is not them. */
    withUser: conversation.participants.find(
      (participant) => String(participant._id) !== String(req.user._id)
    ),
    lastMessage: conversation.lastMessage,
    relatedProduct: conversation.relatedProduct,
    unread: conversation.unread?.[String(req.user._id)] ?? 0,
    updatedAt: conversation.updatedAt,
  }));

  return ok(res, { message: "Conversations loaded", data: shaped });
});

/**
 * POST /api/conversations — find or create.
 *
 * The deterministic `key` plus a unique index makes this safe when two people
 * open a thread at the same moment: the second upsert finds the first one
 * rather than creating a duplicate.
 */
export const startConversation = asyncHandler(async (req, res) => {
  const { participant, product, message } = req.body;

  if (String(participant) === String(req.user._id)) {
    throw ApiError.badRequest("You cannot message yourself", "SELF_CONVERSATION");
  }

  const other = await User.findById(participant).select("name isActive role");
  if (!other || !other.isActive) {
    throw ApiError.notFound("That person is not available", "USER_NOT_FOUND");
  }

  const key = Conversation.buildKey(req.user._id, participant);

  const conversation = await Conversation.findOneAndUpdate(
    { key },
    {
      $setOnInsert: {
        key,
        participants: [req.user._id, participant],
        relatedProduct: product,
      },
    },
    { new: true, upsert: true }
  );

  if (message) {
    await persistMessage({
      conversation,
      sender: req.user,
      receiverId: participant,
      content: message,
    });
  }

  return created(res, { message: "Conversation ready", data: conversation });
});

/** GET /api/conversations/:id/messages */
export const listMessages = asyncHandler(async (req, res) => {
  await loadParticipantConversation(req.params.id, req.user._id);

  const query = getQuery(req);
  const { page, limit, skip } = readPageParams({ ...query, limit: query.limit ?? 30 });

  const [data, total] = await Promise.all([
    Message.find({ conversation: req.params.id })
      .populate("sender", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments({ conversation: req.params.id }),
  ]);

  return paginated(res, {
    /* Reversed so the client renders oldest-first without re-sorting. */
    message: "Messages loaded",
    data: data.reverse(),
    pagination: buildPagination({ page, limit, total }),
  });
});

async function persistMessage({ conversation, sender, receiverId, content }) {
  const message = await Message.create({
    conversation: conversation._id,
    sender: sender._id,
    receiver: receiverId,
    content,
  });

  const unread = conversation.unread ?? new Map();
  const current = unread.get?.(String(receiverId)) ?? 0;
  conversation.unread = unread;
  conversation.unread.set(String(receiverId), current + 1);
  conversation.lastMessage = { content: content.slice(0, 300), sender: sender._id, at: new Date() };
  await conversation.save();

  const payload = {
    _id: message._id,
    conversation: conversation._id,
    content: message.content,
    sender: { _id: sender._id, name: sender.name },
    receiver: receiverId,
    createdAt: message.createdAt,
  };

  messageCreated(conversation._id, receiverId, payload);
  await notifyNewMessage(receiverId, sender.name, content, conversation._id).catch(() => {});

  return message;
}

/** POST /api/conversations/:id/messages */
export const sendMessage = asyncHandler(async (req, res) => {
  const conversation = await loadParticipantConversation(req.params.id, req.user._id);

  const receiverId = conversation.participants.find(
    (id) => String(id) !== String(req.user._id)
  );

  const message = await persistMessage({
    conversation,
    sender: req.user,
    receiverId,
    content: req.body.content,
  });

  return created(res, { message: "Sent", data: message });
});

/** PATCH /api/conversations/:id/read */
export const markConversationRead = asyncHandler(async (req, res) => {
  const conversation = await loadParticipantConversation(req.params.id, req.user._id);

  const result = await Message.updateMany(
    { conversation: conversation._id, receiver: req.user._id, readAt: null },
    { readAt: new Date() }
  );

  conversation.unread?.set?.(String(req.user._id), 0);
  await conversation.save();

  messagesRead(conversation._id, {
    conversation: conversation._id,
    reader: req.user._id,
    count: result.modifiedCount,
  });

  return ok(res, {
    message: "Marked as read",
    data: { updated: result.modifiedCount },
  });
});
