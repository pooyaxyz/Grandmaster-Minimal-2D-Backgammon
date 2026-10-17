import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  AIDifficulty,
  BoardThemeId,
  ChatMessage,
  GameMode,
  GameState,
  PlayerColor,
  PlayerProfile,
} from './types/game';
import {
  applyMove,
  calculatePipCounts,
  canBearOff,
  checkWinner,
  createInitialGameState,
  getAIMoveSequence,
  getAllLegalMoves,
  getAvailableDiceFromRoll,
  getCoachHint,
  getValidMovesForPoint,
  rollDice,
  undoLastMove,
} from './utils/backgammonLogic';
import {
  BOARD_THEMES,
  checkDailyRewardAvailable,
  loadPlayerProfile,
  savePlayerProfile,
  updatePlayerRatingAndStats,
} from './utils/storage';
import { soundManager } from './utils/audio';
import { GameAlert, notificationService } from './utils/notifications';
import { multiplayerService } from './services/multiplayer';
import { TwoDBackgammonBoard } from './components/TwoDBackgammonBoard';
import { GameHUD } from './components/GameHUD';
import { ChatModal } from './components/ChatModal';
import { MatchmakingModal } from './components/MatchmakingModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { StatsModal } from './components/StatsModal';
import { DailyRewardsModal } from './components/DailyRewardsModal';
import { ThemesModal } from './components/ThemesModal';
import { ShareModal } from './components/ShareModal';
import { HowToPlayModal } from './components/HowToPlayModal';

export default function App() {
  // Player Profile & Preferences
  const [profile, setProfile] = useState<PlayerProfile>(() => loadPlayerProfile());
  const [currentThemeId, setCurrentThemeId] = useState<BoardThemeId>(profile.preferredTheme || 'walnut');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(profile.soundEnabled ?? true);

  // Game Mode & Difficulty
  const [gameMode, setGameMode] = useState<GameMode>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('skilled');
  const [activeRoomCode, setActiveRoomCode] = useState<string | undefined>(undefined);
  const [isQueueingMatch, setIsQueueingMatch] = useState(false);

  // Active Game State
  const [gameState, setGameState] = useState<GameState>(() => createInitialGameState());
  const [selectedPoint, setSelectedPoint] = useState<number | 'bar' | null>(null);
  const [validDestinations, setValidDestinations] = useState<number[]>([]);
  const [canBearOffSelected, setCanBearOffSelected] = useState<boolean>(false);
  const [isRollingDice, setIsRollingDice] = useState(false);

  // View, Fullscreen & Orientation Settings
  const [flippedPerspective, setFlippedPerspective] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRotated, setIsRotated] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight > window.innerWidth * 1.15;
    }
    return false;
  });

  // Track browser fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleToggleRotate = () => {
    setIsRotated((prev) => !prev);
  };

  // Modals & Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [activeAlerts, setActiveAlerts] = useState<GameAlert[]>([]);

  const [matchmakingModalOpen, setMatchmakingModalOpen] = useState(false);
  const [leaderboardModalOpen, setLeaderboardModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [dailyRewardsModalOpen, setDailyRewardsModalOpen] = useState(false);
  const [themesModalOpen, setThemesModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [howToPlayModalOpen, setHowToPlayModalOpen] = useState(false);

  const theme = BOARD_THEMES[currentThemeId] || BOARD_THEMES.walnut;
  const isAITurnRef = useRef(false);

  // Sync sound manager with soundEnabled state
  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Listen for push notifications & in-app alerts
  useEffect(() => {
    notificationService.requestPushPermission();

    // Check if daily reward is ready
    const status = checkDailyRewardAvailable(profile);
    if (status.available) {
      setTimeout(() => {
        notificationService.notifyDailyRewardReady();
      }, 1500);
    }

    const unsubscribe = notificationService.onAlert((alert) => {
      setActiveAlerts((prev) => [...prev, alert]);
      setTimeout(() => {
        setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      }, 6000);
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to multiplayer synchronization
  useEffect(() => {
    const unsub = multiplayerService.subscribe((room) => {
      if (room.gameState) {
        setGameState(room.gameState);
      }
      setChatMessages(room.chatMessages || []);
      if (!chatOpen && room.chatMessages.length > 0) {
        const lastMsg = room.chatMessages[room.chatMessages.length - 1];
        if (lastMsg.sender !== profile.nickname) {
          setUnreadChatCount((c) => c + 1);
        }
      }
    });

    return () => unsub();
  }, [chatOpen, profile.nickname]);

  // Handle Roll Dice
  const handleRollDice = useCallback(() => {
    if (gameState.diceRolled || gameState.winner) return;

    setIsRollingDice(true);
    soundManager.playDiceRoll();

    setTimeout(() => {
      const dice = rollDice();
      const diceAvailable = getAvailableDiceFromRoll(dice);

      // Check if player has any legal moves
      const legalMoves = getAllLegalMoves(gameState.board, gameState.currentTurn, diceAvailable);

      setGameState((prev) => {
        const nextState: GameState = {
          ...prev,
          dice,
          diceAvailable,
          diceRolled: true,
          turnMoves: [],
        };

        if (legalMoves.length === 0) {
          // No legal moves available! Pass turn
          setTimeout(() => {
            notificationService.triggerAlert({
              title: 'Turn Passed',
              body: `No legal moves possible for ${prev.currentTurn.toUpperCase()} with ${dice[0]}-${dice[1]}. Turn passed!`,
              type: 'turn',
            });
            handleEndTurn(nextState);
          }, 1400);
        }

        return nextState;
      });

      setIsRollingDice(false);
    }, 550);
  }, [gameState]);

  // Handle selecting a point / checker
  const handleSelectPoint = (point: number | 'bar') => {
    if (gameState.winner || !gameState.diceRolled) return;

    // Check player permissions
    if (gameMode === 'ai' && gameState.currentTurn === 'black') return;
    if (gameMode === 'online' && activeRoomCode) {
      const room = multiplayerService.getCurrentRoom();
      if (room) {
        const myColor = room.hostName === profile.nickname ? 'white' : 'black';
        if (gameState.currentTurn !== myColor) return;
      }
    }

    // If point is already selected, deselect
    if (selectedPoint === point) {
      setSelectedPoint(null);
      setValidDestinations([]);
      setCanBearOffSelected(false);
      return;
    }

    // Get legal moves from this point
    const moves = getValidMovesForPoint(gameState.board, point, gameState.currentTurn, gameState.diceAvailable);

    if (moves.length === 0) {
      setSelectedPoint(null);
      setValidDestinations([]);
      setCanBearOffSelected(false);
      return;
    }

    soundManager.playButtonTap();
    setSelectedPoint(point);
    const destPoints = moves.filter((m) => typeof m.to === 'number').map((m) => m.to as number);
    const hasBearOff = moves.some((m) => m.to === 'off');
    setValidDestinations(destPoints);
    setCanBearOffSelected(hasBearOff);
  };

  // Handle moving selected checker to destination
  const handleMoveToDestination = (dest: number | 'off') => {
    if (selectedPoint === null || !gameState.diceRolled || gameState.winner) return;

    const moves = getValidMovesForPoint(
      gameState.board,
      selectedPoint,
      gameState.currentTurn,
      gameState.diceAvailable
    );
    const matchedMove = moves.find((m) => m.to === dest);

    if (!matchedMove) return;

    // Execute Move
    if (dest === 'off') {
      soundManager.playBearOff();
    } else if (matchedMove.hit) {
      soundManager.playBlotHit();
    } else {
      soundManager.playCheckerClick();
    }

    const nextBoard = applyMove(gameState.board, gameState.currentTurn, {
      from: selectedPoint,
      to: dest,
      dieUsed: matchedMove.die,
      hit: matchedMove.hit,
    });

    const nextDiceAvailable = [...gameState.diceAvailable];
    const dieIndex = nextDiceAvailable.indexOf(matchedMove.die);
    if (dieIndex !== -1) nextDiceAvailable.splice(dieIndex, 1);

    const nextTurnMoves = [
      ...gameState.turnMoves,
      {
        from: selectedPoint,
        to: dest,
        dieUsed: matchedMove.die,
        hit: matchedMove.hit,
      },
    ];

    // Check winner
    const winResult = checkWinner(nextBoard);

    const updatedGameState: GameState = {
      ...gameState,
      board: nextBoard,
      diceAvailable: nextDiceAvailable,
      turnMoves: nextTurnMoves,
      winner: winResult ? winResult.winner : null,
      winType: winResult ? winResult.winType : null,
    };

    setGameState(updatedGameState);
    setSelectedPoint(null);
    setValidDestinations([]);
    setCanBearOffSelected(false);

    if (winResult) {
      handleMatchVictory(winResult.winner, winResult.winType);
      return;
    }

    // Auto-advance if no more dice available or no legal moves
    if (nextDiceAvailable.length === 0) {
      setTimeout(() => {
        handleEndTurn(updatedGameState);
      }, 350);
    } else {
      const remainingMoves = getAllLegalMoves(nextBoard, gameState.currentTurn, nextDiceAvailable);
      if (remainingMoves.length === 0) {
        setTimeout(() => {
          notificationService.triggerAlert({
            title: 'Turn Complete',
            body: 'No further legal moves possible with remaining dice. Passing turn!',
            type: 'turn',
          });
          handleEndTurn(updatedGameState);
        }, 600);
      }
    }
  };

  // Undo Move
  const handleUndoMove = () => {
    if (gameState.turnMoves.length === 0 || gameState.winner) return;
    const reverted = undoLastMove(gameState);
    setGameState(reverted);
    setSelectedPoint(null);
    setValidDestinations([]);
    setCanBearOffSelected(false);
  };

  // End Turn
  const handleEndTurn = (overrideState?: GameState) => {
    const state = overrideState || gameState;
    const nextPlayer: PlayerColor = state.currentTurn === 'white' ? 'black' : 'white';

    const nextState: GameState = {
      ...state,
      currentTurn: nextPlayer,
      dice: [],
      diceAvailable: [],
      diceRolled: false,
      turnMoves: [],
    };

    setGameState(nextState);
    setSelectedPoint(null);
    setValidDestinations([]);
    setCanBearOffSelected(false);

    // Sync online room if active
    if (gameMode === 'online' && activeRoomCode) {
      multiplayerService.sendGameState(nextState);
    }
  };

  // Handle Match Victory
  const handleMatchVictory = (winner: PlayerColor, winType: 'normal' | 'gammon' | 'backgammon') => {
    soundManager.playVictory();
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
    });

    const isHumanWin = winner === 'white';
    const updatedProfile = updatePlayerRatingAndStats(isHumanWin, winType, 15);
    setProfile(updatedProfile);

    notificationService.triggerAlert({
      title: isHumanWin ? '🏆 Victory!' : 'Match Completed',
      body: isHumanWin
        ? `Incredible game! You achieved a ${winType} victory! Rating updated to ${updatedProfile.rating} Elo.`
        : 'Good effort! Practice makes a grandmaster. Rematch anytime!',
      type: 'achievement',
    });
  };

  // Doubling Cube
  const handleProposeDouble = () => {
    soundManager.playDoubling();
    const nextVal = gameState.doublingValue * 2;
    setGameState((prev) => ({
      ...prev,
      doublingValue: nextVal,
      doublingOwner: prev.currentTurn === 'white' ? 'black' : 'white',
    }));
    notificationService.triggerAlert({
      title: '⚡ Stakes Doubled!',
      body: `Match stakes increased to ${nextVal}×!`,
      type: 'achievement',
    });
  };

  // Coach Hint
  const handleGetCoachHint = () => {
    const hint = getCoachHint(gameState);
    if (!hint) {
      notificationService.triggerAlert({
        title: 'Coach Insight',
        body: 'Roll your dice first to see the tactical opportunities!',
        type: 'achievement',
      });
      return;
    }

    const fromLabel = hint.from === 'bar' ? 'the Bar' : `Point ${hint.from}`;
    const toLabel = hint.to === 'off' ? 'Bear-off Tray' : `Point ${hint.to}`;
    notificationService.triggerAlert({
      title: '💡 Grandmaster Coach Hint',
      body: `Recommended: Move checker from ${fromLabel} to ${toLabel} using die [${hint.dieUsed}]${
        hint.hit ? ' (Captures opponent blot!)' : ''
      }`,
      type: 'achievement',
    });

    // Auto-highlight recommended point
    handleSelectPoint(hint.from);
  };

  // AI Turn Execution Loop
  useEffect(() => {
    if (gameMode !== 'ai' || gameState.winner || gameState.currentTurn !== 'black') {
      isAITurnRef.current = false;
      return;
    }

    if (isAITurnRef.current) return;
    isAITurnRef.current = true;

    const runAITurn = async () => {
      // 1. Brief pause then roll dice
      await new Promise((r) => setTimeout(r, 800));
      if (gameState.currentTurn !== 'black' || gameState.winner) {
        isAITurnRef.current = false;
        return;
      }

      const dice = rollDice();
      const diceAvailable = getAvailableDiceFromRoll(dice);
      soundManager.playDiceRoll();

      setGameState((prev) => ({
        ...prev,
        dice,
        diceAvailable,
        diceRolled: true,
        turnMoves: [],
      }));

      // 2. Compute AI move sequence
      await new Promise((r) => setTimeout(r, 700));
      let currentBoard = gameState.board;
      let remainingDice = [...diceAvailable];

      const movesToMake = getAIMoveSequence(currentBoard, remainingDice, aiDifficulty);

      if (movesToMake.length === 0) {
        notificationService.triggerAlert({
          title: 'AI Turn Passed',
          body: `AI (Black) has no legal moves with roll ${dice[0]}-${dice[1]}. Turn passed!`,
          type: 'turn',
        });
        await new Promise((r) => setTimeout(r, 1000));
        handleEndTurn({
          ...gameState,
          dice,
          diceAvailable: [],
          diceRolled: true,
          turnMoves: [],
        });
        isAITurnRef.current = false;
        return;
      }

      // 3. Play each AI move sequentially with visual animation delay
      for (const move of movesToMake) {
        await new Promise((r) => setTimeout(r, 650));
        currentBoard = applyMove(currentBoard, 'black', {
          from: move.from,
          to: move.to,
          dieUsed: move.dieUsed,
          hit: move.hit,
        });

        if (move.to === 'off') {
          soundManager.playBearOff();
        } else if (move.hit) {
          soundManager.playBlotHit();
        } else {
          soundManager.playCheckerClick();
        }

        const idx = remainingDice.indexOf(move.dieUsed);
        if (idx !== -1) remainingDice.splice(idx, 1);

        setGameState((prev) => ({
          ...prev,
          board: currentBoard,
          diceAvailable: [...remainingDice],
        }));

        const winResult = checkWinner(currentBoard);
        if (winResult) {
          handleMatchVictory(winResult.winner, winResult.winType);
          isAITurnRef.current = false;
          return;
        }
      }

      // Turn finished
      await new Promise((r) => setTimeout(r, 600));
      handleEndTurn({
        ...gameState,
        board: currentBoard,
        diceAvailable: [],
        diceRolled: true,
      });
      isAITurnRef.current = false;
    };

    runAITurn();
  }, [gameState.currentTurn, gameState.diceRolled, gameMode, gameState.winner, aiDifficulty]);

  // Online Matchmaking & Private Rooms
  const handleStartQuickMatchmaking = async () => {
    setIsQueueingMatch(true);
    soundManager.playButtonTap();

    setTimeout(async () => {
      try {
        const res = await fetch('/api/matchmaking/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: profile.id,
            name: profile.nickname,
            avatar: profile.avatar,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.matched) {
            setActiveRoomCode(data.roomId);
            setGameMode('online');
            setMatchmakingModalOpen(false);
            setIsQueueingMatch(false);
            notificationService.triggerAlert({
              title: '⚔️ Match Found!',
              body: `Matched against ${data.opponentName}! Let the game begin.`,
              type: 'invite',
            });
            return;
          }
        }
      } catch {
        // Fallback
      }

      // Simulated active opponent pairing fallback
      const simulatedOpponent = 'Grandmaster Darius';
      const roomId = 'MATCH-' + Math.floor(1000 + Math.random() * 9000);
      setActiveRoomCode(roomId);
      setGameMode('online');
      setIsQueueingMatch(false);
      setMatchmakingModalOpen(false);

      notificationService.triggerAlert({
        title: '⚔️ Opponent Challenged!',
        body: `Matched against ${simulatedOpponent} in arena room ${roomId}!`,
        type: 'invite',
      });
    }, 1500);
  };

  const handleCreateOnlineRoom = async () => {
    const code = await multiplayerService.createRoom(profile.nickname, profile.avatar);
    setActiveRoomCode(code);
    setGameMode('online');
  };

  const handleJoinOnlineRoom = async (code: string) => {
    const ok = await multiplayerService.joinRoom(code, profile.nickname, profile.avatar);
    if (ok) {
      setActiveRoomCode(code);
      setGameMode('online');
      notificationService.triggerAlert({
        title: 'Room Joined',
        body: `Successfully entered room ${code}!`,
        type: 'invite',
      });
    }
  };

  const handleSelectAIMode = (diff: AIDifficulty) => {
    setAiDifficulty(diff);
    setGameMode('ai');
    setActiveRoomCode(undefined);
    setGameState(createInitialGameState());
    notificationService.triggerAlert({
      title: 'AI Practice Started',
      body: `Practice match initiated on ${diff.toUpperCase()} difficulty.`,
      type: 'achievement',
    });
  };

  const handleSelectLocalMode = () => {
    setGameMode('local');
    setActiveRoomCode(undefined);
    setGameState(createInitialGameState());
    notificationService.triggerAlert({
      title: '2-Player Local Mode',
      body: 'Pass & play active on this device. Use "Flip View" to swap player perspective!',
      type: 'achievement',
    });
  };

  const handleSendChatMessage = (text: string, isQuickEmote?: boolean) => {
    multiplayerService.sendChatMessage(
      profile.nickname,
      text,
      gameState.currentTurn,
      isQuickEmote
    );
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    soundManager.setEnabled(nextVal);
    const updated = { ...profile, soundEnabled: nextVal };
    savePlayerProfile(updated);
    setProfile(updated);
  };

  const handleSelectTheme = (id: BoardThemeId) => {
    setCurrentThemeId(id);
    const updated = { ...profile, preferredTheme: id };
    savePlayerProfile(updated);
    setProfile(updated);
  };

  const dailyRewardStatus = checkDailyRewardAvailable(profile);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090b10] flex flex-col items-center justify-center font-sans">
      {/* Responsive 2D Minimal Backgammon Board */}
      <TwoDBackgammonBoard
        gameState={gameState}
        theme={theme}
        selectedPoint={selectedPoint}
        validDestinations={validDestinations}
        canBearOffSelected={canBearOffSelected}
        onSelectPoint={handleSelectPoint}
        onMoveToDestination={handleMoveToDestination}
        onRollDice={handleRollDice}
        isRollingDice={isRollingDice}
        flippedPerspective={flippedPerspective}
        isRotated={isRotated}
        isFullscreen={isFullscreen}
      />

      {/* Floating HUD & Bottom Dock Controls */}
      <GameHUD
        gameState={gameState}
        gameMode={gameMode}
        profile={profile}
        flippedPerspective={flippedPerspective}
        isRolling={isRollingDice}
        soundEnabled={soundEnabled}
        unreadChatCount={unreadChatCount}
        isFullscreen={isFullscreen}
        isRotated={isRotated}
        onRollDice={handleRollDice}
        onUndoMove={handleUndoMove}
        onEndTurn={() => handleEndTurn()}
        onProposeDouble={handleProposeDouble}
        onToggleFlipPerspective={() => setFlippedPerspective((p) => !p)}
        onToggleSound={handleToggleSound}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleRotate={handleToggleRotate}
        onGetCoachHint={handleGetCoachHint}
        onOpenChat={() => {
          setChatOpen(true);
          setUnreadChatCount(0);
        }}
        onOpenMatchmaking={() => setMatchmakingModalOpen(true)}
        onOpenLeaderboard={() => setLeaderboardModalOpen(true)}
        onOpenStats={() => setStatsModalOpen(true)}
        onOpenDailyRewards={() => setDailyRewardsModalOpen(true)}
        onOpenThemes={() => setThemesModalOpen(true)}
        onOpenShare={() => setShareModalOpen(true)}
        onOpenHowToPlay={() => setHowToPlayModalOpen(true)}
        dailyRewardAvailable={dailyRewardStatus.available}
      />

      {/* In-App Toast Alert Notifications */}
      <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {activeAlerts.map((alert) => (
          <div
            key={alert.id}
            className="pointer-events-auto bg-[#161b28]/95 border border-amber-500/40 rounded-2xl p-3.5 shadow-2xl text-white flex items-start gap-3 animate-slide-in"
          >
            <div className="text-xl">
              {alert.type === 'reward' ? '🎁' : alert.type === 'invite' ? '⚔️' : alert.type === 'turn' ? '🎲' : '✨'}
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-xs text-amber-200">{alert.title}</h5>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{alert.body}</p>
              {alert.actionText && (
                <button
                  onClick={() => {
                    if (alert.onAction) alert.onAction();
                    else setDailyRewardsModalOpen(true);
                  }}
                  className="mt-2 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg transition-transform active:scale-95"
                >
                  {alert.actionText}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Modals */}
      <ChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        currentUserName={profile.nickname}
        currentUserColor={gameState.currentTurn}
        onSendMessage={handleSendChatMessage}
      />

      <MatchmakingModal
        isOpen={matchmakingModalOpen}
        onClose={() => setMatchmakingModalOpen(false)}
        currentMode={gameMode}
        aiDifficulty={aiDifficulty}
        profile={profile}
        onUpdateProfile={setProfile}
        onSelectAIMode={handleSelectAIMode}
        onSelectLocalMode={handleSelectLocalMode}
        onCreateOnlineRoom={handleCreateOnlineRoom}
        onJoinOnlineRoom={handleJoinOnlineRoom}
        onStartQuickMatchmaking={handleStartQuickMatchmaking}
        isQueueing={isQueueingMatch}
        activeRoomCode={activeRoomCode}
      />

      <LeaderboardModal
        isOpen={leaderboardModalOpen}
        onClose={() => setLeaderboardModalOpen(false)}
      />

      <StatsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        profile={profile}
      />

      <DailyRewardsModal
        isOpen={dailyRewardsModalOpen}
        onClose={() => setDailyRewardsModalOpen(false)}
        profile={profile}
        onClaimSuccess={(updated) => setProfile(updated)}
      />

      <ThemesModal
        isOpen={themesModalOpen}
        onClose={() => setThemesModalOpen(false)}
        currentThemeId={currentThemeId}
        onSelectTheme={handleSelectTheme}
      />

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        profile={profile}
        gameState={gameState}
        activeRoomCode={activeRoomCode}
      />

      <HowToPlayModal
        isOpen={howToPlayModalOpen}
        onClose={() => setHowToPlayModalOpen(false)}
      />
    </div>
  );
}
