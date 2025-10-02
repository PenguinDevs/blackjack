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
      case 'double-down':
        // TODO: Implement double down
        console.log('Double down not implemented yet')
        break
      case 'split':
        // TODO: Implement split
        console.log('Split not implemented yet')
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

        <main className="container mx-auto px-4 py-8">
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && gameState.gameState !== 'waiting' && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 border border-blue-500 text-blue-200 rounded-lg">
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

          {/* Game Rules (collapsible) */}
          <div className="mt-12 text-center">
            <details className="bg-gray-900/50 rounded-lg p-6 text-left max-w-2xl mx-auto">
              <summary className="cursor-pointer text-lg font-semibold text-white mb-4">
                Game Rules
              </summary>
              <div className="text-gray-300 space-y-2 text-sm">
                <p><strong>Objective:</strong> Get as close to 21 as possible without going over (busting).</p>
                <p><strong>Card Values:</strong> Number cards = face value, Face cards = 10, Ace = 1 or 11</p>
                <p><strong>Blackjack:</strong> Ace + 10-value card on first two cards (pays 3:2)</p>
                <p><strong>Hit:</strong> Take another card</p>
                <p><strong>Stand:</strong> Keep your current hand</p>
                <p><strong>Dealer Rules:</strong> Must hit on 16 or less, must stand on 17 or more</p>
                <p><strong>Push:</strong> Tie with dealer (bet returned)</p>
              </div>
            </details>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}