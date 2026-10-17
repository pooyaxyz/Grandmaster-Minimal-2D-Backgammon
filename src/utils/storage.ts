import { BoardTheme, BoardThemeId, LeaderboardEntry, PlayerProfile } from '../types/game';

const PROFILE_KEY = 'grandmaster_bg_profile_v1';
const LEADERBOARD_KEY = 'grandmaster_bg_leaderboard_v1';

export const BOARD_THEMES: Record<BoardThemeId, BoardTheme> = {
  walnut: {
    id: 'walnut',
    name: 'Imperial Walnut',
    description: 'Polished walnut & bird-eye maple inlay with brushed brass latches',
    frameWood: '#3b2214',
    feltBase: '#1a1412',
    pointLight: '#d4b483',
    pointDark: '#6b3e26',
    pointGoldTrim: '#e5c158',
    checkerWhite: '#fdfbf7',
    checkerBlack: '#221e1d',
    barColor: '#2a1a10',
    diceWhite: '#ffffff',
    diceBlack: '#181818',
    ambientLightColor: '#ffeedd',
  },
  emerald: {
    id: 'emerald',
    name: 'Royal Emerald & Gold',
    description: 'Bespoke green velvet felt with lustrous gold leaf points and malachite border',
    frameWood: '#14281d',
    feltBase: '#0c1a13',
    pointLight: '#e6c875',
    pointDark: '#1f4e38',
    pointGoldTrim: '#ffd700',
    checkerWhite: '#f5f5f0',
    checkerBlack: '#143324',
    barColor: '#0a1710',
    diceWhite: '#fffdf5',
    diceBlack: '#123824',
    ambientLightColor: '#e0ffe5',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Midnight Obsidian',
    description: 'Sleek carbon-fiber composite with luminous cybernetic accents',
    frameWood: '#121316',
    feltBase: '#090a0c',
    pointLight: '#00d2ff',
    pointDark: '#ff2a6d',
    pointGoldTrim: '#05d9e8',
    checkerWhite: '#e0f7fa',
    checkerBlack: '#1a1c23',
    barColor: '#0f1115',
    diceWhite: '#00f2fe',
    diceBlack: '#4facfe',
    ambientLightColor: '#d6e4ff',
  },
  azure: {
    id: 'azure',
    name: 'Mediterranean Azure',
    description: 'Sun-drenched Aegean sea tones with whitewashed oak frame',
    frameWood: '#4a5568',
    feltBase: '#102a43',
    pointLight: '#bcccdc',
    pointDark: '#2680c2',
    pointGoldTrim: '#f0b429',
    checkerWhite: '#f7fafc',
    checkerBlack: '#183b56',
    barColor: '#243b53',
    diceWhite: '#ffffff',
    diceBlack: '#0b69a3',
    ambientLightColor: '#ebf8ff',
  },
};

const DEFAULT_AVATARS = [
  '👑', '🦁', '🦅', '⚔️', '💎', '🐺', '🐉', '⚡', '🦉', '🎲'
];

export function getDefaultProfile(): PlayerProfile {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return {
    id: 'guest_' + Math.random().toString(36).substring(2, 9),
    nickname: `Master_${randomSuffix}`,
    avatar: '👑',
    title: 'Initiate Tactician',
    rating: 1250,
    tier: 'Silver',
    coins: 300,
    stats: {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      winStreak: 0,
      highestStreak: 0,
      gammons: 0,
      backgammons: 0,
      totalPipsCleared: 0,
      doublesAccepted: 0,
    },
    lastDailyRewardDate: null,
    dailyStreak: 0,
    preferredTheme: 'walnut',
    soundEnabled: true,
  };
}

export function loadPlayerProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...getDefaultProfile(), ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load player profile from storage', e);
  }
  const defaultProfile = getDefaultProfile();
  savePlayerProfile(defaultProfile);
  return defaultProfile;
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to save player profile', e);
  }
}

export function updatePlayerRatingAndStats(
  won: boolean,
  winType: 'normal' | 'gammon' | 'backgammon' | null,
  pipsCleared: number
): PlayerProfile {
  const profile = loadPlayerProfile();
  const eloDelta = won ? (winType === 'backgammon' ? 45 : winType === 'gammon' ? 35 : 25) : -18;
  const newRating = Math.max(800, profile.rating + eloDelta);

  let newTier: PlayerProfile['tier'] = 'Bronze';
  if (newRating >= 1800) newTier = 'Grandmaster';
  else if (newRating >= 1600) newTier = 'Diamond';
  else if (newRating >= 1450) newTier = 'Platinum';
  else if (newRating >= 1300) newTier = 'Gold';
  else if (newRating >= 1150) newTier = 'Silver';

  const newStreak = won ? profile.stats.winStreak + 1 : 0;
  const newHighestStreak = Math.max(profile.stats.highestStreak, newStreak);
  const earnedCoins = won ? (winType === 'backgammon' ? 150 : winType === 'gammon' ? 100 : 60) : 15;

  const updated: PlayerProfile = {
    ...profile,
    rating: newRating,
    tier: newTier,
    coins: profile.coins + earnedCoins,
    stats: {
      ...profile.stats,
      gamesPlayed: profile.stats.gamesPlayed + 1,
      wins: profile.stats.wins + (won ? 1 : 0),
      losses: profile.stats.losses + (won ? 0 : 1),
      winStreak: newStreak,
      highestStreak: newHighestStreak,
      gammons: profile.stats.gammons + (won && winType === 'gammon' ? 1 : 0),
      backgammons: profile.stats.backgammons + (won && winType === 'backgammon' ? 1 : 0),
      totalPipsCleared: profile.stats.totalPipsCleared + pipsCleared,
    },
  };

  savePlayerProfile(updated);
  return updated;
}

// Generate rich competitive global leaderboard seeded with realistic grandmasters
export function getLeaderboard(): LeaderboardEntry[] {
  const profile = loadPlayerProfile();
  const baseCompetitors: Omit<LeaderboardEntry, 'rank' | 'isCurrentPlayer'>[] = [
    { nickname: 'Magnus_Tavla', avatar: '🦁', rating: 2180, tier: 'Grandmaster', wins: 412, winRate: 74 },
    { nickname: 'CyprusKing', avatar: '🦅', rating: 2045, tier: 'Grandmaster', wins: 389, winRate: 71 },
    { nickname: 'Constantine_IX', avatar: '⚔️', rating: 1970, tier: 'Grandmaster', wins: 334, winRate: 69 },
    { nickname: 'SilkRoadMaster', avatar: '🐉', rating: 1890, tier: 'Diamond', wins: 295, winRate: 67 },
    { nickname: 'Atalanta_Dice', avatar: '⚡', rating: 1820, tier: 'Diamond', wins: 260, winRate: 65 },
    { nickname: 'Zeno_Pip', avatar: '🦉', rating: 1740, tier: 'Platinum', wins: 210, winRate: 63 },
    { nickname: 'PersianPrince', avatar: '💎', rating: 1680, tier: 'Platinum', wins: 185, winRate: 61 },
    { nickname: 'VikingRoller', avatar: '🐺', rating: 1540, tier: 'Gold', wins: 140, winRate: 58 },
    { nickname: 'AegeanNomad', avatar: '🎲', rating: 1420, tier: 'Gold', wins: 95, winRate: 54 },
    { nickname: 'SilverFox', avatar: '🦊', rating: 1290, tier: 'Silver', wins: 62, winRate: 51 },
  ];

  const playerWins = profile.stats.wins;
  const playerRate = profile.stats.gamesPlayed > 0 ? Math.round((playerWins / profile.stats.gamesPlayed) * 100) : 50;

  const all = [
    ...baseCompetitors,
    {
      nickname: `${profile.nickname} (You)`,
      avatar: profile.avatar,
      rating: profile.rating,
      tier: profile.tier,
      wins: playerWins,
      winRate: playerRate,
      isCurrentPlayer: true,
    },
  ];

  all.sort((a, b) => b.rating - a.rating);

  return all.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

// 7-day daily rewards configuration
export interface DailyRewardStep {
  day: number;
  coins: number;
  label: string;
}

export const DAILY_REWARDS: DailyRewardStep[] = [
  { day: 1, coins: 50, label: '50 Chips' },
  { day: 2, coins: 100, label: '100 Chips' },
  { day: 3, coins: 150, label: '150 Chips' },
  { day: 4, coins: 200, label: '200 Chips' },
  { day: 5, coins: 300, label: '300 Chips' },
  { day: 6, coins: 450, label: '450 Chips' },
  { day: 7, coins: 800, label: '800 Grand Jackpot' },
];

export function checkDailyRewardAvailable(profile: PlayerProfile): {
  available: boolean;
  nextDay: number;
  timeRemainingMs: number;
} {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (!profile.lastDailyRewardDate) {
    return { available: true, nextDay: 1, timeRemainingMs: 0 };
  }

  if (profile.lastDailyRewardDate === todayStr) {
    // Already claimed today; calculate time until midnight
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const msUntilTomorrow = tomorrow.getTime() - now.getTime();
    return {
      available: false,
      nextDay: (profile.dailyStreak % 7) + 1,
      timeRemainingMs: msUntilTomorrow,
    };
  }

  // Check if yesterday or older
  const lastDate = new Date(profile.lastDailyRewardDate);
  const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  let nextStreak = profile.dailyStreak + 1;
  if (diffDays > 2) {
    // Streak broken
    nextStreak = 1;
  }
  const dayIndex = ((nextStreak - 1) % 7) + 1;

  return {
    available: true,
    nextDay: dayIndex,
    timeRemainingMs: 0,
  };
}

export function claimDailyReward(): { success: boolean; coinsGranted: number; profile: PlayerProfile } {
  const profile = loadPlayerProfile();
  const status = checkDailyRewardAvailable(profile);

  if (!status.available) {
    return { success: false, coinsGranted: 0, profile };
  }

  const reward = DAILY_REWARDS.find((r) => r.day === status.nextDay) || DAILY_REWARDS[0];
  const nowStr = new Date().toISOString().split('T')[0];

  const updated: PlayerProfile = {
    ...profile,
    coins: profile.coins + reward.coins,
    lastDailyRewardDate: nowStr,
    dailyStreak: (profile.dailyStreak % 7) + 1,
  };

  savePlayerProfile(updated);
  return { success: true, coinsGranted: reward.coins, profile: updated };
}

export { DEFAULT_AVATARS };
