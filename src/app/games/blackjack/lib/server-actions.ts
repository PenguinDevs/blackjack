'use server'

import { BlackjackEngine } from './blackjack-engine'
import { BlackjackGameState, PlayerAction } from '../types'

/**
 * Server actions for blackjack game
 * These can be used for server-side game validation or multiplayer functionality
 */

export async function initializeBlackjackGame(betAmount: number): Promise<BlackjackGameState> {
  try {
    let gameState = BlackjackEngine.initializeGame(betAmount)
    gameState = BlackjackEngine.dealInitialCards(gameState)
    return gameState
  } catch (error) {
    throw new Error(
      `Failed to initialize game: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export async function executePlayerAction(
  gameState: BlackjackGameState,
  action: PlayerAction
): Promise<BlackjackGameState> {
  try {
    let newGameState = gameState

    switch (action) {
      case 'hit':
        newGameState = BlackjackEngine.playerHit(gameState)
        break
      case 'stand':
        newGameState = BlackjackEngine.playerStand(gameState)

        // If player stands, automatically play dealer turn
        if (newGameState.gameState === 'dealer-turn') {
          newGameState = BlackjackEngine.playDealerTurn(newGameState)
          newGameState = BlackjackEngine.completeGame(newGameState)
        }
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    // If game is over after player action, complete it
    if (newGameState.gameState === 'game-over' && !newGameState.gameResult) {
      newGameState = BlackjackEngine.completeGame(newGameState)
    }

    return newGameState
  } catch (error) {
    throw new Error(
      `Failed to execute action: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export async function validateGameState(gameState: BlackjackGameState): Promise<{
  isValid: boolean
  errors: string[]
}> {
  const errors: string[] = []

  try {
    // Validate deck integrity
    if (gameState.deck.length < 0 || gameState.deck.length > 52) {
      errors.push('Invalid deck size')
    }

    // Validate hand values
    const playerCalculated = BlackjackEngine.calculateHandValue(gameState.playerHand.cards)
    if (playerCalculated.value !== gameState.playerHand.value) {
      errors.push('Player hand value mismatch')
    }

    const dealerCalculated = BlackjackEngine.calculateHandValue(gameState.dealerHand.cards)
    if (dealerCalculated.value !== gameState.dealerHand.value) {
      errors.push('Dealer hand value mismatch')
    }

    // Validate game state transitions
    switch (gameState.gameState) {
      case 'waiting':
        if (gameState.playerHand.cards.length > 0 || gameState.dealerHand.cards.length > 0) {
          errors.push('Cards present in waiting state')
        }
        break
      case 'dealing':
      case 'player-turn':
        if (gameState.playerHand.cards.length < 2) {
          errors.push('Insufficient player cards for current state')
        }
        break
      case 'game-over':
        if (!gameState.gameResult) {
          errors.push('Game over without result')
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      isValid: false,
      errors,
    }
  }
}

export async function calculateGameStatistics(gameStates: BlackjackGameState[]): Promise<{
  totalGames: number
  totalWins: number
  totalLosses: number
  totalPushes: number
  winRate: number
  totalWinnings: number
  averageBet: number
  blackjackCount: number
}> {
  const completedGames = gameStates.filter(
    (state) => state.gameState === 'game-over' && state.gameResult
  )

  const stats = {
    totalGames: completedGames.length,
    totalWins: 0,
    totalLosses: 0,
    totalPushes: 0,
    winRate: 0,
    totalWinnings: 0,
    averageBet: 0,
    blackjackCount: 0,
  }

  if (completedGames.length === 0) {
    return stats
  }

  let totalBets = 0

  for (const gameState of completedGames) {
    const result = gameState.gameResult!

    if (result.playerWins) {
      stats.totalWins++
    } else if (result.isDraw) {
      stats.totalPushes++
    } else {
      stats.totalLosses++
    }

    stats.totalWinnings += result.winnings - gameState.currentBet
    totalBets += gameState.currentBet

    if (gameState.playerHand.isBlackjack) {
      stats.blackjackCount++
    }
  }

  stats.winRate = (stats.totalWins / completedGames.length) * 100
  stats.averageBet = totalBets / completedGames.length

  return stats
}
