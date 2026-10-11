import React from 'react';
import { SanitizedClientState } from '../types';

interface PlayPhaseProps {
  clientState?: SanitizedClientState | null;
  onInitiateVote?: () => void;

  // Single-device fallback props
  players?: any[];
  gameData?: any;
  settings?: any;
  onEject?: (playerId: string) => void;
}

export const PlayPhase: React.FC<PlayPhaseProps> = ({ clientState, onInitiateVote }) => {
  if (clientState) {
    const { players, myPlayerId, category } = clientState;
    const me = players.find(p => p.id === myPlayerId);

    const activePlayers = players.filter(p => !p.isDead);
    const deadPlayers = players.filter(p => p.isDead);

    return (
      <div className="h-full w-full flex flex-col items-center justify-between p-4 md:p-6 bg-transparent relative z-10 text-slate-200">
        
        {/* Discussion Header */}
        <div className="w-full max-w-xl text-center space-y-2 pt-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono border border-emerald-500/30 uppercase tracking-widest">
            DISCUSSION PHASE
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            Discuss & Ask Questions
          </h1>
          <p className="text-xs text-slate-400">
            Category: <strong className="text-cyan-300 font-mono">{category || 'Unknown'}</strong>. Take turns asking questions to catch the Imposter!
          </p>
        </div>

        {/* Players Grid Roster */}
        <div className="w-full max-w-xl flex-1 overflow-y-auto my-4 space-y-4 pr-1">
          <div className="space-y-2">
            <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider block">
              Active Crew & Suspects ({activePlayers.length})
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {activePlayers.map(p => {
                const isMe = p.id === myPlayerId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isMe
                        ? 'border-cyan-500/50 bg-cyan-950/30 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-sm">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                        p.isConnected ? 'bg-emerald-500' : 'bg-slate-500'
                      }`} />
                    </div>
                    <div className="text-left overflow-hidden">
                      <span className="font-bold text-xs truncate block">{p.name} {isMe && '(You)'}</span>
                      {p.isHost && <span className="text-[9px] font-mono text-amber-300 font-bold">HOST</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {deadPlayers.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider block">
                Ejected Players ({deadPlayers.length})
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {deadPlayers.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-900 bg-slate-950/60 text-slate-500 line-through opacity-70"
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center font-bold text-xs text-slate-600">
                      💀
                    </div>
                    <span className="font-bold text-xs truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Voting Action Button */}
        <div className="w-full max-w-xl pt-2">
          <button
            onClick={onInitiateVote}
            className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-rose-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>🚨 Start Simultaneous Vote</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <span>Discussion Phase</span>
    </div>
  );
};
