'use client'

import { useState, useCallback } from 'react'
import { BlackjackGameState, BettingState } from '../types'
import { BlackjackEngine } from '../lib/blackjack-engine'
import { useCredits } from '@/hooks/useCredits'
import { placeBet, recordGameResult } from './server-actions'

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
  const { credits, subtractCredits, addCredits, refreshCredits } = useCredits()
  
  const [gameState, setGameState] = useState<BlackjackGameState>({
    gameState: 'waiting',
    playerHand: { cards: [], value: 0, isBusted: false, isBlackjack: false, isSoft: false },
    dealerHand: { cards: [], value: 0, isBusted: false, isBlackjack: false, isSoft: false },
    currentBet: 0,
    availableActions: [],
    deck: [],
  })

  const [bettingState, setBettingState] = useState<BettingState>({
    amount: 100,
    showBettingOptions: false,
    isPlacingBet: false,
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startNewGame = useCallback(async (betAmount: number) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credits, subtractCredits])

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
          const { winnings, playerWins, isDraw } = newGameState.gameResult
          const gameResult = playerWins ? 'win' : isDraw ? 'push' : 'lose'
          
          try {
            // Award winnings immediately with optimistic update
            if (winnings > 0) {
              const success = await addCredits(winnings)
              if (!success) {
                setError('Failed to award winnings')
                return
              }
            }
            
            // Record game result for statistics (non-blocking)
            recordGameResult(newGameState.currentBet, winnings, gameResult).catch((error) => {
              console.warn('Failed to record game statistics:', error)
            })
          } catch (error) {
            console.error('Error processing game result:', error)
            setError('Failed to process game result')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState])

  const playDealerTurn = useCallback(async (currentGameState: BlackjackGameState) => {
    try {
      // Simulate dealer thinking time
      await new Promise((resolve) => setTimeout(resolve, 1000))

      let newGameState = BlackjackEngine.playDealerTurn(currentGameState)
      setGameState(newGameState)

      // Complete game and show result
      await new Promise((resolve) => setTimeout(resolve, 500))
      newGameState = BlackjackEngine.completeGame(newGameState)
      setGameState(newGameState)

      // Handle game result and credits
      if (newGameState.gameResult) {
        const { winnings, playerWins, isDraw } = newGameState.gameResult
        const gameResult = playerWins ? 'win' : isDraw ? 'push' : 'lose'
        
        try {
          // Award winnings immediately with optimistic update
          if (winnings > 0) {
            const success = await addCredits(winnings)
            if (!success) {
              setError('Failed to award winnings')
              return
            }
          }
          
          // Record game result for statistics (non-blocking)
          recordGameResult(newGameState.currentBet, winnings, gameResult).catch((error) => {
            console.warn('Failed to record game statistics:', error)
          })
        } catch (error) {
          console.error('Error processing game result:', error)
          setError('Failed to process game result')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete dealer turn')
    } finally {
      setIsLoading(false)
    }
  }, [addCredits])

  const resetGame = useCallback(() => {
    setGameState({
      gameState: 'waiting',
      playerHand: { cards: [], value: 0, isBusted: false, isBlackjack: false, isSoft: false },
      dealerHand: { cards: [], value: 0, isBusted: false, isBlackjack: false, isSoft: false },
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
