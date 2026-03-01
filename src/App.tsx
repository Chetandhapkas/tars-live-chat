import React, { useState, useEffect } from "react";
import { ClerkProvider, SignIn, SignedIn, SignedOut, useUser, UserButton } from "@clerk/clerk-react";
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Sidebar } from "@/src/components/Chat/Sidebar";
import { ChatWindow } from "@/src/components/Chat/ChatWindow";
import { Id } from "../convex/_generated/dataModel";
import { motion, AnimatePresence } from "motion/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

function ChatApp() {
  const { user } = useUser();
  const storeUser = useMutation(api.users.store);
  const [selectedConvId, setSelectedConvId] = useState<Id<"conversations"> | null>(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  const currentUser = useQuery(api.users.getMe, user ? { clerkId: user.id } : "skip");

  useEffect(() => {
    if (user) {
      storeUser({
        name: user.fullName || user.username || "Anonymous",
        email: user.primaryEmailAddress?.emailAddress || "",
        image: user.imageUrl,
        clerkId: user.id,
      });
    }
  }, [user, storeUser]);

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!currentUser) return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 bg-primary/20 rounded-full" />
        <p className="text-muted-foreground text-sm">Initializing session...</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-background text-foreground">
      <AnimatePresence mode="wait">
        {(!isMobileView || !selectedConvId) && (
          <motion.div
            key="sidebar"
            initial={isMobileView ? { x: -300 } : false}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="w-full md:w-auto h-full"
          >
            <Sidebar
              currentUserId={currentUser._id}
              onSelectConversation={setSelectedConvId}
              selectedId={selectedConvId || undefined}
            />
          </motion.div>
        )}

        {(selectedConvId) && (
          <motion.div
            key="chat"
            initial={isMobileView ? { x: 300 } : false}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            className="flex-1 h-full"
          >
            <ChatWindow
              conversationId={selectedConvId}
              currentUserId={currentUser._id}
              onBack={isMobileView ? () => setSelectedConvId(null) : undefined}
            />
          </motion.div>
        )}

        {!selectedConvId && !isMobileView && (
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/30">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  💬
                </motion.div>
              </div>
              <h2 className="text-2xl font-bold">Welcome to Nexus Chat</h2>
              <p className="text-muted-foreground max-w-xs">
                Select a conversation or start a new one to begin messaging.
              </p>
            </div>
          </div>
        )}
      </AnimatePresence>
      
      <div className="fixed top-4 right-4 z-50">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
}

export default function App() {
  const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const convexUrl = import.meta.env.VITE_CONVEX_URL;

  if (!clerkPubKey || !convexUrl) {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-8 text-center bg-slate-50">
        <div className="max-w-md space-y-6">
          <h1 className="text-3xl font-bold text-slate-900">Nexus Chat Setup</h1>
          <p className="text-slate-600">
            To get started, you need to configure your Clerk and Convex environment variables.
          </p>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left space-y-4">
            <p className="text-sm font-semibold text-slate-700">Required Variables:</p>
            <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
              <li><code>VITE_CLERK_PUBLISHABLE_KEY</code></li>
              <li><code>VITE_CONVEX_URL</code></li>
            </ul>
            <p className="text-xs text-slate-500 italic">
              Add these to your project secrets in the AI Studio sidebar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <SignedIn>
        {convex && (
          <ConvexProvider client={convex}>
            <ChatApp />
          </ConvexProvider>
        )}
      </SignedIn>
      <SignedOut>
        <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-slate-100"
          >
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2">NEXUS</h1>
              <p className="text-slate-500">Connect with anyone, anywhere.</p>
            </div>
            <SignIn />
          </motion.div>
        </div>
      </SignedOut>
    </ClerkProvider>
  );
}
