import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Search, UserPlus, MessageSquare } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/src/components/ui/avatar";
import { Button } from "@/src/components/ui/button";
import { formatMessageTime } from "@/src/lib/dateUtils";

interface SidebarProps {
  currentUserId: Id<"users">;
  onSelectConversation: (id: Id<"conversations">) => void;
  selectedId?: Id<"conversations">;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUserId, onSelectConversation, selectedId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const conversations = useQuery(api.conversations.list, { userId: currentUserId });
  const users = useQuery(api.users.listAll, { searchTerm });
  const createConversation = useMutation(api.conversations.getOrCreate);
  const markAsRead = useMutation(api.messages.markAsRead);
  const [view, setView] = useState<"chats" | "users">("chats");

  const handleSelectConversation = (id: Id<"conversations">) => {
    onSelectConversation(id);
    markAsRead({ conversationId: id, userId: currentUserId });
  };

  const handleStartChat = async (otherUserId: Id<"users">) => {
    const convId = await createConversation({ participantOneId: currentUserId, participantTwoId: otherUserId });
    handleSelectConversation(convId);
    setView("chats");
  };

  return (
    <div className="w-full md:w-80 h-full flex flex-col bg-card border-r">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Messages</h2>
          <Button variant="ghost" size="icon" onClick={() => setView(view === "chats" ? "users" : "chats")}>
            {view === "chats" ? <UserPlus className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={view === "chats" ? "Search chats..." : "Search users..."}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === "users" ? (
          <div className="p-2 space-y-1">
            {users?.filter(u => u._id !== currentUserId).map((user) => (
              <button
                key={user._id}
                onClick={() => handleStartChat(user._id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
              >
                <Avatar>
                  <AvatarImage src={user.image} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </button>
            ))}
            {users?.length === 0 && (
              <p className="text-center text-muted-foreground mt-4">No users found</p>
            )}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {conversations?.map((conv) => (
              <button
                key={conv._id}
                onClick={() => handleSelectConversation(conv._id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left relative",
                  selectedId === conv._id ? "bg-accent" : "hover:bg-accent/50"
                )}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={conv.otherUser?.image} />
                    <AvatarFallback>{conv.otherUser?.name[0]}</AvatarFallback>
                  </Avatar>
                  {conv.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-card rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{conv.otherUser?.name}</p>
                    {conv.lastMessage && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatMessageTime(conv.lastMessage._creationTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "text-xs truncate flex-1",
                      conv.unreadCount > 0 ? "text-foreground font-semibold" : "text-muted-foreground"
                    )}>
                      {conv.lastMessage?.content || "No messages yet"}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
            {conversations?.length === 0 && (
              <div className="text-center mt-10 space-y-2">
                <p className="text-muted-foreground">No conversations yet</p>
                <Button variant="outline" size="sm" onClick={() => setView("users")}>
                  Find someone to chat with
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
