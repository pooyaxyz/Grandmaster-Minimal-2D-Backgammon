import React, { useState, useEffect } from 'react';
import { X, Gift, Check, Sparkles, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PlayerProfile } from '../types/game';
import { checkDailyRewardAvailable, claimDailyReward, DAILY_REWARDS } from '../utils/storage';
import { soundManager } from '../utils/audio';

interface DailyRewardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: PlayerProfile;
  onClaimSuccess: (updatedProfile: PlayerProfile) => void;
}

export const DailyRewardsModal: React.FC<DailyRewardsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onClaimSuccess,
}) => {
  const [rewardStatus, setRewardStatus] = useState(checkDailyRewardAvailable(profile));
  const [timeLeftStr, setTimeLeftStr] = useState('');

  useEffect(() => {
    setRewardStatus(checkDailyRewardAvailable(profile));
  }, [profile, isOpen]);

  useEffect(() => {
    if (rewardStatus.available) return;

    const timer = setInterval(() => {
      const status = checkDailyRewardAvailable(profile);
      setRewardStatus(status);
      if (status.timeRemainingMs > 0) {
        const hours = Math.floor(status.timeRemainingMs / (1000 * 60 * 60));
        const mins = Math.floor((status.timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((status.timeRemainingMs % (1000 * 60)) / 1000);
        setTimeLeftStr(
          `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [profile, rewardStatus.available]);

  if (!isOpen) return null;

  const handleClaim = () => {
    const res = claimDailyReward();
    if (res.success) {
      soundManager.playRewardCoins();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      onClaimSuccess(res.profile);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-[#131722] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161b29]">
          <div className="flex items-center gap-2.5">
            <Gift className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base tracking-wide text-amber-200">Daily Grandmaster Vault</h3>
              <p className="text-xs text-slate-400">7-Day Attendance Streak Rewards</p>
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
          {/* Streak Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-300 block font-medium">Current Consecutive Streak</span>
              <span className="text-lg font-black text-amber-300 font-mono">
                🔥 {profile.dailyStreak} Days Active
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-medium">Vault Chips</span>
              <span className="text-base font-bold text-white font-mono">🪙 {profile.coins}</span>
            </div>
          </div>

          {/* 7 Day Rewards Grid */}
          <div className="grid grid-cols-4 gap-2">
            {DAILY_REWARDS.map((r, i) => {
              const isClaimed = profile.dailyStreak >= r.day && !rewardStatus.available;
              const isCurrent = rewardStatus.available && rewardStatus.nextDay === r.day;
              const isJackpot = r.day === 7;

              return (
                <div
                  key={r.day}
                  className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between transition-all ${
                    isJackpot ? 'col-span-2' : ''
                  } ${
                    isCurrent
                      ? 'bg-amber-500/20 border-amber-400 shadow-lg scale-102 ring-1 ring-amber-400/50'
                      : isClaimed
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Day {r.day}
                  </div>
                  <div className="text-2xl my-1">{isJackpot ? '👑' : '🪙'}</div>
                  <div className="font-mono font-bold text-xs text-amber-300">+{r.coins}</div>
                  {isClaimed && (
                    <div className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5 mt-1">
                      <Check className="w-2.5 h-2.5" /> Claimed
                    </div>
                  )}
                  {isCurrent && (
                    <div className="text-[9px] text-amber-300 font-bold mt-1">Available!</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action button */}
          {rewardStatus.available ? (
            <button
              onClick={handleClaim}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide transition-all shadow-xl active:scale-98 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Claim Day {rewardStatus.nextDay} Reward</span>
            </button>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center flex items-center justify-center gap-2 text-xs text-slate-400">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Next reward unlocks in <strong className="font-mono text-white">{timeLeftStr}</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
