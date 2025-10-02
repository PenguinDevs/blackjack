import { Card, Hand, Suit, Rank, BlackjackGameState, GameState, PlayerAction, GameResult } from '../types'

/**
 * Server-side Blackjack game logic
 * Handles game state, card dealing, scoring
 */
export class BlackjackEngine {
  private static readonly DECK_SIZE = 52
  private static readonly SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
  private static readonly RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

  /**
   * Creates a new shuffled deck of cards
   */
  static createDeck(): Card[] {
    const deck: Card[] = []
    
    for (const suit of this.SUITS) {
      for (const rank of this.RANKS) {
        deck.push({
          suit,
          rank,
          value: this.getCardValue(rank),
          isHidden: false
        })
      }
    }
    
    return this.shuffleDeck(deck)
  }

  /**
   * Gets the base value of a card (Aces default to 11)
   */
  private static getCardValue(rank: Rank): number {
    switch (rank) {
      case 'A':
        return 11
      case 'K':
      case 'Q':
      case 'J':
        return 10
      default:
        return parseInt(rank)
    }
  }

  /**
   * Shuffles deck using Fisher-Yates algorithm
   */
  private static shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  /**
   * Calculates hand value, handling Aces appropriately
   */
  static calculateHandValue(cards: Card[]): { value: number; isSoft: boolean; isBusted: boolean; isBlackjack: boolean } {
    let value = 0
    let aces = 0
    let isSoft = false

    // Count non-ace cards first
    for (const card of cards) {
      if (!card.isHidden) {
        if (card.rank === 'A') {
          aces++
        } else {
          value += card.value
        }
      }
    }

    // Handle aces
    for (let i = 0; i < aces; i++) {
      if (value + 11 <= 21) {
        value += 11
        isSoft = true
      } else {
        value += 1
      }
    }

    const isBusted = value > 21
    const isBlackjack = cards.length === 2 && value === 21 && !cards.some(c => c.isHidden)

    return { value, isSoft, isBusted, isBlackjack }
  }

  /**
   * Creates a new hand from cards
   */
  static createHand(cards: Card[]): Hand {
    const { value, isSoft, isBusted, isBlackjack } = this.calculateHandValue(cards)
    
    return {
      cards,
      value,
      isSoft,
      isBusted,
      isBlackjack
    }
  }

  /**
   * Deals a card from the deck
   */
  static dealCard(deck: Card[], isHidden: boolean = false): { card: Card; remainingDeck: Card[] } {
    if (deck.length === 0) {
      throw new Error('Cannot deal from empty deck')
    }
    
    const [card, ...remainingDeck] = deck
    card.isHidden = isHidden
    
    return { card, remainingDeck }
  }

  /**
   * Initializes a new game state
   */
  static initializeGame(betAmount: number): BlackjackGameState {
    const deck = this.createDeck()
    
    return {
      gameState: 'dealing',
      playerHand: this.createHand([]),
      dealerHand: this.createHand([]),
      currentBet: betAmount,
      availableActions: [],
      deck
    }
  }

  /**
   * Deals initial cards (2 to player, 2 to dealer with one hidden)
   */
  static dealInitialCards(gameState: BlackjackGameState): BlackjackGameState {
    let { deck } = gameState
    
    // Deal two cards to player
    const { card: playerCard1, remainingDeck: deck1 } = this.dealCard(deck)
    const { card: playerCard2, remainingDeck: deck2 } = this.dealCard(deck1)
    
    // Deal two cards to dealer (second one hidden)
    const { card: dealerCard1, remainingDeck: deck3 } = this.dealCard(deck2)
    const { card: dealerCard2, remainingDeck: finalDeck } = this.dealCard(deck3, true)
    
    const playerHand = this.createHand([playerCard1, playerCard2])
    const dealerHand = this.createHand([dealerCard1, dealerCard2])
    
    // Determine next game state
    let nextState: GameState = 'player-turn'
    let availableActions: PlayerAction[] = ['hit', 'stand']
    
    // Check for blackjacks
    if (playerHand.isBlackjack) {
      nextState = 'dealer-turn'
      availableActions = []
    }
    
    return {
      ...gameState,
      gameState: nextState,
      playerHand,
      dealerHand,
      availableActions,
      deck: finalDeck
    }
  }

  /**
   * Player hits (takes another card)
   */
  static playerHit(gameState: BlackjackGameState): BlackjackGameState {
    if (gameState.gameState !== 'player-turn') {
      throw new Error('Not player\'s turn')
    }
    
    const { card, remainingDeck } = this.dealCard(gameState.deck)
    const newCards = [...gameState.playerHand.cards, card]
    const newPlayerHand = this.createHand(newCards)
    
    let nextState: GameState = 'player-turn'
    let availableActions: PlayerAction[] = ['hit', 'stand']
    
    // Check if player busted
    if (newPlayerHand.isBusted) {
      nextState = 'game-over'
      availableActions = []
    }
    
    return {
      ...gameState,
      gameState: nextState,
      playerHand: newPlayerHand,
      availableActions,
      deck: remainingDeck
    }
  }

  /**
   * Player stands (ends their turn)
   */
  static playerStand(gameState: BlackjackGameState): BlackjackGameState {
    if (gameState.gameState !== 'player-turn') {
      throw new Error('Not player\'s turn')
    }
    
    return {
      ...gameState,
      gameState: 'dealer-turn',
      availableActions: []
    }
  }

  /**
   * Dealer plays according to rules (hit on 16, stand on 17)
   */
  static playDealerTurn(gameState: BlackjackGameState): BlackjackGameState {
    if (gameState.gameState !== 'dealer-turn') {
      throw new Error('Not dealer\'s turn')
    }
    
    let { dealerHand, deck } = gameState
    
    // Reveal dealer's hidden card
    const revealedCards = dealerHand.cards.map(card => ({ ...card, isHidden: false }))
    dealerHand = this.createHand(revealedCards)
    
    // Dealer hits on 16 or soft 17
    while (dealerHand.value < 17 || (dealerHand.value === 17 && dealerHand.isSoft)) {
      const { card, remainingDeck } = this.dealCard(deck)
      dealerHand = this.createHand([...dealerHand.cards, card])
      deck = remainingDeck
    }
    
    return {
      ...gameState,
      gameState: 'game-over',
      dealerHand,
      deck
    }
  }

  /**
   * Determines game result and winnings
   */
  static determineGameResult(gameState: BlackjackGameState): GameResult {
    const { playerHand, dealerHand, currentBet } = gameState
    
    // Player busted
    if (playerHand.isBusted) {
      return {
        playerWins: false,
        isDraw: false,
        winnings: 0,
        reason: 'Player busted'
      }
    }
    
    // Dealer busted
    if (dealerHand.isBusted) {
      const winnings = playerHand.isBlackjack ? currentBet * 2.5 : currentBet * 2
      return {
        playerWins: true,
        isDraw: false,
        winnings,
        reason: 'Dealer busted'
      }
    }
    
    // Both have blackjack
    if (playerHand.isBlackjack && dealerHand.isBlackjack) {
      return {
        playerWins: false,
        isDraw: true,
        winnings: currentBet, // Push - return bet
        reason: 'Both have blackjack'
      }
    }
    
    // Player has blackjack
    if (playerHand.isBlackjack) {
      return {
        playerWins: true,
        isDraw: false,
        winnings: currentBet * 2.5, // 3:2 payout
        reason: 'Player blackjack'
      }
    }
    
    // Dealer has blackjack
    if (dealerHand.isBlackjack) {
      return {
        playerWins: false,
        isDraw: false,
        winnings: 0,
        reason: 'Dealer blackjack'
      }
    }
    
    // Compare values
    if (playerHand.value > dealerHand.value) {
      return {
        playerWins: true,
        isDraw: false,
        winnings: currentBet * 2,
        reason: `Player wins ${playerHand.value} vs ${dealerHand.value}`
      }
    } else if (dealerHand.value > playerHand.value) {
      return {
        playerWins: false,
        isDraw: false,
        winnings: 0,
        reason: `Dealer wins ${dealerHand.value} vs ${playerHand.value}`
      }
    } else {
      return {
        playerWins: false,
        isDraw: true,
        winnings: currentBet, // Push - return bet
        reason: `Push at ${playerHand.value}`
      }
    }
  }

  /**
   * Processes a complete game with the result
   */
  static completeGame(gameState: BlackjackGameState): BlackjackGameState {
    const gameResult = this.determineGameResult(gameState)
    
    return {
      ...gameState,
      gameResult
    }
  }
}