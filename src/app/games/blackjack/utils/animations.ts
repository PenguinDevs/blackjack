// Animation utilities using Web Animations API

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
    this.activeAnimations.forEach(animation => {
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
    const { from, to, delay = 0, duration = 600, isDealer = false } = config
    
    // Store original position for restoration (unused but kept for potential future use)
    // const originalTransform = cardElement.style.transform || ''
    
    // Calculate arc trajectory - simpler approach
    const arcHeight = 200 // Fixed arc height for consistent animation
    const midX = (from.x + to.x) / 2
    const midY = from.y - arcHeight
    
    return new Promise((resolve) => {
      // Set initial animation styles
      cardElement.style.position = 'relative'
      cardElement.style.zIndex = '1000'      // Set initial state - card starts invisible from deck position
      cardElement.style.transform = `translate(${from.x}px, ${from.y}px) scale(0.7)`
      cardElement.style.opacity = '0'
      cardElement.style.zIndex = '1000'
      cardElement.style.position = 'relative'
      
      // Single smooth animation with all phases
      const flyAnimation = cardElement.animate([
        // Start: invisible at deck position
        { 
          opacity: '0', 
          transform: `translate(${from.x}px, ${from.y}px) scale(0.7) rotate(0deg)` 
        },
        // Mid: fade in and reach arc peak
        { 
          opacity: '1', 
          transform: `translate(${midX}px, ${midY}px) scale(1.1) rotate(${isDealer ? -15 : 15}deg)`,
          offset: 0.4
        },
        // Near end: approach target
        { 
          opacity: '1', 
          transform: `translate(${to.x}px, ${to.y}px) scale(1.05) rotate(0deg)`,
          offset: 0.8
        },
        // End: settle at final position
        { 
          opacity: '1', 
          transform: `translate(${to.x}px, ${to.y}px) scale(1) rotate(0deg)` 
        }
      ], {
        duration,
        delay,
        fill: 'forwards',
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' // Smooth ease-out
      })
      
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
   * Animates card dealing (simpler version)
   */
  static animateCardDeal(
    cardElement: HTMLElement,
    config: {
      from: { x: number; y: number; rotation?: number }
      to: { x: number; y: number; rotation?: number }
      delay?: number
    }
  ): Promise<void> {
    const { from, to, delay = 0 } = config
    
    return new Promise((resolve) => {
      // Set initial position
      cardElement.style.transform = `translate(${from.x}px, ${from.y}px) rotate(${from.rotation || 0}deg) scale(0.8)`
      cardElement.style.opacity = '0'
      
      // Animate to final position
      const animation = cardElement.animate([
        { 
          transform: `translate(${from.x}px, ${from.y}px) rotate(${from.rotation || 0}deg) scale(0.8)`,
          opacity: '0'
        },
        { 
          transform: `translate(${to.x}px, ${to.y}px) rotate(${to.rotation || 0}deg) scale(1)`,
          opacity: '1'
        }
      ], {
        duration: 600,
        delay,
        fill: 'forwards',
        easing: 'ease-out'
      })
      
      this.trackAnimation(animation)
      animation.onfinish = () => resolve()
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
      const flipOut = cardElement.animate([
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(90deg)' }
      ], {
        duration: 200,
        fill: 'forwards',
        easing: 'ease-in'
      })
      
      this.trackAnimation(flipOut)
      
      flipOut.onfinish = () => {
        // Change card content to show the revealed card
        console.log(`🎯 Revealing card: ${cardRank} of ${cardSuit}`)
        
        const suitSymbol = this.getSuitSymbol(cardSuit)
        const suitColor = cardSuit === 'hearts' || cardSuit === 'diamonds' ? 'text-red-500' : 'text-black'
        
        cardElement.innerHTML = `
          <div class="text-xs font-bold ${suitColor}">
            ${cardRank}
          </div>
          <div class="text-2xl ${suitColor}">${suitSymbol}</div>
          <div class="text-xs font-bold transform rotate-180 ${suitColor}">
            ${cardRank}
          </div>
        `
        
        // Update classes to show revealed card styling
        cardElement.className = 'w-16 h-24 bg-white border-2 border-gray-300 rounded-lg flex flex-col items-center justify-between p-1 cursor-pointer transition-transform hover:scale-105 shadow-md'
        cardElement.removeAttribute('data-card-hidden')
        
        // Second half: rotate back to 0deg (showing the face)
        const flipIn = cardElement.animate([
          { transform: 'rotateY(90deg)' },
          { transform: 'rotateY(0deg)' }
        ], {
          duration: 200,
          fill: 'forwards',
          easing: 'ease-out'
        })
        
        this.trackAnimation(flipIn)
        flipIn.onfinish = () => {
          console.log('✅ Card flip completed')
          resolve()
        }
      }
    })
  }
  
  // Helper method for suit symbols
  private static getSuitSymbol(suit: string): string {
    switch (suit) {
      case 'hearts': return '♥'
      case 'diamonds': return '♦'
      case 'clubs': return '♣'
      case 'spades': return '♠'
      default: return ''
    }
  }

  /**
   * Deck position calculator - cards fly from top-center of the game board
   */
  static getDeckPosition(): { x: number; y: number } {
    return {
      x: 0, // Center horizontally
      y: -300 // Start from above the visible area
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

  /**
   * Animates hand value update
   */
  static animateHandValue(element: HTMLElement): Promise<void> {
    return this.createAnimation(element, [
      { transform: 'scale(1)' },
      { transform: 'scale(1.2)' },
      { transform: 'scale(1)' }
    ], {
      duration: 400,
      easing: 'ease-out'
    })
  }

  /**
   * Animates winning/losing result
   */
  static animateResult(element: HTMLElement, isWin: boolean): Promise<void> {
    const color = isWin ? '#22c55e' : '#ef4444'
    
    return this.createAnimation(element, [
      { transform: 'scale(1)', color: element.style.color || '#ffffff' },
      { transform: 'scale(1.1)', color },
      { transform: 'scale(1)', color }
    ], {
      duration: 800,
      easing: 'ease-out'
    })
  }

  /**
   * Animates credits update
   */
  static animateCreditsUpdate(element: HTMLElement, isIncrease: boolean): Promise<void> {
    const direction = isIncrease ? -10 : 10
    
    return this.createAnimation(element, [
      { transform: 'translateY(0px) scale(1)' },
      { transform: `translateY(${direction}px) scale(1.05)` },
      { transform: 'translateY(0px) scale(1)' }
    ], {
      duration: 500,
      easing: 'ease-out'
    })
  }

  /**
   * Pulse animation for interactive elements
   */
  static animatePulse(element: HTMLElement, intensity: number = 1.05): Promise<void> {
    return this.createAnimation(element, [
      { transform: 'scale(1)' },
      { transform: `scale(${intensity})` },
      { transform: 'scale(1)' }
    ], {
      duration: 600,
      easing: 'ease-out'
    })
  }

  /**
   * Staggered animation for multiple cards
   */
  static animateMultipleCards(
    cards: {
      element: HTMLElement
      config: {
        from: { x: number; y: number; rotation?: number }
        to: { x: number; y: number; rotation?: number }
        delay?: number
      }
    }[]
  ): Promise<void[]> {
    return Promise.all(
      cards.map((card, index) =>
        this.animateCardFlying(card.element, {
          from: card.config.from,
          to: card.config.to,
          delay: (card.config.delay || 0) + index * 150,
        })
      )
    )
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
      modal.style.opacity = '1'
      modal.style.transform = 'translate(-50%, -50%) scaleX(0.1) scaleY(0.1)'
      modal.style.transformOrigin = '50% 50%'
      
      header.style.opacity = '0'
      header.style.transform = 'translateY(20px)'
      
      buttons.style.opacity = '0'
      buttons.style.transform = 'translateY(20px)'

      // Step 1: Expand horizontally
      const expandH = modal.animate([
        { transform: 'translate(-50%, -20%) scaleX(0.1) scaleY(0.1)' },
        { transform: 'translate(-50%, -20%) scaleX(1) scaleY(0.1)' },
      ], {
        duration: 200,
        fill: 'forwards',
        easing: 'ease-out'
      })
      
      this.trackAnimation(expandH)
      
      expandH.onfinish = () => {
        // Step 2: Expand vertically
        const expandV = modal.animate([
          { transform: 'translate(-50%, -20%) scaleX(1) scaleY(0.1)' },
          { transform: 'translate(-50%, -50%) scaleX(1) scaleY(1)' },
        ], {
          duration: 300,
          fill: 'forwards',
          easing: 'ease-out'
        })
        
        this.trackAnimation(expandV)
        
        expandV.onfinish = () => {
          // Step 3: Fade in content with staggered timing
          const headerAnim = header.animate([
            { opacity: '0', transform: 'translateY(20px)' },
            { opacity: '1', transform: 'translateY(0px)' }
          ], {
            duration: 300,
            fill: 'forwards'
          })
          
          this.trackAnimation(headerAnim)

          const buttonsAnim = buttons.animate([
            { opacity: '0', transform: 'translateY(20px)' },
            { opacity: '1', transform: 'translateY(0px)' }
          ], {
            duration: 300,
            delay: 20,
            fill: 'forwards'
          })
          
          this.trackAnimation(buttonsAnim)
          buttonsAnim.onfinish = () => resolve()
        }
      }
    })
  }

  /**
   * Animates betting modal collapse
   */
  static animateBettingModalCollapse(modal: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      const animation = modal.animate([
        { 
          transform: 'translate(-50%, -50%) scaleX(1) scaleY(1)',
          opacity: '1'
        },
        { 
          transform: 'translate(-50%, -50%) scaleX(0.1) scaleY(0.1)',
          opacity: '0'
        }
      ], {
        duration: 300,
        fill: 'forwards',
        easing: 'ease-in'
      })
      
      this.trackAnimation(animation)
      animation.onfinish = () => resolve()
    })
  }
}