import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageCircle, Send } from 'lucide-react';
import { PlayerProfile, GameState } from '../types/game';
import { soundManager } from '../utils/audio';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  gameState: GameState;
  activeRoomCode?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  profile,
  gameState,
  activeRoomCode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://grandmaster-backgammon.com';
  const shareText = activeRoomCode
    ? `⚔️ Challenge me to a 3D Backgammon match in room ${activeRoomCode}! Join here: ${appUrl}`
    : gameState.winner
    ? `🏆 I just won a Backgammon match on Grandmaster 3D! Current Elo: ${profile.rating} (${profile.tier} Tier). Play now: ${appUrl}`
    : `🎲 Playing Grandmaster 3D Backgammon! Elo: ${profile.rating} | Wins: ${profile.stats.wins}. Challenge me: ${appUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareText);
    soundManager.playButtonTap();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    soundManager.playButtonTap();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Grandmaster 3D Backgammon',
          text: shareText,
          url: appUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleWhatsAppShare = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleTelegramShare = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-[#131722] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161b29]">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base tracking-wide text-amber-200">Share Achievements</h3>
              <p className="text-xs text-slate-400">Social sharing & friend invites</p>
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

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Visual Scorecard Preview */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/40 text-center">
            <div className="text-3xl mb-1">{profile.avatar}</div>
            <h4 className="font-black text-lg text-amber-200 tracking-wide">{profile.nickname}</h4>
            <div className="text-xs font-semibold text-slate-300 mt-0.5">
              {profile.tier} • Rating {profile.rating} Elo
            </div>
            <div className="flex justify-center gap-4 mt-3 text-xs font-mono text-slate-300 border-t border-slate-800/80 pt-2.5">
              <span>Wins: <strong className="text-white">{profile.stats.wins}</strong></span>
              <span>Streak: <strong className="text-amber-400">{profile.stats.winStreak}🔥</strong></span>
              <span>Gammons: <strong className="text-white">{profile.stats.gammons}</strong></span>
            </div>
          </div>

          {/* Share Text Box */}
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed">
            {shareText}
          </div>

          {/* Social Platforms Row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleTwitterShare}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>𝕏 / Twitter</span>
            </button>
            <button
              onClick={handleWhatsAppShare}
              className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleTelegramShare}
              className="py-2.5 px-3 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
            </button>
          </div>

          {/* Native Share / Copy */}
          <div className="flex gap-2">
            <button
              onClick={handleNativeShare}
              className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-98"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Invite Link</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
