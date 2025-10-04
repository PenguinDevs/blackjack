import { BlackjackGameState, BettingState } from '../types'
import { GAME_CONSTANTS, createEmptyHand } from '../utils/game-utils'

// Game State Management using Reducer Pattern
export interface GameState {
  game: BlackjackGameState
  betting: BettingState
  ui: {
    loading: boolean
    error: string | null
    isInitialDealComplete: boolean
  }
}

export type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GAME_STATE'; payload: BlackjackGameState }
  | { type: 'SET_BETTING_STATE'; payload: Partial<BettingState> }
  | { type: 'RESET_GAME' }
  | { type: 'SET_INITIAL_DEAL_COMPLETE'; payload: boolean }

export const initialGameState: GameState = {
  game: {
    gameState: 'waiting',
    playerHand: createEmptyHand(),
    dealerHand: createEmptyHand(),
    currentBet: 0,
    availableActions: [],
    deck: [],
  },
  betting: {
    amount: GAME_CONSTANTS.INITIAL_BET_AMOUNT,
    showBettingOptions: false,
    isPlacingBet: false,
  },
  ui: {
    loading: false,
    error: null,
    isInitialDealComplete: false,
  },
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        ui: { ...state.ui, loading: action.payload },
      }

    case 'SET_ERROR':
      return {
        ...state,
        ui: { ...state.ui, error: action.payload },
      }

    case 'SET_GAME_STATE':
      return {
        ...state,
        game: action.payload,
      }

    case 'SET_BETTING_STATE':
      return {
        ...state,
        betting: { ...state.betting, ...action.payload },
      }

    case 'SET_INITIAL_DEAL_COMPLETE':
      return {
        ...state,
        ui: { ...state.ui, isInitialDealComplete: action.payload },
      }

    case 'RESET_GAME':
      return {
        ...initialGameState,
        betting: {
          ...initialGameState.betting,
          amount: state.betting.amount, // Preserve bet amount
        },
      }

    default:
      return state
  }
}

// Game State Selectors for better encapsulation
export const gameSelectors = {
  getGameState: (state: GameState) => state.game,
  getBettingState: (state: GameState) => state.betting,
  getUIState: (state: GameState) => state.ui,
  isGameActive: (state: GameState) =>
    state.game.gameState === 'player-turn' || state.game.gameState === 'dealer-turn',
  isGameWaiting: (state: GameState) => state.game.gameState === 'waiting',
  isGameOver: (state: GameState) => state.game.gameState === 'game-over',
  canPlaceBet: (state: GameState, credits: number) =>
    state.game.gameState === 'waiting' && credits >= state.betting.amount,
}
