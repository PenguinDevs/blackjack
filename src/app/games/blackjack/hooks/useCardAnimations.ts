'use client'

import { useCallback, useRef } from 'react'
import { GameAnimations } from '../utils/animations'

export const useCardAnimations = () => {
  const gameboardRef = useRef<HTMLElement | null>(null)
  const animationQueue = useRef<Array<() => Promise<void>>>([])
  const isAnimating = useRef(false)

  // Initialize the gameboard reference for animations
  const initializeGameboard = useCallback((element: HTMLElement) => {
    gameboardRef.current = element
  }, [])

  // Process animation queue sequentially
  const processAnimationQueue = useCallback(async () => {
    if (isAnimating.current || animationQueue.current.length === 0) {
      return
    }

    isAnimating.current = true

    while (animationQueue.current.length > 0) {
      const animation = animationQueue.current.shift()
      if (animation) {
        await animation()
      }
    }

    isAnimating.current = false
  }, [])

  // Add animation to queue
  const queueAnimation = useCallback((animation: () => Promise<void>) => {
    animationQueue.current.push(animation)
    processAnimationQueue()
  }, [processAnimationQueue])

  // Animate a single card flying to its position
  const animateNewCard = useCallback(
    (cardKey: string, isDealer: boolean = false, delay: number = 0) => {
      if (!gameboardRef.current) return Promise.resolve()

      return new Promise<void>((resolve) => {
        queueAnimation(async () => {
          // Wait for delay before starting animation
          if (delay > 0) {
            await new Promise(delayResolve => setTimeout(delayResolve, delay))
          }

          const cardElement = gameboardRef.current?.querySelector(
            `[data-animation-key="${cardKey}"]`
          ) as HTMLElement

          if (!cardElement) {
            console.warn(`Card element not found for key: ${cardKey}`)
            // Log all available card elements for debugging
            const allCards = gameboardRef.current?.querySelectorAll('[data-animation-key]')
            console.log('Available cards:', Array.from(allCards || []).map((el: Element) => el.getAttribute('data-animation-key')))
            resolve()
            return
          }

          console.log(`Found card element for: ${cardKey}`)

          // Get deck position (cards fly from top-center)
          const deckPosition = GameAnimations.getDeckPosition()

          // Get hand container to calculate target position
          const handContainer = cardElement.closest('[data-hand-type]') as HTMLElement
          if (!handContainer) {
            console.warn(`Hand container not found for card: ${cardKey}`)
            resolve()
            return
          }

          // Target position relative to gameboard (simplified calculation)
          const targetPosition = {
            x: 0, // Cards will be positioned by their container
            y: 0,
          }

          try {
            await GameAnimations.animateCardFlying(cardElement, {
              from: deckPosition,
              to: targetPosition,
              delay: 0, // Delay already handled above
              duration: 600, // Reduced duration for snappier feel
              isDealer,
            })
          } catch (error) {
            console.warn('Card animation failed:', error)
          }

          resolve()
        })
      })
    },
    [queueAnimation]
  )

  // Animate multiple cards with staggered timing
  const animateMultipleNewCards = useCallback(
    (cardKeys: string[], isDealer: boolean = false, staggerDelay: number = 200) => {
      const animations = cardKeys.map((cardKey, index) =>
        animateNewCard(cardKey, isDealer, index * staggerDelay)
      )
      return Promise.all(animations)
    },
    [animateNewCard]
  )

  // Animate initial deal - hide cards first, then animate them flying in
  const animateInitialDeal = useCallback(async () => {
    if (!gameboardRef.current) return

    console.log('Starting initial deal animation - hiding cards first')

    // Wait for DOM to be ready with all card elements
    await new Promise(resolve => setTimeout(resolve, 100))

    // Sequence: Player card 1 -> Dealer card 1 -> Player card 2 -> Dealer card 2 (hidden)
    const sequence = [
      { key: 'player-card-0', isDealer: false },
      { key: 'dealer-card-0', isDealer: true },
      { key: 'player-card-1', isDealer: false },
      { key: 'dealer-card-1', isDealer: true },
    ]

    // First, find all cards that should be animated (they're already hidden with pre-deal class)
    const cardElements: HTMLElement[] = []
    for (const { key } of sequence) {
      let cardElement = null
      let attempts = 0
      const maxAttempts = 20

      while (!cardElement && attempts < maxAttempts) {
        cardElement = gameboardRef.current.querySelector(
          `[data-animation-key="${key}"]`
        ) as HTMLElement
        
        if (!cardElement) {
          await new Promise(resolve => setTimeout(resolve, 50))
          attempts++
        }
      }

      if (cardElement) {
        cardElements.push(cardElement)
        // Cards should already have pre-deal class applied from initial render
        console.log(`Found card for animation: ${key}`)
      } else {
        console.warn(`Card element not found for animation: ${key}`)
      }
    }

    // Now animate each card flying in
    for (let i = 0; i < sequence.length; i++) {
      const { key, isDealer } = sequence[i]
      
      console.log(`Animating card ${i + 1}/${sequence.length}: ${key}`)
      
      try {
        await animateNewCard(key, isDealer, 0)
        await new Promise(resolve => setTimeout(resolve, 100)) // Stagger between cards
      } catch (error) {
        console.warn(`Failed to animate ${key}:`, error)
      }
    }

    // Additional buffer to ensure all animations settle
    await new Promise(resolve => setTimeout(resolve, 200))
  }, [animateNewCard])

  // Animate card flip (for revealing dealer's hidden card)
  const animateCardFlip = useCallback((cardKey: string) => {
    if (!gameboardRef.current) return Promise.resolve()

    const cardElement = gameboardRef.current.querySelector(
      `[data-animation-key="${cardKey}"]`
    ) as HTMLElement

    if (!cardElement) return Promise.resolve()

    return GameAnimations.animateCardFlip(cardElement)
  }, [])

  // Clear animation queue (useful for game resets)
  const clearAnimations = useCallback(() => {
    animationQueue.current = []
    isAnimating.current = false
  }, [])

  return {
    initializeGameboard,
    animateNewCard,
    animateMultipleNewCards,
    animateInitialDeal,
    animateCardFlip,
    clearAnimations,
    isAnimating: () => isAnimating.current,
  }
}