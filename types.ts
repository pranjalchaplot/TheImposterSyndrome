export enum GamePhase {
  SETUP = 'SETUP',               // Join / Host screen
  LOBBY = 'LOBBY',               // Inside room, waiting to start
  LOADING = 'LOADING',           // AI/Bank content generation
  REVEAL = 'REVEAL',             // Secret dossier role & word reveal
  PLAY = 'PLAY',                 // Discussion phase & timer
  VOTING = 'VOTING',             // Real-time simultaneous secret voting
  ROUND_RESULT = 'ROUND_RESULT', // Ejection / Vote tally announcement
  GAME_OVER = 'GAME_OVER'        // Game completed, all roles revealed
}

export type ExtraRole = 'JESTER' | null;

export interface GameSettings {
  timerDuration: number; // in seconds, 0 = no timer
  imposterCount: number;
  revealRoleOnDeath: boolean;
  imposterTeaming: boolean; // If true, imposters see each other
  targetCategory: string;
  extraRoles: {
    jesterEnabled: boolean;
  };
  enableAdultMode: boolean;
}

export interface Player {
  id: string;
  name: string;
  isImposter?: boolean;
  isDead: boolean;
  avatarSeed: number;
  extraRole?: ExtraRole;
  isHost?: boolean;
  isConnected?: boolean;
  hasVoted?: boolean;
  role?: 'CREW' | 'IMPOSTER' | 'JESTER';
}

export interface SanitizedPlayer {
  id: string;
  name: string;
  avatarSeed: number;
  isHost: boolean;
  isConnected: boolean;
  isDead: boolean;
  hasVoted: boolean;
  role?: 'CREW' | 'IMPOSTER' | 'JESTER'; // Masked unless own role, revealed teammate, or GAME_OVER
}

export interface VoteSummary {
  votes: Record<string, number>; // targetPlayerId or 'SKIP' -> count
  totalVotesCast: number;
  totalActivePlayers: number;
  ejectedPlayerId: string | 'SKIP' | 'TIE' | null;
  ejectedPlayerName?: string;
  outcomeText: string;
}

export interface SanitizedClientState {
  roomCode: string;
  phase: GamePhase;
  myPlayerId: string;
  players: SanitizedPlayer[];
  settings: GameSettings;
  category: string | null;
  secretWord: string | null; // NULL for Imposter and Jester! Zero-leakage guarantee.
  myRole: 'CREW' | 'IMPOSTER' | 'JESTER' | null;
  teammates: string[]; // List of imposter teammate names if imposterTeaming is enabled
  timerRemaining: number;
  winner: 'CREW' | 'IMPOSTER' | 'JESTER' | null;
  ejectedPlayer: { id: string; name: string; isImposter?: boolean; extraRole?: ExtraRole } | null;
  voteSummary: VoteSummary | null;
  trueGameData: GameData | null; // Only populated on GAME_OVER
}

export interface GameData {
  category: string;
  word: string;
}

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 15;

export const DEFAULT_SETTINGS: GameSettings = {
  timerDuration: 0, // Default: No Timer
  imposterCount: 1,
  revealRoleOnDeath: true,
  imposterTeaming: false,
  targetCategory: "LOCAL_RANDOM",
  extraRoles: {
    jesterEnabled: false
  },
  enableAdultMode: false
};
