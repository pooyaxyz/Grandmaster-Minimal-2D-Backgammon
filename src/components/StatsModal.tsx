import React from 'react';
import { X, Award, Flame, Target, ShieldCheck, Zap } from 'lucide-react';
import { PlayerProfile } from '../types/game';
import { soundManager } from '../utils/audio';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, profile }) => {
  if (!isOpen) return null;

  const { stats } = profile;
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;

  // Next tier progress calculation
  const getNextTier = () => {
    if (profile.rating < 1150) return { name: 'Silver', target: 1150, current: profile.rating, min: 800 };
    if (profile.rating < 1300) return { name: 'Gold', target: 1300, current: profile.rating, min: 1150 };
    if (profile.rating < 1450) return { name: 'Platinum', target: 1450, current: profile.rating, min: 1300 };
    if (profile.rating < 1600) return { name: 'Diamond', target: 1600, current: profile.rating, min: 1450 };
    if (profile.rating < 1800) return { name: 'Grandmaster', target: 1800, current: profile.rating, min: 1600 };
    return { name: 'Pinnacle Master', target: 2200, current: profile.rating, min: 1800 };
  };

  const nextTier = getNextTier();
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((nextTier.current - nextTier.min) / (nextTier.target - nextTier.min)) * 100))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-[#131722] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161b29]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{profile.avatar}</span>
            <div>
              <h3 className="font-bold text-base tracking-wide text-amber-200">{profile.nickname}</h3>
              <p className="text-xs text-slate-400">Competitive Performance Dossier</p>
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
          {/* Tier Progress Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 uppercase font-semibold">Tier Progression</span>
              <span className="text-xs font-bold text-amber-300">
                {profile.tier} → {nextTier.name}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
              <span>{profile.rating} Elo</span>
              <span>{nextTier.target} Goal</span>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Target className="w-4 h-4 text-emerald-400" />
                <span>Win Rate</span>
              </div>
              <div className="font-mono text-2xl font-black text-white">{winRate}%</div>
              <span className="text-[10px] text-slate-500 font-medium">
                {stats.wins} W / {stats.losses} L ({stats.gamesPlayed} Total)
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Win Streak</span>
              </div>
              <div className="font-mono text-2xl font-black text-amber-300">{stats.winStreak}</div>
              <span className="text-[10px] text-slate-500 font-medium">
                Best Streak: {stats.highestStreak} Wins
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Gammons (2×)</span>
              </div>
              <div className="font-mono text-2xl font-black text-white">{stats.gammons}</div>
              <span className="text-[10px] text-slate-500 font-medium">
                Crushing shutouts
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Backgammons (3×)</span>
              </div>
              <div className="font-mono text-2xl font-black text-purple-300">{stats.backgammons}</div>
              <span className="text-[10px] text-slate-500 font-medium">
                Mastery sweeps
              </span>
            </div>
          </div>

          {/* Pips cleared & Coins */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Total Strategic Pips Cleared</span>
              <span className="font-mono text-base font-bold text-white tabular-nums">
                {stats.totalPipsCleared.toLocaleString()} pips
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block font-medium">Arena Vault Chips</span>
              <span className="font-mono text-base font-bold text-amber-400 tabular-nums">
                🪙 {profile.coins}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
