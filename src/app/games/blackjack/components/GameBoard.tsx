'use client'

import React, { useEffect, useRef, useCallback } from 'react'
import { BlackjackGameState, BettingState, PlayerAction, AIRecommendation } from '../types'
import { Hand } from './Card'
import { BettingInterface } from './BettingInterface'
import { GameActions, GameStatus } from './GameActions'
import { useAnimationManager } from '../hooks/useAnimationManager'
import { useCardAnimations } from '../hooks/useCardAnimations'
import { GameAnimations } from '../utils/animations'
import { getAIRecommendation } from '../lib/gemini-ai-service'
import '../styles/animations.css'

// Simplified interface following Interface Segregation Principle
interface GameBoardCoreProps {
  gameState: BlackjackGameState
  bettingState: BettingState
  credits: number
}

interface GameBoardActionsProps {
  onBetChange: (amount: number) => void
  onPlaceBet: () => void
  onPlayerAction: (action: PlayerAction) => void
  onShowBettingOptions: (show: boolean) => void
}

interface GameBoardAnimationProps {
  onAnimationStart?: () => void
  onAnimationComplete?: () => void
}

type GameBoardProps = GameBoardCoreProps & GameBoardActionsProps & GameBoardAnimationProps

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  bettingState,
  credits,
  onBetChange,
  onPlaceBet,
  onPlayerAction,
  onShowBettingOptions,
  onAnimationStart,
  onAnimationComplete,
}) => {
  const [isInitialDealComplete, setIsInitialDealComplete] = React.useState(false)
  const prevGameStateRef = useRef<BlackjackGameState | null>(null)
  const cardAnimations = useCardAnimations()

  const { rootRef } = useAnimationManager({
    gameState,
    onAnimationStart,
    onAnimationComplete,
    onInitialDealComplete: setIsInitialDealComplete,
  })

  const handleCardAnimations = React.useCallback(
    async (prevState: BlackjackGameState, currentState: BlackjackGameState) => {
      // Prevent multiple simultaneous animation sequences
      if (cardAnimations.isAnimating()) {
        return
      }

      onAnimationStart?.()

      try {
        // Initial deal animation (both players get their first cards)
        if (prevState.gameState === 'waiting') {
          console.log('Starting initial deal animation')
          await cardAnimations.animateInitialDeal()
          console.log('Initial deal animation completed')
          // Enable game actions now that initial deal is done
          setIsInitialDealComplete(true)
        }
        // Player hit animation
        else if (prevState.playerHand.cards.length < currentState.playerHand.cards.length) {
          const newCardIndex = currentState.playerHand.cards.length - 1
          console.log(`Animating new player card: ${newCardIndex}`)
          await cardAnimations.animateNewCard(`player-card-${newCardIndex}`, false)
        }
        // Dealer hit animation
        else if (prevState.dealerHand.cards.length < currentState.dealerHand.cards.length) {
          const newCardIndex = currentState.dealerHand.cards.length - 1
          console.log(`Animating new dealer card: ${newCardIndex}`)
          await cardAnimations.animateNewCard(`dealer-card-${newCardIndex}`, true)
        }
      } catch (error) {
        console.warn('Animation error:', error)
      }

      onAnimationComplete?.()
    },
    [cardAnimations, onAnimationStart, onAnimationComplete]
  )

  useEffect(() => {
    // Initialize animation scope
    if (rootRef.current) {
      GameAnimations.initializeScope(rootRef.current)
      cardAnimations.initializeGameboard(rootRef.current)
    }

    return () => {
      GameAnimations.cleanup()
      cardAnimations.clearAnimations()
    }
  }, [cardAnimations, rootRef])

  // Track game state changes and trigger animations
  useEffect(() => {
    const prev = prevGameStateRef.current
    const current = gameState

    // Reset initial deal completion when starting a new game
    if (current.gameState === 'waiting') {
      setIsInitialDealComplete(false)
    }

    // Skip if no previous state (initial load)
    if (!prev) {
      prevGameStateRef.current = current
      return
    }

    // Detect initial deal: waiting → player-turn (cards appear for first time)
    const isInitialDeal =
      prev.gameState === 'waiting' &&
      current.gameState === 'player-turn' &&
      current.playerHand.cards.length > 0

    // Detect new cards during gameplay
    const hasNewPlayerCards = prev.playerHand.cards.length < current.playerHand.cards.length
    const hasNewDealerCards = prev.dealerHand.cards.length < current.dealerHand.cards.length

    if (isInitialDeal) {
      console.log('Detected initial deal: waiting → player-turn')
      // Wait for next frame to ensure DOM is updated with new cards
      requestAnimationFrame(() => {
        handleCardAnimations(prev, current)
      })
    } else if (hasNewPlayerCards || hasNewDealerCards) {
      console.log('Detected new cards during gameplay')
      requestAnimationFrame(() => {
        handleCardAnimations(prev, current)
      })
    }

    prevGameStateRef.current = current
  }, [gameState, handleCardAnimations])

  // Handle dealer card flip when hole card is revealed
  // Handle AI recommendation requests
  const handleAIRecommendation = useCallback(
    async (gameState: BlackjackGameState): Promise<AIRecommendation> => {
      try {
        return await getAIRecommendation(gameState)
      } catch (error) {
        console.error('Failed to get AI recommendation:', error)
        throw error
      }
    },
    []
  )

  const handleDealerCardFlip = React.useCallback(async () => {
    if (
      (gameState.gameState === 'dealer-turn' || gameState.gameState === 'game-over') &&
      gameState.dealerHand.cards.length > 1
    ) {
      const holeCard = gameState.dealerHand.cards.find((card) => card.isHidden)
      if (holeCard) {
        console.log('🔄 Flipping dealer hole card')
        await cardAnimations.animateCardFlip('dealer-card-1')

        // Force the card element to show the revealed card content
        // This is a visual override since the game state might not update immediately
        const cardElement = rootRef.current?.querySelector(
          '[data-animation-key="dealer-card-1"]'
        ) as HTMLElement
        if (cardElement) {
          // Remove the hidden card styling and ensure it's visible
          cardElement.classList.add('animated')
          cardElement.style.opacity = '1'
          cardElement.style.transform = 'none'
          console.log('💡 Ensured dealer card visibility after flip')
        }
      }
    }
  }, [gameState.gameState, gameState.dealerHand.cards, cardAnimations, rootRef])

  useEffect(() => {
    if (gameState.gameState === 'dealer-turn' || gameState.gameState === 'game-over') {
      handleDealerCardFlip()
    }
  }, [gameState.gameState, handleDealerCardFlip])

  const showBettingInterface = gameState.gameState === 'waiting'
  const showGameActions =
    gameState.gameState === 'player-turn' &&
    gameState.availableActions.length > 0 &&
    isInitialDealComplete

  return (
    <div ref={rootRef} className="w-full">
      <div className="p-8">
        <div className="w-full h-[600px] relative game-board z-10">
          {/* Game Status - Fixed Position at Top Center */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
            <GameStatus
              gameState={gameState.gameState}
              message={gameState.gameResult?.reason}
              currentBet={gameState.gameState !== 'waiting' ? gameState.currentBet : undefined}
            />
          </div>

          {/* Dealer Section - Fixed Position */}
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
            <Hand
              cards={gameState.dealerHand.cards}
              label="Dealer"
              value={
                gameState.gameState === 'game-over' ||
                (gameState.gameState === 'dealer-turn' &&
                  !gameState.dealerHand.cards.some((card) => card.isHidden))
                  ? gameState.dealerHand.value
                  : gameState.dealerHand.cards.length === 0 ||
                      gameState.dealerHand.cards.some((card) => card.isHidden)
                    ? '?'
                    : gameState.dealerHand.value
              }
              isDealer={true}
              gameState={gameState.gameState}
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
              isDealer={false}
              gameState={gameState.gameState}
            />
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

          {/* Current Bet Display - Hidden on small screens */}
          {gameState.gameState !== 'waiting' && (
            <div className="absolute bottom-8 left-8 hidden md:block">
              <div className="rounded-lg p-4">
                <p className="text-sm font-medium mb-2">Current Bet</p>
                <p className="text-xl font-black ">{gameState.currentBet} Credits</p>
              </div>
            </div>
          )}
        </div>

        {/* Game Action Buttons - Outside game board container, below everything */}
        {showGameActions && (
          <div className="flex justify-center -mt-12 relative z-50">
            <GameActions
              gameState={gameState.gameState}
              availableActions={gameState.availableActions}
              onPlayerAction={onPlayerAction}
              disabled={gameState.gameState !== 'player-turn'}
              fullGameState={gameState}
              onAskAI={handleAIRecommendation}
            />
          </div>
        )}
      </div>
    </div>
  )
}
