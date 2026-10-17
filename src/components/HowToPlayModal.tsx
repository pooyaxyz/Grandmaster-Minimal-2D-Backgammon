import React from 'react';
import { X, BookOpen, CheckCircle, ShieldAlert, Trophy } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-lg bg-[#131722] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161b29]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base tracking-wide text-amber-200">How to Play Backgammon</h3>
              <p className="text-xs text-slate-400">Rules, Movement & Scoring Guide</p>
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
        <div className="p-5 space-y-4 overflow-y-auto text-xs text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h4 className="font-bold text-sm text-amber-300 mb-1 flex items-center gap-1.5">
              <span>🎯 Objective & Movement</span>
            </h4>
            <p>
              Move all 15 of your checkers into your Home Board and bear them off the table.
              <br />
              • <strong className="text-white">White</strong> moves counter-clockwise from point 24 down toward point 1 (bearing off into the right tray).
              <br />
              • <strong className="text-white">Black</strong> moves from point 1 up toward point 24 (bearing off into their home tray).
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h4 className="font-bold text-sm text-amber-300 mb-1 flex items-center gap-1.5">
              <span>🎲 Dice & Doubles</span>
            </h4>
            <p>
              Roll 2 dice. Each die indicates a separate checker movement distance.
              If you roll <strong>doubles</strong> (e.g. 4-4), you receive <strong className="text-emerald-400">4 moves</strong> of that number instead of 2!
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h4 className="font-bold text-sm text-amber-300 mb-1 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <span>Hitting Blots & The Bar</span>
            </h4>
            <p>
              A single checker resting on a point is called a <strong>blot</strong>. If an opponent lands on your blot, your checker is captured and sent to the <strong>Bar</strong> in the center. Checkers on the bar MUST re-enter the opponent's home board before any other checkers can move.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h4 className="font-bold text-sm text-amber-300 mb-1 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Bearing Off</span>
            </h4>
            <p>
              Once ALL 15 of your checkers are inside your home board (points 1–6 for White, 19–24 for Black), you can start bearing them off into your side tray. The first player to bear off all 15 checkers wins!
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h4 className="font-bold text-sm text-amber-300 mb-1 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span>Victory Levels</span>
            </h4>
            <p>
              • <strong>Normal Win (1×):</strong> Opponent has borne off at least 1 checker.
              <br />
              • <strong>Gammon (2×):</strong> Opponent has borne off ZERO checkers.
              <br />
              • <strong>Backgammon (3×):</strong> Opponent has borne off zero checkers AND still has a checker on the bar or in the winner's home board!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
