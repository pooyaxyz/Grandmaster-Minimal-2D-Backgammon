import { BoardState, CheckerMove, GameState, PlayerColor, AIDifficulty } from '../types/game';

// 1-indexed points (1..24), point 0 unused for cleaner indexing
export function createInitialBoard(): BoardState {
  const points = new Array(25).fill(0);

  // Standard Backgammon Starting Setup
  // Positive: White, Negative: Black
  points[24] = 2;   // 2 White on 24
  points[13] = 5;   // 5 White on 13
  points[8]  = 3;   // 3 White on 8
  points[6]  = 5;   // 5 White on 6

  points[1]  = -2;  // 2 Black on 1
  points[12] = -5;  // 5 Black on 12
  points[17] = -3;  // 3 Black on 17
  points[19] = -5;  // 5 Black on 19

  return {
    points,
    bar: { white: 0, black: 0 },
    off: { white: 0, black: 0 },
  };
}

export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentTurn: 'white',
    dice: [],
    diceAvailable: [],
    diceRolled: false,
    doublingValue: 1,
    doublingOwner: 'center',
    turnMoves: [],
    winner: null,
    winType: null,
    matchScore: { white: 0, black: 0, target: 5 },
    moveHistoryLog: ['Match started. Roll dice to begin!'],
  };
}

// Calculate pip counts for both players
export function calculatePipCounts(board: BoardState): { white: number; black: number } {
  let white = board.bar.white * 25;
  let black = board.bar.black * 25;

  for (let p = 1; p <= 24; p++) {
    const val = board.points[p];
    if (val > 0) {
      white += val * p; // Distance for White to bear off (points 1..6 are 1..6 pips away)
    } else if (val < 0) {
      black += Math.abs(val) * (25 - p); // Distance for Black to bear off (points 19..24 are 6..1 pips away)
    }
  }

  return { white, black };
}

// Check if all of a player's checkers are in their home board (eligible to bear off)
export function canBearOff(board: BoardState, player: PlayerColor): boolean {
  if (player === 'white') {
    if (board.bar.white > 0) return false;
    for (let p = 7; p <= 24; p++) {
      if (board.points[p] > 0) return false;
    }
    return true;
  } else {
    if (board.bar.black > 0) return false;
    for (let p = 1; p <= 18; p++) {
      if (board.points[p] < 0) return false;
    }
    return true;
  }
}

// Get all legal moves from a specific point (or 'bar') for the available dice
export function getValidMovesForPoint(
  board: BoardState,
  from: number | 'bar',
  player: PlayerColor,
  diceAvailable: number[]
): { to: number | 'off'; die: number; hit: boolean }[] {
  const moves: { to: number | 'off'; die: number; hit: boolean }[] = [];
  if (diceAvailable.length === 0) return moves;

  // If checkers are on the bar, player MUST move them first
  if (player === 'white' && board.bar.white > 0 && from !== 'bar') return moves;
  if (player === 'black' && board.bar.black > 0 && from !== 'bar') return moves;

  const uniqueDice = Array.from(new Set(diceAvailable));

  if (from === 'bar') {
    if (player === 'white' && board.bar.white > 0) {
      for (const die of uniqueDice) {
        const dest = 25 - die; // 24 down to 19
        const targetVal = board.points[dest];
        if (targetVal >= -1) {
          moves.push({
            to: dest,
            die,
            hit: targetVal === -1,
          });
        }
      }
    } else if (player === 'black' && board.bar.black > 0) {
      for (const die of uniqueDice) {
        const dest = die; // 1 up to 6
        const targetVal = board.points[dest];
        if (targetVal <= 1) {
          moves.push({
            to: dest,
            die,
            hit: targetVal === 1,
          });
        }
      }
    }
    return moves;
  }

  const p = from as number;
  const count = board.points[p];
  if (player === 'white' && count <= 0) return moves;
  if (player === 'black' && count >= 0) return moves;

  const bearingOffAllowed = canBearOff(board, player);

  if (player === 'white') {
    for (const die of uniqueDice) {
      const dest = p - die;
      if (dest >= 1) {
        const targetVal = board.points[dest];
        if (targetVal >= -1) {
          moves.push({ to: dest, die, hit: targetVal === -1 });
        }
      } else if (bearingOffAllowed) {
        // Bearing off
        if (dest === 0) {
          moves.push({ to: 'off', die, hit: false });
        } else if (dest < 0) {
          // Can only bear off with higher die if no checkers on higher points
          let hasHigher = false;
          for (let higher = p + 1; higher <= 6; higher++) {
            if (board.points[higher] > 0) {
              hasHigher = true;
              break;
            }
          }
          if (!hasHigher) {
            moves.push({ to: 'off', die, hit: false });
          }
        }
      }
    }
  } else {
    // Black moves forward (p + die)
    for (const die of uniqueDice) {
      const dest = p + die;
      if (dest <= 24) {
        const targetVal = board.points[dest];
        if (targetVal <= 1) {
          moves.push({ to: dest, die, hit: targetVal === 1 });
        }
      } else if (bearingOffAllowed) {
        // Bearing off (point 25 and beyond)
        if (dest === 25) {
          moves.push({ to: 'off', die, hit: false });
        } else if (dest > 25) {
          // Can only bear off with higher die if no checkers on lower points in home board (19 to p-1)
          let hasLower = false;
          for (let lower = 19; lower < p; lower++) {
            if (board.points[lower] < 0) {
              hasLower = true;
              break;
            }
          }
          if (!hasLower) {
            moves.push({ to: 'off', die, hit: false });
          }
        }
      }
    }
  }

  return moves;
}

// Find all points that currently have at least one legal move
export function getAllLegalMoves(
  board: BoardState,
  player: PlayerColor,
  diceAvailable: number[]
): { from: number | 'bar'; to: number | 'off'; die: number; hit: boolean }[] {
  const allMoves: { from: number | 'bar'; to: number | 'off'; die: number; hit: boolean }[] = [];

  // Check bar first
  if (player === 'white' && board.bar.white > 0) {
    const barMoves = getValidMovesForPoint(board, 'bar', player, diceAvailable);
    return barMoves.map((m) => ({ from: 'bar', ...m }));
  }
  if (player === 'black' && board.bar.black > 0) {
    const barMoves = getValidMovesForPoint(board, 'bar', player, diceAvailable);
    return barMoves.map((m) => ({ from: 'bar', ...m }));
  }

  for (let p = 1; p <= 24; p++) {
    const moves = getValidMovesForPoint(board, p, player, diceAvailable);
    for (const m of moves) {
      allMoves.push({ from: p, ...m });
    }
  }

  return allMoves;
}

// Clone board state
export function cloneBoard(board: BoardState): BoardState {
  return {
    points: [...board.points],
    bar: { ...board.bar },
    off: { ...board.off },
  };
}

// Apply a single checker move to the board
export function applyMove(
  board: BoardState,
  player: PlayerColor,
  move: { from: number | 'bar'; to: number | 'off'; dieUsed: number; hit: boolean }
): BoardState {
  const next = cloneBoard(board);

  // Decrement source
  if (move.from === 'bar') {
    if (player === 'white') next.bar.white--;
    else next.bar.black--;
  } else {
    if (player === 'white') next.points[move.from]--;
    else next.points[move.from]++;
  }

  // Increment destination
  if (move.to === 'off') {
    if (player === 'white') next.off.white++;
    else next.off.black++;
  } else {
    if (move.hit) {
      // Opponent blot sent to bar
      if (player === 'white') {
        next.points[move.to] = 1;
        next.bar.black++;
      } else {
        next.points[move.to] = -1;
        next.bar.white++;
      }
    } else {
      if (player === 'white') next.points[move.to]++;
      else next.points[move.to]--;
    }
  }

  return next;
}

// Undo the last checker move
export function undoLastMove(gameState: GameState): GameState {
  if (gameState.turnMoves.length === 0) return gameState;

  const moves = [...gameState.turnMoves];
  const lastMove = moves.pop()!;
  const player = gameState.currentTurn;

  const nextBoard = cloneBoard(gameState.board);

  // Reverse destination
  if (lastMove.to === 'off') {
    if (player === 'white') nextBoard.off.white--;
    else nextBoard.off.black--;
  } else {
    if (lastMove.hit) {
      // Restore opponent blot
      if (player === 'white') {
        nextBoard.points[lastMove.to] = -1;
        nextBoard.bar.black--;
      } else {
        nextBoard.points[lastMove.to] = 1;
        nextBoard.bar.white--;
      }
    } else {
      if (player === 'white') nextBoard.points[lastMove.to]--;
      else nextBoard.points[lastMove.to]++;
    }
  }

  // Restore source
  if (lastMove.from === 'bar') {
    if (player === 'white') nextBoard.bar.white++;
    else nextBoard.bar.black++;
  } else {
    if (player === 'white') nextBoard.points[lastMove.from]++;
    else nextBoard.points[lastMove.from]--;
  }

  // Restore die
  const nextDiceAvailable = [...gameState.diceAvailable, lastMove.dieUsed].sort((a, b) => b - a);

  return {
    ...gameState,
    board: nextBoard,
    diceAvailable: nextDiceAvailable,
    turnMoves: moves,
  };
}

// Check for game victory
export function checkWinner(board: BoardState): { winner: PlayerColor; winType: 'normal' | 'gammon' | 'backgammon' } | null {
  if (board.off.white === 15) {
    if (board.off.black === 0) {
      // Check for backgammon (checker on bar or in White's home board: 1..6)
      let inHome = false;
      for (let p = 1; p <= 6; p++) {
        if (board.points[p] < 0) {
          inHome = true;
          break;
        }
      }
      if (board.bar.black > 0 || inHome) {
        return { winner: 'white', winType: 'backgammon' };
      }
      return { winner: 'white', winType: 'gammon' };
    }
    return { winner: 'white', winType: 'normal' };
  }

  if (board.off.black === 15) {
    if (board.off.white === 0) {
      // Check for backgammon (checker on bar or in Black's home board: 19..24)
      let inHome = false;
      for (let p = 19; p <= 24; p++) {
        if (board.points[p] > 0) {
          inHome = true;
          break;
        }
      }
      if (board.bar.white > 0 || inHome) {
        return { winner: 'black', winType: 'backgammon' };
      }
      return { winner: 'black', winType: 'gammon' };
    }
    return { winner: 'black', winType: 'normal' };
  }

  return null;
}

// Roll two dice (1-6)
export function rollDice(): number[] {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  return [d1, d2];
}

// Expand roll into available moves (handles doubles as 4 moves)
export function getAvailableDiceFromRoll(dice: number[]): number[] {
  if (dice.length < 2) return [...dice];
  if (dice[0] === dice[1]) {
    return [dice[0], dice[0], dice[0], dice[0]];
  }
  return [dice[0], dice[1]];
}

// AI Engine Heuristic Evaluation
function evaluateBoardForBlack(board: BoardState, difficulty: AIDifficulty): number {
  let score = 0;

  // 1. Checkers borne off (highest value)
  score += board.off.black * 120;
  score -= board.off.white * 120;

  // 2. Pip count advantage
  const pips = calculatePipCounts(board);
  score += (pips.white - pips.black) * 1.5;

  // 3. Checkers on the bar penalty
  score -= board.bar.black * 70;
  score += board.bar.white * 70;

  // 4. Points & Primes
  let blackConsecutivePoints = 0;
  let maxBlackPrime = 0;

  for (let p = 1; p <= 24; p++) {
    const val = board.points[p];

    // Single checker (blot) vulnerability
    if (val === -1) {
      // Check distance to White checkers behind it (points 1 to p-1)
      let threatLevel = 0;
      for (let w = Math.max(1, p - 6); w < p; w++) {
        if (board.points[w] > 0) threatLevel++;
      }
      score -= 25 + threatLevel * 10;
    }

    if (val === 1) {
      // White blot: reward potential hits
      score += 20;
    }

    // Secured anchor / point (2+ checkers)
    if (val <= -2) {
      score += 15;
      // Bonus for holding home board points (19..24)
      if (p >= 19) score += 12;
      blackConsecutivePoints++;
      if (blackConsecutivePoints > maxBlackPrime) {
        maxBlackPrime = blackConsecutivePoints;
      }
    } else {
      blackConsecutivePoints = 0;
    }
  }

  // Prime blockade reward (3, 4, 5, 6 point primes)
  if (maxBlackPrime >= 3) {
    score += maxBlackPrime * 20;
  }

  // Escaping back checkers from point 1..6
  for (let p = 1; p <= 6; p++) {
    if (board.points[p] < 0) {
      score -= Math.abs(board.points[p]) * 10; // Encourage moving them forward
    }
  }

  // Add subtle randomness for Casual level
  if (difficulty === 'casual') {
    score += (Math.random() - 0.5) * 50;
  } else if (difficulty === 'skilled') {
    score += (Math.random() - 0.5) * 15;
  }

  return score;
}

// Find best sequence of moves for AI (Black)
export function getAIMoveSequence(
  board: BoardState,
  diceAvailable: number[],
  difficulty: AIDifficulty
): CheckerMove[] {
  if (diceAvailable.length === 0) return [];

  // Generate complete move sequences recursively
  interface MoveNode {
    board: BoardState;
    remainingDice: number[];
    moves: CheckerMove[];
  }

  let frontier: MoveNode[] = [{
    board: cloneBoard(board),
    remainingDice: [...diceAvailable],
    moves: [],
  }];

  const completedSequences: MoveNode[] = [];

  // Expand moves step by step
  while (frontier.length > 0) {
    const nextFrontier: MoveNode[] = [];

    for (const node of frontier) {
      if (node.remainingDice.length === 0) {
        completedSequences.push(node);
        continue;
      }

      const legalMoves = getAllLegalMoves(node.board, 'black', node.remainingDice);

      if (legalMoves.length === 0) {
        // No further legal moves possible with remaining dice
        completedSequences.push(node);
        continue;
      }

      // Branch on legal moves
      for (const m of legalMoves) {
        const nextBoard = applyMove(node.board, 'black', {
          from: m.from,
          to: m.to,
          dieUsed: m.die,
          hit: m.hit,
        });

        const nextDice = [...node.remainingDice];
        const idx = nextDice.indexOf(m.die);
        if (idx !== -1) nextDice.splice(idx, 1);

        nextFrontier.push({
          board: nextBoard,
          remainingDice: nextDice,
          moves: [
            ...node.moves,
            { from: m.from, to: m.to, dieUsed: m.die, hit: m.hit },
          ],
        });
      }
    }

    // Limit tree branching for performance
    if (nextFrontier.length > 80) {
      // Sort and take top 50
      nextFrontier.sort((a, b) => evaluateBoardForBlack(b.board, difficulty) - evaluateBoardForBlack(a.board, difficulty));
      frontier = nextFrontier.slice(0, 50);
    } else {
      frontier = nextFrontier;
    }
  }

  if (completedSequences.length === 0) return [];

  // Backgammon rule: A player must use as many dice as possible!
  const maxDiceUsed = Math.max(...completedSequences.map((s) => s.moves.length));
  const validLengthSequences = completedSequences.filter((s) => s.moves.length === maxDiceUsed);

  // Find best scoring sequence
  let bestScore = -Infinity;
  let bestSequence: CheckerMove[] = [];

  for (const seq of validLengthSequences) {
    const score = evaluateBoardForBlack(seq.board, difficulty);
    if (score > bestScore) {
      bestScore = score;
      bestSequence = seq.moves;
    }
  }

  return bestSequence;
}

// Generate Coach Hint for current human player
export function getCoachHint(gameState: GameState): CheckerMove | null {
  if (gameState.diceAvailable.length === 0) return null;
  const legalMoves = getAllLegalMoves(gameState.board, gameState.currentTurn, gameState.diceAvailable);
  if (legalMoves.length === 0) return null;

  // Prefer bearing off, then hitting blot, then making anchor
  for (const m of legalMoves) {
    if (m.to === 'off') return { from: m.from, to: m.to, dieUsed: m.die, hit: m.hit };
  }
  for (const m of legalMoves) {
    if (m.hit) return { from: m.from, to: m.to, dieUsed: m.die, hit: m.hit };
  }
  // Standard first legal move
  const first = legalMoves[0];
  return { from: first.from, to: first.to, dieUsed: first.die, hit: first.hit };
}
