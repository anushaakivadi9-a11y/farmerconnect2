import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2, Package, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const API_BASE = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

interface Message {
  _id?: string;
  sender: string;
  content: string;
  createdAt?: string;
  pending?: boolean;
}

interface Chat {
  _id: string;
  participants: { _id: string; name: string; role: string }[];
  product: { _id: string; name: string; imageUrl: string };
  messages: Message[];
  lastMessage: string;
  lastMessageAt: string;
}

let socket: Socket | null = null;
const getSocket = () => {
  if (!socket) socket = io(SOCKET_URL, { transports: ["websocket"] });
  return socket;
};

const FarmerChatInbox = () => {
  const { user } = useAuth();
  const myId = (user as any)?._id || (user as any)?.id;
  const token = localStorage.getItem("fc_token");

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Fetch all chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/chat/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setChats(data.data || []);
      } catch (err) {
        console.error("Failed to fetch chats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  // Socket setup
  useEffect(() => {
    if (!myId) return;
    const s = getSocket();
    s.emit("join", myId);

    const handleMsg = (msg: Message & { chatId: string }) => {
      if (activeChat && msg.chatId === activeChat._id) {
        setMessages((prev) => {
          const withoutOptimistic = prev.filter((m) => !m.pending);
          return [...withoutOptimistic, msg];
        });
      }
      // Update last message in sidebar
      setChats((prev) =>
        prev.map((c) =>
          c._id === msg.chatId
            ? { ...c, lastMessage: msg.content, lastMessageAt: msg.createdAt || new Date().toISOString() }
            : c
        )
      );
    };

    s.on("receiveMessage", handleMsg);
    return () => { s.off("receiveMessage", handleMsg); };
  }, [myId, activeChat]);

  // Open a chat
  const openChat = async (chat: Chat) => {
    setLoadingChat(true);
    setActiveChat(chat);
    try {
      const { data } = await axios.get(`${API_BASE}/chat/${chat._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(data.data.messages || []);
      getSocket().emit("joinChat", chat._id);
    } catch (err) {
      console.error("Failed to load chat", err);
    } finally {
      setLoadingChat(false);
    }
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const sendMessage = () => {
    if (!input.trim() || !activeChat || !myId) return;
    const content = input.trim();
    setInput("");

    // Find the buyer (other participant)
    const buyer = activeChat.participants.find((p) => p._id !== myId);

    const optimistic: Message = {
      sender: myId,
      content,
      createdAt: new Date().toISOString(),
      pending: true,
    };
    setMessages((prev) => [...prev, optimistic]);

    getSocket().emit("sendMessage", {
      chatId: activeChat._id,
      content,
      senderId: myId,
      receiverId: buyer?._id,
    });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (ts?: string) =>
    ts ? new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

  const formatDate = (ts?: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return formatTime(ts);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft">
      <div className="flex h-[500px]">
        {/* Sidebar — chat list */}
        <div className={`w-full sm:w-64 border-r border-border flex flex-col ${activeChat ? "hidden sm:flex" : "flex"}`}>
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-display font-bold flex items-center gap-2">
              <MessageCircle size={16} className="text-primary" /> Messages
            </h3>
          </div>

          {chats.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-2">
              <MessageCircle size={32} className="text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground opacity-60">Buyers will message you from product listings</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {chats.map((chat) => {
                const buyer = chat.participants.find((p) => p._id !== myId);
                const isActive = activeChat?._id === chat._id;
                return (
                  <button
                    key={chat._id}
                    onClick={() => openChat(chat)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors border-b border-border last:border-0 ${
                      isActive ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 grid place-items-center shrink-0">
                      <img
                        src={chat.product?.imageUrl}
                        alt={chat.product?.name}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{buyer?.name || "Buyer"}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Package size={10} /> {chat.product?.name}
                      </p>
                      {chat.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate opacity-70 mt-0.5">
                          {chat.lastMessage}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDate(chat.lastMessageAt)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${!activeChat ? "hidden sm:flex" : "flex"}`}>
          {!activeChat ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-6">
              <MessageCircle size={40} className="text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground">Select a conversation</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <button
                  onClick={() => setActiveChat(null)}
                  className="sm:hidden p-1 hover:bg-secondary rounded-lg"
                >
                  <ChevronLeft size={18} />
                </button>
                <img
                  src={activeChat.product?.imageUrl}
                  alt={activeChat.product?.name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">
                    {activeChat.participants.find((p) => p._id !== myId)?.name || "Buyer"}
                  </p>
                  <p className="text-xs text-muted-foreground">{activeChat.product?.name}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-background/30">
                {loadingChat ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = String(msg.sender) === String(myId);
                    return (
                      <div key={msg._id || idx} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                          isMine
                            ? `bg-primary text-primary-foreground rounded-br-sm ${msg.pending ? "opacity-70" : ""}`
                            : "bg-card border border-border rounded-bl-sm"
                        }`}>
                          <p>{msg.content}</p>
                          {msg.createdAt && (
                            <p className={`text-[10px] mt-0.5 ${isMine ? "text-primary-foreground/60 text-right" : "text-muted-foreground"}`}>
                              {formatTime(msg.createdAt)}
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
              <div className="px-3 py-3 border-t border-border flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Type a reply..."
                  className="flex-1 bg-secondary rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="w-9 h-9 bg-primary text-primary-foreground rounded-xl grid place-items-center hover:bg-primary/90 disabled:opacity-40 transition-all"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerChatInbox;