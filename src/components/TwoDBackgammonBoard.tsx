import React, { useEffect, useState } from 'react';
import { BoardState, BoardTheme, GameState, PlayerColor } from '../types/game';

interface TwoDBackgammonBoardProps {
  gameState: GameState;
  theme: BoardTheme;
  selectedPoint: number | 'bar' | null;
  validDestinations: number[];
  canBearOffSelected: boolean;
  onSelectPoint: (point: number | 'bar') => void;
  onMoveToDestination: (dest: number | 'off') => void;
  onRollDice: () => void;
  isRollingDice: boolean;
  flippedPerspective: boolean;
  isRotated: boolean;
  isFullscreen: boolean;
}

// 2D Board Coordinate Constants (ViewBox: 1000 x 640)
const POINT_WIDTH = 65;
const TRIANGLE_HEIGHT = 236;
const CHECKER_RADIUS = 24;

export const TwoDBackgammonBoard: React.FC<TwoDBackgammonBoardProps> = ({
  gameState,
  theme,
  selectedPoint,
  validDestinations,
  canBearOffSelected,
  onSelectPoint,
  onMoveToDestination,
  onRollDice,
  isRollingDice,
  flippedPerspective,
  isRotated,
  isFullscreen,
}) => {
  const { board, currentTurn, dice, diceAvailable, diceRolled, doublingValue } = gameState;
  const isWhite = currentTurn === 'white';

  // Helper to get X position for a point (1..24)
  const getPointX = (p: number): number => {
    const effectivePoint = flippedPerspective ? 25 - p : p;

    if (effectivePoint >= 1 && effectivePoint <= 6) {
      // Bottom Right (6 near bar, 1 near right frame)
      return 884 - (effectivePoint - 0.5) * POINT_WIDTH;
    } else if (effectivePoint >= 7 && effectivePoint <= 12) {
      // Bottom Left (7 near bar, 12 near left frame)
      return 430 - (effectivePoint - 6 - 0.5) * POINT_WIDTH;
    } else if (effectivePoint >= 13 && effectivePoint <= 18) {
      // Top Left (13 near left frame, 18 near bar)
      return 40 + (effectivePoint - 13 + 0.5) * POINT_WIDTH;
    } else {
      // Top Right (19 near bar, 24 near right frame)
      return 494 + (effectivePoint - 19 + 0.5) * POINT_WIDTH;
    }
  };

  const isTopPoint = (p: number): boolean => {
    const effectivePoint = flippedPerspective ? 25 - p : p;
    return effectivePoint >= 13;
  };

  return (
    <div
      className={`w-full h-full flex-1 flex items-center justify-center overflow-hidden select-none ${
        isFullscreen ? 'p-0 w-screen h-screen fixed inset-0 z-10' : 'p-1 sm:p-3'
      }`}
    >
      {/* 
        Board Container:
        When isFullscreen is true, scale to 100% full screen without any menu or margins.
        When isRotated is true, rotate 90 degrees and fit screen.
      */}
      <div
        className={`relative flex items-center justify-center transition-all duration-300 ease-out ${
          isFullscreen
            ? isRotated
              ? 'w-screen h-screen rotate-90 max-w-none max-h-none'
              : 'w-screen h-screen max-w-none max-h-none'
            : isRotated
            ? 'w-[calc(100vh-140px)] h-[calc(100vw-12px)] max-h-[820px] max-w-[1100px] rotate-90'
            : 'w-full h-full max-w-[1200px] max-h-[calc(100vh-140px)]'
        }`}
      >
        <div
          className={`relative w-full h-full aspect-[1000/640] max-h-full max-w-full flex items-center justify-center shadow-2xl overflow-hidden ${
            isFullscreen ? 'rounded-none border-none' : 'rounded-2xl border border-slate-800'
          }`}
        >
          <svg
            viewBox="0 0 1000 640"
            className="w-full h-full select-none"
            style={{ backgroundColor: theme.feltBase }}
          >
            <defs>
              {/* Minimal drop shadows */}
              <filter id="checkerShadow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#000000" floodOpacity="0.5" />
              </filter>
              <filter id="glowPulse" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* 1. Outer Frame & Borders */}
            <rect
              x="0"
              y="0"
              width="1000"
              height="640"
              fill={theme.frameWood}
              rx="16"
            />
            {/* Inner Felt Surface */}
            <rect
              x="22"
              y="22"
              width="870"
              height="596"
              fill={theme.feltBase}
              rx="10"
            />

            {/* 2. Center Divider Bar */}
            <rect
              x="440"
              y="22"
              width="44"
              height="596"
              fill={theme.barColor}
            />
            <line x1="440" y1="22" x2="440" y2="618" stroke={theme.pointGoldTrim} strokeWidth="1" strokeOpacity="0.35" />
            <line x1="484" y1="22" x2="484" y2="618" stroke={theme.pointGoldTrim} strokeWidth="1" strokeOpacity="0.35" />

            {/* 3. Bear-off Side Tray (Far Right) */}
            <rect
              x="902"
              y="22"
              width="76"
              height="596"
              fill="#121620"
              rx="8"
              stroke="#262f40"
              strokeWidth="1.5"
            />
            {/* Divider between White and Black bear-off trays */}
            <line x1="902" y1="320" x2="978" y2="320" stroke="#334155" strokeWidth="2" strokeDasharray="3 3" />

            {/* White Bear-off Tray clickable target */}
            <g
              className="cursor-pointer"
              onClick={() => {
                if (selectedPoint !== null && canBearOffSelected && currentTurn === 'white') {
                  onMoveToDestination('off');
                }
              }}
            >
              <rect
                x="904"
                y="322"
                width="72"
                height="294"
                fill={canBearOffSelected && currentTurn === 'white' ? '#10b98130' : 'transparent'}
                stroke={canBearOffSelected && currentTurn === 'white' ? '#10b981' : 'transparent'}
                strokeWidth="2.5"
                rx="6"
              />
              <text
                x="940"
                y="460"
                fill={canBearOffSelected && currentTurn === 'white' ? '#10b981' : '#64748b'}
                fontSize="11"
                fontFamily="sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                transform="rotate(90 940 460)"
                letterSpacing="1"
              >
                WHITE OFF ({board.off.white})
              </text>
            </g>

            {/* Black Bear-off Tray clickable target */}
            <g
              className="cursor-pointer"
              onClick={() => {
                if (selectedPoint !== null && canBearOffSelected && currentTurn === 'black') {
                  onMoveToDestination('off');
                }
              }}
            >
              <rect
                x="904"
                y="24"
                width="72"
                height="294"
                fill={canBearOffSelected && currentTurn === 'black' ? '#10b98130' : 'transparent'}
                stroke={canBearOffSelected && currentTurn === 'black' ? '#10b981' : 'transparent'}
                strokeWidth="2.5"
                rx="6"
              />
              <text
                x="940"
                y="180"
                fill={canBearOffSelected && currentTurn === 'black' ? '#10b981' : '#64748b'}
                fontSize="11"
                fontFamily="sans-serif"
                fontWeight="bold"
                textAnchor="middle"
                transform="rotate(90 940 180)"
                letterSpacing="1"
              >
                BLACK OFF ({board.off.black})
              </text>
            </g>

            {/* 4. 24 Minimal Triangular Points */}
            {Array.from({ length: 24 }, (_, i) => i + 1).map((pointNum) => {
              const centerX = getPointX(pointNum);
              const isTop = isTopPoint(pointNum);
              const isEven = pointNum % 2 === 0;
              const fillColor = isEven ? theme.pointDark : theme.pointLight;

              const leftX = centerX - POINT_WIDTH / 2;
              const rightX = centerX + POINT_WIDTH / 2;
              const baseY = isTop ? 22 : 618;
              const tipY = isTop ? 22 + TRIANGLE_HEIGHT : 618 - TRIANGLE_HEIGHT;

              const isDestination = validDestinations.includes(pointNum);

              return (
                <g
                  key={pointNum}
                  className="cursor-pointer transition-opacity"
                  onClick={() => {
                    if (selectedPoint !== null && isDestination) {
                      onMoveToDestination(pointNum);
                    } else {
                      onSelectPoint(pointNum);
                    }
                  }}
                >
                  {/* Triangular Point */}
                  <polygon
                    points={`${leftX},${baseY} ${rightX},${baseY} ${centerX},${tipY}`}
                    fill={fillColor}
                    stroke={isDestination ? '#10b981' : theme.pointGoldTrim}
                    strokeWidth={isDestination ? '3' : '0.5'}
                    strokeOpacity={isDestination ? '1' : '0.4'}
                  />

                  {/* Subdued Point Number Index */}
                  <text
                    x={centerX}
                    y={isTop ? 17 : 633}
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {pointNum}
                  </text>

                  {/* Destination Indicator Pulse */}
                  {isDestination && (
                    <circle
                      cx={centerX}
                      cy={tipY + (isTop ? 24 : -24)}
                      r="11"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      filter="url(#glowPulse)"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}

            {/* 5. Checkers on Points 1..24 */}
            {Array.from({ length: 24 }, (_, i) => i + 1).map((pointNum) => {
              const val = board.points[pointNum];
              if (val === 0) return null;

              const isWhiteChecker = val > 0;
              const count = Math.abs(val);
              const centerX = getPointX(pointNum);
              const isTop = isTopPoint(pointNum);
              const isSelected = selectedPoint === pointNum;

              const maxVisible = Math.min(count, 5);
              const spacing = 43;

              return (
                <g
                  key={`checkers-${pointNum}`}
                  className="cursor-pointer"
                  onClick={() => {
                    if (selectedPoint !== null && validDestinations.includes(pointNum)) {
                      onMoveToDestination(pointNum);
                    } else {
                      onSelectPoint(pointNum);
                    }
                  }}
                >
                  {Array.from({ length: maxVisible }, (_, idx) => {
                    const cy = isTop
                      ? 22 + CHECKER_RADIUS + 4 + idx * spacing
                      : 618 - CHECKER_RADIUS - 4 - idx * spacing;

                    const isTopChecker = idx === maxVisible - 1;

                    return (
                      <g key={idx} filter="url(#checkerShadow)">
                        {/* Checker Base */}
                        <circle
                          cx={centerX}
                          cy={cy}
                          r={CHECKER_RADIUS}
                          fill={isWhiteChecker ? theme.checkerWhite : theme.checkerBlack}
                          stroke={isSelected && isTopChecker ? '#38bdf8' : isWhiteChecker ? '#cbd5e1' : '#334155'}
                          strokeWidth={isSelected && isTopChecker ? '3.5' : '1.5'}
                        />
                        {/* Inner concentric ring for tactile depth */}
                        <circle
                          cx={centerX}
                          cy={cy}
                          r={CHECKER_RADIUS * 0.65}
                          fill="none"
                          stroke={isWhiteChecker ? '#94a3b8' : '#475569'}
                          strokeWidth="1.2"
                          strokeOpacity="0.55"
                        />
                        {/* Center core */}
                        <circle
                          cx={centerX}
                          cy={cy}
                          r="3.5"
                          fill={isWhiteChecker ? '#64748b' : '#94a3b8'}
                        />

                        {/* Stack count badge if more than 5 checkers */}
                        {isTopChecker && count > 5 && (
                          <g>
                            <circle
                              cx={centerX}
                              cy={cy}
                              r="13"
                              fill="#0f172a"
                              stroke="#f59e0b"
                              strokeWidth="1.5"
                            />
                            <text
                              x={centerX}
                              y={cy + 4}
                              fill="#f59e0b"
                              fontSize="11"
                              fontWeight="bold"
                              fontFamily="monospace"
                              textAnchor="middle"
                            >
                              {count}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* 6. Checkers on the Center Bar */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectPoint('bar')}
            >
              {/* White Bar Checkers */}
              {board.bar.white > 0 &&
                Array.from({ length: Math.min(board.bar.white, 4) }, (_, idx) => {
                  const cy = 400 + idx * 42;
                  const isSelected = selectedPoint === 'bar' && currentTurn === 'white';
                  return (
                    <g key={`white-bar-${idx}`} filter="url(#checkerShadow)">
                      <circle
                        cx="462"
                        cy={cy}
                        r={CHECKER_RADIUS - 2}
                        fill={theme.checkerWhite}
                        stroke={isSelected ? '#38bdf8' : '#cbd5e1'}
                        strokeWidth={isSelected ? '3.5' : '1.5'}
                      />
                      <circle cx="462" cy={cy} r="14" fill="none" stroke="#94a3b8" strokeWidth="1" />
                      {idx === Math.min(board.bar.white, 4) - 1 && board.bar.white > 4 && (
                        <text x="462" y={cy + 4} fill="#0f172a" fontSize="11" fontWeight="bold" textAnchor="middle">
                          +{board.bar.white - 3}
                        </text>
                      )}
                    </g>
                  );
                })}

              {/* Black Bar Checkers */}
              {board.bar.black > 0 &&
                Array.from({ length: Math.min(board.bar.black, 4) }, (_, idx) => {
                  const cy = 240 - idx * 42;
                  const isSelected = selectedPoint === 'bar' && currentTurn === 'black';
                  return (
                    <g key={`black-bar-${idx}`} filter="url(#checkerShadow)">
                      <circle
                        cx="462"
                        cy={cy}
                        r={CHECKER_RADIUS - 2}
                        fill={theme.checkerBlack}
                        stroke={isSelected ? '#38bdf8' : '#475569'}
                        strokeWidth={isSelected ? '3.5' : '1.5'}
                      />
                      <circle cx="462" cy={cy} r="14" fill="none" stroke="#475569" strokeWidth="1" />
                      {idx === Math.min(board.bar.black, 4) - 1 && board.bar.black > 4 && (
                        <text x="462" y={cy + 4} fill="#f1f5f9" fontSize="11" fontWeight="bold" textAnchor="middle">
                          +{board.bar.black - 3}
                        </text>
                      )}
                    </g>
                  );
                })}
            </g>

            {/* 7. Borne-Off Checkers in Side Trays */}
            {Array.from({ length: Math.min(board.off.white, 15) }, (_, idx) => {
              const cy = 600 - idx * 18;
              return (
                <rect
                  key={`white-off-${idx}`}
                  x="914"
                  y={cy}
                  width="52"
                  height="12"
                  rx="3"
                  fill={theme.checkerWhite}
                  stroke="#cbd5e1"
                  strokeWidth="1"
                />
              );
            })}
            {Array.from({ length: Math.min(board.off.black, 15) }, (_, idx) => {
              const cy = 34 + idx * 18;
              return (
                <rect
                  key={`black-off-${idx}`}
                  x="914"
                  y={cy}
                  width="52"
                  height="12"
                  rx="3"
                  fill={theme.checkerBlack}
                  stroke="#475569"
                  strokeWidth="1"
                />
              );
            })}

            {/* 8. 2D Minimal Dice in the Active Playing Area */}
            <g
              className="cursor-pointer"
              onClick={onRollDice}
              transform={isWhite ? 'translate(200, 360)' : 'translate(200, 220)'}
            >
              {diceRolled && dice.length >= 2 ? (
                <g>
                  {/* Die 1 */}
                  <rect
                    x="0"
                    y="0"
                    width="50"
                    height="50"
                    rx="10"
                    fill={isWhite ? theme.diceWhite : theme.diceBlack}
                    stroke={diceAvailable.includes(dice[0]) ? '#f59e0b' : '#475569'}
                    strokeWidth="2.5"
                    filter="url(#checkerShadow)"
                  />
                  <MinimalDiePips
                    val={dice[0]}
                    color={isWhite ? '#0f172a' : '#f8fafc'}
                    offsetX={0}
                    offsetY={0}
                  />

                  {/* Die 2 */}
                  <rect
                    x="62"
                    y="0"
                    width="50"
                    height="50"
                    rx="10"
                    fill={isWhite ? theme.diceWhite : theme.diceBlack}
                    stroke={diceAvailable.includes(dice[1]) ? '#f59e0b' : '#475569'}
                    strokeWidth="2.5"
                    filter="url(#checkerShadow)"
                  />
                  <MinimalDiePips
                    val={dice[1]}
                    color={isWhite ? '#0f172a' : '#f8fafc'}
                    offsetX={62}
                    offsetY={0}
                  />
                </g>
              ) : (
                /* Tap to roll prompt if not yet rolled */
                <g className={isRollingDice ? 'animate-spin origin-center' : ''}>
                  <rect
                    x="0"
                    y="0"
                    width="116"
                    height="48"
                    rx="12"
                    fill="#0f172a"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <text
                    x="58"
                    y="29"
                    fill="#fbbf24"
                    fontSize="13"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                  >
                    {isRollingDice ? 'Rolling...' : '🎲 Roll Dice'}
                  </text>
                </g>
              )}
            </g>

            {/* 9. Doubling Cube on the Left Rim */}
            <g transform="translate(3, 295)">
              <rect
                x="0"
                y="0"
                width="26"
                height="50"
                rx="4"
                fill="#1e293b"
                stroke="#b45309"
                strokeWidth="1.2"
              />
              <text
                x="13"
                y="30"
                fill="#f59e0b"
                fontSize="11"
                fontWeight="black"
                fontFamily="sans-serif"
                textAnchor="middle"
                transform="rotate(90 13 30)"
              >
                {doublingValue}×
              </text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};

// Minimalist 2D Die Pips Helper Component
const MinimalDiePips: React.FC<{ val: number; color: string; offsetX: number; offsetY: number }> = ({
  val,
  color,
  offsetX,
  offsetY,
}) => {
  const c = 25;
  const l = 13;
  const r = 37;
  const t = 13;
  const b = 37;
  const rad = 3.5;

  const pips: [number, number][] = [];
  if (val === 1) {
    pips.push([c, c]);
  } else if (val === 2) {
    pips.push([l, t], [r, b]);
  } else if (val === 3) {
    pips.push([l, t], [c, c], [r, b]);
  } else if (val === 4) {
    pips.push([l, t], [r, t], [l, b], [r, b]);
  } else if (val === 5) {
    pips.push([l, t], [r, t], [c, c], [l, b], [r, b]);
  } else if (val === 6) {
    pips.push([l, t], [r, t], [l, c], [r, c], [l, b], [r, b]);
  }

  return (
    <g>
      {pips.map(([px, py], i) => (
        <circle key={i} cx={offsetX + px} cy={offsetY + py} r={rad} fill={color} />
      ))}
    </g>
  );
};
