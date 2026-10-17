import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Smile } from 'lucide-react';
import { ChatMessage, PlayerColor } from '../types/game';
import { soundManager } from '../utils/audio';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentUserName: string;
  currentUserColor?: PlayerColor;
  onSendMessage: (text: string, isQuickEmote?: boolean) => void;
}

const QUICK_PHRASES = [
  'Good roll! 🎲',
  'Tough break! 😅',
  'Well played! 👏',
  'Shall we double? ⚡',
  'Nice prime! 🛡️',
  'Good game! 🤝',
  'Thinking... 🤔',
  'Rematch after this? 🔥',
];

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  messages,
  currentUserName,
  currentUserColor,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    soundManager.playButtonTap();
    onSendMessage(inputText.trim(), false);
    setInputText('');
  };

  const handleQuickPhrase = (phrase: string) => {
    soundManager.playButtonTap();
    onSendMessage(phrase, true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-[#131722] border border-slate-800 rounded-2xl shadow-2xl flex flex-col h-[520px] max-h-[85vh] overflow-hidden text-white animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-[#161b29]">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <div>
              <h3 className="font-bold text-sm tracking-wide text-amber-200">Arena Game Chat</h3>
              <p className="text-[11px] text-slate-400">Live communication with your opponent</p>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playButtonTap();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Phrases Carousel */}
        <div className="px-4 py-2 bg-[#0e111a] border-b border-slate-800/60 overflow-x-auto flex gap-1.5 no-scrollbar">
          {QUICK_PHRASES.map((phrase, idx) => (
            <button
              key={idx}
              onClick={() => handleQuickPhrase(phrase)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-amber-500/20 hover:border-amber-500/40 border border-slate-700/60 text-xs text-slate-300 hover:text-amber-200 transition-colors"
            >
              {phrase}
            </button>
          ))}
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-[#10131d]/90">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
              <Smile className="w-8 h-8 mb-2 opacity-40" />
              <span>Say hello or pick a quick tactical reaction above!</span>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender === currentUserName;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-400 px-1 mb-0.5">
                    {msg.sender}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs font-medium leading-relaxed shadow-md ${
                      isMine
                        ? 'bg-amber-500 text-slate-950 rounded-br-none'
                        : 'bg-slate-800 text-white rounded-bl-none border border-slate-700/60'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-[#161b29] border-t border-slate-800/80 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            maxLength={140}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
