import { Card, Suit, Rank, BlackjackGameState } from '../types'

/**
 * Utility functions for blackjack game
 */

export class GameUtils {
  /**
   * Format card for display (e.g., "Ace of Hearts", "10 of Spades")
   */
  static formatCardName(card: Card): string {
    const rankName = this.getRankName(card.rank)
    const suitName = this.getSuitName(card.suit)
    return `${rankName} of ${suitName}`
  }

  /**
   * Get readable rank name
   */
  static getRankName(rank: Rank): string {
    switch (rank) {
      case 'A': return 'Ace'
      case 'J': return 'Jack'
      case 'Q': return 'Queen'
      case 'K': return 'King'
      default: return rank
    }
  }

  /**
   * Get readable suit name
   */
  static getSuitName(suit: Suit): string {
    switch (suit) {
      case 'hearts': return 'Hearts'
      case 'diamonds': return 'Diamonds'
      case 'clubs': return 'Clubs'
      case 'spades': return 'Spades'
      default: return suit
    }
  }

  /**
   * Get Unicode symbol for card suit
   */
  static getSuitSymbol(suit: Suit): string {
    switch (suit) {
      case 'hearts': return '♥'
      case 'diamonds': return '♦'
      case 'clubs': return '♣'
      case 'spades': return '♠'
      default: return ''
    }
  }

  /**
   * Get color class for card suit
   */
  static getSuitColor(suit: Suit): 'red' | 'black' {
    return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black'
  }

  /**
   * Format credits/money display
   */
  static formatCredits(amount: number): string {
    return amount.toLocaleString()
  }

  /**
   * Calculate win percentage
   */
  static calculateWinRate(wins: number, totalGames: number): number {
    if (totalGames === 0) return 0
    return Math.round((wins / totalGames) * 100 * 100) / 100 // Round to 2 decimal places
  }

  /**
   * Format time duration (for game timer)
   */
  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Generate hand description for accessibility
   */
  static describeHand(cards: Card[]): string {
    if (cards.length === 0) return 'Empty hand'
    
    const visibleCards = cards.filter(card => !card.isHidden)
    if (visibleCards.length === 0) return 'Hidden cards'
    
    const cardNames = visibleCards.map(card => this.formatCardName(card))
    
    if (cardNames.length === 1) {
      return cardNames[0]
    } else if (cardNames.length === 2) {
      return `${cardNames[0]} and ${cardNames[1]}`
    } else {
      const lastCard = cardNames.pop()
      return `${cardNames.join(', ')}, and ${lastCard}`
    }
  }

  /**
   * Validate bet amount
   */
  static validateBet(amount: number, minBet: number, maxBet: number, availableCredits: number): {
    isValid: boolean
    error?: string
  } {
    if (amount < minBet) {
      return {
        isValid: false,
        error: `Minimum bet is ${this.formatCredits(minBet)} credits`
      }
    }
    
    if (amount > maxBet) {
      return {
        isValid: false,
        error: `Maximum bet is ${this.formatCredits(maxBet)} credits`
      }
    }
    
    if (amount > availableCredits) {
      return {
        isValid: false,
        error: `Insufficient credits. You have ${this.formatCredits(availableCredits)} credits`
      }
    }
    
    return { isValid: true }
  }

  /**
   * Generate game summary
   */
  static generateGameSummary(playerCards: Card[], dealerCards: Card[], result: {
    playerWins: boolean
    isDraw: boolean
    winnings: number
    reason: string
  }): string {
    const playerHand = this.describeHand(playerCards)
    const dealerHand = this.describeHand(dealerCards.map(c => ({ ...c, isHidden: false })))
    
    let summary = `Player had: ${playerHand}\n`
    summary += `Dealer had: ${dealerHand}\n`
    summary += `Result: ${result.reason}\n`
    
    if (result.playerWins) {
      summary += `You won ${this.formatCredits(result.winnings)} credits!`
    } else if (result.isDraw) {
      summary += `Push - ${this.formatCredits(result.winnings)} credits returned`
    } else {
      summary += 'You lost this round'
    }
    
    return summary
  }

  /**
   * Get hand strength description for UI
   */
  static getHandStrengthDescription(cards: Card[], value: number): string {
    if (value > 21) return 'Busted'
    if (cards.length === 2 && value === 21) return 'Blackjack!'
    if (value === 21) return 'Twenty-One'
    if (value >= 17) return 'Strong Hand'
    if (value >= 12) return 'Decent Hand'
    return 'Weak Hand'
  }

  /**
   * Calculate optimal strategy hint (basic strategy)
   */
  static getBasicStrategyHint(playerValue: number, dealerUpCard: number, playerHasSoftAce: boolean): string {
    // Simplified basic strategy hints
    if (playerValue < 12) return 'Hit'
    if (playerValue > 16) return 'Stand'
    
    if (playerHasSoftAce) {
      if (playerValue <= 17) return 'Hit'
      return 'Stand'
    }
    
    // Hard totals
    if (playerValue <= 11) return 'Hit'
    if (playerValue === 12 && [2, 3, 7, 8, 9, 10, 11].includes(dealerUpCard)) return 'Hit'
    if (playerValue === 12) return 'Stand'
    if (playerValue <= 16 && dealerUpCard >= 7) return 'Hit'
    if (playerValue <= 16 && dealerUpCard <= 6) return 'Stand'
    
    return 'Stand'
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
  FACE_CARD_VALUE: 10
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
  STAGGER_DELAY: 150
} as const