'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BettingState } from '../types'
import { GAME_CONSTANTS } from '../utils/game-utils'

interface BettingInterfaceProps {
  bettingState: BettingState
  credits: number
  onBetChange: (amount: number) => void
  onPlaceBet: () => void
  onShowBettingOptions: (show: boolean) => void
}

export const BettingInterface: React.FC<BettingInterfaceProps> = ({
  bettingState,
  credits,
  onBetChange,
  onPlaceBet,
  onShowBettingOptions,
}) => {
  const currentBetRef = useRef<HTMLDivElement>(null)
  const bettingButtonsRef = useRef<HTMLDivElement>(null)
  const isInteracting = useRef(false)
  const [isAnimatingIn, setIsAnimatingIn] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if device is mobile on mount and window resize
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 640) // 640px is Tailwind's 'sm' breakpoint
    }

    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Auto-show betting options on mobile
  useEffect(() => {
    if (isMobile && !bettingState.showBettingOptions) {
      onShowBettingOptions(true)
    }
  }, [isMobile, onShowBettingOptions, bettingState.showBettingOptions])

  useEffect(() => {
    if (bettingState.showBettingOptions) {
      // Small delay to ensure the element is mounted before starting animation
      const timer = setTimeout(() => {
        setIsAnimatingIn(true)
      }, 10)
      return () => clearTimeout(timer)
    } else {
      setIsAnimatingIn(false)
    }
  }, [bettingState.showBettingOptions])

  const increaseBet = (amount: number) => {
    const newBet = bettingState.amount + amount
    if (newBet <= credits) {
      onBetChange(newBet)
    }
  }

  const canAffordBet = (additionalAmount: number) => {
    return bettingState.amount + additionalAmount <= credits
  }

  const handleManualBetChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '')

    if (numericValue) {
      const newBet = parseInt(numericValue, 10)
      if (newBet <= credits && newBet > 0) {
        onBetChange(newBet)
      }
    }
  }

  const handleMouseEnter = () => {
    // Only show on hover for desktop devices
    if (!isMobile && !bettingState.showBettingOptions) {
      onShowBettingOptions(true)
    }
  }

  const handleMouseLeave = () => {
    // Don't hide on mobile or if user is currently interacting with modal elements
    if (isMobile || isInteracting.current) {
      return
    }

    if (bettingState.showBettingOptions) {
      onShowBettingOptions(false)
    }
  }

  const handleModalMouseEnter = () => {
    isInteracting.current = true
  }

  const handleModalMouseLeave = () => {
    isInteracting.current = false
    // Small delay to prevent flicker when mouse briefly leaves modal (desktop only)
    if (!isMobile) {
      setTimeout(() => {
        if (!isInteracting.current && bettingState.showBettingOptions) {
          handleMouseLeave()
        }
      }, 100)
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div 
        className="relative" 
        onMouseEnter={isMobile ? undefined : handleMouseEnter} 
        onMouseLeave={isMobile ? undefined : handleMouseLeave}
      >
        {/* Always Visible Button */}
        <Button
          onClick={onPlaceBet}
          size="lg"
          className="text-2xl px-12 py-6 font-bold relative z-40"
          disabled={credits < bettingState.amount || bettingState.isPlacingBet}
          onMouseEnter={isMobile ? undefined : handleModalMouseEnter}
          onMouseLeave={isMobile ? undefined : handleModalMouseLeave}
        >
          {bettingState.isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
        </Button>

        {/* Betting Modal */}
        {bettingState.showBettingOptions && (
          <div
            className={`absolute top-1/2 left-1/2 bg-black/90 backdrop-blur-sm rounded-lg border border-gray-600 shadow-2xl p-4 sm:p-6 pt-8 sm:pt-12 flex flex-col justify-start items-center z-30 w-[350px] sm:w-[400px] h-[350px] sm:h-[400px] transition-all duration-300 ease-in-out ${
              isAnimatingIn
                ? 'opacity-100 -translate-x-1/2 -translate-y-1/2 scale-100'
                : 'opacity-0 -translate-x-1/2 -translate-y-1/2 scale-0'
            }`}
            onMouseEnter={isMobile ? undefined : handleModalMouseEnter}
            onMouseLeave={isMobile ? undefined : handleModalMouseLeave}
            style={{
              top: isMobile ? '-70px' : '-90px',
              transformOrigin: '50% 50%',
            }}
          >
            {/* Modal Header */}
            <div ref={currentBetRef} className="mb-4 sm:mb-6 text-center">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Place Your Bet</h3>

              <div className="mb-3">
                <Input
                  type="text"
                  placeholder="Enter bet amount"
                  value={bettingState.amount.toString()}
                  onChange={(e) => handleManualBetChange(e.target.value)}
                  className="w-36 sm:w-40 h-12 sm:h-14 mx-auto text-center font-black bg-gray-800 border-gray-600 text-white placeholder-gray-400 rounded-lg"
                  style={{ fontSize: isMobile ? '1.5rem' : '2rem' }}
                  maxLength={6}
                />
              </div>
            </div>

            {/* Betting Options */}
            <div ref={bettingButtonsRef} className="mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3 text-center">Quick adjustments:</p>
              <div className="flex gap-2 sm:gap-3 justify-center">
                <Button
                  onClick={() => increaseBet(GAME_CONSTANTS.BET_INCREMENT_SMALL)}
                  variant="outline"
                  size="sm"
                  className="bg-green-600 text-white hover:bg-green-700 border-green-600 transition-colors"
                  disabled={!canAffordBet(GAME_CONSTANTS.BET_INCREMENT_SMALL)}
                >
                  +{GAME_CONSTANTS.BET_INCREMENT_SMALL}
                </Button>
                <Button
                  onClick={() => increaseBet(GAME_CONSTANTS.BET_INCREMENT_MEDIUM)}
                  variant="outline"
                  size="sm"
                  className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600 transition-colors"
                  disabled={!canAffordBet(GAME_CONSTANTS.BET_INCREMENT_MEDIUM)}
                >
                  +{GAME_CONSTANTS.BET_INCREMENT_MEDIUM}
                </Button>
                <Button
                  onClick={() => increaseBet(GAME_CONSTANTS.BET_INCREMENT_LARGE)}
                  variant="outline"
                  size="sm"
                  className="bg-purple-600 text-white hover:bg-purple-700 border-purple-600 transition-colors"
                  disabled={!canAffordBet(GAME_CONSTANTS.BET_INCREMENT_LARGE)}
                >
                  +{GAME_CONSTANTS.BET_INCREMENT_LARGE}
                </Button>
              </div>
            </div>

            {/* Empty space for the button */}
            <div className="h-12 sm:h-16 mb-4 sm:mb-6"></div>

            {/* Status Messages */}
            <div className="text-center px-2">
              {credits < bettingState.amount ? (
                <p className="text-red-400 text-xs break-words">
                  Insufficient credits! Need {bettingState.amount - credits} more.
                </p>
              ) : (
                <p className="text-gray-300 text-xs break-words">
                  Remaining: {credits - bettingState.amount} credits
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
