/**
 * Expert Consultation Chat
 * AI-powered plant health chat with markdown rendering
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { chatService } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import {
    MessageSquare, Send, Plus, Bot, User, Clock,
    Leaf, ChevronRight, Loader, AlertCircle, Sparkles, ShoppingCart,
    Trash2, Edit2
} from "lucide-react";
import { getDiseaseEntry, buildChatProductResponse, getRelevantProducts } from "../data/diseaseProductMap";
import { eCommerceService } from "../services/api";

const POLL_INTERVAL = 1500; // ms

const PRODUCT_QUERY_RE = /(?:what\s+(?:product|medicine|treatment|fungicide|chemical)[s]?\s+(?:is\s+)?(?:needed\s+)?for|how\s+to\s+treat|treatment\s+for|cure\s+for|product\s+for)\s+([a-z\s]+?)(?:\s*disease|\s*infection|\s*problem|\s*\?|$)/i;

const interceptProductQuery = async (text) => {
    const match = text.match(PRODUCT_QUERY_RE);
    if (!match) return null;

    const diseaseName = match[1].trim();
    const entry = getDiseaseEntry(diseaseName);
    if (!entry) return null; // let AI handle unknown diseases

    // Fetch live marketplace products
    let relevantProducts = [];
    try {
        const { data } = await eCommerceService.getProducts();
        const all = data.results || data;
        relevantProducts = getRelevantProducts(diseaseName, all, 2);
    } catch { /* fallback: no products shown */ }

    return buildChatProductResponse(diseaseName, relevantProducts);
};

// -- Lightweight markdown renderer ----------------------------------------------
const renderMarkdown = (text) => {
    if (!text) return "";
    return text
        // Bold **text**
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        // Italic *text*
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        // Code `code`
        .replace(/`([^`]+)`/g, "<code style='background:rgba(0,0,0,0.08);padding:0.15em 0.4em;border-radius:4px;font-size:0.88em;'>$1</code>")
        // Headers ### ## #
        .replace(/^### (.+)$/gm, "<h4 style='margin:1em 0 0.4em;font-weight:800;font-size:0.95rem;'>$1</h4>")
        .replace(/^## (.+)$/gm, "<h3 style='margin:1em 0 0.5em;font-weight:900;font-size:1rem;'>$1</h3>")
        .replace(/^# (.+)$/gm, "<h2 style='margin:1em 0 0.5em;font-weight:900;font-size:1.1rem;'>$1</h2>")
        // Bullet points * and -
        .replace(/^[*\-] (.+)$/gm, "<li style='margin:0.2em 0;list-style:none;padding-left:0.25em;'>    $1</li>")
        // Checkmarks        
        .replace(/    /g, "<span style='color:#10b981;'>    </span>")
        .replace(/       /g, "<span style='color:#f59e0b;'>       </span>")
        // Table rows
        .replace(/\|(.+)\|/g, (match) => {
            const cells = match.split("|").filter(Boolean);
            const isHeader = cells.every(c => c.trim().match(/^[-:]+$/));
            if (isHeader) return "";
            return "<tr>" + cells.map(c => `<td style='padding:0.35em 0.75em;border:1px solid rgba(0,0,0,0.1);'>${c.trim()}</td>`).join("") + "</tr>";
        })
        // Wrap consecutive <tr> in table
        .replace(/(<tr>.*?<\/tr>\s*)+/gs, (m) => `<table style='border-collapse:collapse;width:100%;margin:0.75em 0;font-size:0.85em;'>${m}</table>`)
        // Wrap consecutive <li> in ul
        .replace(/(<li.*?<\/li>\s*)+/gs, (m) => `<ul style='margin:0.5em 0;padding:0;'>${m}</ul>`)
        // Line breaks
        .replace(/\n\n/g, "</p><p style='margin:0.6em 0;'>")
        .replace(/\n/g, "<br/>");
};

const TypewriterText = ({ text, animate, hasMarkdown }) => {
    const [displayed, setDisplayed] = useState(animate ? "" : text);
    const index = useRef(0);
    const chunkCountRef = useRef(0);

    useEffect(() => {
        if (!animate) {
            setDisplayed(text);
            return;
        }
        index.current = 0;
        chunkCountRef.current = 0;
        const chunk = Math.max(1, Math.floor(text.length / 60));

        const tick = () => {
            if (index.current < text.length) {
                setDisplayed(text.substring(0, index.current + chunk));
                index.current += chunk;
                chunkCountRef.current += 1;
                // Scroll to bottom every 8 chunks (deterministic, no random)
                if (chunkCountRef.current % 8 === 0) {
                    window.dispatchEvent(new CustomEvent('scroll-chat-to-bottom'));
                }
                setTimeout(tick, 15);
            } else {
                setDisplayed(text);
                window.dispatchEvent(new CustomEvent('scroll-chat-to-bottom'));
            }
        };
        setTimeout(tick, 100);
    }, [text, animate]);

    if (hasMarkdown) {
        return <div dangerouslySetInnerHTML={{ __html: `<p style='margin:0;'>${renderMarkdown(displayed)}</p>` }} style={{ wordBreak: "break-word" }} />;
    }
    return <span style={{ whiteSpace: "pre-wrap" }}>{displayed}</span>;
};

const MessageBubble = ({ msg, isUser }) => {
    const { t } = useLanguage();
    const hasMarkdown = !isUser && !!(msg.content?.includes("**") || msg.content?.includes("#") || msg.content?.includes("|"));
    const formatTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Animate only if AI message and recently created
    const isNew = !isUser && (Date.now() - new Date(msg.created_at || Date.now()).getTime() < 10000);

    return (
        <div style={{
            display: "flex",
            justifyContent: isUser ? "flex-end" : "flex-start",
            gap: "0.75rem",
            alignItems: "flex-start",
            marginBottom: "1rem",
            padding: isUser ? "0 0 0 15%" : "0 15% 0 0"
        }}>
            {!isUser && (
                <div style={{
                    width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#065f46,#10b981)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4,
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                }}>
                    <Bot size={16} color="#fff" />
                </div>
            )}
            <div style={{ maxWidth: "100%", display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
                <div style={{
                    padding: "0.85rem 1.15rem",
                    borderRadius: isUser ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                    background: isUser ? "var(--primary)" : "var(--bg-surface-l2)",
                    color: isUser ? "#fff" : "var(--text-main)",
                    border: isUser ? "none" : "1px solid var(--border-light)",
                    boxShadow: isUser ? "0 4px 12px rgba(6,95,70,0.15)" : "none",
                    fontSize: "0.9rem", lineHeight: 1.6, fontWeight: 500,
                }}>
                    <TypewriterText text={msg.content} animate={isNew} hasMarkdown={hasMarkdown} />
                </div>
                <p style={{
                    margin: "0.35rem 0.25rem 0", fontSize: "0.65rem", color: "var(--text-muted)",
                    display: "flex", alignItems: "center", gap: "0.3rem",
                    fontWeight: 600
                }}>
                    {!isUser && <span>{t("chat.plantAdvisor")}</span>}
                    <Clock size={10} style={{ opacity: 0.7 }} /> {formatTime(msg.created_at || new Date().toISOString())}
                </p>
            </div>
            {isUser && (
                <div style={{
                    width: 32, height: 32, borderRadius: "50%", background: "var(--bg-card)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 4,
                    border: "1px solid var(--border-light)", boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
                }}>
                    <User size={16} style={{ color: "var(--text-muted)" }} />
                </div>
            )}
        </div>
    );
};

const Chat = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [rooms, setRooms] = useState([]);
    const [activeRoom, setActiveRoom] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loadingRooms, setLoadingRooms] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [waitingAI, setWaitingAI] = useState(false);
    const [error, setError] = useState(null);
    const [renamingRoomId, setRenamingRoomId] = useState(null);
    const [newName, setNewName] = useState("");

    const pollRef = useRef(null);
    const messagesEndRef = useRef(null);
    const lastMessageCount = useRef(0);

    const isAdmin = sessionStorage.getItem("isStaff") === "true" || sessionStorage.getItem("isSuperuser") === "true";

    // -- load rooms --------------------------------------------------------------
    const loadRooms = useCallback(async () => {
        try {
            const { data } = await chatService.getRooms();
            setRooms(Array.isArray(data) ? data : (data.results || []));
        } catch {
            setError(t("chat.loadRoomsError"));
        } finally {
            setLoadingRooms(false);
        }
    }, [t]);

    const loadMessages = useCallback(async (roomId) => {
        try {
            setLoadingMessages(true);
            const { data } = await chatService.getRoomMessages(roomId);
            const msgs = Array.isArray(data) ? data : [];
            setMessages(msgs);
            lastMessageCount.current = msgs.length;
        } catch {
            setError(t("chat.loadError"));
        } finally {
            setLoadingMessages(false);
        }
    }, [t]);

    // poll - detects new AI reply
    const pollMessages = useCallback(async (roomId) => {
        try {
            const { data } = await chatService.getRoomMessages(roomId);
            const msgs = Array.isArray(data) ? data : [];
            if (msgs.length > lastMessageCount.current) {
                setMessages(msgs);
                lastMessageCount.current = msgs.length;
                setWaitingAI(false);
            }
        } catch { /* silent */ }
    }, []);

    useEffect(() => { loadRooms(); }, [loadRooms]);

    useEffect(() => {
        if (!activeRoom) return;
        loadMessages(activeRoom.id);
        clearInterval(pollRef.current);
        pollRef.current = setInterval(() => pollMessages(activeRoom.id), POLL_INTERVAL);
        return () => clearInterval(pollRef.current);
    }, [activeRoom, loadMessages, pollMessages]);

    useEffect(() => {
        const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        };
        // Scroll on message change
        scrollToBottom();
        // Fallback for slower render
        const timer = setTimeout(scrollToBottom, 50);
        return () => clearTimeout(timer);
    }, [messages, waitingAI]);

    useEffect(() => {
        const handleScroll = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        window.addEventListener('scroll-chat-to-bottom', handleScroll);
        return () => window.removeEventListener('scroll-chat-to-bottom', handleScroll);
    }, []);

    // -- actions -----------------------------------------------------------------
    const createNewRoom = async (firstMessage = null) => {
        try {
            const title = `Conversation ${new Date().toLocaleDateString()}`;
            const { data } = await chatService.createRoom({ title });
            setRooms(prev => [data, ...prev]);
            setActiveRoom(data);
            setMessages([]);
            // Load welcome message from server after brief delay
            setTimeout(() => loadMessages(data.id), 800);
            if (firstMessage) {
                setTimeout(() => sendMessageToRoom(data.id, firstMessage), 1200);
            }
        } catch {
            setError(t("chat.createRoomError"));
        }
    };

    const sendMessageToRoom = async (roomId, text) => {
        if (!text.trim() || sending) return;
        setSending(true);

        const optimistic = {
            id: `opt-${Date.now()}`, sender_type: "user",
            content: text, created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, optimistic]);
        setWaitingAI(true);

        // -- Client-side interception for disease-product questions ----------
        const productReply = await interceptProductQuery(text);
        if (productReply) {
            // Inject instant structured response - skip the backend AI round-trip
            const instantMsg = {
                id: `product-${Date.now()}`,
                sender_type: "bot",
                content: productReply,
                created_at: new Date().toISOString(),
            };
            setMessages(prev => [...prev.filter(m => m.id !== optimistic.id), instantMsg]);
            setWaitingAI(false);
            setSending(false);
            // Still send to backend silently so it's stored in history
            chatService.sendMessage(roomId, text).catch(() => { });
            return;
        }
        // -- Normal AI path --------------------------------------------------

        try {
            await chatService.sendMessage(roomId, text);
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            await loadRooms();
            // Poll quickly for AI response
            setTimeout(() => pollMessages(roomId), 500);
            setTimeout(() => pollMessages(roomId), 1500);
            setTimeout(() => pollMessages(roomId), 3000);
        } catch {
            setMessages(prev => prev.filter(m => m.id !== optimistic.id));
            setWaitingAI(false);
            setError(t("chat.sendError"));
        } finally {
            setSending(false);
        }
    };

    const deleteRoom = async (roomId) => {
        if (!window.confirm(t("chat.confirmDeleteDesc"))) return;
        try {
            await chatService.deleteRoom(roomId);
            setRooms(prev => prev.filter(r => r.id !== roomId));
            if (activeRoom?.id === roomId) {
                setActiveRoom(null);
                setMessages([]);
            }
        } catch {
            setError(t("chat.deleteError") || "Failed to delete conversation.");
        }
    };

    const renameRoom = async (roomId) => {
        if (!newName.trim()) return;
        try {
            const { data } = await chatService.updateRoom(roomId, { title: newName.trim() });
            setRooms(prev => prev.map(r => r.id === roomId ? { ...r, title: data.title } : r));
            if (activeRoom?.id === roomId) {
                setActiveRoom(prev => ({ ...prev, title: data.title }));
            }
            setRenamingRoomId(null);
            setNewName("");
        } catch {
            setError(t("chat.renameError") || "Failed to rename conversation.");
        }
    };

    const sendMessage = async (content = input) => {
        if (!content?.trim() || sending) return;
        const text = content.trim();
        setInput("");
        if (!activeRoom) {
            await createNewRoom(text);
        } else {
            await sendMessageToRoom(activeRoom.id, text);
        }
    };

    // -- incoming navigation prompt detection --
    useEffect(() => {
        if (!loadingRooms && location.state?.initialMessage) {
            const msg = location.state.initialMessage;
            
            // Safely clear the state so it doesn't re-trigger on unmount/re-mount
            const newHistoryState = { ...window.history.state };
            if (newHistoryState && newHistoryState.usr) {
                delete newHistoryState.usr.initialMessage;
            }
            window.history.replaceState(newHistoryState, "");

            sendMessage(msg);
        }
    }, [loadingRooms, location.state?.initialMessage]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const formatDate = (iso) => {
        const d = new Date(iso); const today = new Date();
        if (d.toDateString() === today.toDateString()) return t("common.today") || "Today";
        const y = new Date(today); y.setDate(today.getDate() - 1);
        if (d.toDateString() === y.toDateString()) return t("common.yesterday") || "Yesterday";
        return d.toLocaleDateString();
    };

    const SUGGESTIONS = Array.isArray(t("chat.suggestions")) ? t("chat.suggestions") : [];
    const QUICK_REPLIES = Array.isArray(t("chat.quickReplies")) ? t("chat.quickReplies") : [];

    // -- render -------------------------------------------------------------------
    return (
        <div className="page-container">
            <Navbar activePage="chat" />
            <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden", background: "var(--bg-main)" }}>

                {/* -- Sidebar --------------------------------------------------- */}
                <div style={{
                    width: 300, borderRight: "1px solid var(--border-light)",
                    display: "flex", flexDirection: "column",
                    background: "var(--bg-surface-1)", flexShrink: 0,
                }}>
                    <div style={{ padding: "1.25rem 1rem 1rem", borderBottom: "1px solid var(--border-light)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                            <h2 style={{ fontSize: "1rem", fontWeight: 900, margin: 0, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                <MessageSquare size={16} style={{ color: "var(--primary)" }} />
                                {t("chat.conversations")}
                            </h2>
                            <button onClick={() => createNewRoom()} title={t("chat.newConv")} style={{
                                width: 32, height: 32, borderRadius: 8, border: "none", cursor: "pointer",
                                background: "var(--primary)", color: "#fff",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 2px 8px rgba(6,95,70,0.3)",
                            }}>
                                <Plus size={15} />
                            </button>
                        </div>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0 }}>
                            {t("chat.askExpert")}
                        </p>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
                        {loadingRooms ? (
                            <div style={{ padding: "2rem", textAlign: "center" }}>
                                <Loader size={18} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} />
                            </div>
                        ) : rooms.length === 0 ? (
                            <div style={{ padding: "2rem 1rem", textAlign: "center" }}>
                                <MessageSquare size={28} style={{ color: "var(--text-muted)", marginBottom: "0.75rem", opacity: 0.4 }} />
                                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>{t("chat.noConv")}</p>
                                <button onClick={() => createNewRoom()} className="btn-primary" style={{ fontSize: "0.82rem", padding: "0.55rem 1rem" }}>
                                    <Plus size={14} /> {t("chat.startChat")}
                                </button>
                            </div>
                        ) : (
                            rooms.map(room => (
                                <div key={room.id} onClick={() => setActiveRoom(room)} style={{
                                    padding: "0.8rem 1rem", borderRadius: 12, cursor: "pointer",
                                    marginBottom: "0.4rem", transition: "all 0.2s",
                                    position: "relative",
                                    background: activeRoom?.id === room.id ? "var(--primary)" : "var(--bg-card)",
                                    color: activeRoom?.id === room.id ? "#fff" : "var(--text-main)",
                                    border: "1px solid var(--border-light)",
                                    boxShadow: activeRoom?.id === room.id ? "0 4px 12px rgba(6,95,70,0.2)" : "none",
                                }}
                                    onMouseEnter={e => { if (activeRoom?.id !== room.id) e.currentTarget.style.borderColor = "var(--primary)"; }}
                                    onMouseLeave={e => { if (activeRoom?.id !== room.id) e.currentTarget.style.borderColor = "var(--border-light)"; }}>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.25rem" }}>
                                        {renamingRoomId === room.id ? (
                                            <div style={{ display: "flex", gap: "0.3rem", width: "100%" }} onClick={e => e.stopPropagation()}>
                                                <input
                                                    autoFocus
                                                    value={newName}
                                                    onChange={e => setNewName(e.target.value)}
                                                    onKeyDown={e => { if (e.key === "Enter") renameRoom(room.id); if (e.key === "Escape") setRenamingRoomId(null); }}
                                                    style={{ flex: 1, fontSize: "0.8rem", padding: "0.25rem", borderRadius: 4, border: "1px solid var(--primary)", outline: "none" }}
                                                />
                                            </div>
                                        ) : (
                                            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {room.title || `Chat #${room.id}`}
                                            </p>
                                        )}

                                        <div style={{ display: "flex", gap: "0.35rem", opacity: activeRoom?.id === room.id ? 1 : 0.6 }} onClick={e => e.stopPropagation()}>
                                            {renamingRoomId === room.id ? (
                                                <button onClick={() => renameRoom(room.id)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0 }}>
                                                    <Send size={12} />
                                                </button>
                                            ) : (
                                                <>
                                                    <button onClick={() => { setRenamingRoomId(room.id); setNewName(room.title); }} title={t("chat.renameRoom")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, opacity: 0.7 }}>
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button onClick={() => deleteRoom(room.id)} title={t("chat.deleteRoom")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, opacity: 0.7 }}>
                                                        <Trash2 size={13} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {room.last_message && (
                                        <p style={{ margin: "0.15rem 0 0", fontSize: "0.72rem", opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {room.last_message.content?.replace(/\*\*/g, "").substring(0, 45)}...
                                        </p>
                                    )}
                                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.65rem", opacity: 0.6, fontWeight: 600 }}>
                                        {formatDate(room.updated_at || room.created_at)}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* -- Main Area ------------------------------------------------- */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

                    {!activeRoom ? (
                        /* Welcome / Suggestion screen */
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2.5rem", textAlign: "center", overflowY: "auto" }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: "50%",
                                background: "linear-gradient(135deg,#065f46,#10b981)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                marginBottom: "1.5rem", boxShadow: "0 8px 32px rgba(6,95,70,0.25)",
                            }}>
                                <Sparkles size={36} color="#fff" />
                            </div>
                            <h2 style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--text-main)", marginBottom: "0.5rem" }}>
                                {t("chat.howHelp")}
                            </h2>
                            <p style={{ color: "var(--text-muted)", maxWidth: 440, lineHeight: 1.7, marginBottom: "2rem", fontSize: "0.9rem" }}>
                                {t("chat.howHelpDesc")}
                            </p>

                            <p style={{ fontWeight: 800, fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
                                {t("chat.tryAsking")}
                            </p>
                            <div style={{ width: "100%", maxWidth: 520, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginBottom: "2rem" }}>
                                {SUGGESTIONS.map((s, i) => (
                                    <button key={i} onClick={() => sendMessage(s)} style={{
                                        padding: "0.8rem 1rem", borderRadius: 12, textAlign: "left",
                                        border: "1px solid var(--border-light)", background: "var(--bg-card)",
                                        cursor: "pointer", fontWeight: 600, color: "var(--text-main)", fontSize: "0.82rem",
                                        display: "flex", alignItems: "flex-start", gap: "0.5rem", transition: "all 0.2s",
                                        boxShadow: "var(--shadow-sm)", lineHeight: 1.4,
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.background = "var(--primary-subtle)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.background = "var(--bg-card)"; }}>
                                        <MessageSquare size={13} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
                                        {s}
                                    </button>
                                ))}
                            </div>

                            {/* Inline quick input on welcome */}
                            <div style={{ width: "100%", maxWidth: 520, display: "flex", gap: "0.5rem" }}>
                                <input
                                    value={input} onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={t("chat.inputPlaceholder")}
                                    style={{
                                        flex: 1, padding: "0.875rem 1.25rem", borderRadius: 14,
                                        border: "1px solid var(--border-light)", background: "var(--bg-card)",
                                        color: "var(--text-main)", fontSize: "0.9rem", outline: "none",
                                    }}
                                    onFocus={e => e.target.style.borderColor = "var(--primary)"}
                                    onBlur={e => e.target.style.borderColor = "var(--border-light)"}
                                />
                                <button onClick={() => sendMessage()} disabled={!input.trim()} className="btn-primary"
                                    style={{ padding: "0.875rem 1.25rem", borderRadius: 14, fontWeight: 800 }}>
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div style={{
                                padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--border-light)",
                                display: "flex", alignItems: "center", gap: "1rem",
                                background: "var(--bg-card)", flexShrink: 0,
                            }}>
                                <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#065f46,#10b981)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Bot size={20} color="#fff" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem", color: "var(--text-main)" }}>
                                        {activeRoom.title || t("chat.plantAdvisor")}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: "0.72rem", color: "#10b981", fontWeight: 700 }}>
                                        {isAdmin ? t("chat.adminView") : `${t("chat.plantAdvisor")}    ${t("chat.online")}`}
                                    </p>
                                </div>
                                <button onClick={() => { setActiveRoom(null); setMessages([]); }}
                                    style={{ marginLeft: "auto", background: "none", border: "1px solid var(--border-light)", borderRadius: 8, padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 700 }}>
                                    {t("chat.back")}
                                </button>
                            </div>

                            {/* Messages */}
                            <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1.5rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {loadingMessages ? (
                                    <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                                        <Loader size={24} style={{ animation: "spin 1s linear infinite" }} />
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((msg) => (
                                            <MessageBubble key={msg.id} msg={msg} isUser={msg.sender_type === "user"} />
                                        ))}
                                        {/* AI Typing indicator */}
                                        {waitingAI && (
                                            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                                                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#065f46,#10b981)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <Bot size={17} color="#fff" />
                                                </div>
                                                <div style={{ padding: "0.875rem 1.25rem", borderRadius: "4px 18px 18px 18px", background: "var(--bg-card)", border: "1px solid var(--border-light)", display: "flex", gap: "0.35rem", alignItems: "center" }}>
                                                    {[0, 1, 2].map(i => (
                                                        <div key={i} style={{
                                                            width: 8, height: 8, borderRadius: "50%", background: "var(--primary)",
                                                            animation: `pulse 1.2s ease-in-out infinite`,
                                                            animationDelay: `${i * 0.2}s`,
                                                        }} />
                                                    ))}
                                                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "0.25rem" }}>{t("chat.typing")}</span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick replies */}
                            <div style={{ padding: "0.5rem 1.5rem 0", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                {QUICK_REPLIES.map((q, i) => (
                                    <button key={i} onClick={() => sendMessage(q)}
                                        style={{
                                            padding: "0.35rem 0.875rem", borderRadius: 20, border: "1px solid var(--border-light)",
                                            background: "var(--bg-card)", cursor: "pointer", fontSize: "0.78rem",
                                            color: "var(--text-muted)", fontWeight: 600, transition: "all 0.2s",
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary)"; e.currentTarget.style.color = "var(--primary)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-light)"; e.currentTarget.style.color = "var(--text-muted)"; }}>
                                        {q}
                                    </button>
                                ))}
                            </div>

                            {/* Error */}
                            {error && (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.5rem", background: "#fef2f2", borderTop: "1px solid #fca5a5", color: "#dc2626", fontSize: "0.83rem", fontWeight: 600 }}>
                                    <AlertCircle size={15} /> {error}
                                    <button onClick={() => setError(null)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#dc2626", fontWeight: 800 }}>   </button>
                                </div>
                            )}

                            {/* Input */}
                            <div style={{ padding: "0.875rem 1.5rem 1.25rem", borderTop: "1px solid var(--border-light)", background: "var(--bg-card)", display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                                <textarea
                                    value={input} onChange={e => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={t("chat.inputPlaceholder")}
                                    rows={1}
                                    style={{
                                        flex: 1, resize: "none", border: "1px solid var(--border-light)",
                                        borderRadius: 14, padding: "0.8rem 1.25rem", outline: "none",
                                        background: "var(--bg-main)", color: "var(--text-main)",
                                        fontSize: "0.9rem", fontFamily: "inherit", lineHeight: 1.5,
                                        maxHeight: 120, overflowY: "auto", transition: "border-color 0.2s",
                                    }}
                                    onFocus={e => e.target.style.borderColor = "var(--primary)"}
                                    onBlur={e => e.target.style.borderColor = "var(--border-light)"}
                                />
                                <button onClick={() => sendMessage()} disabled={!input.trim() || sending || waitingAI}
                                    style={{
                                        width: 46, height: 46, borderRadius: 14, border: "none", cursor: "pointer",
                                        background: (!input.trim() || sending || waitingAI) ? "var(--bg-surface-2)" : "var(--primary)",
                                        color: (!input.trim() || sending || waitingAI) ? "var(--text-muted)" : "#fff",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "all 0.2s", flexShrink: 0,
                                        boxShadow: (!input.trim() || sending || waitingAI) ? "none" : "0 4px 12px rgba(6,95,70,0.3)",
                                    }}>
                                    {sending ? <Loader size={17} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={17} />}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Chat;
