import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const updateTyping = mutation({
  args: { conversationId: v.id("conversations"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation_user", (q) => 
        q.eq("conversationId", args.conversationId).eq("userId", args.userId)
      )
      .unique();

    const expiresAt = Date.now() + 3000; // 3 seconds

    if (existing) {
      await ctx.db.patch(existing._id, { expiresAt });
    } else {
      await ctx.db.insert("typingStatus", {
        conversationId: args.conversationId,
        userId: args.userId,
        expiresAt,
      });
    }
  },
});

export const getTyping = query({
  args: { conversationId: v.id("conversations"), currentUserId: v.id("users") },
  handler: async (ctx, args) => {
    const typing = await ctx.db
      .query("typingStatus")
      .withIndex("by_conversation_user", (q) => q.eq("conversationId", args.conversationId))
      .filter((q) => q.and(q.neq(q.field("userId"), args.currentUserId), q.gt(q.field("expiresAt"), Date.now())))
      .unique();

    if (!typing) return null;
    return await ctx.db.get(typing.userId);
  },
});

export const setOnline = mutation({
  args: { userId: v.id("users"), isOnline: v.boolean() },
  handler: async (ctx, args) => {
    const status = await ctx.db
      .query("onlineStatus")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (status) {
      await ctx.db.patch(status._id, {
        isOnline: args.isOnline,
        lastSeen: Date.now(),
      });
    } else {
      await ctx.db.insert("onlineStatus", {
        userId: args.userId,
        isOnline: args.isOnline,
        lastSeen: Date.now(),
      });
    }
  },
});
