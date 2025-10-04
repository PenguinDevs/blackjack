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
  // Betting constants
  MIN_BET: 5,
  MAX_BET: 1000,
  BET_INCREMENT_SMALL: 5,
  BET_INCREMENT_MEDIUM: 25,
  BET_INCREMENT_LARGE: 100,

  // Payout constants
  BLACKJACK_PAYOUT: 1.5, // 3:2
  STANDARD_PAYOUT: 1, // 1:1

  // Game rules constants
  DEALER_STAND_VALUE: 17,
  BLACKJACK_VALUE: 21,
  DECK_SIZE: 52,
  INITIAL_CARDS_DEALT: 4, // 2 to player, 2 to dealer
  CARDS_REMAINING_AFTER_DEAL: 48, // 52 - 4

  // Card value constants
  ACE_HIGH_VALUE: 11,
  ACE_LOW_VALUE: 1,
  FACE_CARD_VALUE: 10,

  // Common card values for testing
  CARD_VALUE_5: 5,
  CARD_VALUE_7: 7,
  CARD_VALUE_8: 8,
  CARD_VALUE_9: 9,

  // Common hand values for testing
  SOFT_16: 16, // 10 + 5 + A(1)
  BUST_25: 25, // 10 + 8 + 7
  DEALER_19: 19, // 10 + 9
  PLAYER_20: 20,

  // Payout calculations
  BLACKJACK_WINNINGS: 250, // 100 bet + 150 (3:2 payout)

  // Default values
  INITIAL_BET_AMOUNT: 100,
} as const

/**
 * Player action constants
 */
export const PLAYER_ACTIONS = {
  HIT: 'hit' as const,
  STAND: 'stand' as const,
} as const

/**
 * AI confidence level constants
 */
export const AI_CONSTANTS = {
  CONFIDENCE_HIGH: 0.95,
  CONFIDENCE_MEDIUM_HIGH: 0.9,
  CONFIDENCE_MEDIUM: 0.85,
  CONFIDENCE_MEDIUM_LOW: 0.8,
  CONFIDENCE_PERFECT: 1.0,
  DEFAULT_CONFIDENCE: 0.9,
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
