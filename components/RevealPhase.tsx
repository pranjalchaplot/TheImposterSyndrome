import React from 'react';
import { SanitizedClientState } from '../types';

interface RevealPhaseProps {
  clientState?: SanitizedClientState | null;
  onStartPlay?: () => void;

  // Single-device fallback props
  players?: any[];
  gameData?: any;
  settings?: any;
  onComplete?: () => void;
}

export const RevealPhase: React.FC<RevealPhaseProps> = ({ clientState, onStartPlay, onComplete }) => {
  if (clientState) {
    const { myRole, secretWord, category, teammates, players } = clientState;
    const me = players.find(p => p.id === clientState.myPlayerId);
    const isHost = me?.isHost;

    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-transparent relative z-10 text-slate-200">
        <div className="w-full max-w-md bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-5 text-center backdrop-blur-md">
          
          <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 text-xs font-mono border border-cyan-800 uppercase tracking-widest">
            SECRET DOSSIER INITIALIZED
          </span>

          <h1 className="text-2xl font-black text-white">
            Your Secret Briefing is Ready
          </h1>

          <p className="text-xs text-slate-400">
            Roles and encrypted instructions have been dispatched to your device. Check your <strong className="text-cyan-300">Secret Dossier</strong> at the bottom right.
          </p>

          <div className="w-full bg-black/60 border border-slate-800 rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">CATEGORY</span>
            <span className="text-xl font-bold text-cyan-300">{category || 'Classified'}</span>
          </div>

          {isHost ? (
            <button
              onClick={onStartPlay}
              className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-cyan-950/50 transition-all cursor-pointer mt-2"
            >
              Start Discussion Phase 🗣️
            </button>
          ) : (
            <div className="w-full py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center text-xs font-mono text-cyan-300 animate-pulse">
              Waiting for Host to begin discussion phase...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Single device fallback
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center">
      <button
        onClick={onComplete}
        className="py-3 px-6 rounded-xl bg-cyan-600 text-white font-bold text-sm"
      >
        Proceed to Discussion
      </button>
    </div>
  );
};
