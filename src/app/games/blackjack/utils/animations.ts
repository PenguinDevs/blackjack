// Animation utilities using Web Animations API
import { ANIMATION_TIMINGS } from './game-utils'

/**
 * Animation utilities for blackjack game using Web Animations API
 */
export class GameAnimations {
  private static activeAnimations: Animation[] = []

  /**
   * Initialize animation scope for cleanup
   */
  static initializeScope(rootElement: HTMLElement) {
    // Store reference to root element if needed
    return rootElement
  }

  /**
   * Clean up animations
   */
  static cleanup() {
    this.activeAnimations.forEach((animation) => {
      if (animation.cancel) animation.cancel()
    })
    this.activeAnimations = []
  }

  /**
   * Add animation to tracking
   */
  private static trackAnimation(animation: Animation) {
    this.activeAnimations.push(animation)
    return animation
  }

  /**
   * Helper to create Web API animation
   */
  private static createAnimation(
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const animation = element.animate(keyframes, options)
        this.trackAnimation(animation)

        animation.onfinish = () => resolve()
        animation.oncancel = () => resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Enhanced card flying animation with arc trajectory
   */
  static animateCardFlying(
    cardElement: HTMLElement,
    config: {
      from: { x: number; y: number }
      to: { x: number; y: number }
      delay?: number
      duration?: number
      isDealer?: boolean
    }
  ): Promise<void> {
    const { from, to, delay = 0, duration = ANIMATION_TIMINGS.CARD_DEAL, isDealer = false } = config

    // Store original position for restoration (unused but kept for potential future use)
    // const originalTransform = cardElement.style.transform || ''

    // Calculate arc trajectory - simpler approach
    const arcHeight = 200 // Fixed arc height for consistent animation
    const midX = (from.x + to.x) / 2
    const midY = from.y - arcHeight

    return new Promise((resolve) => {
      // Remove pre-deal class so animation can control visibility
      cardElement.classList.remove('pre-deal')

      // Set initial animation styles
      cardElement.style.position = 'relative'
      cardElement.style.zIndex = '1000'
      cardElement.style.transform = `translate(${from.x}px, ${from.y}px) scale(0.7)`
      cardElement.style.opacity = '0'

      // Single smooth animation with all phases
      const flyAnimation = cardElement.animate(
        [
          // Start: invisible at deck position
          {
            opacity: '0',
            transform: `translate(${from.x}px, ${from.y}px) scale(0.7) rotate(0deg)`,
          },
          // Mid: fade in and reach arc peak
          {
            opacity: '1',
            transform: `translate(${midX}px, ${midY}px) scale(1.1) rotate(${isDealer ? -15 : 15}deg)`,
            offset: 0.4,
          },
          // Near end: approach target
          {
            opacity: '1',
            transform: `translate(${to.x}px, ${to.y}px) scale(1.05) rotate(0deg)`,
            offset: 0.8,
          },
          // End: settle at final position
          {
            opacity: '1',
            transform: `translate(${to.x}px, ${to.y}px) scale(1) rotate(0deg)`,
          },
        ],
        {
          duration,
          delay,
          fill: 'forwards',
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth ease-out
        }
      )

      this.trackAnimation(flyAnimation)

      flyAnimation.onfinish = () => {
        // Reset styles and mark as animated
        cardElement.style.removeProperty('transform')
        cardElement.style.removeProperty('opacity')
        cardElement.style.removeProperty('z-index')
        cardElement.style.removeProperty('position')
        cardElement.classList.remove('pre-deal')
        cardElement.classList.add('animated')
        resolve()
      }

      flyAnimation.oncancel = () => {
        // Clean up on cancel - make sure card is still visible
        cardElement.style.removeProperty('transform')
        cardElement.style.removeProperty('opacity')
        cardElement.style.removeProperty('z-index')
        cardElement.style.removeProperty('position')
        cardElement.classList.remove('pre-deal')
        cardElement.classList.add('animated')
        resolve()
      }
    })
  }

  /**
   * Animates card flip (revealing hidden card)
   */
  static animateCardFlip(cardElement: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      console.log('🔄 Starting card flip animation')

      // Get the hidden card data from the element
      const cardSuit = cardElement.getAttribute('data-card-suit')
      const cardRank = cardElement.getAttribute('data-card-rank')

      if (!cardSuit || !cardRank) {
        console.warn('⚠️ Missing card data for flip animation')
        resolve()
        return
      }

      // First half: rotate to 90deg (hiding the back)
      const flipOut = cardElement.animate(
        [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(90deg)' }],
        {
          duration: 200,
          fill: 'forwards',
          easing: 'ease-in',
        }
      )

      this.trackAnimation(flipOut)

      flipOut.onfinish = () => {
        // Mark card as flipped for React to handle the content change
        console.log(`🎯 Revealing card: ${cardRank} of ${cardSuit}`)
        
        // Just mark the card as flipped - let React handle the content
        cardElement.setAttribute('data-card-flipped', 'true')
        cardElement.removeAttribute('data-card-hidden')

        // Second half: rotate back to 0deg (showing the face)
        const flipIn = cardElement.animate(
          [{ transform: 'rotateY(90deg)' }, { transform: 'rotateY(0deg)' }],
          {
            duration: 200,
            fill: 'forwards',
            easing: 'ease-out',
          }
        )

        this.trackAnimation(flipIn)
        flipIn.onfinish = () => {
          console.log('✅ Card flip completed')
          resolve()
        }
      }
    })
  }

  // Duplicate getSuitSymbol function removed - card display logic is handled in Card component

  /**
   * Deck position calculator - cards fly from top-center of the game board
   */
  static getDeckPosition(): { x: number; y: number } {
    return {
      x: 0, // Center horizontally
      y: -300, // Start from above the visible area
    }
  }

  /**
   * Calculate target position for a card in a hand
   */
  static getHandPosition(
    handElement: HTMLElement,
    cardIndex: number,
    totalCards: number
  ): { x: number; y: number } {
    const cardWidth = 64 // w-16 = 64px
    const cardSpacing = 8 // space-x-2 = 8px

    // Calculate total width of all cards
    const totalWidth = totalCards * cardWidth + (totalCards - 1) * cardSpacing

    // Calculate starting x position to center the hand
    const startX = -totalWidth / 2 + cardWidth / 2

    // Calculate this card's position
    const x = startX + cardIndex * (cardWidth + cardSpacing)
    const y = 0 // Cards are positioned at the center of the hand element

    return { x, y }
  }

  // Unused animation functions removed to eliminate DRY violations
  // Only actively used animations (animateCardFlying, animateCardFlip, getDeckPosition, getHandPosition) are kept
}
