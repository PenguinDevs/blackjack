import { useReducer, useCallback } from 'react'
import { gameReducer, initialGameState, gameSelectors } from '../state/gameState'
import { BlackjackGameState, BettingState } from '../types'

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState)

  const actions = {
    setLoading: useCallback((loading: boolean) => {
      dispatch({ type: 'SET_LOADING', payload: loading })
    }, []),

    setError: useCallback((error: string | null) => {
      dispatch({ type: 'SET_ERROR', payload: error })
    }, []),

    setGameState: useCallback((gameState: BlackjackGameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState })
    }, []),

    setBettingState: useCallback((bettingState: Partial<BettingState>) => {
      dispatch({ type: 'SET_BETTING_STATE', payload: bettingState })
    }, []),

    setInitialDealComplete: useCallback((complete: boolean) => {
      dispatch({ type: 'SET_INITIAL_DEAL_COMPLETE', payload: complete })
    }, []),

    resetGame: useCallback(() => {
      dispatch({ type: 'RESET_GAME' })
    }, []),
  }

  const selectors = {
    gameState: gameSelectors.getGameState(state),
    bettingState: gameSelectors.getBettingState(state),
    uiState: gameSelectors.getUIState(state),
    isGameActive: gameSelectors.isGameActive(state),
    isGameWaiting: gameSelectors.isGameWaiting(state),
    isGameOver: gameSelectors.isGameOver(state),
    canPlaceBet: (credits: number) => gameSelectors.canPlaceBet(state, credits),
  }

  return {
    state,
    actions,
    selectors,
  }
}