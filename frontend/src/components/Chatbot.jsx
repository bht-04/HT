import React, { useState, useRef, useEffect } from "react";

function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [products, setProducts] = useState([]);
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showRelatedProducts, setShowRelatedProducts] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [chatStatus, setChatStatus] = useState("online");

  const messagesEndRef = useRef(null);
  const backendDomin = process.env.REACT_APP_API_URL || "http://localhost:8080/api";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, suggestedProducts, showRelatedProducts, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setShowRelatedProducts(false);
    setChatStatus("typing");
    setIsTyping(true);

    try {
      const response = await fetch(`${backendDomin}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input.trim() }),
      });

      const data = await response.json();

      const botMessage = {
        sender: "bot",
        text: data.answer || "Đang xử lý...",
      };
      setMessages((prev) => [...prev, botMessage]);

      setProducts(data.products || []);
      setSuggestedProducts(data.suggestedProducts || []);
      setChatStatus("online");
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Lỗi khi gọi chatbot. Vui lòng thử lại." },
      ]);
      setProducts([]);
      setSuggestedProducts([]);
      setChatStatus("offline");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleRelatedProducts = () => {
    setShowRelatedProducts(!showRelatedProducts);
  };

  const formatPrice = (price) => {
    if (!price) return 'Liên hệ';
    return price.toLocaleString('vi-VN');
  };

  const getStatusText = () => {
    switch(chatStatus) {
      case 'online': return 'Đang hoạt động';
      case 'typing': return 'Đang trả lời...';
      case 'offline': return 'Đang ngoại tuyến';
      default: return 'Đang hoạt động';
    }
  };

  const getStatusColor = () => {
    switch(chatStatus) {
      case 'online': return 'bg-green-500';
      case 'typing': return 'bg-yellow-500 animate-pulse';
      case 'offline': return 'bg-red-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Nút mở chat */}
      {!isOpen && (
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110"
          style={{ backgroundColor: "#a12b58" }}
          onClick={() => setIsOpen(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 sm:h-8 sm:w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
          <span className="absolute top-0 right-0 flex h-3 w-3 sm:h-4 sm:w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 bg-red-500"></span>
          </span>
        </div>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className="w-[90vw] sm:w-96 md:w-[400px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200" style={{ height: "600px", maxHeight: "85vh" }}>
          {/* Header */}
          <div
            className="px-4 py-3 rounded-t-2xl flex justify-between items-center text-white"
            style={{ backgroundColor: "#a12b58" }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()}`}></div>
                <h3 className="font-semibold text-sm sm:text-base">
                  Chatbot
                </h3>
              </div>
              <span className="text-xs opacity-80 bg-white/20 px-2.5 py-0.5 rounded-full">
                {getStatusText()}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 scroll-smooth">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div
                  className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3"
                  style={{ backgroundColor: "#f8d7da" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8"
                    style={{ color: "#a12b58" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <p className="text-gray-700 text-sm font-medium">
                  Xin chào! Tôi là trợ lý của HTShop
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  Tôi có thể giúp gì cho bạn về thiết bị công nghệ?
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  <button 
                    onClick={() => setInput("Tôi muốn tìm tai nghe")}
                    className="text-xs bg-white px-3 py-1.5 rounded-full border border-gray-200 hover:border-[#a12b58] hover:text-[#a12b58] transition-colors"
                  >
                    Tìm tai nghe
                  </button>
                  <button 
                    onClick={() => setInput("Tôi muốn mua laptop")}
                    className="text-xs bg-white px-3 py-1.5 rounded-full border border-gray-200 hover:border-[#a12b58] hover:text-[#a12b58] transition-colors"
                  >
                    Mua laptop
                  </button>
                  <button 
                    onClick={() => setInput("Giá điện thoại Samsung")}
                    className="text-xs bg-white px-3 py-1.5 rounded-full border border-gray-200 hover:border-[#a12b58] hover:text-[#a12b58] transition-colors"
                  >
                    Giá Samsung
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-3 flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-2.5 max-w-[85%] shadow-sm ${
                    msg.sender === "user"
                      ? "rounded-tr-none text-white"
                      : "rounded-tl-none bg-white border border-gray-200"
                  }`}
                  style={{
                    backgroundColor: msg.sender === "user" ? "#a12b58" : "",
                  }}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                  {msg.sender === "bot" && (
                    <div className="mt-1 text-xs opacity-70" style={{ color: msg.sender === "user" ? "#ffffff" : "#a12b58" }}>
                      HTShop
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start mb-3">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}

            {suggestedProducts.length > 0 && (
              <div className="bg-white p-3 rounded-xl border border-gray-200 mt-3 mb-2 shadow-sm">
                <p className="text-sm font-semibold text-gray-700 mb-2">
                  Sản phẩm gợi ý:
                </p>
                {suggestedProducts.map((p) => (
                  <div
                    key={p._id}
                    className="flex items-center gap-3 mb-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                    onClick={() =>
                      window.open(`/chi-tiet-san-pham/${p._id}`, "_blank")
                    }
                  >
                    <img
                      src={p.productImage?.[0] || "/default-image.png"}
                      alt={p.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.brand}
                      </p>
                      <p className="text-sm font-bold" style={{ color: "#a12b58" }}>
                        {formatPrice(p.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {products.length > 0 &&
              showRelatedProducts &&
              messages.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-sm text-gray-700">
                      Sản phẩm liên quan:
                    </p>
                    <button
                      onClick={toggleRelatedProducts}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Ẩn
                    </button>
                  </div>
                  <div className="space-y-2">
                    {products.map((p) => (
                      <div
                        key={p._id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        onClick={() =>
                          window.open(`/chi-tiet-san-pham/${p._id}`, "_blank")
                        }
                      >
                        <img
                          src={p.productImage?.[0] || "/default-image.png"}
                          alt={p.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {p.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {p.brand} - {p.category}
                          </p>
                          <p className="text-sm font-bold" style={{ color: "#a12b58" }}>
                            {formatPrice(p.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="p-3 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex gap-2">
              <textarea
                className="flex-1 resize-none border border-gray-300 rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#a12b58] focus:border-transparent transition-all"
                style={{ minHeight: "44px", maxHeight: "120px" }}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập tin nhắn..."
                onFocus={() => setShowRelatedProducts(false)}
              />
              <button
                onClick={sendMessage}
                className="px-4 py-2.5 rounded-xl text-white transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#a12b58" }}
                disabled={!input.trim()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              Enter để gửi · Shift+Enter xuống dòng
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbot;