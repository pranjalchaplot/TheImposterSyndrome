import React, { useState } from 'react';
import { SanitizedClientState } from '../types';

interface VotePhaseProps {
  clientState: SanitizedClientState;
  onCastVote: (targetPlayerId: string | 'SKIP') => void;
  onNextRound: () => void;
}

export const VotePhase: React.FC<VotePhaseProps> = ({ clientState, onCastVote, onNextRound }) => {
  const [selectedTarget, setSelectedTarget] = useState<string | 'SKIP' | null>(null);

  const { players, myPlayerId, voteSummary, phase, ejectedPlayer } = clientState;
  const me = players.find(p => p.id === myPlayerId);
  const activeLiving = players.filter(p => !p.isDead);
  const totalVotedCount = activeLiving.filter(p => p.hasVoted).length;

  const isRoundResult = phase === 'ROUND_RESULT';

  const handleVoteSubmit = () => {
    if (selectedTarget && me && !me.isDead && !me.hasVoted) {
      onCastVote(selectedTarget);
    }
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-between p-4 md:p-6 bg-transparent relative z-10">
      
      {/* Header */}
      <div className="w-full max-w-xl text-center space-y-2 pt-2">
        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-mono border border-rose-500/30 uppercase tracking-widest">
          {isRoundResult ? 'VOTE RESULT' : 'SIMULTANEOUS SECRET VOTE'}
        </span>
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-wide">
          {isRoundResult ? 'Vote Resolution' : 'Cast Your Ejection Vote'}
        </h1>
        <p className="text-xs text-slate-400">
          {isRoundResult
            ? 'The results have been tallied by the server.'
            : me?.isDead
            ? 'You are dead. Observe the voting progress.'
            : 'Select the player you suspect is the Imposter, or vote to Skip.'}
        </p>
      </div>

      {/* Voting Progress Counter */}
      {!isRoundResult && (
        <div className="w-full max-w-xl my-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">STATUS:</span>
            <span className="text-xs font-bold text-cyan-300">
              {me?.hasVoted ? '✓ Vote Recorded' : me?.isDead ? 'Spectating' : 'Awaiting Your Vote'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">VOTES CAST:</span>
            <span className="text-sm font-black text-cyan-400 font-mono">
              {totalVotedCount} / {activeLiving.length}
            </span>
          </div>
        </div>
      )}

      {/* Grid of Living Players to Vote On */}
      {!isRoundResult && (
        <div className="w-full max-w-xl flex-1 overflow-y-auto my-2 pr-1 space-y-2">
          {activeLiving.map(p => {
            const isSelf = p.id === myPlayerId;
            const isSelected = selectedTarget === p.id;

            return (
              <button
                key={p.id}
                disabled={me?.isDead || me?.hasVoted}
                onClick={() => setSelectedTarget(p.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-rose-500 bg-rose-950/40 text-white shadow-lg shadow-rose-950/50 scale-[1.01]'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/80'
                } ${me?.hasVoted || me?.isDead ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-cyan-400">
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-sm block">{p.name} {isSelf && '(You)'}</span>
                    {p.hasVoted && (
                      <span className="text-[10px] font-mono text-emerald-400">✓ Voted</span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <span className="text-xs font-bold text-rose-400 font-mono">SELECTED</span>
                )}
              </button>
            );
          })}

          {/* Skip Vote Option */}
          <button
            disabled={me?.isDead || me?.hasVoted}
            onClick={() => setSelectedTarget('SKIP')}
            className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
              selectedTarget === 'SKIP'
                ? 'border-amber-500 bg-amber-950/40 text-amber-200 shadow-lg scale-[1.01]'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
            } ${me?.hasVoted || me?.isDead ? 'opacity-80 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-amber-400">
                ⏭
              </div>
              <span className="font-bold text-sm text-amber-300">SKIP VOTE</span>
            </div>
            {selectedTarget === 'SKIP' && (
              <span className="text-xs font-bold text-amber-400 font-mono">SELECTED</span>
            )}
          </button>
        </div>
      )}

      {/* Vote Action Footer Button */}
      {!isRoundResult && (
        <div className="w-full max-w-xl pt-2">
          {me?.hasVoted ? (
            <div className="w-full py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-center text-xs font-mono text-cyan-300 animate-pulse">
              ✓ YOUR VOTE HAS BEEN SUBMITTED. WAITING FOR OTHERS...
            </div>
          ) : (
            <button
              disabled={!selectedTarget || me?.isDead}
              onClick={handleVoteSubmit}
              className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-rose-950/50 transition-all cursor-pointer"
            >
              Confirm Vote
            </button>
          )}
        </div>
      )}

      {/* Round Result Modal */}
      {isRoundResult && voteSummary && (
        <div className="w-full max-w-xl my-auto bg-slate-900/95 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 text-center animate-fadeIn backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-3xl">
            {ejectedPlayer ? '💀' : '🤝'}
          </div>

          <h2 className="text-2xl font-black text-white">
            {voteSummary.outcomeText}
          </h2>

          {ejectedPlayer && ejectedPlayer.isImposter !== undefined && (
            <div className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase ${
              ejectedPlayer.isImposter
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
            }`}>
              {ejectedPlayer.name} was {ejectedPlayer.isImposter ? 'AN IMPOSTER!' : 'NOT AN IMPOSTER (CREW)!'}
            </div>
          )}

          {/* Breakdown list */}
          <div className="w-full bg-black/50 border border-slate-800 rounded-xl p-3 text-left space-y-2 mt-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block text-center">Vote Breakdown</span>
            {Object.entries(voteSummary.votes).map(([targetId, count]) => {
              const pName = targetId === 'SKIP' ? 'Skip Vote' : players.find(p => p.id === targetId)?.name || 'Unknown';
              return (
                <div key={targetId} className="flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-800/60 pb-1">
                  <span>{pName}</span>
                  <span className="font-bold text-cyan-400">{count} {count === 1 ? 'vote' : 'votes'}</span>
                </div>
              );
            })}
          </div>

          <button
            onClick={onNextRound}
            className="w-full py-3 mt-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
          >
            Continue Game
          </button>
        </div>
      )}
    </div>
  );
};
