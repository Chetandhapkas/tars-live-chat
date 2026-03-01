import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Send, MoreVertical, ArrowLeft, Smile } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/src/components/ui/avatar";
import { formatMessageTime } from "@/src/lib/dateUtils";
import { motion, AnimatePresence } from "motion/react";

interface ChatWindowProps {
  conversationId: Id<"conversations">;
  currentUserId: Id<"users">;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, currentUserId, onBack }) => {
  const [message, setMessage] = useState("");
  const messages = useQuery(api.messages.list, { conversationId });
  const sendMessage = useMutation(api.messages.send);
  const updateTyping = useMutation(api.status.updateTyping);
  const typingUser = useQuery(api.status.getTyping, { conversationId, currentUserId });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showNewMessageButton, setShowNewMessageButton] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    await sendMessage({ conversationId, senderId: currentUserId, content: message });
    setMessage("");
  };

  const handleTyping = () => {
    updateTyping({ conversationId, userId: currentUserId });
  };

  useEffect(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
      if (isAtBottom) {
        scrollRef.current.scrollTo({ top: scrollHeight, behavior: "smooth" });
        setShowNewMessageButton(false);
      } else {
        setShowNewMessageButton(true);
      }
    }
  }, [messages]);

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    setShowNewMessageButton(false);
  };

  if (!messages) return <div className="flex-1 flex items-center justify-center">Loading messages...</div>;

  return (
    <div className="flex flex-col h-full bg-background border-l">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-card">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <Avatar className="w-10 h-10">
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">Chat</h3>
            {typingUser && (
              <p className="text-xs text-primary animate-pulse">{typingUser.name} is typing...</p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={cn(
                "flex flex-col max-w-[80%]",
                msg.senderId === currentUserId ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div
                className={cn(
                  "px-4 py-2 rounded-2xl text-sm",
                  msg.senderId === currentUserId
                    ? "bg-primary text-primary-foreground rounded-tr-none"
                    : "bg-muted text-foreground rounded-tl-none"
                )}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-muted-foreground mt-1">
                {formatMessageTime(msg._creationTime)}
              </span>
            </div>
          ))
        )}
      </div>

      {/* New Message Button */}
      <AnimatePresence>
        {showNewMessageButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2"
          >
            <Button size="sm" onClick={scrollToBottom} className="rounded-full shadow-lg">
              New Messages ↓
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t bg-card flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon">
          <Smile className="w-5 h-5" />
        </Button>
        <Input
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!message.trim()}>
          <Send className="w-5 h-5" />
        </Button>
      </form>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
