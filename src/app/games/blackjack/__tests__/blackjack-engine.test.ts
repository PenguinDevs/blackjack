/**
 * Test file for Blackjack game logic
 * Run with: npm test blackjack-engine.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BlackjackEngine } from '../lib/blackjack-engine'
import { BlackjackGameState, Card } from '../types'

describe('BlackjackEngine', () => {
  let gameState: BlackjackGameState

  beforeEach(() => {
    gameState = BlackjackEngine.initializeGame(100)
  })

  describe('Game Initialization', () => {
    it('should initialize game with correct bet amount', () => {
      expect(gameState.currentBet).toBe(100)
      expect(gameState.gameState).toBe('dealing')
      expect(gameState.deck).toHaveLength(52)
    })

    it('should create a shuffled deck', () => {
      const deck = BlackjackEngine.createDeck()
      expect(deck).toHaveLength(52)
      
      // Check that all suits and ranks are present
      const suits = new Set(deck.map(card => card.suit))
      const ranks = new Set(deck.map(card => card.rank))
      
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
      expect(initializedGame.deck).toHaveLength(48) // 52 - 4 cards dealt
    })

    it('should transition to player turn after dealing', () => {
      const dealtGame = BlackjackEngine.dealInitialCards(gameState)
      expect(dealtGame.gameState).toBe('player-turn')
      expect(dealtGame.availableActions).toContain('hit')
      expect(dealtGame.availableActions).toContain('stand')
    })
  })

  describe('Hand Evaluation', () => {
    it('should calculate hand values correctly', () => {
      const cards: Card[] = [
        { suit: 'hearts', rank: '10', value: 10 },
        { suit: 'spades', rank: 'A', value: 11 }
      ]
      
      const result = BlackjackEngine.calculateHandValue(cards)
      expect(result.value).toBe(21)
      expect(result.isBlackjack).toBe(true)
      expect(result.isSoft).toBe(true)
    })

    it('should handle ace low when necessary', () => {
      const cards: Card[] = [
        { suit: 'hearts', rank: '10', value: 10 },
        { suit: 'spades', rank: '5', value: 5 },
        { suit: 'clubs', rank: 'A', value: 11 }
      ]
      
      const result = BlackjackEngine.calculateHandValue(cards)
      expect(result.value).toBe(16) // Ace counts as 1
      expect(result.isBusted).toBe(false)
    })

    it('should detect busted hands', () => {
      const cards: Card[] = [
        { suit: 'hearts', rank: '10', value: 10 },
        { suit: 'spades', rank: '8', value: 8 },
        { suit: 'clubs', rank: '7', value: 7 }
      ]
      
      const result = BlackjackEngine.calculateHandValue(cards)
      expect(result.value).toBe(25)
      expect(result.isBusted).toBe(true)
    })
  })

  describe('Player Actions', () => {
    let dealtGame: BlackjackGameState

    beforeEach(() => {
      dealtGame = BlackjackEngine.dealInitialCards(gameState)
    })

    it('should handle player hit', () => {
      const hitGame = BlackjackEngine.playerHit(dealtGame)
      expect(hitGame.playerHand.cards).toHaveLength(3)
      expect(hitGame.deck).toHaveLength(47)
    })

    it('should handle player stand', () => {
      const standGame = BlackjackEngine.playerStand(dealtGame)
      expect(standGame.gameState).toBe('dealer-turn')
      expect(standGame.availableActions).toHaveLength(0)
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
      expect(dealerGame.dealerHand.cards.every(card => !card.isHidden)).toBe(true)
    })

    it('should follow dealer hit/stand rules', () => {
      const dealtGame = BlackjackEngine.dealInitialCards(gameState)
      const standGame = BlackjackEngine.playerStand(dealtGame)
      const dealerGame = BlackjackEngine.playDealerTurn(standGame)
      
      // Dealer should stand on 17 or higher
      expect(dealerGame.dealerHand.value >= 17 || dealerGame.dealerHand.isBusted).toBe(true)
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
            { suit: 'hearts', rank: 'A', value: 11 },
            { suit: 'spades', rank: 'K', value: 10 }
          ],
          value: 21,
          isBusted: false,
          isBlackjack: true,
          isSoft: true
        },
        dealerHand: {
          cards: [
            { suit: 'clubs', rank: '10', value: 10 },
            { suit: 'diamonds', rank: '9', value: 9 }
          ],
          value: 19,
          isBusted: false,
          isBlackjack: false,
          isSoft: false
        },
        currentBet: 100
      }
      
      const result = BlackjackEngine.determineGameResult(playerBlackjack)
      expect(result.playerWins).toBe(true)
      expect(result.winnings).toBe(250) // 100 bet + 150 (3:2 payout)
      expect(result.reason).toBe('Player blackjack')
    })

    it('should handle push correctly', () => {
      const pushGame: BlackjackGameState = {
        ...gameState,
        gameState: 'game-over',
        playerHand: {
          cards: [],
          value: 20,
          isBusted: false,
          isBlackjack: false,
          isSoft: false
        },
        dealerHand: {
          cards: [],
          value: 20,
          isBusted: false,
          isBlackjack: false,
          isSoft: false
        },
        currentBet: 100
      }
      
      const result = BlackjackEngine.determineGameResult(pushGame)
      expect(result.isDraw).toBe(true)
      expect(result.winnings).toBe(100) // Bet returned
    })
  })

  describe('Edge Cases', () => {
    it('should throw error when dealing from empty deck', () => {
      const emptyDeckGame = { ...gameState, deck: [] }
      expect(() => BlackjackEngine.dealCard(emptyDeckGame.deck)).toThrow()
    })

    it('should handle multiple aces correctly', () => {
      const multipleAces: Card[] = [
        { suit: 'hearts', rank: 'A', value: 11 },
        { suit: 'spades', rank: 'A', value: 11 },
        { suit: 'clubs', rank: 'A', value: 11 },
        { suit: 'diamonds', rank: '8', value: 8 }
      ]
      
      const result = BlackjackEngine.calculateHandValue(multipleAces)
      expect(result.value).toBe(21) // A(11) + A(1) + A(1) + 8 = 21
      expect(result.isSoft).toBe(true)
    })
  })
})

// Integration test example
describe('Full Game Integration', () => {
  it('should play a complete game', () => {
    // Initialize game
    let game = BlackjackEngine.initializeGame(100)
    
    // Deal initial cards
    game = BlackjackEngine.dealInitialCards(game)
    expect(game.playerHand.cards).toHaveLength(2)
    expect(game.dealerHand.cards).toHaveLength(2)
    
    // Player stands (simple strategy)
    game = BlackjackEngine.playerStand(game)
    expect(game.gameState).toBe('dealer-turn')
    
    // Dealer plays
    game = BlackjackEngine.playDealerTurn(game)
    expect(game.gameState).toBe('game-over')
    
    // Complete game
    game = BlackjackEngine.completeGame(game)
    expect(game.gameResult).toBeDefined()
    expect(typeof game.gameResult!.winnings).toBe('number')
  })
})