'use client'

import { useState, useRef, useEffect } from 'react'
import { animate, createScope } from 'animejs'
import { Navbar, CreditsDisplay } from '@/components/ui/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { useCredits } from '@/hooks/useCredits'

export default function GamePage() {
  const { credits } = useCredits()
  const [gameStarted, setGameStarted] = useState(false)
  const [showGameOptions, setShowGameOptions] = useState(false)
  const [betAmount, setBetAmount] = useState(100)
  const [showBettingOptions, setShowBettingOptions] = useState(false)
  const [inputBetAmount, setInputBetAmount] = useState('')

  const rootRef = useRef<HTMLDivElement>(null)
  const bettingModalRef = useRef<HTMLDivElement>(null)
  const currentBetRef = useRef<HTMLDivElement>(null)
  const bettingButtonsRef = useRef<HTMLDivElement>(null)
  const scopeRef = useRef<ReturnType<typeof createScope> | null>(null)

  useEffect(() => {
    // Initialize scope for cleanup if needed
    if (rootRef.current) {
      scopeRef.current = createScope({ root: rootRef.current })
    }
    return () => {
      if (scopeRef.current) {
        scopeRef.current.revert()
      }
    }
  }, [])

  // Handle animations when betting options become visible
  useEffect(() => {
    if (showBettingOptions && bettingModalRef.current && currentBetRef.current && bettingButtonsRef.current) {
      const modal = bettingModalRef.current
      const header = currentBetRef.current  
      const buttons = bettingButtonsRef.current
      
      if (!modal || !header || !buttons) return

      // Create a cleaner animation timeline using onComplete callbacks
      const animationTimeline = () => {
        // Set initial states
        animate(modal, {
          opacity: 1,
          transform: 'translate(-50%, -50%) scaleX(0.1) scaleY(0.1)',
          transformOrigin: '50% 50%',
          duration: 0
        })
        
        animate(header, { opacity: 0, translateY: '20px', duration: 0 })
        animate(buttons, { opacity: 0, translateY: '20px', duration: 0 })

        // Step 1: Expand horizontally
        animate(modal, {
          transform: ['translate(-50%, -20%) scaleX(0.1) scaleY(0.1)', 'translate(-50%, -20%) scaleX(1) scaleY(0.1)'],
          duration: 200,
          ease: 'out(2)',
          onComplete: () => {
            // Step 2: Expand vertically
            animate(modal, {
              transform: ['translate(-50%, -20%) scaleX(1) scaleY(0.1)', 'translate(-50%, -50%) scaleX(1) scaleY(1)'],
              duration: 300,
              ease: 'out(2)',
              onComplete: () => {
                // Step 3: Fade in content with staggered timing
                animate(header, {
                  opacity: [0, 1],
                  translateY: ['20px', '0px'],
                  duration: 300
                })
                
                animate(buttons, {
                  opacity: [0, 1],
                  translateY: ['20px', '0px'],
                  duration: 300,
                  delay: 20
                })
              }
            })
          }
        })
      }

      animationTimeline()
    }
  }, [showBettingOptions])

  const handlePlaceBet = () => {
    setGameStarted(true)
    setShowGameOptions(true)
    // Game logic will be implemented here
  }

  const increaseBet = (amount: number) => {
    const newBet = betAmount + amount
    if (newBet <= credits) {
      setBetAmount(newBet)
    }
  }

  const canAffordBet = (additionalAmount: number) => {
    return betAmount + additionalAmount <= credits
  }

  const handleManualBetChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '')
    setInputBetAmount(numericValue)
    
    if (numericValue) {
      const newBet = parseInt(numericValue, 10)
      if (newBet <= credits && newBet > 0) {
        setBetAmount(newBet)
      }
    }
  }

  const handleMouseEnter = () => {
    if (!showBettingOptions) {
      setShowBettingOptions(true)
    }
  }

  const handleMouseLeave = () => {
    if (showBettingOptions && bettingModalRef.current) {
      animate(bettingModalRef.current, {
        transform: ['translate(-50%, -50%) scaleX(1) scaleY(1)', 'translate(-50%, -50%) scaleX(0.1) scaleY(0.1)'],
        opacity: [1, 0],
        duration: 300,
        ease: 'in(2)',
        onComplete: () => {
          setShowBettingOptions(false)
        }
      })
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar 
          leftContent={<CreditsDisplay />} 
        />

        <main className="container mx-auto px-4 py-8">
        {/* Game Canvas */}
        <div ref={rootRef} className="w-full">
          <div className="p-8">
            <div className="w-full h-[600px] flex items-center justify-center relative">
              <div className="w-full h-full p-8">
                {/* Dealer Section */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-4">Dealer</h3>
                  <div className="flex justify-center space-x-2 mb-4">
                    {/* Dealer cards will go here */}
                    <div className="w-16 h-24 bg-white border rounded-lg flex items-center justify-center">
                      <span className="text-xs">Card</span>
                    </div>
                    <div className="w-16 h-24 bg-gray-600 border rounded-lg flex items-center justify-center">
                      <span className="text-xs text-white">?</span>
                    </div>
                  </div>
                </div>

                {/* Center Betting Interface (when game not started) */}
                {!gameStarted && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div 
                      className="relative"
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      {/* Always Visible Button - stays in place */}
                      <Button 
                        onClick={handlePlaceBet}
                        size="lg"
                        className="text-2xl px-12 py-6 bg-white text-black hover:bg-gray-100 font-bold relative z-40"
                        disabled={credits < betAmount}
                      >
                        Place Bet
                      </Button>

                      {/* Betting Modal - expands around the button */}
                      {showBettingOptions && (
                        <div 
                          ref={bettingModalRef}
                          className="absolute top-1/2 left-1/2 bg-black/90 backdrop-blur-sm rounded-lg border border-gray-600 shadow-2xl p-6 pt-12 flex flex-col justify-start items-center z-30"
                          style={{ 
                            opacity: 0,
                            transform: 'translate(-50%, -50%) scaleX(0.1) scaleY(0.1)',
                            transformOrigin: '50% 50%',
                            top: '-90px',
                            width: '400px',
                            height: '400px'
                          }}
                        >
                          {/* Modal Header - above button area */}
                          <div ref={currentBetRef} className="mb-6 text-center">
                            <h3 className="text-xl font-bold text-white mb-4">Place Your Bet</h3>
                            
                            {/* Primary Bet Input*/}
                            <div className="mb-3">
                              <Input
                                type="text"
                                placeholder="Enter bet amount"
                                value={betAmount.toString()}
                                onChange={(e) => handleManualBetChange(e.target.value)}
                                className="w-40 h-14 mx-auto text-center font-black bg-gray-800 border-gray-600 text-white placeholder-gray-400 rounded-lg"
                                style={{ fontSize: '2rem' }}
                                maxLength={6}
                              />
                            </div>
                          </div>

                          {/* Betting Options - above button area */}
                          <div ref={bettingButtonsRef} className="mb-6">
                            <p className="text-sm text-gray-300 mb-3 text-center">Quick adjustments:</p>
                            <div className="flex gap-3 justify-center">
                              <Button 
                                onClick={() => increaseBet(5)}
                                variant="outline"
                                size="sm"
                                className="bg-green-600 text-white hover:bg-green-700 border-green-600 transition-colors"
                                disabled={!canAffordBet(5)}
                              >
                                +5
                              </Button>
                              <Button 
                                onClick={() => increaseBet(25)}
                                variant="outline"
                                size="sm"
                                className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600 transition-colors"
                                disabled={!canAffordBet(25)}
                              >
                                +25
                              </Button>
                              <Button 
                                onClick={() => increaseBet(100)}
                                variant="outline"
                                size="sm"
                                className="bg-purple-600 text-white hover:bg-purple-700 border-purple-600 transition-colors"
                                disabled={!canAffordBet(100)}
                              >
                                +100
                              </Button>
                            </div>
                          </div>

                          {/* Empty space for the button - button floats above this */}
                          <div className="h-16 mb-6"></div>

                          {/* Status Messages - below button area */}
                          <div className="text-center">
                            {credits < betAmount ? (
                              <p className="text-red-400 text-xs">
                                Insufficient credits! Need {betAmount - credits} more.
                              </p>
                            ) : (
                              <p className="text-gray-300 text-xs">
                                Remaining: {credits - betAmount} credits
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Player Section */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                  <h3 className="text-2xl font-bold text-white mb-4 text-center">Your Hand</h3>
                  <div className="flex justify-center space-x-2 mb-4">
                    {/* Player cards will go here */}
                    <div className="w-16 h-24 bg-white border rounded-lg flex items-center justify-center">
                      <span className="text-xs">Card</span>
                    </div>
                    <div className="w-16 h-24 bg-white border rounded-lg flex items-center justify-center">
                      <span className="text-xs">Card</span>
                    </div>
                  </div>
                  
                  {/* Game Action Buttons - only show when game started and options should be shown */}
                  {gameStarted && showGameOptions && (
                    <div className="flex space-x-4 justify-center">
                      <Button variant="outline" className="bg-white text-black hover:bg-gray-100">
                        Hit
                      </Button>
                      <Button variant="outline" className="bg-white text-black hover:bg-gray-100">
                        Stand
                      </Button>
                    </div>
                  )}
                </div>

                {/* Betting Area - only show when game started */}
                {gameStarted && (
                  <div className="absolute bottom-8 left-8">
                    <div className="rounded-lg p-4">
                      <p className="text-sm font-medium mb-2">Current Bet</p>
                      <p className="text-xl font-black text-foreground">{betAmount} Credits</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>


      </main>
    </div>
    </AuthGuard>
  )
}