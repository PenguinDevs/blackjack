import React from 'react'
import { BlackjackGameState } from '../types'

interface GameBoardLayoutProps {
  children: React.ReactNode
  gameState: BlackjackGameState
  loading?: boolean
  error?: string | null
}

export const GameBoardLayout: React.FC<GameBoardLayoutProps> = ({
  children,
  loading = false,
  error = null,
}) => {
  return (
    <div className="relative">
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Loading Indicator - Fixed Position Overlay */}
      {loading && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className="inline-flex items-center px-4 py-2 bg-blue-500/90 backdrop-blur-sm border border-blue-500 text-blue-200 rounded-lg shadow-lg">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300 mr-2"></div>
            Processing...
          </div>
        </div>
      )}

      {/* Main Game Content */}
      <div className="game-board-content">{children}</div>
    </div>
  )
}
