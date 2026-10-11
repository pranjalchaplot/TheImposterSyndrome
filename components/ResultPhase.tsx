import React from 'react';
import { SanitizedClientState } from '../types';

interface GameOverPhaseProps {
  clientState?: SanitizedClientState | null;
  onRestartLobby?: () => void;

  // Single device fallback props
  players?: any[];
  gameData?: any;
  winner?: 'CREW' | 'IMPOSTER' | 'JESTER';
  onReset?: () => void;
}

export const GameOverPhase: React.FC<GameOverPhaseProps> = ({ clientState, onRestartLobby, onReset }) => {
  if (clientState) {
    const { winner, players, trueGameData, myPlayerId } = clientState;
    const me = players.find(p => p.id === myPlayerId);
    const isHost = me?.isHost;

    let bannerBg = 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300';
    let bannerTitle = 'CREW VICTORY!';
    let bannerSubtitle = 'All Imposters were successfully identified and ejected!';

    if (winner === 'IMPOSTER') {
      bannerBg = 'border-rose-500/50 bg-rose-950/40 text-rose-300';
      bannerTitle = 'IMPOSTERS WIN!';
      bannerSubtitle = 'The Imposters infiltrated and outnumbered the crew!';
    } else if (winner === 'JESTER') {
      bannerBg = 'border-amber-500/50 bg-amber-950/40 text-amber-300';
      bannerTitle = 'JESTER WINS! 🃏';
      bannerSubtitle = 'The Jester tricked the crew into voting them out!';
    }

    return (
      <div className="h-full w-full flex flex-col items-center justify-between p-4 md:p-6 overflow-y-auto bg-transparent relative z-10 text-slate-200">
        
        {/* Victory Banner */}
        <div className={`w-full max-w-xl border ${bannerBg} rounded-2xl p-6 shadow-2xl text-center space-y-2 backdrop-blur-md animate-fadeIn mt-4`}>
          <span className="text-[10px] font-mono uppercase tracking-widest block opacity-80">MISSION OVER</span>
          <h1 className="text-3xl md:text-4xl font-black tracking-wider uppercase drop-shadow-md">
            {bannerTitle}
          </h1>
          <p className="text-xs text-slate-300">
            {bannerSubtitle}
          </p>
        </div>

        {/* Revealed Secret Word */}
        {trueGameData && (
          <div className="w-full max-w-xl my-4 bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-5 text-center shadow-xl backdrop-blur-md">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">REVEALED SECRET WORD</span>
            <h2 className="text-2xl font-black text-cyan-300 font-mono tracking-wider mt-1">
              {trueGameData.word}
            </h2>
            <span className="text-xs text-slate-400 font-mono block mt-1">
              Category: {trueGameData.category}
            </span>
          </div>
        )}

        {/* All Player True Roles Roster */}
        <div className="w-full max-w-xl flex-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-2 max-h-[300px] backdrop-blur-md">
          <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-800 pb-2">
            Final Role Dossier
          </span>
          {players.map(p => {
            const isMe = p.id === myPlayerId;
            let roleBadge = 'bg-emerald-950 text-emerald-300 border-emerald-800';
            if (p.role === 'IMPOSTER') roleBadge = 'bg-rose-950 text-rose-300 border-rose-800';
            if (p.role === 'JESTER') roleBadge = 'bg-amber-950 text-amber-300 border-amber-800';

            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-800/40"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-bold text-xs">
                    {p.name} {isMe && '(You)'} {p.isDead && '(Ejected)'}
                  </span>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border ${roleBadge}`}>
                  {p.role}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="w-full max-w-xl pt-4">
          {isHost ? (
            <button
              onClick={onRestartLobby}
              className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
            >
              Play Again 🔄 (Return to Lobby)
            </button>
          ) : (
            <button
              onClick={onReset || onRestartLobby}
              className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider border border-slate-700 transition-all cursor-pointer"
            >
              Return to Menu
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex items-center justify-center">
      <button onClick={onReset} className="py-3 px-6 rounded-xl bg-cyan-600 text-white font-bold">
        Reset Game
      </button>
    </div>
  );
};
