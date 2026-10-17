import React, { useState } from 'react';
import { X, Users, Bot, Globe, Key, UserCheck, Shield, Sparkles, Check, Copy } from 'lucide-react';
import { AIDifficulty, GameMode, PlayerProfile } from '../types/game';
import { DEFAULT_AVATARS, savePlayerProfile } from '../utils/storage';
import { soundManager } from '../utils/audio';

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: GameMode;
  aiDifficulty: AIDifficulty;
  profile: PlayerProfile;
  onUpdateProfile: (updated: PlayerProfile) => void;
  onSelectAIMode: (difficulty: AIDifficulty) => void;
  onSelectLocalMode: () => void;
  onCreateOnlineRoom: () => void;
  onJoinOnlineRoom: (code: string) => void;
  onStartQuickMatchmaking: () => void;
  isQueueing: boolean;
  activeRoomCode?: string;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  onClose,
  currentMode,
  aiDifficulty,
  profile,
  onUpdateProfile,
  onSelectAIMode,
  onSelectLocalMode,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onStartQuickMatchmaking,
  isQueueing,
  activeRoomCode,
}) => {
  const [tab, setTab] = useState<'modes' | 'profile' | 'private'>('modes');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState(profile.nickname);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playButtonTap();
    const updated: PlayerProfile = {
      ...profile,
      nickname: nicknameInput.trim() || profile.nickname,
      avatar: selectedAvatar,
    };
    savePlayerProfile(updated);
    onUpdateProfile(updated);
    setTab('modes');
  };

  const handleCopyRoomCode = () => {
    if (!activeRoomCode) return;
    navigator.clipboard.writeText(activeRoomCode);
    soundManager.playButtonTap();
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-lg bg-[#131722] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-white animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161b29]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎲</span>
            <div>
              <h2 className="font-bold text-base tracking-wide text-amber-200">Arena Game Modes</h2>
              <p className="text-xs text-slate-400">Matchmaking, private rooms & practice</p>
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

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-800/60 bg-[#0e111a] text-xs font-semibold">
          <button
            onClick={() => setTab('modes')}
            className={`py-3 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              tab === 'modes'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Game Modes</span>
          </button>
          <button
            onClick={() => setTab('private')}
            className={`py-3 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              tab === 'private'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Private Rooms</span>
          </button>
          <button
            onClick={() => setTab('profile')}
            className={`py-3 flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
              tab === 'profile'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Guest Identity</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === 'modes' && (
            <div className="space-y-3">
              {/* Online Quick Matchmaking */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-950/20 border border-amber-500/40 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-amber-200">Online Ranked Matchmaking</h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Compete against live players near your Elo rating.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center gap-2">
                  <button
                    disabled={isQueueing}
                    onClick={() => {
                      soundManager.playButtonTap();
                      onStartQuickMatchmaking();
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                  >
                    {isQueueing ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Searching Opponent...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Find Quick Match</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 2-Player Local Mode */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80 hover:border-slate-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">2-Player Local Pass & Play</h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Head-to-head match on the same phone, tablet, or laptop.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      soundManager.playButtonTap();
                      onSelectLocalMode();
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs text-white shadow-md transition-colors"
                  >
                    Play Local
                  </button>
                </div>
              </div>

              {/* Single Player Practice vs AI */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Single-Player Practice vs AI</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Sharpen strategies with move hints and pip race analysis.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {(['casual', 'skilled', 'grandmaster'] as AIDifficulty[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => {
                        soundManager.playButtonTap();
                        onSelectAIMode(level);
                        onClose();
                      }}
                      className={`py-2 rounded-xl border text-xs font-bold capitalize transition-all ${
                        currentMode === 'ai' && aiDifficulty === level
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-slate-900 border-slate-700/60 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'private' && (
            <div className="space-y-4">
              {/* Host private room */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80">
                <h4 className="font-bold text-sm text-amber-200 mb-1">Create Private Room</h4>
                <p className="text-xs text-slate-400 mb-3">
                  Generate a private room code and invite a friend to play instantly.
                </p>

                {activeRoomCode ? (
                  <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/40 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-mono">Your Room Code</span>
                      <span className="font-mono text-lg font-black text-amber-300 tracking-wider">
                        {activeRoomCode}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyRoomCode}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      soundManager.playButtonTap();
                      onCreateOnlineRoom();
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
                  >
                    Generate Room Code
                  </button>
                )}
              </div>

              {/* Join private room */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/80">
                <h4 className="font-bold text-sm text-white mb-1">Join Room with Code</h4>
                <p className="text-xs text-slate-400 mb-3">
                  Enter the 6-character room code given by your opponent.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="e.g. BG-8392"
                    maxLength={10}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                  />
                  <button
                    disabled={!joinCodeInput.trim()}
                    onClick={() => {
                      soundManager.playButtonTap();
                      onJoinOnlineRoom(joinCodeInput.trim());
                      onClose();
                    }}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md disabled:opacity-40"
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Guest Tactician Nickname
                </label>
                <input
                  type="text"
                  value={nicknameInput}
                  onChange={(e) => setNicknameInput(e.target.value)}
                  maxLength={16}
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Choose Tactical Avatar
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {DEFAULT_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        soundManager.playButtonTap();
                        setSelectedAvatar(emoji);
                      }}
                      className={`text-2xl p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                        selectedAvatar === emoji
                          ? 'bg-amber-500/20 border-amber-400 scale-105 shadow-md'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md"
              >
                Save Guest Profile
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
