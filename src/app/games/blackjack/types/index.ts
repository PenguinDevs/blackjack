export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  suit: Suit
  rank: Rank
  value: number // Actual value (Ace can be 1 or 11)
  isHidden?: boolean // For dealer's hole card
}

export interface Hand {
  cards: Card[]
  value: number
  isBusted: boolean
  isBlackjack: boolean
  isSoft: boolean // Contains Ace counted as 11
}

export type GameState =
  | 'waiting' // Waiting for bet
  | 'betting' // Player placing bet
  | 'dealing' // Initial cards being dealt
  | 'player-turn' // Player's turn to act
  | 'dealer-turn' // Dealer's turn to act
  | 'game-over' // Round completed

export type PlayerAction = 'hit' | 'stand'

export interface GameResult {
  playerWins: boolean
  isDraw: boolean
  winnings: number
  reason: string
}

export interface BlackjackGameState {
  gameState: GameState
  playerHand: Hand
  dealerHand: Hand
  currentBet: number
  availableActions: PlayerAction[]
  gameResult?: GameResult
  deck: Card[]
}

export interface BettingState {
  amount: number
  showBettingOptions: boolean
  isPlacingBet: boolean
}

// Animation-related types
export interface AnimationConfig {
  duration: number
  ease: string
  delay?: number
}

export interface CardAnimation {
  element: HTMLElement
  from: { x: number; y: number; rotation: number }
  to: { x: number; y: number; rotation: number }
  config: AnimationConfig
}
