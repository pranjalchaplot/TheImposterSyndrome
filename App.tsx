/// <reference types="vite/client" />
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GamePhase, Player, GameData, GameSettings, DEFAULT_SETTINGS } from './types';
import { SetupPhase } from './components/SetupPhase';
import { RevealPhase } from './components/RevealPhase';
import { PlayPhase } from './components/PlayPhase';
import { VotePhase } from './components/VotePhase';
import { GameOverPhase } from './components/ResultPhase';
import { SecretDossier } from './components/SecretDossier';
import { useMultiplayerGame } from './hooks/useMultiplayerGame';
import { generateGameTopic } from './services/geminiService';
import backgroundVideo from './assets/videos/udaipur_b-roll.mp4';

// Dynamically import all audio files from bgm_radio folder
const bgmModules = import.meta.glob('./assets/audios/bgm_radio/*.{wav,mp3,ogg}', { as: 'url', eager: true });
const BGM_TRACKS = Object.values(bgmModules) as string[];

const App: React.FC = () => {
  // Multiplayer custom hook
  const multiplayer = useMultiplayerGame();
  const { clientState } = multiplayer;

  // Single-device fallback state
  const [localPhase, setLocalPhase] = useState<GamePhase>(GamePhase.SETUP);
  const [localPlayers, setLocalPlayers] = useState<Player[]>([]);
  const [localGameData, setLocalGameData] = useState<GameData | null>(null);
  const [localSettings, setLocalSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [localWinner, setLocalWinner] = useState<'CREW' | 'IMPOSTER' | 'JESTER' | null>(null);

  // BGM Radio
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try { return localStorage.getItem('bgm_muted') === 'true'; } catch { return false; }
  });
  const [currentTrackName, setCurrentTrackName] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackIndexRef = useRef(0);
  const shuffledTracks = useRef<string[]>([...BGM_TRACKS].sort(() => Math.random() - 0.5));

  const getTrackName = (src: string) => {
    try {
      let name = src.split('/').pop() || '';
      name = name.split('?')[0];
      name = decodeURIComponent(name);
      return name.replace(/\.\w+$/, '');
    } catch {
      return 'Unknown Track';
    }
  };

  const playNextTrack = useCallback(() => {
    trackIndexRef.current = (trackIndexRef.current + 1) % shuffledTracks.current.length;
    const audio = audioRef.current;
    const src = shuffledTracks.current[trackIndexRef.current];
    if (audio) {
      audio.src = src;
      audio.play().catch(() => {});
    }
    setCurrentTrackName(getTrackName(src));
  }, []);

  const playPrevTrack = useCallback(() => {
    trackIndexRef.current = (trackIndexRef.current - 1 + shuffledTracks.current.length) % shuffledTracks.current.length;
    const audio = audioRef.current;
    const src = shuffledTracks.current[trackIndexRef.current];
    if (audio) {
      audio.src = src;
      audio.play().catch(() => {});
    }
    setCurrentTrackName(getTrackName(src));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const firstSrc = shuffledTracks.current[0];
    setCurrentTrackName(getTrackName(firstSrc));

    const startOnInteraction = () => {
      audio.play().catch(() => {});
      window.removeEventListener('pointerdown', startOnInteraction);
    };
    audio.play().catch(() => {
      window.addEventListener('pointerdown', startOnInteraction);
    });
    return () => window.removeEventListener('pointerdown', startOnInteraction);
  }, []);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio && audio.paused) {
      audio.play().catch(() => {});
    }
    setIsMuted(prev => {
      const next = !prev;
      try { localStorage.setItem('bgm_muted', String(next)); } catch {}
      return next;
    });
  };

  // Single-device local start
  const startSingleDeviceGame = async (names: string[], newSettings: GameSettings) => {
    setLocalSettings(newSettings);
    setLocalPhase(GamePhase.LOADING);

    const data = await generateGameTopic(newSettings.targetCategory, newSettings.enableAdultMode);
    setLocalGameData(data);

    const indices = Array.from({ length: names.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    const imposterIndices = new Set(indices.slice(0, newSettings.imposterCount));
    let jesterIndex: number | null = null;
    if (newSettings.extraRoles.jesterEnabled) {
      const nonImposterIndices = indices.filter(idx => !imposterIndices.has(idx));
      if (nonImposterIndices.length > 0) {
        jesterIndex = nonImposterIndices[Math.floor(Math.random() * nonImposterIndices.length)];
      }
    }

    const newPlayers: Player[] = names.map((name, idx) => ({
      id: crypto.randomUUID(),
      name,
      isImposter: imposterIndices.has(idx),
      isDead: false,
      avatarSeed: Math.floor(Math.random() * 1000),
      extraRole: idx === jesterIndex ? 'JESTER' : null
    }));

    setLocalPlayers(newPlayers);
    setLocalPhase(GamePhase.REVEAL);
  };

  // Determine current active phase
  const currentPhase = clientState ? clientState.phase : localPhase;

  return (
    <div className="h-full w-full bg-brand-dark text-slate-200 overflow-hidden relative">
      {/* Background Video Layer */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-contain z-0 opacity-60 pointer-events-none"
        style={{ objectPosition: 'center center' }}
      >
        <source src={backgroundVideo} type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 z-[1] bg-black/75 pointer-events-none" />

      {/* BGM audio element */}
      <audio
        id="bgm-player-element"
        ref={audioRef}
        src={shuffledTracks.current[0]}
        muted={isMuted}
        onEnded={playNextTrack}
        style={{ display: 'none' }}
      />

      {/* Floating Secret Dossier Card for active multiplayer players */}
      {clientState && (clientState.phase === GamePhase.REVEAL || clientState.phase === GamePhase.PLAY || clientState.phase === GamePhase.VOTING || clientState.phase === GamePhase.ROUND_RESULT) && (
        <SecretDossier clientState={clientState} />
      )}

      {/* Main View Manager */}
      <div className="relative z-10 w-full h-full overflow-hidden">
        
        {/* Loading Screen */}
        {currentPhase === GamePhase.LOADING && (
          <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-transparent">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-4 bg-slate-900 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-cyan-400 text-xs font-mono">AI</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mt-8 animate-pulse">Constructing Mission</h2>
            <p className="text-slate-400 text-sm mt-2">Encrypting data streams & role assignments...</p>
          </div>
        )}

        {/* Setup / Lobby Screen */}
        {(currentPhase === GamePhase.SETUP || currentPhase === GamePhase.LOBBY) && (
          <SetupPhase
            onStartGame={startSingleDeviceGame}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            currentTrackName={currentTrackName}
            onNextTrack={playNextTrack}
            onPrevTrack={playPrevTrack}
            clientState={clientState}
            roomCodeFromUrl={multiplayer.roomCodeFromUrl}
            onCreateRoom={multiplayer.createRoom}
            onJoinRoom={multiplayer.joinRoom}
            onUpdateSettings={multiplayer.updateSettings}
            onStartMultiplayerGame={multiplayer.startGame}
            onLeaveRoom={multiplayer.leaveRoom}
            multiplayerError={multiplayer.error}
          />
        )}

        {/* Reveal Phase */}
        {currentPhase === GamePhase.REVEAL && (
          <RevealPhase
            clientState={clientState}
            onStartPlay={multiplayer.startPlay}
            players={localPlayers}
            gameData={localGameData}
            settings={localSettings}
            onComplete={() => setLocalPhase(GamePhase.PLAY)}
          />
        )}

        {/* Play / Discussion Phase */}
        {currentPhase === GamePhase.PLAY && (
          <PlayPhase
            clientState={clientState}
            onInitiateVote={multiplayer.initiateVote}
            players={localPlayers}
            gameData={localGameData}
            settings={localSettings}
          />
        )}

        {/* Simultaneous Secret Voting & Round Result Phase */}
        {(currentPhase === GamePhase.VOTING || currentPhase === GamePhase.ROUND_RESULT) && clientState && (
          <VotePhase
            clientState={clientState}
            onCastVote={multiplayer.castVote}
            onNextRound={multiplayer.nextRound}
          />
        )}

        {/* Game Over Phase */}
        {currentPhase === GamePhase.GAME_OVER && (
          <GameOverPhase
            clientState={clientState}
            onRestartLobby={multiplayer.restartLobby}
            players={localPlayers}
            gameData={localGameData}
            winner={localWinner || 'CREW'}
            onReset={() => setLocalPhase(GamePhase.SETUP)}
          />
        )}
      </div>
    </div>
  );
};

export default App;
