'use client'

import { useState, useCallback } from 'react'
import { AIRecommendationState, BlackjackGameState } from '../types'
import { getAIRecommendation } from '../lib/gemini-ai-service'

export function useAIRecommendation() {
  const [aiState, setAiState] = useState<AIRecommendationState>({
    isLoading: false,
    recommendation: null,
    error: null,
  })

  const getRecommendation = useCallback(async (gameState: BlackjackGameState) => {
    setAiState({
      isLoading: true,
      recommendation: null,
      error: null,
    })

    try {
      const recommendation = await getAIRecommendation(gameState)
      setAiState({
        isLoading: false,
        recommendation,
        error: null,
      })
      
      return recommendation
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI recommendation'
      setAiState({
        isLoading: false,
        recommendation: null,
        error: errorMessage,
      })
      
      throw error
    }
  }, [])

  const clearRecommendation = useCallback(() => {
    setAiState({
      isLoading: false,
      recommendation: null,
      error: null,
    })
  }, [])

  return {
    aiState,
    getRecommendation,
    clearRecommendation,
  }
}