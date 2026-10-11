import React, { useState } from 'react';
import { SanitizedClientState } from '../types';

interface SecretDossierProps {
  clientState: SanitizedClientState;
}

export const SecretDossier: React.FC<SecretDossierProps> = ({ clientState }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const { myRole, secretWord, category, teammates } = clientState;

  let roleColor = 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300';
  let roleTitle = 'CREW MEMBER';
  let roleDescription = 'Discuss with the team, find who does not know the word, and vote them out!';

  if (myRole === 'IMPOSTER') {
    roleColor = 'border-rose-500/50 bg-rose-950/40 text-rose-300';
    roleTitle = 'THE IMPOSTER';
    roleDescription = 'You do NOT know the secret word. Blend in, listen carefully, and pretend you belong!';
  } else if (myRole === 'JESTER') {
    roleColor = 'border-amber-500/50 bg-amber-950/40 text-amber-300';
    roleTitle = 'THE JESTER';
    roleDescription = 'Your secret goal is to act suspicious and get yourself voted out by the crew to WIN!';
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Dossier Toggle Floating Badge */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/90 border border-brand-primary/40 text-white shadow-xl shadow-cyan-950/50 hover:bg-slate-800 transition-all cursor-pointer backdrop-blur-md"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
        </span>
        <span className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-300">
          📁 Secret Dossier
        </span>
      </button>

      {/* Expanded Dossier Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className={`w-full max-w-md rounded-2xl border ${roleColor} p-6 shadow-2xl relative flex flex-col gap-4 bg-slate-900/95`}>
            
            {/* Close Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">CONFIDENTIAL DOSSIER</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            {/* Role Header */}
            <div className="text-center py-2">
              <span className="text-xs uppercase tracking-widest font-mono text-slate-400">Your Assigned Role</span>
              <h2 className="text-2xl font-black tracking-wider uppercase mt-1 drop-shadow-md">
                {roleTitle}
              </h2>
              <p className="text-xs text-slate-400 mt-2 px-2">
                {roleDescription}
              </p>
            </div>

            {/* Category Info */}
            {category && (
              <div className="bg-slate-800/60 rounded-xl p-3 text-center border border-slate-700/50">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block">Category</span>
                <span className="text-base font-bold text-cyan-300 tracking-wide">{category}</span>
              </div>
            )}

            {/* Secret Word Reveal Box */}
            <div className="bg-black/60 rounded-xl p-4 border border-slate-800 text-center flex flex-col items-center justify-center min-h-[90px]">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">Secret Word</span>
              
              {!isRevealed ? (
                <button
                  onMouseDown={() => setIsRevealed(true)}
                  onMouseUp={() => setIsRevealed(false)}
                  onTouchStart={() => setIsRevealed(true)}
                  onTouchEnd={() => setIsRevealed(false)}
                  className="w-full py-3 px-4 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono tracking-wider font-bold hover:bg-cyan-500/30 transition-all select-none active:scale-98"
                >
                  PRESS & HOLD TO REVEAL WORD
                </button>
              ) : (
                <div className="animate-fadeIn">
                  {myRole === 'CREW' && secretWord ? (
                    <span className="text-2xl font-extrabold text-cyan-400 tracking-wider font-mono">
                      {secretWord}
                    </span>
                  ) : myRole === 'IMPOSTER' ? (
                    <span className="text-sm font-bold text-rose-400 font-mono">
                      🚨 UNKNOWN WORD (YOU ARE IMPOSTER)
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-amber-400 font-mono">
                      🃏 UNKNOWN WORD (GET VOTED OUT!)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Imposter Teammates Info if enabled */}
            {myRole === 'IMPOSTER' && teammates.length > 0 && (
              <div className="bg-rose-950/50 border border-rose-800/40 rounded-xl p-3 text-center">
                <span className="text-[10px] font-mono text-rose-300 uppercase tracking-widest block">Fellow Imposters</span>
                <span className="text-xs font-bold text-rose-200">{teammates.join(', ')}</span>
              </div>
            )}

            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-2 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold uppercase tracking-wider hover:bg-slate-700 transition-all"
            >
              Hide Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
