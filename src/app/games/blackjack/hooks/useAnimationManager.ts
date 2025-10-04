import { useRef, useEffect, useCallback } from 'react'
import { BlackjackGameState } from '../types'
import { GameAnimations } from '../utils/animations'
import { useCardAnimations } from '../hooks/useCardAnimations'

interface AnimationManagerProps {
  gameState: BlackjackGameState
  onAnimationStart?: () => void
  onAnimationComplete?: () => void
  onInitialDealComplete?: (complete: boolean) => void
}

export const useAnimationManager = ({ 
  gameState, 
  onAnimationStart, 
  onAnimationComplete,
  onInitialDealComplete
}: AnimationManagerProps) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const prevGameStateRef = useRef<BlackjackGameState | null>(null)
  const cardAnimations = useCardAnimations()

  const handleCardAnimations = useCallback(
    async (prevState: BlackjackGameState, currentState: BlackjackGameState) => {
      // Prevent multiple simultaneous animation sequences
      if (cardAnimations.isAnimating()) {
        return
      }

      onAnimationStart?.()

      try {
        // Initial deal animation (both players get their first cards)
        if (prevState.gameState === 'waiting' && currentState.gameState !== 'waiting') {
          console.log('Starting initial deal animation')
          await cardAnimations.animateInitialDeal()
          console.log('Initial deal animation completed')
          onInitialDealComplete?.(true)
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
    [cardAnimations, onAnimationStart, onAnimationComplete, onInitialDealComplete]
  )

  useEffect(() => {
    // Initialize animation scope
    if (rootRef.current) {
      GameAnimations.initializeScope(rootRef.current)
      cardAnimations.initializeGameboard(rootRef.current)
    }
  }, [cardAnimations])

  useEffect(() => {
    const prevState = prevGameStateRef.current
    if (prevState && prevState !== gameState) {
      handleCardAnimations(prevState, gameState)
    }
    prevGameStateRef.current = gameState
  }, [gameState, handleCardAnimations])

  return {
    rootRef,
    cardAnimations,
  }
}