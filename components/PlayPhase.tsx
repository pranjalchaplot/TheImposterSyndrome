
import React, { useState, useEffect } from 'react';
import { Player, GameData, GameSettings, ExtraRole } from '../types';
import { Button } from './ui/Button';

interface PlayPhaseProps {
  players: Player[];
  gameData: GameData;
  settings: GameSettings;
  onEject: (playerId: string) => void;
}

export const PlayPhase: React.FC<PlayPhaseProps> = ({ players, gameData, settings, onEject }) => {
  const [timeLeft, setTimeLeft] = useState(settings.timerDuration); 
  const [timerActive, setTimerActive] = useState(true);
  const [votingMode, setVotingMode] = useState(false);
  
  // Voting Interaction State
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [revealPopupData, setRevealPopupData] = useState<{name: string, isImposter: boolean, extraRole: ExtraRole} | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (settings.timerDuration > 0 && timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, settings.timerDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const activePlayers = players.filter(p => !p.isDead);
  const deadPlayers = players.filter(p => p.isDead);

  const handlePlayerTap = (player: Player) => {
    if (player.isDead) return;
    
    if (votingMode) {
      // Open confirmation logic
      setSelectedPlayerId(player.id);
    }
  };

  const confirmEjection = () => {
    if (!selectedPlayerId) return;
    const player = players.find(p => p.id === selectedPlayerId);
    if (!player) return;

    // Show the result popup LOCALLY first before calling onEject (which might refresh UI or end game)
    setRevealPopupData({
      name: player.name,
      isImposter: player.isImposter,
      extraRole: player.extraRole
    });
    setSelectedPlayerId(null); // Close confirm modal
  };

  const closeRevealAndProceed = () => {
    if (revealPopupData) {
       const p = players.find(p => p.name === revealPopupData.name && !p.isDead); // simple find
       setRevealPopupData(null);
       setVotingMode(false); // exit voting mode
       if (p) onEject(p.id);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto p-6 animate-fade-in relative">
      
      {/* CONFIRM EJECTION MODAL */}
      {selectedPlayerId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
           <div className="bg-brand-card w-full max-w-sm p-6 rounded-2xl border border-brand-primary shadow-2xl transform scale-100">
              <h3 className="text-xl font-bold text-white text-center mb-2">Confirm Ejection</h3>
              <p className="text-center text-slate-400 mb-6">
                Are you sure you want to eliminate <span className="text-white font-bold">{players.find(p => p.id === selectedPlayerId)?.name}</span>?
              </p>
              <div className="flex gap-3">
                <Button onClick={() => setSelectedPlayerId(null)} variant="ghost" fullWidth className="border border-slate-700">Cancel</Button>
                <Button onClick={confirmEjection} variant="danger" fullWidth>Eject Agent</Button>
              </div>
           </div>
        </div>
      )}

      {/* REVEAL POPUP MODAL */}
      {revealPopupData && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-sm text-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 ${
                  revealPopupData.extraRole === 'JESTER' && settings.revealRoleOnDeath ? 'bg-yellow-500 border-yellow-400' :
                  revealPopupData.isImposter && settings.revealRoleOnDeath ? 'bg-brand-danger border-rose-500' : 
                  'bg-slate-700 border-slate-600'
                }`}>
                   <span className="text-4xl font-bold text-white">{revealPopupData.name.charAt(0)}</span>
                </div>

                <h2 className="text-3xl font-black text-white mb-1 uppercase">{revealPopupData.name}</h2>
                <p className="text-lg text-rose-500 font-bold mb-8">was ejected.</p>

                {settings.revealRoleOnDeath ? (
                <>
                  <div className={`w-full p-6 rounded-2xl border mb-4 animate-pop ${
                    revealPopupData.isImposter ? 'bg-rose-900/20 border-brand-danger' : 
                    'bg-brand-primary/10 border-brand-primary'
                  }`}>
                      <p className="text-xs uppercase font-bold tracking-widest mb-2 opacity-70">Identity Confirmed</p>
                      <p className={`text-3xl font-black ${revealPopupData.isImposter ? 'text-brand-danger' : 'text-brand-primary'}`}>
                          {revealPopupData.isImposter ? 'IMPOSTER' : 'INNOCENT'}
                      </p>
                  </div>
                  
                  {revealPopupData.extraRole === 'JESTER' && (
                    <div className="w-full p-4 rounded-2xl border border-yellow-500 bg-yellow-500/20 mb-8 animate-pop">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M2 12a5 5 0 0 0 5 5 8 8 0 0 1 5 2 8 8 0 0 1 5-2 5 5 0 0 0 5-5V7h-5a8 8 0 0 0-5 2 8 8 0 0 0-5-2H2Z"/><path d="M6 11c1.5 0 3 .5 3 2-2 0-3 0-3-2Z"/><path d="M18 11c-1.5 0-3 .5-3 2 2 0 3 0 3-2Z"/></svg>
                        <p className="text-yellow-500 font-black text-xl uppercase tracking-wider">JESTER</p>
                      </div>
                      <p className="text-yellow-300 text-sm font-bold">They got what they wanted!</p>
                    </div>
                  )}
                </>
                ) : (
                <div className="w-full p-6 rounded-2xl border border-slate-700 bg-brand-surface mb-8">
                    <p className="text-slate-400 italic">Identity remains unknown...</p>
                </div>
                )}

                <Button onClick={closeRevealAndProceed} fullWidth className="py-4 text-lg">
                   Continue Mission
                </Button>
            </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex justify-between items-start mb-8">
         <div>
            <h2 className="text-brand-primary text-xs uppercase font-bold tracking-widest mb-1">Mission Status</h2>
            <div className="flex items-center gap-2 text-sm text-slate-400">
               {votingMode ? (
                  <span className="text-rose-500 font-bold animate-pulse">VOTING IN PROGRESS</span>
               ) : (
                 <>
                   <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse"></span>
                   Active
                 </>
               )}
            </div>
         </div>
         {deadPlayers.length > 0 && (
            <div className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold text-slate-400">
               {deadPlayers.length} ELIMINATED
            </div>
         )}
      </div>

      {/* Timer or Infinite Symbol */}
      <div className={`text-center mb-10 relative group transition-all duration-300 ${votingMode ? 'opacity-20 blur-sm' : 'opacity-100'}`}>
        {settings.timerDuration > 0 ? (
          <>
            <div 
              onClick={() => !votingMode && setTimerActive(!timerActive)}
              className={`text-7xl font-mono font-bold tabular-nums cursor-pointer select-none transition-colors duration-300 ${timeLeft < 30 ? 'text-brand-danger animate-pulse' : 'text-white'}`}
            >
              {formatTime(timeLeft)}
            </div>
            <p className="text-xs text-slate-600 mt-2 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              {timerActive ? 'Tap to Pause' : 'Tap to Resume'}
            </p>
          </>
        ) : (
          <div className="text-7xl text-slate-700 flex justify-center py-4">
             <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/></svg>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className={`bg-brand-card border border-slate-800 rounded-2xl p-5 mb-6 relative overflow-hidden transition-all duration-300 ${votingMode ? 'opacity-50 grayscale' : ''}`}>
        <div className="absolute top-0 right-0 p-3 opacity-10">
           <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="m3 9 3 3-3 3"/><path d="M14 8V7c0-1.1.9-2 2-2h6"/><path d="M14 12v-1"/><path d="M14 16v-1"/><path d="M14 20v-1c0-1.1.9-2 2-2h6"/></svg>
        </div>
        <p className="text-slate-500 text-xs uppercase font-bold mb-1">Current Category</p>
        <p className="text-brand-accent font-black text-2xl tracking-tight">{gameData.category}</p>
        <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between text-xs text-slate-400 font-mono">
           <span>IMPOSTERS: {settings.imposterCount}</span>
           <span>AGENTS: {activePlayers.length}</span>
        </div>
      </div>

      {/* Agents Grid (Combined) */}
      <div className="flex-1 overflow-y-auto mb-6">
         <h3 className="text-slate-500 font-bold mb-3 px-1 text-sm uppercase flex justify-between">
            <span>Personnel Roster</span>
            {votingMode && <span className="text-rose-500 animate-pulse">SELECT TARGET</span>}
         </h3>
         
         <div className="grid grid-cols-3 gap-2">
            {/* Render all players, preserving order or sorting dead to bottom */}
            {players.map(p => (
              <button 
                key={p.id}
                disabled={p.isDead || !votingMode}
                onClick={() => handleTapPlayer(p)}
                className={`relative py-4 px-2 rounded-lg flex items-center justify-center text-center border transition-all duration-200 
                   ${p.isDead 
                      ? 'bg-slate-900/50 border-slate-800 opacity-40' 
                      : votingMode 
                        ? 'bg-brand-card border-rose-500/50 hover:bg-rose-900/20 hover:scale-105 cursor-pointer animate-pulse-slow' 
                        : 'bg-brand-surface/50 border-slate-800/50'
                   }
                `}
              >
                 <span className={`text-sm font-bold truncate w-full ${p.isDead ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                    {p.name}
                 </span>
                 
                 {/* Dead Marker */}
                 {p.isDead && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <svg className="w-full h-full text-slate-700/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><line x1="0" y1="24" x2="24" y2="0"/></svg>
                     </div>
                 )}
              </button>
            ))}
         </div>
      </div>

      <Button 
        onClick={() => setVotingMode(!votingMode)} 
        fullWidth 
        variant={votingMode ? "secondary" : "danger"} 
        className={`shadow-lg py-4 transition-all ${votingMode ? 'border-slate-600' : 'shadow-brand-danger/20'}`}
      >
        {votingMode ? 'CANCEL VOTING' : 'VOTING PHASE'}
      </Button>
    </div>
  );

  function handleTapPlayer(p: Player) {
     if (votingMode && !p.isDead) {
        setSelectedPlayerId(p.id);
     }
  }
};
