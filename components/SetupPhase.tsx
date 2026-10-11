import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/Button';
import { MIN_PLAYERS, MAX_PLAYERS, GameSettings, DEFAULT_SETTINGS, SanitizedClientState } from '../types';
import { WORD_BANK } from '../services/wordBank';
import { DiceIcon, RobotIcon, CategoryCard } from './ui/AnimatedIcons';
import imposterLogo from '../assets/IMPOSTER.png';

interface SetupPhaseProps {
  onStartGame: (names: string[], settings: GameSettings) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  currentTrackName: string;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  
  // Multiplayer props
  clientState?: SanitizedClientState | null;
  roomCodeFromUrl?: string | null;
  onCreateRoom?: (hostName: string, avatarSeed: number) => Promise<any>;
  onJoinRoom?: (roomCode: string, name: string, avatarSeed: number) => Promise<any>;
  onUpdateSettings?: (settings: GameSettings) => void;
  onStartMultiplayerGame?: () => void;
  onLeaveRoom?: () => void;
  multiplayerError?: string | null;
}

export const SetupPhase: React.FC<SetupPhaseProps> = ({
  onStartGame,
  isMuted,
  onToggleMute,
  currentTrackName,
  onNextTrack,
  onPrevTrack,
  clientState,
  roomCodeFromUrl,
  onCreateRoom,
  onJoinRoom,
  onUpdateSettings,
  onStartMultiplayerGame,
  onLeaveRoom,
  multiplayerError
}) => {
  // Mode selection: 'HOST' | 'JOIN' | 'PASS_PLAY'
  const [mode, setMode] = useState<'HOST' | 'JOIN' | 'PASS_PLAY'>(() => {
    return roomCodeFromUrl ? 'JOIN' : 'HOST';
  });

  // Host Form State
  const [hostName, setHostName] = useState('');
  // Join Form State
  const [joinCode, setJoinCode] = useState(roomCodeFromUrl || '');
  const [joinName, setJoinName] = useState('');
  
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Single Device Setup State
  const [activePlayers, setActivePlayers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (roomCodeFromUrl && !joinCode) {
      setJoinCode(roomCodeFromUrl);
      setMode('JOIN');
    }
  }, [roomCodeFromUrl]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostName.trim() || !onCreateRoom) return;
    setIsSubmitting(true);
    try {
      await onCreateRoom(hostName.trim(), Math.floor(Math.random() * 1000));
    } catch {}
    setIsSubmitting(false);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !joinName.trim() || !onJoinRoom) return;
    setIsSubmitting(true);
    try {
      await onJoinRoom(joinCode.trim().toUpperCase(), joinName.trim(), Math.floor(Math.random() * 1000));
    } catch {}
    setIsSubmitting(false);
  };

  const copyRoomCode = () => {
    if (clientState?.roomCode) {
      navigator.clipboard.writeText(clientState.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const copyShareLink = () => {
    if (clientState?.roomCode) {
      const url = `${window.location.origin}${window.location.pathname}?room=${clientState.roomCode}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const isHost = clientState?.players.find(p => p.id === clientState.myPlayerId)?.isHost;

  // ----------------------------------------------------
  // RENDER MULTIPLAYER ROOM LOBBY (WHEN IN ROOM)
  // ----------------------------------------------------
  if (clientState && clientState.phase === 'LOBBY') {
    return (
      <div className="h-full w-full flex flex-col items-center justify-between p-4 md:p-6 overflow-y-auto bg-transparent relative z-10 text-slate-200">
        
        {/* Header Logo & Room Code */}
        <div className="w-full max-w-2xl text-center space-y-3 pt-2">
          <img src={imposterLogo} alt="The Imposter Syndrome" className="h-12 md:h-16 mx-auto object-contain drop-shadow-md" />
          
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-full">
              MULTIPLAYER ROOM LOBBY
            </span>
            
            <div className="flex items-center gap-3 bg-slate-900/90 border border-cyan-500/40 rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-md">
              <span className="text-xs font-mono text-slate-400">ROOM CODE:</span>
              <span className="text-2xl font-black font-mono tracking-widest text-cyan-300">
                {clientState.roomCode}
              </span>
              
              <div className="flex gap-1.5 ml-2">
                <button
                  onClick={copyRoomCode}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 border border-slate-700 transition-all"
                >
                  {copiedCode ? '✓ Copied' : 'Copy Code'}
                </button>
                <button
                  onClick={copyShareLink}
                  className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-mono text-white transition-all shadow-md"
                >
                  {copiedLink ? '✓ Copied' : 'Share Link 🔗'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Room Players Roster & Host Settings */}
        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          
          {/* Active Player Roster */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                PLAYERS ({clientState.players.length} / 15)
              </span>
              <span className="text-[10px] font-mono text-cyan-400">
                MIN 3 REQUIRED
              </span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {clientState.players.map(p => {
                const isMe = p.id === clientState.myPlayerId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isMe
                        ? 'border-cyan-500/50 bg-cyan-950/30 text-white'
                        : 'border-slate-800/80 bg-slate-800/40 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-cyan-400 text-xs">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                          p.isConnected ? 'bg-emerald-500' : 'bg-slate-500'
                        }`} />
                      </div>
                      <span className="font-bold text-sm">
                        {p.name} {isMe && '(You)'}
                      </span>
                    </div>

                    {p.isHost && (
                      <span className="text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 font-bold">
                        👑 HOST
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settings Overview */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                GAME CONFIGURATION
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {isHost ? 'Host Config' : 'View Only'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono">Imposters:</span>
                {isHost && onUpdateSettings ? (
                  <select
                    value={clientState.settings.imposterCount}
                    onChange={e => onUpdateSettings({ ...clientState.settings, imposterCount: parseInt(e.target.value) })}
                    className="bg-slate-800 text-cyan-300 border border-slate-700 rounded-lg px-2 py-1 font-mono font-bold"
                  >
                    <option value={1}>1 Imposter</option>
                    <option value={2}>2 Imposters</option>
                    <option value={3}>3 Imposters</option>
                  </select>
                ) : (
                  <span className="font-bold text-cyan-300 font-mono">{clientState.settings.imposterCount}</span>
                )}
              </div>

              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono">Category:</span>
                {isHost && onUpdateSettings ? (
                  <select
                    value={clientState.settings.targetCategory}
                    onChange={e => onUpdateSettings({ ...clientState.settings, targetCategory: e.target.value })}
                    className="bg-slate-800 text-cyan-300 border border-slate-700 rounded-lg px-2 py-1 font-mono font-bold max-w-[140px]"
                  >
                    <option value="LOCAL_RANDOM">🎲 Random Category</option>
                    {Object.keys(WORD_BANK).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  <span className="font-bold text-cyan-300 font-mono">{clientState.settings.targetCategory}</span>
                )}
              </div>

              <div className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-mono">Jester Role:</span>
                {isHost && onUpdateSettings ? (
                  <input
                    type="checkbox"
                    checked={clientState.settings.extraRoles.jesterEnabled}
                    onChange={e => onUpdateSettings({
                      ...clientState.settings,
                      extraRoles: { ...clientState.settings.extraRoles, jesterEnabled: e.target.checked }
                    })}
                    className="w-4 h-4 accent-cyan-500 cursor-pointer"
                  />
                ) : (
                  <span className="font-bold text-amber-300 font-mono">
                    {clientState.settings.extraRoles.jesterEnabled ? 'ENABLED 🃏' : 'DISABLED'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="w-full max-w-2xl flex gap-3 pt-2">
          <button
            onClick={onLeaveRoom}
            className="w-1/3 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider border border-slate-700 transition-all cursor-pointer"
          >
            Leave Room
          </button>

          {isHost ? (
            <button
              disabled={clientState.players.length < 3 || !onStartMultiplayerGame}
              onClick={onStartMultiplayerGame}
              className="w-2/3 py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
            >
              Start Game 🚀 ({clientState.players.length}/15)
            </button>
          ) : (
            <div className="w-2/3 py-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 text-center text-xs font-mono text-cyan-300 flex items-center justify-center animate-pulse">
              Waiting for Host to start game...
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER SETUP FORM (HOST / JOIN / SINGLE-DEVICE SETUP)
  // ----------------------------------------------------
  return (
    <div className="h-full w-full flex flex-col items-center justify-between p-4 md:p-6 overflow-y-auto bg-transparent relative z-10 text-slate-200">
      
      {/* Header */}
      <div className="w-full max-w-md text-center space-y-3 pt-2">
        <img src={imposterLogo} alt="The Imposter Syndrome" className="h-14 md:h-16 mx-auto object-contain drop-shadow-md" />
        <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
          ONLINE MULTIPLAYER ENGINE
        </p>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-slate-900/90 border border-slate-800 rounded-2xl p-1 shadow-xl">
          <button
            onClick={() => setMode('HOST')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'HOST' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setMode('JOIN')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'JOIN' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Join Room
          </button>
          <button
            onClick={() => setMode('PASS_PLAY')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'PASS_PLAY' ? 'bg-slate-800 text-slate-200 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pass & Play
          </button>
        </div>
      </div>

      {multiplayerError && (
        <div className="w-full max-w-md bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono p-3 rounded-xl text-center animate-fadeIn">
          ⚠️ {multiplayerError}
        </div>
      )}

      {/* Mode 1: Host Room Form */}
      {mode === 'HOST' && (
        <form onSubmit={handleCreateRoom} className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-md">
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              Host Player Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Captain Alex"
              value={hostName}
              onChange={e => setHostName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-cyan-500 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!hostName.trim() || isSubmitting}
            className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
          >
            {isSubmitting ? 'Creating Room...' : 'Create Room 🌐'}
          </button>
        </form>
      )}

      {/* Mode 2: Join Room Form */}
      {mode === 'JOIN' && (
        <form onSubmit={handleJoinRoom} className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-md">
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              4-Character Room Code
            </label>
            <input
              type="text"
              required
              maxLength={9}
              placeholder="e.g. IMPS-8291"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-cyan-300 font-mono text-center text-lg font-black uppercase tracking-widest focus:border-cyan-500 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
              Your Player Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Detective Sarah"
              value={joinName}
              onChange={e => setJoinName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-cyan-500 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!joinCode.trim() || !joinName.trim() || isSubmitting}
            className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-sm font-bold uppercase tracking-wider shadow-lg shadow-cyan-950/50 transition-all cursor-pointer"
          >
            {isSubmitting ? 'Joining Room...' : 'Join Room 🚪'}
          </button>
        </form>
      )}

      {/* Mode 3: Single Device (Pass & Play Fallback) */}
      {mode === 'PASS_PLAY' && (
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 backdrop-blur-md text-center">
          <p className="text-xs text-slate-400">
            Pass single device around to reveal roles locally.
          </p>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter player name..."
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && inputValue.trim()) {
                  setActivePlayers(prev => [...prev, inputValue.trim()]);
                  setInputValue('');
                }
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none"
            />
            
            <div className="flex flex-wrap gap-2 justify-center py-2 max-h-[120px] overflow-y-auto">
              {activePlayers.map((name, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-slate-800 text-cyan-300 text-xs font-mono">
                  {name}
                </span>
              ))}
            </div>
          </div>

          <button
            disabled={activePlayers.length < MIN_PLAYERS}
            onClick={() => onStartGame(activePlayers, settings)}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider transition-all"
          >
            Start Single Device Game ({activePlayers.length}/15)
          </button>
        </div>
      )}

      <div className="text-[10px] font-mono text-slate-500 text-center py-2">
        The Imposter Syndrome • Online Multiplayer Engine v2.0
      </div>
    </div>
  );
};
