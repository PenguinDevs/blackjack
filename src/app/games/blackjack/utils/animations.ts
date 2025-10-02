import { animate, createScope } from 'animejs'
import { CardAnimation } from '../types'

/**
 * Animation utilities for blackjack game
 */
export class GameAnimations {
  private static scope: ReturnType<typeof createScope> | null = null

  /**
   * Initialize animation scope for cleanup
   */
  static initializeScope(rootElement: HTMLElement) {
    this.scope = createScope({ root: rootElement })
    return this.scope
  }

  /**
   * Clean up animations
   */
  static cleanup() {
    if (this.scope) {
      this.scope.revert()
      this.scope = null
    }
  }

  /**
   * Animates betting modal expansion
   */
  static animateBettingModal(
    modal: HTMLElement,
    header: HTMLElement,
    buttons: HTMLElement
  ): Promise<void> {
    return new Promise((resolve) => {
      // Set initial states
      animate(modal, {
        opacity: 1,
        transform: 'translate(-50%, -50%) scaleX(0.1) scaleY(0.1)',
        transformOrigin: '50% 50%',
        duration: 0,
      })

      animate(header, { opacity: 0, translateY: '20px', duration: 0 })
      animate(buttons, { opacity: 0, translateY: '20px', duration: 0 })

      // Step 1: Expand horizontally
      animate(modal, {
        transform: [
          'translate(-50%, -20%) scaleX(0.1) scaleY(0.1)',
          'translate(-50%, -20%) scaleX(1) scaleY(0.1)',
        ],
        duration: 200,
        ease: 'out(2)',
        onComplete: () => {
          // Step 2: Expand vertically
          animate(modal, {
            transform: [
              'translate(-50%, -20%) scaleX(1) scaleY(0.1)',
              'translate(-50%, -50%) scaleX(1) scaleY(1)',
            ],
            duration: 300,
            ease: 'out(2)',
            onComplete: () => {
              // Step 3: Fade in content with staggered timing
              animate(header, {
                opacity: [0, 1],
                translateY: ['20px', '0px'],
                duration: 300,
              })

              animate(buttons, {
                opacity: [0, 1],
                translateY: ['20px', '0px'],
                duration: 300,
                delay: 20,
                onComplete: () => resolve(),
              })
            },
          })
        },
      })
    })
  }

  /**
   * Animates betting modal collapse
   */
  static animateBettingModalCollapse(modal: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      animate(modal, {
        transform: [
          'translate(-50%, -50%) scaleX(1) scaleY(1)',
          'translate(-50%, -50%) scaleX(0.1) scaleY(0.1)',
        ],
        opacity: [1, 0],
        duration: 300,
        ease: 'in(2)',
        onComplete: () => resolve(),
      })
    })
  }

  /**
   * Animates card dealing
   */
  static animateCardDeal(
    cardElement: HTMLElement,
    config: {
      from: { x: number; y: number; rotation?: number }
      to: { x: number; y: number; rotation?: number }
      delay?: number
    }
  ): Promise<void> {
    return new Promise((resolve) => {
      // Set initial position
      animate(cardElement, {
        translateX: config.from.x,
        translateY: config.from.y,
        rotate: config.from.rotation || 0,
        scale: 0.8,
        opacity: 0,
        duration: 0,
      })

      // Animate to final position
      animate(cardElement, {
        translateX: config.to.x,
        translateY: config.to.y,
        rotate: config.to.rotation || 0,
        scale: 1,
        opacity: 1,
        duration: 600,
        delay: config.delay || 0,
        ease: 'out(3)',
        onComplete: () => resolve(),
      })
    })
  }

  /**
   * Animates card flip (revealing hidden card)
   */
  static animateCardFlip(cardElement: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      animate(cardElement, {
        rotateY: [0, 90],
        duration: 200,
        ease: 'in(2)',
        onComplete: () => {
          // Card is now face-down, change content here
          animate(cardElement, {
            rotateY: [90, 0],
            duration: 200,
            ease: 'out(2)',
            onComplete: () => resolve(),
          })
        },
      })
    })
  }

  /**
   * Animates hand value update
   */
  static animateHandValue(element: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      animate(element, {
        scale: [1, 1.2, 1],
        duration: 400,
        ease: 'out(2)',
        onComplete: () => resolve(),
      })
    })
  }

  /**
   * Animates winning/losing result
   */
  static animateResult(element: HTMLElement, isWin: boolean): Promise<void> {
    return new Promise((resolve) => {
      const color = isWin ? '#22c55e' : '#ef4444' // green for win, red for loss

      animate(element, {
        scale: [1, 1.1, 1],
        color: [color, color],
        duration: 800,
        ease: 'out(2)',
        onComplete: () => resolve(),
      })
    })
  }

  /**
   * Animates chips/credits update
   */
  static animateCreditsUpdate(element: HTMLElement, isIncrease: boolean): Promise<void> {
    return new Promise((resolve) => {
      const direction = isIncrease ? -10 : 10

      animate(element, {
        translateY: [0, direction, 0],
        scale: [1, 1.05, 1],
        duration: 500,
        ease: 'out(2)',
        onComplete: () => resolve(),
      })
    })
  }

  /**
   * Staggered animation for multiple cards
   */
  static animateMultipleCards(
    cards: {
      element: HTMLElement
      config: CardAnimation['config'] & {
        from: { x: number; y: number; rotation?: number }
        to: { x: number; y: number; rotation?: number }
      }
    }[]
  ): Promise<void[]> {
    return Promise.all(
      cards.map((card, index) =>
        this.animateCardDeal(card.element, {
          ...card.config,
          delay: (card.config.delay || 0) + index * 150, // Stagger by 150ms
        })
      )
    )
  }

  /**
   * Pulse animation for interactive elements
   */
  static animatePulse(element: HTMLElement, intensity: number = 1.05): Promise<void> {
    return new Promise((resolve) => {
      animate(element, {
        scale: [1, intensity, 1],
        duration: 600,
        ease: 'out(2)',
        onComplete: () => resolve(),
      })
    })
  }
}
