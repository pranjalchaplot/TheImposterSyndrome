import { GameData } from '../types';

export const FALLBACK_TOPICS: GameData[] = [
  { category: "Kitchen", word: "Toaster" },
  { category: "School", word: "Blackboard" },
  { category: "Beach", word: "Sandcastle" },
  { category: "Space", word: "Black Hole" },
  { category: "Zoo", word: "Giraffe" },
  { category: "Hospital", word: "Stethoscope" },
  { category: "Cinema", word: "Popcorn" },
  { category: "Bathroom", word: "Toothbrush" },
  { category: "Airport", word: "Passport" },
  { category: "Gym", word: "Treadmill" }
];

export const getRandomFallback = (): GameData => {
  return FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)];
};