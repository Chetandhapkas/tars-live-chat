import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const store = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        image: args.image,
      });
      return existingUser._id;
    }

    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      image: args.image,
      clerkId: args.clerkId,
    });

    // Initialize online status
    await ctx.db.insert("onlineStatus", {
      userId,
      lastSeen: Date.now(),
      isOnline: true,
    });

    return userId;
  },
});

export const getMe = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();
  },
});

export const listAll = query({
  args: { searchTerm: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      return users.filter((u) => u.name.toLowerCase().includes(term));
    }
    return users;
  },
});
