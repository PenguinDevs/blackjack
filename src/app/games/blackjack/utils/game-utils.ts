// Utility constants and classes for blackjack game

/**
 * Utility functions for blackjack game
 */

export class GameUtils {
  // All utility functions removed - they were not being used in the current implementation
  // Card display logic is handled directly in components where needed
}

/**
 * Constants for game configuration
 */
export const GAME_CONSTANTS = {
  MIN_BET: 5,
  MAX_BET: 1000,
  BLACKJACK_PAYOUT: 1.5, // 3:2
  STANDARD_PAYOUT: 1, // 1:1
  DEALER_STAND_VALUE: 17,
  BLACKJACK_VALUE: 21,
  ACE_HIGH_VALUE: 11,
  ACE_LOW_VALUE: 1,
  FACE_CARD_VALUE: 10,
} as const

/**
 * Animation timing constants
 */
export const ANIMATION_TIMINGS = {
  CARD_DEAL: 600,
  CARD_FLIP: 400,
  BETTING_MODAL: 500,
  HAND_UPDATE: 300,
  RESULT_DISPLAY: 800,
  STAGGER_DELAY: 150,
} as const

/**
 * Default game state constants
 */
export const GAME_DEFAULTS = {
  EMPTY_HAND: { cards: [], value: 0, isBusted: false, isBlackjack: false } as const,
  INITIAL_BET_AMOUNT: 100,
} as const

/**
 * Create a new empty hand
 */
export function createEmptyHand() {
  return { cards: [], value: 0, isBusted: false, isBlackjack: false }
}

/**
 * Game result processing utility
 */
export interface GameResultProcessor {
  addCredits: (amount: number) => Promise<boolean>
  recordGameResult: (
    bet: number,
    winnings: number,
    result: 'win' | 'lose' | 'push'
  ) => Promise<unknown>
}

export class GameResultHandler {
  static async processGameResult(
    gameResult: {
      winnings: number
      playerWins: boolean
      isDraw: boolean
    },
    currentBet: number,
    processor: GameResultProcessor
  ): Promise<{ success: boolean; error?: string }> {
    const { winnings, playerWins, isDraw } = gameResult
    const result = playerWins ? 'win' : isDraw ? 'push' : 'lose'

    try {
      // Award winnings immediately with optimistic update
      if (winnings > 0) {
        const success = await processor.addCredits(winnings)
        if (!success) {
          return { success: false, error: 'Failed to award winnings' }
        }
      }

      // Record game result for statistics (non-blocking)
      processor.recordGameResult(currentBet, winnings, result).catch((error) => {
        console.warn('Failed to record game statistics:', error)
      })

      return { success: true }
    } catch (error) {
      console.error('Error processing game result:', error)
      return { success: false, error: 'Failed to process game result' }
    }
  }
}
