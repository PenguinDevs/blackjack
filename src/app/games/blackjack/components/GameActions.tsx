'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { PlayerAction, GameState } from '../types'

interface GameActionsProps {
  gameState: GameState
  availableActions: PlayerAction[]
  onPlayerAction: (action: PlayerAction) => void
  disabled?: boolean
}

export const GameActions: React.FC<GameActionsProps> = ({
  gameState,
  availableActions,
  onPlayerAction,
  disabled = false
}) => {
  if (gameState !== 'player-turn' || availableActions.length === 0) {
    return null
  }

  const getActionLabel = (action: PlayerAction): string => {
    switch (action) {
      case 'hit': return 'Hit'
      case 'stand': return 'Stand'
      default: return action
    }
  }

  const getActionVariant = (action: PlayerAction) => {
    switch (action) {
      case 'hit': return 'default'
      case 'stand': return 'default'
      default: return 'outline'
    }
  }

  return (
    <div className="flex space-x-4 justify-center">
      {availableActions.map((action) => (
        <Button
          key={action}
          variant={getActionVariant(action) as any}
          className="font-semibold px-6 py-2"
          onClick={() => onPlayerAction(action)}
          disabled={disabled}
        >
          {getActionLabel(action)}
        </Button>
      ))}
    </div>
  )
}

interface GameStatusProps {
  gameState: GameState
  currentBet?: number
  message?: string
}

export const GameStatus: React.FC<GameStatusProps> = ({
  gameState,
  currentBet,
  message
}) => {
  const getStatusMessage = (): string => {
    if (message) return message

    switch (gameState) {
      case 'waiting': return 'Place your bet to start'
      case 'betting': return 'Placing bet...'
      case 'dealing': return 'Dealing cards...'
      case 'player-turn': return 'Your turn - choose an action'
      case 'dealer-turn': return 'Dealer is playing...'
      case 'game-over': return 'Round complete'
      default: return ''
    }
  }

  const getStatusColor = (): string => {
    switch (gameState) {
      case 'waiting': return 'text-gray-400'
      case 'betting': return 'text-yellow-400'
      case 'dealing': return 'text-blue-400'
      case 'player-turn': return 'text-green-400'
      case 'dealer-turn': return 'text-orange-400'
      case 'game-over': return 'text-white'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className="text-center mb-4">
      <p className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusMessage()}
      </p>
      {currentBet && gameState !== 'waiting' && (
        <p className="text-xs text-gray-300 mt-1">
          Current bet: {currentBet} credits
        </p>
      )}
    </div>
  )
}