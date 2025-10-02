'use client'

import React, { useRef, useEffect } from 'react'
import { BlackjackGameState, BettingState, PlayerAction } from '../types'
import { Hand } from './Card'
import { BettingInterface } from './BettingInterface'
import { GameActions, GameStatus } from './GameActions'
import { GameAnimations } from '../utils/animations'

interface GameBoardProps {
  gameState: BlackjackGameState
  bettingState: BettingState
  credits: number
  onBetChange: (amount: number) => void
  onPlaceBet: () => void
  onPlayerAction: (action: PlayerAction) => void
  onShowBettingOptions: (show: boolean) => void
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  bettingState,
  credits,
  onBetChange,
  onPlaceBet,
  onPlayerAction,
  onShowBettingOptions,
}) => {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize animation scope
    if (rootRef.current) {
      GameAnimations.initializeScope(rootRef.current)
    }

    return () => {
      GameAnimations.cleanup()
    }
  }, [])

  const showBettingInterface = gameState.gameState === 'waiting'
  const showGameActions =
    gameState.gameState === 'player-turn' && gameState.availableActions.length > 0

  return (
    <div ref={rootRef} className="w-full">
      <div className="p-8">
        <div className="w-full h-[600px] relative">
          {/* Game Status - Fixed Position at Top Center */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            <GameStatus
              gameState={gameState.gameState}
              currentBet={gameState.currentBet}
              message={gameState.gameResult?.reason}
            />
          </div>

          {/* Dealer Section - Fixed Position */}
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
            <Hand
              cards={gameState.dealerHand.cards}
              label="Dealer"
              value={
                gameState.gameState === 'game-over' || gameState.gameState === 'dealer-turn'
                  ? gameState.dealerHand.value
                  : gameState.dealerHand.cards.length === 0 || gameState.dealerHand.cards.some(card => card.isHidden)
                  ? "?"
                  : gameState.dealerHand.value
              }
            />
          </div>

          {/* Center Betting Interface */}
          {showBettingInterface && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <BettingInterface
                bettingState={bettingState}
                credits={credits}
                onBetChange={onBetChange}
                onPlaceBet={onPlaceBet}
                onShowBettingOptions={onShowBettingOptions}
              />
            </div>
          )}

          {/* Player Section - Fixed Position */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <Hand
              cards={gameState.playerHand.cards}
              label="Your Hand"
              value={gameState.playerHand.cards.length > 0 ? gameState.playerHand.value : undefined}
              className="mb-10"
            />

            {/* Game Action Buttons */}
            {showGameActions && (
              <GameActions
                gameState={gameState.gameState}
                availableActions={gameState.availableActions}
                onPlayerAction={onPlayerAction}
                disabled={gameState.gameState !== 'player-turn'}
              />
            )}
          </div>

          {/* Game Result */}
          {gameState.gameResult && gameState.gameState === 'game-over' && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-sm rounded-lg p-6 text-center border border-gray-600">
              <h3
                className={`text-2xl font-bold mb-2 ${
                  gameState.gameResult.playerWins
                    ? 'text-green-400'
                    : gameState.gameResult.isDraw
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}
              >
                {gameState.gameResult.playerWins
                  ? 'You Win!'
                  : gameState.gameResult.isDraw
                    ? 'Push!'
                    : 'You Lose!'}
              </h3>
              <p className="text-white mb-2">{gameState.gameResult.reason}</p>
              <p className="text-lg font-semibold text-white">
                {gameState.gameResult.winnings > 0 && (
                  <>Winnings: {gameState.gameResult.winnings} credits</>
                )}
              </p>
            </div>
          )}

          {/* Current Bet Display */}
          {gameState.gameState !== 'waiting' && (
            <div className="absolute bottom-8 left-8">
              <div className="rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Current Bet</p>
                <p className="text-xl font-black ">{gameState.currentBet} Credits</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
