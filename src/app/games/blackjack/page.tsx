'use client'

import React from 'react'
import { Navbar, CreditsDisplay } from '@/components/ui/navbar'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useCredits } from '@/hooks/useCredits'
import { Button } from '@/components/ui/button'
import { GameBoard } from './components/GameBoard'
import { useBlackjackGame, useBettingState } from './lib/hooks'
import { PlayerAction } from './types'

export default function BlackjackPage() {
  const { credits } = useCredits()
  const {
    gameState,
    bettingState: gameBettingState,
    isLoading,
    error,
    startNewGame,
    playerHit,
    playerStand,
    resetGame
  } = useBlackjackGame()

  const {
    bettingState,
    setBetAmount,
    setShowBettingOptions,
    setIsPlacingBet
  } = useBettingState()

  // Use local betting state for UI, game betting state for game logic
  const activeBettingState = gameState.gameState === 'waiting' ? bettingState : gameBettingState

  const handleBetChange = (amount: number) => {
    setBetAmount(amount)
  }

  const handlePlaceBet = async () => {
    if (credits >= bettingState.amount) {
      setIsPlacingBet(true)
      await startNewGame(bettingState.amount)
      setIsPlacingBet(false)
    }
  }

  const handlePlayerAction = async (action: PlayerAction) => {
    switch (action) {
      case 'hit':
        await playerHit()
        break
      case 'stand':
        await playerStand()
        break
    }
  }

  const handleShowBettingOptions = (show: boolean) => {
    setShowBettingOptions(show)
  }

  const handleNewRound = () => {
    resetGame()
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar 
          leftContent={<CreditsDisplay />} 
        />

        <main className="container mx-auto px-4 py-8 relative">
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Loading Indicator - Fixed Position Overlay */}
          {isLoading && gameState.gameState !== 'waiting' && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/90 backdrop-blur-sm border border-blue-500 text-blue-200 rounded-lg shadow-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300 mr-2"></div>
                Processing...
              </div>
            </div>
          )}

          {/* Game Board */}
          <GameBoard
            gameState={gameState}
            bettingState={activeBettingState}
            credits={credits}
            onBetChange={handleBetChange}
            onPlaceBet={handlePlaceBet}
            onPlayerAction={handlePlayerAction}
            onShowBettingOptions={handleShowBettingOptions}
          />

          {/* Game Controls */}
          {gameState.gameState === 'game-over' && (
            <div className="text-center mt-8">
              <Button
                onClick={handleNewRound}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3"
              >
                New Round
              </Button>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  )
}