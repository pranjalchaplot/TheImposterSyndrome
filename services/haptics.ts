/**
 * Haptic feedback utility utilizing the Web Vibration API.
 * Follows Appllama Haptic Fidelity laws:
 * - Selection tick for small taps/switches (10-15ms)
 * - Light impact for confirming or adding (25ms)
 * - Medium impact for reveals/flips (40ms)
 * - Warning/error for ejections or classified alarms ([40, 60, 40]ms)
 * Safely no-ops on devices without vibration support or when vibration is blocked.
 */

export const triggerHaptic = (pattern: number | number[] = 15): void => {
  try {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // Graceful degradation when vibration is unsupported or disabled
  }
};

export const haptics = {
  /** Light selection tick for tabs, counters, toggles */
  tick: () => triggerHaptic(12),
  
  /** Light impact when adding a player, saving a setting */
  tap: () => triggerHaptic(20),
  
  /** Snappy pulse for button presses and major state shifts */
  impact: () => triggerHaptic(35),
  
  /** Biometric scanning vibration pulse */
  scanPulse: () => triggerHaptic([15, 30, 15]),
  
  /** Dramatic decryption or card reveal */
  reveal: () => triggerHaptic([30, 40, 50]),
  
  /** High alert for Imposter ejection or emergency */
  alarm: () => triggerHaptic([50, 70, 50, 70, 90]),
  
  /** Success chime vibration */
  success: () => triggerHaptic([20, 40, 30]),
};
