import React from 'react';
import { X, Check, Palette } from 'lucide-react';
import { BoardThemeId } from '../types/game';
import { BOARD_THEMES } from '../utils/storage';
import { soundManager } from '../utils/audio';

interface ThemesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: BoardThemeId;
  onSelectTheme: (id: BoardThemeId) => void;
}

export const ThemesModal: React.FC<ThemesModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-[#131722] border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-white animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#161b29]">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base tracking-wide text-amber-200">Custom 3D Themes</h3>
              <p className="text-xs text-slate-400">Board woodwork, felt inlays & checkers</p>
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
        <div className="p-5 space-y-3 overflow-y-auto">
          {(Object.keys(BOARD_THEMES) as BoardThemeId[]).map((themeId) => {
            const theme = BOARD_THEMES[themeId];
            const isSelected = currentThemeId === themeId;

            return (
              <div
                key={themeId}
                onClick={() => {
                  soundManager.playButtonTap();
                  onSelectTheme(themeId);
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-400 shadow-lg ring-1 ring-amber-400/40'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-sm text-white">{theme.name}</h4>
                  {isSelected && (
                    <div className="flex items-center gap-1 text-xs text-amber-300 font-bold">
                      <Check className="w-3.5 h-3.5" /> Selected
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-3">{theme.description}</p>

                {/* Theme Palette Swatches Preview */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center -space-x-1">
                    <span
                      className="w-5 h-5 rounded-full border border-slate-700 shadow-xs"
                      style={{ backgroundColor: theme.frameWood }}
                      title="Frame Wood"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-slate-700 shadow-xs"
                      style={{ backgroundColor: theme.feltBase }}
                      title="Felt Color"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-slate-700 shadow-xs"
                      style={{ backgroundColor: theme.pointLight }}
                      title="Light Point"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-slate-700 shadow-xs"
                      style={{ backgroundColor: theme.pointDark }}
                      title="Dark Point"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Palette</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
