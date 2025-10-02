'use client'

import { useState, useCallback } from 'react'
import { BlackjackGameState, BettingState } from '../types'
import { BlackjackEngine } from '../lib/blackjack-engine'

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
  const [gameState, setGameState] = useState<BlackjackGameState>({
    gameState: 'waiting',
    playerHand: { cards: [], value: 0, isBusted: false, isBlackjack: false, isSoft: false },
    dealerHand: { cards: [], value: 0, isBusted: false, isBlackjack: false, isSoft: false },
    currentBet: 0,
    availableActions: [],
    deck: []
  })
  
  const [bettingState, setBettingState] = useState<BettingState>({
    amount: 100,
    showBettingOptions: false,
    isPlacingBet: false
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startNewGame = useCallback(async (betAmount: number) => {
    try {
      setError(null)
      setIsLoading(true)
      setBettingState(prev => ({ ...prev, isPlacingBet: true }))

      // Initialize game with bet
      let newGameState = BlackjackEngine.initializeGame(betAmount)
      
      // Deal initial cards
      newGameState = BlackjackEngine.dealInitialCards(newGameState)
      
      setGameState(newGameState)
      setBettingState(prev => ({ 
        ...prev, 
        isPlacingBet: false,
        showBettingOptions: false 
      }))

      // If player has blackjack, automatically play dealer turn
      if (newGameState.playerHand.isBlackjack) {
        setTimeout(async () => {
          await playDealerTurn(newGameState)
        }, 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start game')
      setBettingState(prev => ({ ...prev, isPlacingBet: false }))
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hit')
    } finally {
      setIsLoading(false)
    }
  }, [gameState])

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
      await new Promise(resolve => setTimeout(resolve, 1000))

      let newGameState = BlackjackEngine.playDealerTurn(currentGameState)
      setGameState(newGameState)

      // Complete game and show result
      await new Promise(resolve => setTimeout(resolve, 500))
      newGameState = BlackjackEngine.completeGame(newGameState)
      setGameState(newGameState)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete dealer turn')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const resetGame = useCallback(() => {
    setGameState({
      gameState: 'waiting',
      playerHand: { cards: [], value: 0, isBusted: false, isBlackjack: false, isSoft: false },
      dealerHand: { cards: [], value: 0, isBusted: false, isBlackjack: false, isSoft: false },
      currentBet: 0,
      availableActions: [],
      deck: []
    })
    setBettingState(prev => ({ 
      ...prev, 
      showBettingOptions: false,
      isPlacingBet: false 
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
    resetGame
  }
}

// Hook for betting state management
export function useBettingState(initialAmount: number = 100) {
  const [bettingState, setBettingState] = useState<BettingState>({
    amount: initialAmount,
    showBettingOptions: false,
    isPlacingBet: false
  })

  const setBetAmount = useCallback((amount: number) => {
    setBettingState(prev => ({ ...prev, amount }))
  }, [])

  const setShowBettingOptions = useCallback((show: boolean) => {
    setBettingState(prev => ({ ...prev, showBettingOptions: show }))
  }, [])

  const setIsPlacingBet = useCallback((placing: boolean) => {
    setBettingState(prev => ({ ...prev, isPlacingBet: placing }))
  }, [])

  return {
    bettingState,
    setBetAmount,
    setShowBettingOptions,
    setIsPlacingBet
  }
}