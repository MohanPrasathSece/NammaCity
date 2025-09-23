import { useEffect, useState, useRef } from 'react';
import { chatAPI } from '../services/api.js';
import './ChatPage.css';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    try {
      const res = await chatAPI.sendMessage?.(input) || { data: { reply: 'This is a mock reply 👍' } };
      const aiMsg = { sender: 'ai', text: res.data?.reply || res.reply || res };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'ai', text: err.message }]);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-header">AI Assistant</div>
      <div className="chat-body">
        {messages.map((m, idx) => (
          <div key={idx} className={`msg ${m.sender}`}>{m.text}</div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-bar">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask anything..."
        />
        <button onClick={sendMessage} className="send-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
    </div>
  );
}
