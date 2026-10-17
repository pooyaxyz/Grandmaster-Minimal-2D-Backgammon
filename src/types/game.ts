export type PlayerColor = 'white' | 'black';

export type GameMode = 'ai' | 'local' | 'online';

export type AIDifficulty = 'casual' | 'skilled' | 'grandmaster';

export type BoardThemeId = 'walnut' | 'emerald' | 'obsidian' | 'azure';

export interface BoardTheme {
  id: BoardThemeId;
  name: string;
  description: string;
  frameWood: string;
  feltBase: string;
  pointLight: string;
  pointDark: string;
  pointGoldTrim: string;
  checkerWhite: string;
  checkerBlack: string;
  barColor: string;
  diceWhite: string;
  diceBlack: string;
  ambientLightColor: string;
}

export interface CheckerMove {
  from: number | 'bar'; // 1-24 or 'bar'
  to: number | 'off';   // 1-24 or 'off'
  dieUsed: number;
  hit: boolean;
}

export interface BoardState {
  // 1-based index 1..24
  // Positive number = White checkers, Negative number = Black checkers, 0 = empty
  points: number[];
  bar: {
    white: number;
    black: number;
  };
  off: {
    white: number;
    black: number;
  };
}

export interface GameState {
  board: BoardState;
  currentTurn: PlayerColor;
  dice: number[];
  diceAvailable: number[]; // remaining dice values that can be used this turn
  diceRolled: boolean;
  doublingValue: number;
  doublingOwner: PlayerColor | 'center';
  turnMoves: CheckerMove[]; // Moves made in current turn (for undo)
  winner: PlayerColor | null;
  winType: 'normal' | 'gammon' | 'backgammon' | null;
  matchScore: {
    white: number;
    black: number;
    target: number;
  };
  moveHistoryLog: string[];
}

export interface PlayerProfile {
  id: string;
  nickname: string;
  avatar: string;
  title: string;
  rating: number; // Elo
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Grandmaster';
  coins: number;
  stats: PlayerStats;
  lastDailyRewardDate: string | null;
  dailyStreak: number;
  preferredTheme: BoardThemeId;
  soundEnabled: boolean;
}

export interface PlayerStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  winStreak: number;
  highestStreak: number;
  gammons: number;
  backgammons: number;
  totalPipsCleared: number;
  doublesAccepted: number;
}

export interface LeaderboardEntry {
  rank: number;
  nickname: string;
  avatar: string;
  rating: number;
  tier: string;
  wins: number;
  winRate: number;
  isCurrentPlayer?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderColor?: PlayerColor;
  text: string;
  timestamp: number;
  isQuickEmote?: boolean;
}

export interface OnlineRoom {
  roomId: string;
  hostName: string;
  hostAvatar: string;
  guestName?: string;
  guestAvatar?: string;
  hostColor: PlayerColor;
  status: 'waiting' | 'playing' | 'completed';
  gameState: GameState;
  lastUpdated: number;
  chatMessages: ChatMessage[];
}
