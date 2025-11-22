
import React, { useState } from 'react';
import { GamePhase, Player, GameData, GameSettings, DEFAULT_SETTINGS } from './types';
import { SetupPhase } from './components/SetupPhase';
import { RevealPhase } from './components/RevealPhase';
import { PlayPhase } from './components/PlayPhase';
import { GameOverPhase } from './components/ResultPhase';
import { generateGameTopic } from './services/geminiService';

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.SETUP);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [winner, setWinner] = useState<'CREW' | 'IMPOSTER' | null>(null);

  // Initialize Game
  const startGame = async (names: string[], newSettings: GameSettings) => {
    setSettings(newSettings);
    setPhase(GamePhase.LOADING);

    // Generate Content
    const data = await generateGameTopic(newSettings.targetCategory);
    setGameData(data);

    // Assign Roles
    // Fisher-Yates Shuffle indices
    const indices = Array.from({ length: names.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    const imposterIndices = new Set(indices.slice(0, newSettings.imposterCount));

    const newPlayers: Player[] = names.map((name, idx) => ({
      id: crypto.randomUUID(),
      name,
      isImposter: imposterIndices.has(idx),
      isDead: false,
      avatarSeed: Math.floor(Math.random() * 1000)
    }));

    setPlayers(newPlayers);
    setPhase(GamePhase.REVEAL);
  };

  // Handle Player Death/Ejection directly from Play Phase
  const handlePlayerEjection = (ejectedPlayerId: string) => {
    const updatedPlayers = players.map(p => 
      p.id === ejectedPlayerId ? { ...p, isDead: true } : p
    );
    setPlayers(updatedPlayers);
    
    // Check Win Conditions
    const activeImposters = updatedPlayers.filter(p => p.isImposter && !p.isDead).length;
    const activeCrew = updatedPlayers.filter(p => !p.isImposter && !p.isDead).length;

    if (activeImposters === 0) {
      setWinner('CREW');
      setPhase(GamePhase.GAME_OVER);
    } else if (activeImposters >= activeCrew) {
      setWinner('IMPOSTER');
      setPhase(GamePhase.GAME_OVER);
    } 
    // Else: Game continues, state updated, PlayPhase re-renders with dead player crossed out
  };

  const resetGame = () => {
    setPlayers([]);
    setGameData(null);
    setWinner(null);
    setPhase(GamePhase.SETUP);
  };

  // Loading Screen
  if (phase === GamePhase.LOADING) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 bg-brand-dark">
        <div className="relative w-20 h-20">
           <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
           <div className="absolute inset-4 bg-brand-card rounded-full flex items-center justify-center animate-pulse">
             <span className="text-brand-accent text-xs font-mono">AI</span>
           </div>
        </div>
        <h2 className="text-xl font-bold text-white mt-8 animate-pulse">Constructing Mission</h2>
        <p className="text-slate-500 text-sm mt-2">Encrypting data streams...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-brand-dark text-slate-200 overflow-hidden">
      {phase === GamePhase.SETUP && (
        <SetupPhase onStartGame={startGame} />
      )}
      
      {phase === GamePhase.REVEAL && gameData && (
        <RevealPhase 
          players={players} 
          gameData={gameData} 
          settings={settings}
          onComplete={() => setPhase(GamePhase.PLAY)} 
        />
      )}

      {phase === GamePhase.PLAY && gameData && (
        <PlayPhase 
          players={players} 
          gameData={gameData} 
          settings={settings}
          onEject={handlePlayerEjection} 
        />
      )}

      {phase === GamePhase.GAME_OVER && gameData && winner && (
        <GameOverPhase 
          players={players} 
          gameData={gameData} 
          winner={winner}
          onReset={resetGame} 
        />
      )}
    </div>
  );
};

export default App;
