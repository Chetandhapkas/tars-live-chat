import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.string(),
    clerkId: v.string(),
  }).index("by_clerkId", ["clerkId"]),

  conversations: defineTable({
    participantOneId: v.id("users"),
    participantTwoId: v.id("users"),
    lastMessageId: v.optional(v.id("messages")),
    updatedAt: v.number(),
  }).index("by_participants", ["participantOneId", "participantTwoId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    content: v.string(),
    isRead: v.boolean(),
    deleted: v.optional(v.boolean()),
  }).index("by_conversation", ["conversationId"]),

  typingStatus: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    expiresAt: v.number(),
  }).index("by_conversation_user", ["conversationId", "userId"]),

  onlineStatus: defineTable({
    userId: v.id("users"),
    lastSeen: v.number(),
    isOnline: v.boolean(),
  }).index("by_user", ["userId"]),
});
