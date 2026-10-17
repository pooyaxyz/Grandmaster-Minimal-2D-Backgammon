import React, { useMemo } from 'react';
import { X, Trophy, Medal } from 'lucide-react';
import { getLeaderboard } from '../utils/storage';
import { soundManager } from '../utils/audio';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const leaderboard = useMemo(() => getLeaderboard(), [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-lg bg-[#131722] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161b29]">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base tracking-wide text-amber-200">Global Grandmaster Rankings</h3>
              <p className="text-xs text-slate-400">Competitive Elo leaderboard</p>
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

        {/* Leaderboard Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {leaderboard.map((entry) => {
            const isTop3 = entry.rank <= 3;
            const rankBadgeColor =
              entry.rank === 1
                ? 'bg-amber-400 text-slate-950 font-black'
                : entry.rank === 2
                ? 'bg-slate-300 text-slate-950 font-black'
                : entry.rank === 3
                ? 'bg-amber-700 text-white font-black'
                : 'bg-slate-800 text-slate-400 font-bold';

            return (
              <div
                key={entry.nickname}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                  entry.isCurrentPlayer
                    ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-400/40'
                    : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${rankBadgeColor}`}>
                    {entry.rank}
                  </div>
                  <span className="text-xl">{entry.avatar}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-xs ${entry.isCurrentPlayer ? 'text-amber-300' : 'text-white'}`}>
                        {entry.nickname}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {entry.tier} • {entry.wins} Wins ({entry.winRate}%)
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-amber-300 tabular-nums">
                    {entry.rating}
                  </span>
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Elo</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
