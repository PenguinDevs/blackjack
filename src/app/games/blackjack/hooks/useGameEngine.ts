import { useCallback } from 'react'
import { BlackjackEngine } from '../lib/blackjack-engine'
import { BlackjackGameState } from '../types'
import { GameResultHandler } from '../utils/game-utils'
import { recordGameResult } from '../lib/server-actions'

interface GameEngineHookDependencies {
  addCredits: (amount: number) => Promise<boolean>
  onGameStateChange: (gameState: BlackjackGameState) => void
  onError: (error: string) => void
  onLoading: (loading: boolean) => void
}

export function useGameEngine(dependencies: GameEngineHookDependencies) {
  const { addCredits, onGameStateChange, onError, onLoading } = dependencies

  const startNewGame = useCallback(
    async (betAmount: number): Promise<BlackjackGameState> => {
      try {
        onError('')
        onLoading(true)

        // Initialize game with bet
        let newGameState = BlackjackEngine.initializeGame(betAmount)
        // Deal initial cards
        newGameState = BlackjackEngine.dealInitialCards(newGameState)

        onGameStateChange(newGameState)
        return newGameState
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start game'
        onError(errorMessage)
        throw err
      } finally {
        onLoading(false)
      }
    },
    [onGameStateChange, onError, onLoading]
  )

  const playerHit = useCallback(
    async (gameState: BlackjackGameState): Promise<BlackjackGameState> => {
      try {
        onError('')
        onLoading(true)

        let newGameState = BlackjackEngine.playerHit(gameState)
        onGameStateChange(newGameState)

        // If player busted, end game
        if (newGameState.playerHand.isBusted) {
          newGameState = BlackjackEngine.completeGame(newGameState)
          onGameStateChange(newGameState)

          // Handle game result and credits
          if (newGameState.gameResult) {
            const result = await GameResultHandler.processGameResult(
              newGameState.gameResult,
              newGameState.currentBet,
              { addCredits, recordGameResult }
            )

            if (!result.success && result.error) {
              onError(result.error)
            }
          }
        }

        return newGameState
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to hit'
        onError(errorMessage)
        throw err
      } finally {
        onLoading(false)
      }
    },
    [addCredits, onGameStateChange, onError, onLoading]
  )

  const playerStand = useCallback(
    async (gameState: BlackjackGameState): Promise<BlackjackGameState> => {
      try {
        onError('')
        onLoading(true)

        const newGameState = BlackjackEngine.playerStand(gameState)
        onGameStateChange(newGameState)
        return newGameState
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to stand'
        onError(errorMessage)
        throw err
      } finally {
        onLoading(false)
      }
    },
    [onGameStateChange, onError, onLoading]
  )

  const playDealerTurn = useCallback(
    async (gameState: BlackjackGameState): Promise<BlackjackGameState> => {
      try {
        onLoading(true)

        // Step 1: Reveal dealer's hidden card
        await new Promise((resolve) => setTimeout(resolve, 500))

        const revealedCards = gameState.dealerHand.cards.map((card) => ({
          ...card,
          isHidden: false,
        }))
        let newGameState = {
          ...gameState,
          dealerHand: BlackjackEngine.createHand(revealedCards),
        }
        onGameStateChange(newGameState)

        // Wait for card flip animation
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Step 2: Dealer hits cards if needed
        while (BlackjackEngine.shouldDealerHit(newGameState)) {
          await new Promise((resolve) => setTimeout(resolve, 800))

          newGameState = BlackjackEngine.dealerHit(newGameState)
          onGameStateChange(newGameState)

          // Wait for card animation
          await new Promise((resolve) => setTimeout(resolve, 800))
        }

        // Step 3: Complete game
        newGameState = { ...newGameState, gameState: 'game-over' as const }
        onGameStateChange(newGameState)

        await new Promise((resolve) => setTimeout(resolve, 500))
        newGameState = BlackjackEngine.completeGame(newGameState)
        onGameStateChange(newGameState)

        // Handle game result
        if (newGameState.gameResult) {
          const result = await GameResultHandler.processGameResult(
            newGameState.gameResult,
            newGameState.currentBet,
            { addCredits, recordGameResult }
          )

          if (!result.success && result.error) {
            onError(result.error)
          }
        }

        return newGameState
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to complete dealer turn'
        onError(errorMessage)
        throw err
      } finally {
        onLoading(false)
      }
    },
    [addCredits, onGameStateChange, onError, onLoading]
  )

  return {
    startNewGame,
    playerHit,
    playerStand,
    playDealerTurn,
  }
}
