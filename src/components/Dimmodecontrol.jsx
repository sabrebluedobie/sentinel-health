import React, { useState } from 'react';
import { Sun, Moon, Settings } from 'lucide-react';
import { useDimMode } from './DimModeContext';

export default function DimModeControl({ position = 'bottom-right' }) {
  const { dimLevel, isDimmed, enableDimMode, disableDimMode, adjustDimLevel } = useDimMode();
  const [showControls, setShowControls] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const quickPresets = [
    { label: 'Light', value: 30 },
    { label: 'Medium', value: 50 },
    { label: 'Heavy', value: 70 },
    { label: 'Max', value: 90 },
  ];

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      {/* Expanded controls */}
      {showControls && (
        <div className="mb-3 bg-white rounded-xl shadow-lg ring-1 ring-black/5 p-4 w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-zinc-900">Screen Dimming</h3>
            <button
              onClick={() => setShowControls(false)}
              className="text-zinc-400 hover:text-zinc-600"
              aria-label="Close controls"
            >
              ×
            </button>
          </div>

          {/* Slider */}
          <div className="mb-3">
            <label className="block text-xs text-zinc-600 mb-2">
              Dim Level: {dimLevel}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={dimLevel}
              onChange={(e) => adjustDimLevel(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            {quickPresets.map((preset) => (
              <button
                key={preset.value}
                onClick={() => adjustDimLevel(preset.value)}
                className={`px-2 py-1.5 text-xs rounded-md font-medium transition-colors ${
                  dimLevel === preset.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Off button */}
          <button
            onClick={disableDimMode}
            className="w-full px-3 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Turn Off Dimming
          </button>

          <p className="text-xs text-zinc-500 mt-3">
            Reduces screen brightness for migraine relief without affecting device settings.
          </p>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => {
          if (!showControls) {
            setShowControls(true);
          } else if (isDimmed) {
            disableDimMode();
            setShowControls(false);
          } else {
            enableDimMode(70);
          }
        }}
        className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all ${
          isDimmed
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-white text-zinc-700 hover:bg-zinc-50 ring-1 ring-black/5'
        }`}
        aria-label={isDimmed ? 'Dimming active' : 'Enable dimming'}
        title={isDimmed ? 'Screen dimming active' : 'Enable screen dimming'}
      >
        {isDimmed ? (
          <>
            <Moon size={20} />
            <span className="text-sm font-medium">{dimLevel}%</span>
          </>
        ) : (
          <>
            <Sun size={20} />
            <span className="text-sm font-medium">Dim</span>
          </>
        )}
      </button>
    </div>
  );
}