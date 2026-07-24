import { useState, useRef, useEffect } from 'react';
import { elvisApi } from '../api/elvisApi';
import PixelWindow from './ui/PixelWindow';
import ElvisCat from './ElvisCat';
import { MountainScene } from './ui/PixelScene';
import './ElvisChat.css';

const STARTER_MESSAGES = [
  { from: 'elvis', text: 'Mrrrp~' },
  { from: 'system', text: 'Elvis is your apprentice. He only speaks cat. Good luck.' },
];

export default function ElvisChat() {
  const [messages, setMessages] = useState(STARTER_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { from: 'user', text }]);
    setLoading(true);

    try {
      const { response } = await elvisApi.chat(text);
      setMessages((prev) => [...prev, { from: 'elvis', text: response }]);
    } catch {
      setMessages((prev) => [...prev, { from: 'elvis', text: 'Mrrp? (connection lost)' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <MountainScene className="chat-section section-zone" id="chat">
      <div className="container">
        <h2 className="section-title">Elvis Apprentice.exe</h2>
        <p className="section-subtitle">
          Ask him anything. He'll respond with cat noises. Very helpful.
        </p>

        <PixelWindow title="Elvis_Apprentice.exe" className="chat-window">
          <div className="chat-header">
            <ElvisCat mood="chill" size="small" className="chat-avatar-sprite" />
            <div>
              <strong>Elvis</strong>
              <span className="chat-status">Apprentice · Online · Unhelpful</span>
            </div>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.from}`}>
                <p>{msg.text}</p>
              </div>
            ))}
            {loading && (
              <div className="chat-bubble elvis typing">
                <p className="typing-dots"><span></span><span></span><span></span></p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message... (Elvis won't understand anyway)"
              disabled={loading}
            />
            <button type="submit" className="btn btn-accent" disabled={loading || !input.trim()}>
              Send
            </button>
          </form>
        </PixelWindow>
      </div>
    </MountainScene>
  );
}
