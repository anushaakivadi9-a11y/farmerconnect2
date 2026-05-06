// ChatWindow.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { X, Send, Loader2, MessageCircle, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
const API_BASE = import.meta.env.VITE_API_BASE;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

interface Message {
  _id?: string;
  sender: string;
  content: string;
  createdAt?: string;
  pending?: boolean;
}

interface ChatWindowProps {
  productId: string;
  productName: string;
  productImage: string;
  farmerId: string;
  farmerName: string;
  onClose: () => void;
}

// ─── Shared socket singleton ──────────────────────────────────────────────────
let socket: Socket | null = null;
const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ["websocket"] });
  }
  return socket;
};

// ─── Chat Panel ───────────────────────────────────────────────────────────────
const ChatPanel = ({
  productId,
  productName,
  productImage,
  farmerId,
  farmerName,
  onClose,
  onNewIncomingMessage, // called when seller sends a message while panel is open
}: ChatWindowProps & { onNewIncomingMessage: () => void }) => {
  const { user } = useAuth();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const token = localStorage.getItem("fc_token");
  const myId = (user as any)?._id || (user as any)?.id;

  const scrollDown = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollDown();
  }, [messages]);

  // 1. Start / fetch chat
  useEffect(() => {
    const initChat = async () => {
      try {
        setLoading(true);
        const { data } = await axios.post(
          `${API_BASE}/chat/start`,
          { farmerId, productId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const chat = data.data;
        setChatId(chat._id);
        setMessages(chat.messages || []);
      } catch (err) {
        console.error("Failed to start chat", err);
      } finally {
        setLoading(false);
      }
    };
    if (myId) initChat();
  }, [productId, farmerId, myId]);

  // 2. Socket — join rooms & listen
  useEffect(() => {
    if (!chatId || !myId) return;
    const s = getSocket();

    s.emit("join", myId);
    s.emit("joinChat", chatId);

    const handleReceive = (msg: Message & { chatId: string }) => {
      if (msg.chatId !== chatId) return;

      setMessages((prev) => {
        const withoutOptimistic = prev.filter((m) => !m.pending);
        return [...withoutOptimistic, msg];
      });

      // If the incoming message is from the seller (not me), fire the callback
      if (String(msg.sender) !== String(myId)) {
        onNewIncomingMessage();
      }
    };

    s.on("receiveMessage", handleReceive);
    return () => {
      s.off("receiveMessage", handleReceive);
    };
  }, [chatId, myId, onNewIncomingMessage]);

  // 3. Send
  const sendMessage = () => {
    if (!input.trim() || !chatId || !myId) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    const optimistic: Message = {
      sender: myId,
      content,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    getSocket().emit("sendMessage", {
      chatId,
      content,
      senderId: myId,
      receiverId: farmerId,
    });

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (ts?: string) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-20 right-6 z-50 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      style={{ height: "480px" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground">
        <img
          src={productImage}
          alt={productName}
          className="w-9 h-9 rounded-lg object-cover opacity-90"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{farmerName}</p>
          <p className="text-xs opacity-75 flex items-center gap-1 truncate">
            <Package size={10} /> {productName}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-background/50">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-2">
            <MessageCircle size={32} className="text-muted-foreground opacity-40" />
            <p className="text-sm text-muted-foreground">
              Start the conversation!
              <br />
              <span className="text-xs opacity-60">Ask about {productName}</span>
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = String(msg.sender) === String(myId);
            return (
              <div
                key={msg._id || idx}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMine
                      ? `bg-primary text-primary-foreground rounded-br-sm ${
                          msg.pending ? "opacity-70" : ""
                        }`
                      : "bg-card border border-border rounded-bl-sm"
                  }`}
                >
                  <p>{msg.content}</p>
                  {msg.createdAt && (
                    <p
                      className={`text-[10px] mt-0.5 ${
                        isMine
                          ? "text-primary-foreground/60 text-right"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                      {msg.pending && " · sending..."}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border bg-card flex items-center gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={`Message ${farmerName}...`}
          className="flex-1 bg-secondary rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-9 h-9 bg-primary text-primary-foreground rounded-xl grid place-items-center hover:bg-primary/90 disabled:opacity-40 transition-all"
        >
          <Send size={15} />
        </button>
      </div>
    </motion.div>
  );
};

// ─── Public export: Bubble + Panel together ───────────────────────────────────
// Usage: <ChatWindow productId=... productName=... ... />
// The trigger bubble renders itself — you no longer need a separate open/close button.

const ChatWindow = (props: Omit<ChatWindowProps, "onClose">) => {
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const handleOpen = () => {
    setIsOpen(true);
    setUnread(0); // clear badge when user opens chat
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Called by ChatPanel whenever the seller sends a message
  const handleNewIncoming = useCallback(() => {
    // Only increment if the panel is closed — if open, user sees it live
    setIsOpen((open) => {
      if (!open) setUnread((n) => n + 1);
      return open;
    });
  }, []);

  return (
    <>
      {/* ── Floating trigger bubble ── */}
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg grid place-items-center"
        aria-label="Open chat"
        style={{ display: isOpen ? "none" : "grid" }}
      >
        <MessageCircle size={24} />

        {/* Unread badge */}
        <AnimatePresence>
          {unread > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-md"
            >
              {unread > 99 ? "99+" : unread}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Pulse ring — only when there are unread messages */}
        {unread > 0 && (
          <span className="absolute inset-0 rounded-full bg-primary opacity-30 animate-ping pointer-events-none" />
        )}
      </motion.button>

      {/* ── Chat panel ── */}
      <AnimatePresence>
        {isOpen && (
          <ChatPanel
            {...props}
            onClose={handleClose}
            onNewIncomingMessage={handleNewIncoming}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWindow;