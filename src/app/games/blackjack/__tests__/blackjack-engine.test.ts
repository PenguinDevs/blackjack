/**
 * Test file for Blackjack game logic
 * Run with: npm test blackjack-engine.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BlackjackEngine } from '../lib/blackjack-engine'
import { BlackjackGameState, Card } from '../types'
import { GAME_CONSTANTS, PLAYER_ACTIONS } from '../utils/game-utils'

describe('BlackjackEngine', () => {
  let gameState: BlackjackGameState

  beforeEach(() => {
    gameState = BlackjackEngine.initializeGame(GAME_CONSTANTS.INITIAL_BET_AMOUNT)
  })

  describe('Game Initialization', () => {
    it('should initialize game with correct bet amount', () => {
      expect(gameState.currentBet).toBe(GAME_CONSTANTS.INITIAL_BET_AMOUNT)
      expect(gameState.gameState).toBe('dealing')
      expect(gameState.deck).toHaveLength(GAME_CONSTANTS.DECK_SIZE)
    })

    it('should create a shuffled deck', () => {
      const deck = BlackjackEngine.createDeck()
      expect(deck).toHaveLength(GAME_CONSTANTS.DECK_SIZE)

      // Check that all suits and ranks are present
      const suits = new Set(deck.map((card) => card.suit))
      const ranks = new Set(deck.map((card) => card.rank))

      expect(suits.size).toBe(4)
      expect(ranks.size).toBe(13)
    })
  })

  describe('Card Dealing', () => {
    it('should deal initial cards correctly', () => {
      const initializedGame = BlackjackEngine.dealInitialCards(gameState)

      expect(initializedGame.playerHand.cards).toHaveLength(2)
      expect(initializedGame.dealerHand.cards).toHaveLength(2)
      expect(initializedGame.dealerHand.cards[1].isHidden).toBe(true)
      expect(initializedGame.deck).toHaveLength(GAME_CONSTANTS.CARDS_REMAINING_AFTER_DEAL) // 52 - 4 cards dealt
    })

    it('should transition to player turn after dealing', () => {
      const dealtGame = BlackjackEngine.dealInitialCards(gameState)
      expect(dealtGame.gameState).toBe('player-turn')
      expect(dealtGame.availableActions).toContain(PLAYER_ACTIONS.HIT)
      expect(dealtGame.availableActions).toContain(PLAYER_ACTIONS.STAND)
    })
  })

  describe('Hand Evaluation', () => {
    it('should calculate hand values correctly', () => {
      const cards: Card[] = [
        { suit: 'hearts', rank: '10', value: GAME_CONSTANTS.FACE_CARD_VALUE },
        { suit: 'spades', rank: 'A', value: GAME_CONSTANTS.ACE_HIGH_VALUE },
      ]

      const result = BlackjackEngine.calculateHandValue(cards)
      expect(result.value).toBe(GAME_CONSTANTS.BLACKJACK_VALUE)
      expect(result.isBlackjack).toBe(true)
    })

    it('should handle ace low when necessary', () => {
      const cards: Card[] = [
        { suit: 'hearts', rank: '10', value: GAME_CONSTANTS.FACE_CARD_VALUE },
        { suit: 'spades', rank: '5', value: GAME_CONSTANTS.CARD_VALUE_5 },
        { suit: 'clubs', rank: 'A', value: GAME_CONSTANTS.ACE_HIGH_VALUE },
      ]

      const result = BlackjackEngine.calculateHandValue(cards)
      expect(result.value).toBe(GAME_CONSTANTS.SOFT_16) // Ace counts as 1
      expect(result.isBusted).toBe(false)
    })

    it('should detect busted hands', () => {
      const cards: Card[] = [
        { suit: 'hearts', rank: '10', value: GAME_CONSTANTS.FACE_CARD_VALUE },
        { suit: 'spades', rank: '8', value: GAME_CONSTANTS.CARD_VALUE_8 },
        { suit: 'clubs', rank: '7', value: GAME_CONSTANTS.CARD_VALUE_7 },
      ]

      const result = BlackjackEngine.calculateHandValue(cards)
      expect(result.value).toBe(GAME_CONSTANTS.BUST_25)
      expect(result.isBusted).toBe(true)
    })
  })

  describe('Player Actions', () => {
    let dealtGame: BlackjackGameState

    beforeEach(() => {
      dealtGame = BlackjackEngine.dealInitialCards(gameState)
    })

    it('should handle player hit', () => {
      // Only test hit if player is allowed to hit (not blackjack)
      if (dealtGame.gameState === 'player-turn') {
        const hitGame = BlackjackEngine.playerHit(dealtGame)
        expect(hitGame.playerHand.cards).toHaveLength(3)
        expect(hitGame.deck).toHaveLength(GAME_CONSTANTS.CARDS_REMAINING_AFTER_DEAL - 1) // 47
      } else {
        // If player has blackjack, skip this test
        expect(dealtGame.playerHand.isBlackjack).toBe(true)
      }
    })

    it('should handle player stand', () => {
      // Ensure we're testing with a game that's actually in player-turn state
      if (dealtGame.gameState === 'player-turn') {
        const standGame = BlackjackEngine.playerStand(dealtGame)
        expect(standGame.gameState).toBe('dealer-turn')
        expect(standGame.availableActions).toHaveLength(0)
      } else {
        // If player has blackjack, they automatically go to dealer turn
        expect(dealtGame.gameState).toBe('dealer-turn')
        expect(dealtGame.playerHand.isBlackjack).toBe(true)
      }
    })

    it('should end game when player busts', () => {
      // Create a scenario where player will bust
      let bustGame = dealtGame
      while (!bustGame.playerHand.isBusted && bustGame.gameState === 'player-turn') {
        bustGame = BlackjackEngine.playerHit(bustGame)
      }

      if (bustGame.playerHand.isBusted) {
        expect(bustGame.gameState).toBe('game-over')
      }
    })
  })

  describe('Dealer Logic', () => {
    it('should play dealer turn correctly', () => {
      const dealtGame = BlackjackEngine.dealInitialCards(gameState)
      const standGame = BlackjackEngine.playerStand(dealtGame)
      const dealerGame = BlackjackEngine.playDealerTurn(standGame)

      expect(dealerGame.gameState).toBe('game-over')
      expect(dealerGame.dealerHand.cards.every((card) => !card.isHidden)).toBe(true)
    })

    it('should follow dealer hit/stand rules', () => {
      const dealtGame = BlackjackEngine.dealInitialCards(gameState)
      const standGame = BlackjackEngine.playerStand(dealtGame)
      const dealerGame = BlackjackEngine.playDealerTurn(standGame)

      // Dealer should stand on DEALER_STAND_VALUE or higher
      expect(
        dealerGame.dealerHand.value >= GAME_CONSTANTS.DEALER_STAND_VALUE ||
          dealerGame.dealerHand.isBusted
      ).toBe(true)
    })
  })

  describe('Game Results', () => {
    it('should determine player blackjack win correctly', () => {
      // Mock a player blackjack scenario
      const playerBlackjack: BlackjackGameState = {
        ...gameState,
        gameState: 'game-over',
        playerHand: {
          cards: [
            { suit: 'hearts', rank: 'A', value: GAME_CONSTANTS.ACE_HIGH_VALUE },
            { suit: 'spades', rank: 'K', value: GAME_CONSTANTS.FACE_CARD_VALUE },
          ],
          value: GAME_CONSTANTS.BLACKJACK_VALUE,
          isBusted: false,
          isBlackjack: true,
        },
        dealerHand: {
          cards: [
            { suit: 'clubs', rank: '10', value: GAME_CONSTANTS.FACE_CARD_VALUE },
            { suit: 'diamonds', rank: '9', value: GAME_CONSTANTS.CARD_VALUE_9 },
          ],
          value: GAME_CONSTANTS.DEALER_19,
          isBusted: false,
          isBlackjack: false,
        },
        currentBet: 100,
      }

      const result = BlackjackEngine.determineGameResult(playerBlackjack)
      expect(result.playerWins).toBe(true)
      expect(result.winnings).toBe(GAME_CONSTANTS.BLACKJACK_WINNINGS) // 100 bet + 150 (3:2 payout)
      expect(result.reason).toBe('Player blackjack')
    })

    it('should handle push correctly', () => {
      const pushGame: BlackjackGameState = {
        ...gameState,
        gameState: 'game-over',
        playerHand: {
          cards: [],
          value: GAME_CONSTANTS.PLAYER_20,
          isBusted: false,
          isBlackjack: false,
        },
        dealerHand: {
          cards: [],
          value: GAME_CONSTANTS.PLAYER_20,
          isBusted: false,
          isBlackjack: false,
        },
        currentBet: GAME_CONSTANTS.INITIAL_BET_AMOUNT,
      }

      const result = BlackjackEngine.determineGameResult(pushGame)
      expect(result.isDraw).toBe(true)
      expect(result.winnings).toBe(GAME_CONSTANTS.INITIAL_BET_AMOUNT) // Bet returned
    })
  })

  describe('Edge Cases', () => {
    it('should throw error when dealing from empty deck', () => {
      const emptyDeckGame = { ...gameState, deck: [] }
      expect(() => BlackjackEngine.dealCard(emptyDeckGame.deck)).toThrow()
    })

    it('should handle multiple aces correctly', () => {
      const multipleAces: Card[] = [
        { suit: 'hearts', rank: 'A', value: GAME_CONSTANTS.ACE_HIGH_VALUE },
        { suit: 'spades', rank: 'A', value: GAME_CONSTANTS.ACE_HIGH_VALUE },
        { suit: 'clubs', rank: 'A', value: GAME_CONSTANTS.ACE_HIGH_VALUE },
        { suit: 'diamonds', rank: '8', value: GAME_CONSTANTS.CARD_VALUE_8 },
      ]

      const result = BlackjackEngine.calculateHandValue(multipleAces)
      expect(result.value).toBe(GAME_CONSTANTS.BLACKJACK_VALUE) // A(11) + A(1) + A(1) + 8 = 21
    })
  })
})

// Integration test example
describe('Full Game Integration', () => {
  it('should play a complete game', () => {
    // Initialize game
    let game = BlackjackEngine.initializeGame(GAME_CONSTANTS.INITIAL_BET_AMOUNT)

    // Deal initial cards
    game = BlackjackEngine.dealInitialCards(game)
    expect(game.playerHand.cards).toHaveLength(2)
    expect(game.dealerHand.cards).toHaveLength(2)

    // If player doesn't have blackjack, they can make moves
    if (game.gameState === 'player-turn') {
      // Player stands (simple strategy)
      game = BlackjackEngine.playerStand(game)
      expect(game.gameState).toBe('dealer-turn')
    }

    // If game state is dealer-turn, dealer plays
    if (game.gameState === 'dealer-turn') {
      game = BlackjackEngine.playDealerTurn(game)
      expect(game.gameState).toBe('game-over')
    }

    // Complete game
    game = BlackjackEngine.completeGame(game)
    expect(game.gameResult).toBeDefined()
    expect(typeof game.gameResult!.winnings).toBe('number')
  })
})
