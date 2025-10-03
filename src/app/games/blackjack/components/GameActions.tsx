'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PlayerAction, GameState, BlackjackGameState, AIRecommendation } from '../types'
import { Brain, Loader2 } from 'lucide-react'

interface GameActionsProps {
  gameState: GameState
  availableActions: PlayerAction[]
  onPlayerAction: (action: PlayerAction) => void
  disabled?: boolean
  fullGameState?: BlackjackGameState
  onAskAI?: (gameState: BlackjackGameState) => Promise<AIRecommendation>
}

export const GameActions: React.FC<GameActionsProps> = ({
  gameState,
  availableActions,
  onPlayerAction,
  disabled = false,
  fullGameState,
  onAskAI,
}) => {
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null)
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [showRecommendation, setShowRecommendation] = useState(false)

  // Clear recommendation when game state changes
  useEffect(() => {
    if (gameState !== 'player-turn') {
      setAiRecommendation(null)
      setShowRecommendation(false)
    }
  }, [gameState])

  if (gameState !== 'player-turn' || availableActions.length === 0) {
    return null
  }

  const handleAskAI = async () => {
    if (!fullGameState || !onAskAI) return

    setIsLoadingAI(true)
    try {
      const recommendation = await onAskAI(fullGameState)
      setAiRecommendation(recommendation)
      setShowRecommendation(true)
    } catch (error) {
      console.error('Failed to get AI recommendation:', error)
    } finally {
      setIsLoadingAI(false)
    }
  }

  const handlePlayerAction = (action: PlayerAction) => {
    // Clear AI recommendation immediately when player takes any action
    setAiRecommendation(null)
    setShowRecommendation(false)
    
    // Call the original onPlayerAction handler
    onPlayerAction(action)
  }

  const getActionLabel = (action: PlayerAction): string => {
    switch (action) {
      case 'hit':
        return 'Hit'
      case 'stand':
        return 'Stand'
      default:
        return action
    }
  }

  const getActionVariant = (action: PlayerAction) => {
    switch (action) {
      case 'hit':
        return 'default'
      case 'stand':
        return 'default'
      default:
        return 'outline'
    }
  }

  const isRecommendedAction = (action: PlayerAction): boolean => {
    return aiRecommendation?.action === action && showRecommendation
  }

  const getButtonClassName = (action: PlayerAction): string => {
    const baseClass = "font-semibold px-6 py-2 transition-all duration-500"
    
    if (isRecommendedAction(action)) {
      return `${baseClass} bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black border-2 border-yellow-300 shadow-lg shadow-yellow-400/50 animate-pulse scale-105 hover:scale-110`
    }
    
    return baseClass
  }

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Action Buttons - Hit and Stand */}
      <div className="flex space-x-4 justify-center">
        {availableActions.map((action) => (
          <Button
            key={action}
            variant={
              getActionVariant(action) as
                | 'default'
                | 'destructive'
                | 'outline'
                | 'secondary'
                | 'ghost'
                | 'link'
            }
            className={getButtonClassName(action)}
            onClick={() => handlePlayerAction(action)}
            disabled={disabled}
          >
            {getActionLabel(action)}
          </Button>
        ))}
      </div>
      
      {/* Ask AI Button - Now below Hit/Stand buttons */}
      {fullGameState && onAskAI && (
        <Button
          variant="outline"
          className="font-semibold px-4 py-2 border-purple-500 text-purple-600 hover:bg-purple-50 transition-all duration-200"
          onClick={handleAskAI}
          disabled={disabled || isLoadingAI}
        >
          {isLoadingAI ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Ask Gemini AI
            </>
          )}
        </Button>
      )}
      
      {/* AI Recommendation Display - Below buttons, no absolute positioning needed */}
      {aiRecommendation && showRecommendation && (
        <div className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg shadow-lg transition-all duration-500 min-w-max ${
          showRecommendation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-5 h-5 text-yellow-400" />
            <span className="font-bold text-sm">Gemini AI Recommendation</span>
          </div>
          <p className="text-sm mb-1">
            <span className="font-semibold text-yellow-400">{aiRecommendation.action.toUpperCase()}</span> 
            (Confidence: {Math.round(aiRecommendation.confidence * 100)}%)
          </p>
          <p className="text-xs text-gray-200">{aiRecommendation.reasoning}</p>
        </div>
      )}
    </div>
  )
}

interface GameStatusProps {
  gameState: GameState
  message?: string
  currentBet?: number
}

export const GameStatus: React.FC<GameStatusProps> = ({ gameState, message, currentBet }) => {
  const getStatusMessage = (): string => {
    if (message) return message

    switch (gameState) {
      case 'waiting':
        return 'Place your bet to start'
      case 'betting':
        return 'Placing bet...'
      case 'dealing':
        return 'Dealing cards...'
      case 'player-turn':
        return 'Your turn - choose an action'
      case 'dealer-turn':
        return 'Dealer is playing...'
      case 'game-over':
        return 'Round complete'
      default:
        return ''
    }
  }

  const getStatusColor = (): string => {
    switch (gameState) {
      case 'waiting':
        return 'text-gray-400'
      case 'betting':
        return 'text-yellow-400'
      case 'dealing':
        return 'text-blue-400'
      case 'player-turn':
        return 'text-green-400'
      case 'dealer-turn':
        return 'text-orange-400'
      case 'game-over':
        return 'text-white'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="text-center">
      <p className={`text-sm font-medium ${getStatusColor()}`}>{getStatusMessage()}</p>
      {/* Show current bet on small screens only */}
      {currentBet !== undefined && (
        <p className="text-xs text-gray-300 mt-1 md:hidden">
          Current Bet: {currentBet} Credits
        </p>
      )}
    </div>
  )
}
