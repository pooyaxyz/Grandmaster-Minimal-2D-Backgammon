import React, { useState } from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Repeat,
  Lightbulb,
  MessageSquare,
  Trophy,
  BarChart3,
  Gift,
  Palette,
  Share2,
  HelpCircle,
  Play,
  Maximize,
  Minimize,
  Smartphone,
  SlidersHorizontal,
  X,
  Globe,
} from 'lucide-react';
import { GameMode, GameState, PlayerProfile } from '../types/game';
import { calculatePipCounts } from '../utils/backgammonLogic';
import { soundManager } from '../utils/audio';

interface GameHUDProps {
  gameState: GameState;
  gameMode: GameMode;
  profile: PlayerProfile;
  flippedPerspective: boolean;
  isRolling: boolean;
  soundEnabled: boolean;
  unreadChatCount: number;
  isFullscreen: boolean;
  isRotated: boolean;
  onRollDice: () => void;
  onUndoMove: () => void;
  onEndTurn: () => void;
  onProposeDouble: () => void;
  onToggleFlipPerspective: () => void;
  onToggleSound: () => void;
  onToggleFullscreen: () => void;
  onToggleRotate: () => void;
  onGetCoachHint: () => void;
  onOpenChat: () => void;
  onOpenMatchmaking: () => void;
  onOpenLeaderboard: () => void;
  onOpenStats: () => void;
  onOpenDailyRewards: () => void;
  onOpenThemes: () => void;
  onOpenShare: () => void;
  onOpenHowToPlay: () => void;
  dailyRewardAvailable: boolean;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  gameState,
  gameMode,
  profile,
  flippedPerspective,
  isRolling,
  soundEnabled,
  unreadChatCount,
  isFullscreen,
  isRotated,
  onRollDice,
  onUndoMove,
  onEndTurn,
  onProposeDouble,
  onToggleFlipPerspective,
  onToggleSound,
  onToggleFullscreen,
  onToggleRotate,
  onGetCoachHint,
  onOpenChat,
  onOpenMatchmaking,
  onOpenLeaderboard,
  onOpenStats,
  onOpenDailyRewards,
  onOpenThemes,
  onOpenShare,
  onOpenHowToPlay,
  dailyRewardAvailable,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pipCounts = calculatePipCounts(gameState.board);

  const isWhiteTurn = gameState.currentTurn === 'white';
  const canUndo = gameState.turnMoves.length > 0 && !gameState.winner;
  const canRoll = !gameState.diceRolled && !gameState.winner;
  const canEndTurn =
    gameState.diceRolled &&
    (gameState.diceAvailable.length === 0 || gameState.turnMoves.length > 0) &&
    !gameState.winner;

  // WHEN IN FULL SCREEN:
  // Render ONLY the board in full size without any menu or buttons next to the game!
  // Include only a discrete floating minimize button in the corner to exit.
  if (isFullscreen) {
    return (
      <div className="fixed top-3 right-3 z-50 pointer-events-auto select-none">
        <button
          onClick={() => {
            soundManager.playButtonTap();
            onToggleFullscreen();
          }}
          title="Exit Full Screen (Esc)"
          className="p-2.5 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white/80 hover:text-white shadow-2xl transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold backdrop-blur-xs"
        >
          <Minimize className="w-4 h-4 text-amber-300" />
          <span className="text-[11px] pr-1">Exit</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-1.5 sm:p-3 z-20 select-none">
      {/* Top Header Bar - Optimized for small mobile screens (<360px up to 4K) */}
      <div className="flex items-center justify-between w-full gap-1.5">
        {/* Left: Player Profile Card */}
        <div className="pointer-events-auto shrink min-w-0 flex items-center gap-1.5 bg-[#10141d]/95 border border-amber-500/30 rounded-xl px-2 py-1 text-white shadow-lg">
          <span className="text-base sm:text-lg shrink-0">{profile.avatar}</span>
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1 truncate">
              <span className="font-bold text-xs tracking-wide text-amber-200 truncate">
                {profile.nickname}
              </span>
              <span className="hidden md:inline-block text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {profile.tier}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 truncate">
              <span>{profile.rating}</span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">🪙{profile.coins}</span>
            </div>
          </div>
        </div>

        {/* Center: Pip Counters */}
        <div className="pointer-events-auto shrink-0 flex items-center gap-1.5 sm:gap-2.5 bg-[#10141d]/95 border border-slate-800 rounded-xl px-2 sm:px-3 py-1 text-white shadow-lg">
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full border ${
                isWhiteTurn ? 'bg-white ring-2 ring-amber-400' : 'bg-white/60'
              }`}
            />
            <div className="flex sm:flex-col items-center sm:items-start gap-1 sm:gap-0">
              <span className="text-[8px] text-slate-400 uppercase font-bold hidden sm:block">White</span>
              <span className="font-mono font-bold text-xs text-white tabular-nums">
                W:{pipCounts.white}
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full border ${
                !isWhiteTurn
                  ? 'bg-slate-900 border-amber-400 ring-2 ring-amber-400'
                  : 'bg-slate-800 border-slate-600'
              }`}
            />
            <div className="flex sm:flex-col items-center sm:items-start gap-1 sm:gap-0">
              <span className="text-[8px] text-slate-400 uppercase font-bold hidden sm:block">Black</span>
              <span className="font-mono font-bold text-xs text-white tabular-nums">
                B:{pipCounts.black}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls - ALL WITH shrink-0 SO THEY ARE ALWAYS 100% VISIBLE */}
        <div className="pointer-events-auto shrink-0 flex items-center gap-1">
          {/* 1-Click Orientation Fit Toggle */}
          <button
            onClick={() => {
              soundManager.playButtonTap();
              onToggleRotate();
            }}
            title={isRotated ? 'Reset to Horizontal' : 'Fit to Vertical (Rotate 90°)'}
            className={`shrink-0 p-1.5 sm:p-2 rounded-xl border transition-colors shadow-md flex items-center gap-1 text-xs font-semibold ${
              isRotated
                ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                : 'bg-[#10141d]/95 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${isRotated ? 'rotate-90 text-amber-300' : ''}`} />
            <span className="hidden lg:inline">{isRotated ? 'Horizontal' : 'Fit Screen'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={() => {
              soundManager.playButtonTap();
              onToggleFullscreen();
            }}
            title="Play Full Screen"
            className="shrink-0 p-1.5 sm:p-2 rounded-xl bg-[#10141d]/95 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors shadow-md"
          >
            <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-200" />
          </button>

          {/* Settings / Options Box Drawer Trigger - PROMINENT AND VISIBLE ON ALL SCREENS */}
          <button
            onClick={() => {
              soundManager.playButtonTap();
              setMobileMenuOpen(true);
            }}
            title="Game Options & Settings"
            className="shrink-0 relative px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-xl flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 fill-current" />
            <span className="font-bold text-[11px] sm:text-xs">Options</span>
            {dailyRewardAvailable && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full ring-2 ring-slate-900" />
            )}
          </button>
        </div>
      </div>

      {/* Center Toast Victory Announcement */}
      <div className="flex flex-col items-center pointer-events-none my-auto">
        {gameState.winner ? (
          <div className="pointer-events-auto bg-[#141824]/95 border-2 border-amber-400 rounded-2xl p-5 text-center max-w-xs sm:max-w-sm shadow-2xl animate-scale-in">
            <span className="text-3xl block mb-1">🏆</span>
            <h2 className="text-xl sm:text-2xl font-black text-amber-200 uppercase tracking-wider">
              {gameState.winner.toUpperCase()} VICTORIOUS!
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 capitalize font-medium">
              Won by {gameState.winType || 'normal'} victory
            </p>
            <div className="mt-4 flex gap-2 justify-center">
              <button
                onClick={() => {
                  soundManager.playButtonTap();
                  window.location.reload();
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-slate-950 text-xs shadow-lg transition-transform active:scale-95"
              >
                Play Rematch
              </button>
              <button
                onClick={() => {
                  soundManager.playButtonTap();
                  onOpenShare();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-white text-xs border border-slate-700 transition-colors"
              >
                Share
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Primary Mobile-Friendly Bottom Action Bar */}
      <div className="pointer-events-auto flex items-center justify-center mx-auto w-full max-w-xl">
        <div className="w-full bg-[#10141d]/95 border border-slate-800 rounded-2xl px-2.5 py-1.5 sm:px-4 sm:py-2 text-white shadow-2xl flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Turn and Active Dice */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink min-w-0">
            <div
              className={`px-2 py-1 rounded-lg border text-[10px] sm:text-xs font-bold tracking-wide flex items-center gap-1 shrink-0 ${
                isWhiteTurn
                  ? 'bg-slate-100 text-slate-950 border-white'
                  : 'bg-slate-900 text-slate-100 border-slate-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>{isWhiteTurn ? 'WHITE' : 'BLACK'}</span>
            </div>

            {/* Available Dice badges */}
            {gameState.diceRolled && (
              <div className="flex items-center gap-1 bg-slate-900/90 px-1.5 py-0.5 rounded-lg border border-slate-800 shrink-0">
                {gameState.dice.map((dieVal, idx) => {
                  const isUsed = !gameState.diceAvailable.includes(dieVal);
                  return (
                    <div
                      key={idx}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded flex items-center justify-center font-bold text-xs border ${
                        isUsed
                          ? 'bg-slate-800/40 text-slate-600 border-slate-800 line-through'
                          : 'bg-amber-500/25 text-amber-300 border-amber-500/60'
                      }`}
                    >
                      {dieVal}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {canRoll && (
              <button
                disabled={isRolling}
                onClick={() => {
                  soundManager.playButtonTap();
                  onRollDice();
                }}
                className="flex items-center gap-1 px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl transition-transform active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                <span>Roll Dice</span>
              </button>
            )}

            {canUndo && (
              <button
                onClick={() => {
                  soundManager.playUndo();
                  onUndoMove();
                }}
                title="Undo move"
                className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            )}

            {canEndTurn && (
              <button
                onClick={() => {
                  soundManager.playButtonTap();
                  onEndTurn();
                }}
                className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                <span>Confirm</span>
              </button>
            )}

            {/* Chat Trigger */}
            <button
              onClick={() => {
                soundManager.playButtonTap();
                onOpenChat();
              }}
              className="relative p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white"
              title="Chat"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadChatCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full" />
              )}
            </button>

            {/* Options button in bottom dock as well for mobile thumb convenience */}
            <button
              onClick={() => {
                soundManager.playButtonTap();
                setMobileMenuOpen(true);
              }}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 hover:text-amber-200"
              title="Options & Settings"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Settings & Options Box Drawer Sheet */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs select-none animate-fade-in">
          <div className="w-full sm:max-w-md bg-[#121622] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#161c2b]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm text-amber-200">Game Options & Settings</h3>
                  <p className="text-[11px] text-slate-400">Display, modes, and features</p>
                </div>
              </div>
              <button
                onClick={() => {
                  soundManager.playButtonTap();
                  setMobileMenuOpen(false);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Tiles Grid */}
            <div className="p-4 space-y-3 overflow-y-auto">
              {/* Display & Screen Controls */}
              <div className="grid grid-cols-2 gap-2">
                {/* 1-Click Screen Orientation Match */}
                <button
                  onClick={() => {
                    soundManager.playButtonTap();
                    onToggleRotate();
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-colors ${
                    isRotated
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5 mb-2 text-amber-400" />
                  <div>
                    <div className="font-bold text-xs">Screen Fit</div>
                    <div className="text-[10px] text-slate-400">
                      {isRotated ? 'Vertical Mode' : 'Horizontal Mode'}
                    </div>
                  </div>
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={() => {
                    soundManager.playButtonTap();
                    onToggleFullscreen();
                    setMobileMenuOpen(false);
                  }}
                  className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 text-left flex flex-col justify-between transition-colors"
                >
                  <Maximize className="w-5 h-5 mb-2 text-amber-300" />
                  <div>
                    <div className="font-bold text-xs text-amber-200">Full Screen Mode</div>
                    <div className="text-[10px] text-slate-300">
                      Show full board without menus
                    </div>
                  </div>
                </button>
              </div>

              {/* Gameplay Options */}
              <div className="grid grid-cols-2 gap-2">
                {/* Flip Board Perspective */}
                <button
                  onClick={() => {
                    soundManager.playButtonTap();
                    onToggleFlipPerspective();
                    setMobileMenuOpen(false);
                  }}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left flex flex-col justify-between transition-colors"
                >
                  <Repeat className="w-5 h-5 mb-2 text-indigo-400" />
                  <div>
                    <div className="font-bold text-xs text-white">Flip Board</div>
                    <div className="text-[10px] text-slate-400">Swap player viewpoint</div>
                  </div>
                </button>

                {/* Sound Toggle */}
                <button
                  onClick={() => {
                    onToggleSound();
                  }}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left flex flex-col justify-between transition-colors"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 mb-2 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-5 h-5 mb-2 text-red-400" />
                  )}
                  <div>
                    <div className="font-bold text-xs text-white">Sound Effects</div>
                    <div className="text-[10px] text-slate-400">
                      {soundEnabled ? 'Enabled' : 'Muted'}
                    </div>
                  </div>
                </button>

                {/* Coach Hint (if AI mode) */}
                {gameMode === 'ai' && (
                  <button
                    onClick={() => {
                      soundManager.playButtonTap();
                      onGetCoachHint();
                      setMobileMenuOpen(false);
                    }}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left flex flex-col justify-between transition-colors"
                  >
                    <Lightbulb className="w-5 h-5 mb-2 text-amber-400" />
                    <div>
                      <div className="font-bold text-xs text-white">Coach Move Hint</div>
                      <div className="text-[10px] text-slate-400">Grandmaster advice</div>
                    </div>
                  </button>
                )}

                {/* Propose Doubling Cube */}
                {(gameState.doublingOwner === 'center' || gameState.doublingOwner === gameState.currentTurn) && (
                  <button
                    onClick={() => {
                      soundManager.playDoubling();
                      onProposeDouble();
                      setMobileMenuOpen(false);
                    }}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left flex flex-col justify-between transition-colors"
                  >
                    <span className="text-lg font-black text-amber-400 mb-1">2×</span>
                    <div>
                      <div className="font-bold text-xs text-white">Double Stakes</div>
                      <div className="text-[10px] text-slate-400">Raise doubling cube</div>
                    </div>
                  </button>
                )}
              </div>

              {/* Navigation Tiles */}
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => {
                    soundManager.playButtonTap();
                    setMobileMenuOpen(false);
                    onOpenMatchmaking();
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <Globe className="w-4 h-4 text-sky-400" />
                    <span>Game Mode & Private Rooms</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">
                    {gameMode === 'online' ? 'Online' : gameMode === 'local' ? 'Local 2P' : 'VS AI'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playButtonTap();
                    setMobileMenuOpen(false);
                    onOpenThemes();
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <Palette className="w-4 h-4 text-purple-400" />
                    <span>Board Themes & Veneers</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">4 Themes</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playButtonTap();
                    setMobileMenuOpen(false);
                    onOpenLeaderboard();
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Competitive Leaderboard</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Top 10</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playButtonTap();
                    setMobileMenuOpen(false);
                    onOpenStats();
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    <span>Performance Statistics</span>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Dossier</span>
                </button>

                <button
                  onClick={() => {
                    soundManager.playButtonTap();
                    setMobileMenuOpen(false);
                    onOpenDailyRewards();
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <Gift className="w-4 h-4 text-pink-400" />
                    <span>7-Day Daily Rewards Vault</span>
                  </div>
                  {dailyRewardAvailable && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold text-[9px]">
                      Ready!
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    soundManager.playButtonTap();
                    setMobileMenuOpen(false);
                    onOpenShare();
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <Share2 className="w-4 h-4 text-sky-400" />
                    <span>Share Match & Invite Friends</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    soundManager.playButtonTap();
                    setMobileMenuOpen(false);
                    onOpenHowToPlay();
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-semibold"
                >
                  <div className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    <span>Rules & How to Play</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
