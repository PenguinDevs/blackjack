import { useReducer, useEffect, useCallback } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { ICreditService, creditService } from '@/services/CreditService'
import { creditEventManager } from '@/services/CreditEventManager'

// State management using useReducer pattern
interface CreditState {
  credits: number
  loading: boolean
  error: string | null
}

type CreditAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CREDITS'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' }

const initialState: CreditState = {
  credits: 0,
  loading: true,
  error: null
}

function creditReducer(state: CreditState, action: CreditAction): CreditState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_CREDITS':
      return { ...state, credits: action.payload, loading: false, error: null }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

export interface UserProfile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  credits: number
  games_played: number
  games_won: number
  created_at: string
  updated_at: string
}

interface UseCreditsDependencies {
  creditService: ICreditService
}

export function useCredits(dependencies: UseCreditsDependencies = { creditService }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(creditReducer, initialState)

  // Fetch credits with proper error handling
  const fetchCredits = useCallback(async () => {
    if (!user) {
      dispatch({ type: 'SET_CREDITS', payload: 0 })
      return
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      const credits = await dependencies.creditService.getCredits(user.id)
      dispatch({ type: 'SET_CREDITS', payload: credits })
    } catch (err) {
      if (err instanceof Error && err.message === 'PROFILE_NOT_FOUND') {
        try {
          const credits = await dependencies.creditService.createProfile(user)
          dispatch({ type: 'SET_CREDITS', payload: credits })
        } catch (createErr) {
          const errorMessage = createErr instanceof Error ? createErr.message : 'Failed to create profile'
          dispatch({ type: 'SET_ERROR', payload: errorMessage })
        }
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch credits'
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
      }
    }
  }, [user, dependencies.creditService])

  // Add credits with optimistic updates
  const addCredits = useCallback(async (amount: number): Promise<boolean> => {
    if (!user) return false

    const originalCredits = state.credits

    try {
      dispatch({ type: 'SET_ERROR', payload: null })
      
      // Optimistic update
      dispatch({ type: 'SET_CREDITS', payload: state.credits + amount })
      creditEventManager.emit()

      const success = await dependencies.creditService.addCredits(user.id, amount)
      
      if (!success) {
        // Revert optimistic update
        dispatch({ type: 'SET_CREDITS', payload: originalCredits })
        creditEventManager.emit()
        dispatch({ type: 'SET_ERROR', payload: 'Failed to add credits' })
      }

      return success
    } catch (err) {
      // Revert optimistic update
      dispatch({ type: 'SET_CREDITS', payload: originalCredits })
      creditEventManager.emit()
      const errorMessage = err instanceof Error ? err.message : 'Failed to add credits'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return false
    }
  }, [user, state.credits, dependencies.creditService])

  // Subtract credits with validation
  const subtractCredits = useCallback(async (amount: number): Promise<boolean> => {
    if (!user || state.credits < amount) return false

    const originalCredits = state.credits

    try {
      dispatch({ type: 'SET_ERROR', payload: null })
      
      // Optimistic update
      dispatch({ type: 'SET_CREDITS', payload: state.credits - amount })
      creditEventManager.emit()

      const success = await dependencies.creditService.subtractCredits(user.id, amount)
      
      if (!success) {
        // Revert optimistic update
        dispatch({ type: 'SET_CREDITS', payload: originalCredits })
        creditEventManager.emit()
        dispatch({ type: 'SET_ERROR', payload: 'Failed to subtract credits' })
      }

      return success
    } catch (err) {
      // Revert optimistic update
      dispatch({ type: 'SET_CREDITS', payload: originalCredits })
      creditEventManager.emit()
      const errorMessage = err instanceof Error ? err.message : 'Failed to subtract credits'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
      return false
    }
  }, [user, state.credits, dependencies.creditService])

  // Fetch credits when user changes
  useEffect(() => {
    fetchCredits()
  }, [user?.id, fetchCredits])

  // Subscribe to credit events from other components
  useEffect(() => {
    const unsubscribe = creditEventManager.subscribe({
      onCreditsChanged: () => {
        fetchCredits()
      }
    })

    return unsubscribe
  }, [fetchCredits])

  // Reset state when user logs out
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'RESET' })
    }
  }, [user])

  return {
    credits: state.credits,
    loading: state.loading,
    error: state.error,
    addCredits,
    subtractCredits,
    refreshCredits: fetchCredits,
  }
}
