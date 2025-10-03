'use client'

import { useState, useCallback } from 'react'
import { BlackjackGameState, BettingState } from '../types'
import { BlackjackEngine } from '../lib/blackjack-engine'
import { useCredits } from '@/hooks/useCredits'
import { recordGameResult } from './server-actions'
import { GAME_DEFAULTS, GameResultHandler, createEmptyHand } from '../utils/game-utils'

interface UseBlackjackGameReturn {
  gameState: BlackjackGameState
  bettingState: BettingState
  isLoading: boolean
  error: string | null
  startNewGame: (betAmount: number) => Promise<void>
  playerHit: () => Promise<void>
  playerStand: () => Promise<void>
  resetGame: () => void
}

export function useBlackjackGame(): UseBlackjackGameReturn {
  const { credits, subtractCredits, addCredits } = useCredits()

  const [gameState, setGameState] = useState<BlackjackGameState>({
    gameState: 'waiting',
    playerHand: createEmptyHand(),
    dealerHand: createEmptyHand(),
    currentBet: 0,
    availableActions: [],
    deck: [],
  })

  const [bettingState, setBettingState] = useState<BettingState>({
    amount: GAME_DEFAULTS.INITIAL_BET_AMOUNT,
    showBettingOptions: false,
    isPlacingBet: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const playDealerTurn = useCallback(
    async (currentGameState: BlackjackGameState) => {
      try {
        // Step 1: First reveal the dealer's hidden card (flip animation will be handled by GameBoard)
        await new Promise((resolve) => setTimeout(resolve, 500))
        
        // Reveal dealer's hidden card
        const revealedCards = currentGameState.dealerHand.cards.map(card => ({ ...card, isHidden: false }))
        let newGameState = {
          ...currentGameState,
          dealerHand: BlackjackEngine.createHand(revealedCards)
        }
        setGameState(newGameState)
        
        // Wait for card flip animation to complete
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Step 2: Dealer hits cards one by one if needed
        while (BlackjackEngine.shouldDealerHit(newGameState)) {
          // Simulate dealer thinking time between cards
          await new Promise((resolve) => setTimeout(resolve, 800))
          
          newGameState = BlackjackEngine.dealerHit(newGameState)
          setGameState(newGameState)
          
          // Wait for card animation
          await new Promise((resolve) => setTimeout(resolve, 800))
        }

        // Step 3: Transition to game over state
        newGameState = { ...newGameState, gameState: 'game-over' as const }
        setGameState(newGameState)

        // Step 4: Complete game and show result
        await new Promise((resolve) => setTimeout(resolve, 500))
        newGameState = BlackjackEngine.completeGame(newGameState)
        setGameState(newGameState)

        // Handle game result and credits
        if (newGameState.gameResult) {
          const result = await GameResultHandler.processGameResult(
            newGameState.gameResult,
            newGameState.currentBet,
            { addCredits, recordGameResult }
          )
          
          if (!result.success && result.error) {
            setError(result.error)
            return
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to complete dealer turn')
      } finally {
        setIsLoading(false)
      }
    },
    [addCredits]
  )

  const startNewGame = useCallback(
    async (betAmount: number) => {
      try {
        setError(null)
        setIsLoading(true)
        setBettingState((prev) => ({ ...prev, isPlacingBet: true }))

        // Check if user has sufficient credits
        if (credits < betAmount) {
          throw new Error('Insufficient credits to place bet')
        }

        // Deduct credits for the bet (with optimistic update)
        const success = await subtractCredits(betAmount)
        if (!success) {
          throw new Error('Failed to deduct credits for bet')
        }

        // Initialize game with bet
        let newGameState = BlackjackEngine.initializeGame(betAmount)

        // Deal initial cards
        newGameState = BlackjackEngine.dealInitialCards(newGameState)

        setGameState(newGameState)
        setBettingState((prev) => ({
          ...prev,
          isPlacingBet: false,
          showBettingOptions: false,
        }))

        // If player has blackjack, automatically play dealer turn
        if (newGameState.playerHand.isBlackjack) {
          setTimeout(async () => {
            await playDealerTurn(newGameState)
          }, 1000)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start game')
        setBettingState((prev) => ({ ...prev, isPlacingBet: false }))
      } finally {
        setIsLoading(false)
      }
    },
    [credits, subtractCredits, playDealerTurn]
  )

  const playerHit = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)

      let newGameState = BlackjackEngine.playerHit(gameState)
      setGameState(newGameState)

      // If player busted, end game
      if (newGameState.playerHand.isBusted) {
        newGameState = BlackjackEngine.completeGame(newGameState)
        setGameState(newGameState)

        // Handle game result and credits
        if (newGameState.gameResult) {
          const result = await GameResultHandler.processGameResult(
            newGameState.gameResult,
            newGameState.currentBet,
            { addCredits, recordGameResult }
          )
          
          if (!result.success && result.error) {
            setError(result.error)
            return
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hit')
    } finally {
      setIsLoading(false)
    }
  }, [gameState, addCredits])

  const playerStand = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)

      const newGameState = BlackjackEngine.playerStand(gameState)
      setGameState(newGameState)

      // Play dealer turn
      setTimeout(async () => {
        await playDealerTurn(newGameState)
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stand')
      setIsLoading(false)
    }
  }, [gameState, playDealerTurn])

  const resetGame = useCallback(() => {
    setGameState({
      gameState: 'waiting',
      playerHand: createEmptyHand(),
      dealerHand: createEmptyHand(),
      currentBet: 0,
      availableActions: [],
      deck: [],
    })
    setBettingState((prev) => ({
      ...prev,
      showBettingOptions: false,
      isPlacingBet: false,
    }))
    setError(null)
  }, [])

  return {
    gameState,
    bettingState,
    isLoading,
    error,
    startNewGame,
    playerHit,
    playerStand,
    resetGame,
  }
}

// Hook for betting state management
export function useBettingState(initialAmount: number = 100) {
  const [bettingState, setBettingState] = useState<BettingState>({
    amount: initialAmount,
    showBettingOptions: false,
    isPlacingBet: false,
  })

  const setBetAmount = useCallback((amount: number) => {
    setBettingState((prev) => ({ ...prev, amount }))
  }, [])

  const setShowBettingOptions = useCallback((show: boolean) => {
    setBettingState((prev) => ({ ...prev, showBettingOptions: show }))
  }, [])

  const setIsPlacingBet = useCallback((placing: boolean) => {
    setBettingState((prev) => ({ ...prev, isPlacingBet: placing }))
  }, [])

  return {
    bettingState,
    setBetAmount,
    setShowBettingOptions,
    setIsPlacingBet,
  }
}
