import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getOrCreate = mutation({
  args: { participantOneId: v.id("users"), participantTwoId: v.id("users") },
  handler: async (ctx, args) => {
    const sortedIds = [args.participantOneId, args.participantTwoId].sort();
    
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_participants", (q) => 
        q.eq("participantOneId", sortedIds[0] as any).eq("participantTwoId", sortedIds[1] as any)
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("conversations", {
      participantOneId: sortedIds[0] as any,
      participantTwoId: sortedIds[1] as any,
      updatedAt: Date.now(),
    });
  },
});

export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .filter((q) => 
        q.or(
          q.eq(q.field("participantOneId"), args.userId),
          q.eq(q.field("participantTwoId"), args.userId)
        )
      )
      .order("desc")
      .collect();

    return Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.participantOneId === args.userId 
          ? conv.participantTwoId 
          : conv.participantOneId;
        const otherUser = await ctx.db.get(otherUserId);
        const lastMessage = conv.lastMessageId ? await ctx.db.get(conv.lastMessageId) : null;
        const onlineStatus = await ctx.db
          .query("onlineStatus")
          .withIndex("by_user", (q) => q.eq("userId", otherUserId))
          .unique();

        const unreadCount = (await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) => q.eq("conversationId", conv._id))
          .filter((q) => q.and(q.eq(q.field("isRead"), false), q.neq(q.field("senderId"), args.userId)))
          .collect()).length;

        return {
          ...conv,
          otherUser,
          lastMessage,
          isOnline: onlineStatus?.isOnline ?? false,
          unreadCount,
        };
      })
    );
  },
});
