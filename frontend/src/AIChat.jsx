import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authHeaders } from "./api";

const API_URL = "http://localhost:5000";

export default function AIChat() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: "👋 Bonjour ! Je suis votre assistant Sellekni. Posez-moi vos questions sur le site, je suis là pour vous aider.",
        },
      ]);
    }
  }, [isOpen]);

  const executeAction = (action, path) => {
    if (action === "navigate" && path) {
      navigate(path);
      setIsOpen(false);
    } else if (action === "openSearch") {
      window.dispatchEvent(new CustomEvent("openSearch"));
      setIsOpen(false);
    } else if (action === "openNotifications") {
      window.dispatchEvent(new CustomEvent("openNotifications"));
      setIsOpen(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.reply,
          action: data.action,
          path: data.path,
          buttonText: data.buttonText,
          suggestions: data.suggestions,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue." }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setIsOpen(v => !v)}
        title="Assistant IA"
        style={{
          position: "fixed",
          bottom: "28px",
          left: "20px",
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: "none",
          padding: 0,
          cursor: "pointer",
          zIndex: 50,
          background: "transparent",
          outline: "none",
        }}
        className="hover:scale-110 active:scale-95 transition-transform duration-200"
      >
        {isOpen ? (
          /* Close state */
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "linear-gradient(135deg,#8B5CF6,#C4B5FD)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 0 2px rgba(196,181,253,0.25), 0 8px 24px rgba(212,168,124,0.4)",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0E0520" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </div>
        ) : (
          /* Static orb — warm beige glow */
          <div style={{ position: "relative", width: 52, height: 52 }}>
            {/* Outer glow rings */}
            <div style={{
              position: "absolute", inset: -8, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(196,181,253,0.18) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute", inset: -4, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(212,168,124,0.15) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            {/* Main circle */}
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "linear-gradient(135deg, #8B5CF6 0%, #C4B5FD 50%, #A78BFA 100%)",
              boxShadow: "0 0 0 1px rgba(196,181,253,0.35), 0 8px 28px rgba(212,168,124,0.45), 0 0 40px rgba(196,181,253,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {/* Inner dark circle */}
              <div style={{
                position: "absolute", inset: 5, borderRadius: "50%",
                background: "#0E0520",
                border: "1.5px solid rgba(196,181,253,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(196,181,253,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26A7 7 0 0 1 12 2z"/>
                  <path d="M9 21h6"/>
                  <path d="M10 17v4"/>
                  <path d="M14 17v4"/>
                </svg>
              </div>
            </div>
          </div>
        )}
      </button>

      {/* ── Chat modal ── */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 sm:hidden" onClick={() => setIsOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 sm:bottom-24 sm:left-5 sm:right-auto w-full sm:w-96 h-[82vh] sm:h-[600px] flex flex-col z-50 rounded-t-2xl sm:rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(180deg,#0A031E 0%,#0E0520 100%)",
              border: "1px solid rgba(196,181,253,0.1)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(196,181,253,0.06)"
            }}>

            {/* Header */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-4"
              style={{
                borderBottom: "1px solid rgba(196,181,253,0.07)",
                background: "linear-gradient(135deg,rgba(212,168,124,0.12) 0%,rgba(25,21,18,0) 100%)"
              }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{
                  background: "linear-gradient(135deg,rgba(196,181,253,0.15),rgba(212,168,124,0.1))",
                  border: "1px solid rgba(196,181,253,0.15)"
                }}>
                🤖
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white leading-tight">Assistant Sellekni</p>
                <p className="text-[10px]" style={{ color: "rgba(196,181,253,0.4)" }}>Je vous guide sur le site</p>
              </div>
              <button onClick={() => setIsOpen(false)}
                className="sm:hidden w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(196,181,253,0.12) transparent" }}>
              {messages.map((msg, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className="max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed"
                      style={msg.role === "user"
                        ? {
                            background: "#C4B5FD",
                            color: "#0E0520",
                            borderRadius: "1rem 1rem 2px 1rem",
                            boxShadow: "0 4px 16px rgba(196,181,253,0.2)",
                          }
                        : {
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(196,181,253,0.08)",
                            color: "rgba(255,255,255,0.85)",
                            borderRadius: "1rem 1rem 1rem 2px",
                          }
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                  {msg.action && msg.buttonText && (
                    <div className="flex justify-start">
                      <button onClick={() => executeAction(msg.action, msg.path)}
                        className="px-3 py-1.5 rounded-xl text-xs transition-all"
                        style={{
                          background: "rgba(196,181,253,0.08)",
                          border: "1px solid rgba(196,181,253,0.18)",
                          color: "#C4B5FD",
                        }}>
                        {msg.buttonText} →
                      </button>
                    </div>
                  )}
                  {msg.suggestions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestions.map((s, si) => (
                        <button key={si} onClick={() => executeAction(s.action, s.path)}
                          className="px-2.5 py-1 rounded-full text-[11px] transition-all"
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(196,181,253,0.08)",
                            color: "rgba(196,181,253,0.6)",
                          }}>
                          {s.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(196,181,253,0.08)" }}>
                    <div className="flex gap-1.5 items-center">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                          style={{ background: "rgba(196,181,253,0.5)", animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-3 py-3" style={{ borderTop: "1px solid rgba(196,181,253,0.07)" }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ border: "1px solid rgba(196,181,253,0.08)", background: "rgba(255,255,255,0.03)" }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Posez votre question..."
                  className="flex-1 bg-transparent text-sm text-white focus:outline-none"
                  style={{ caretColor: "#C4B5FD" }}
                  disabled={isLoading}
                />
                <button onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                  style={{
                    background: input.trim() && !isLoading ? "#C4B5FD" : "rgba(255,255,255,0.05)",
                  }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                    stroke={input.trim() && !isLoading ? "#0E0520" : "rgba(255,255,255,0.4)"}
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
