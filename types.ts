
export enum GamePhase {
  SETUP = 'SETUP',
  LOADING = 'LOADING',
  REVEAL = 'REVEAL',
  PLAY = 'PLAY',
  GAME_OVER = 'GAME_OVER' // Final winner
}

export type ExtraRole = 'JESTER' | null;

export interface GameSettings {
  timerDuration: number; // in seconds, 0 = no timer
  imposterCount: number;
  revealRoleOnDeath: boolean;
  imposterTeaming: boolean; // If true, imposters see each other
  // If empty -> AI Random
  // If "LOCAL_RANDOM" -> Local Random
  // If matches key in WORD_BANK -> Local Specific
  // Else -> AI Custom Prompt
  targetCategory: string;
  extraRoles: {
    jesterEnabled: boolean;
  };
}

export interface Player {
  id: string;
  name: string;
  isImposter: boolean;
  isDead: boolean;
  avatarSeed: number;
  extraRole: ExtraRole;
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
  imposterTeaming: false, // Default: Disabled
  targetCategory: "LOCAL_RANDOM", // Default: Offline Deck
  extraRoles: {
    jesterEnabled: false
  }
};
