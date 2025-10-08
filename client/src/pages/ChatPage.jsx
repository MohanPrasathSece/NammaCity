import { useEffect, useState, useRef } from 'react';
import { chatAPI } from '../services/api.js';
import { LANGUAGE_OPTIONS, isSTTSupported, isTTSSupported, startRecognition, speak } from '../utils/voice';
import './ChatPage.css';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [lang, setLang] = useState('en-IN');
  const [listening, setListening] = useState(false);
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
      const aiText = res.data?.reply || res.reply || (typeof res === 'string' ? res : '');
      const aiMsg = { sender: 'ai', text: aiText };
      setMessages((prev) => [...prev, aiMsg]);

      // TTS speak back if supported
      if (isTTSSupported() && aiText) {
        speak(aiText, { lang });
      }
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'ai', text: err.message }]);
    }
  };

  const handleVoiceInput = async () => {
    if (!isSTTSupported()) return alert('Speech-to-text not supported in this browser');
    try {
      setListening(true);
      const transcript = await startRecognition({ lang, interimResults: false });
      setInput(transcript);
    } catch (e) {
      console.warn('STT error:', e.message);
    } finally {
      setListening(false);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <span>AI Assistant</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="lang-select">
            {LANGUAGE_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>{o.label}</option>
            ))}
          </select>
          <button onClick={handleVoiceInput} className={`mic-btn ${listening ? 'active' : ''}`} title="Hold to speak">
            🎤
          </button>
        </div>
      </div>
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
