'use client'

import React, { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BettingState } from '../types'

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
  const bettingModalRef = useRef<HTMLDivElement>(null)
  const currentBetRef = useRef<HTMLDivElement>(null)
  const bettingButtonsRef = useRef<HTMLDivElement>(null)
  const isInteracting = useRef(false)

  useEffect(() => {
    if (bettingState.showBettingOptions && bettingModalRef.current) {
      // Simple CSS transition - no DOM conflicts with React
      bettingModalRef.current.style.opacity = '1'
      bettingModalRef.current.style.transform = 'translate(-50%, -50%) scale(1)'
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
    if (!bettingState.showBettingOptions) {
      onShowBettingOptions(true)
    }
  }

  const handleMouseLeave = () => {
    // Don't hide if user is currently interacting with modal elements
    if (isInteracting.current) {
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
    // Small delay to prevent flicker when mouse briefly leaves modal
    setTimeout(() => {
      if (!isInteracting.current && bettingState.showBettingOptions) {
        handleMouseLeave()
      }
    }, 100)
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {/* Always Visible Button */}
        <Button
          onClick={onPlaceBet}
          size="lg"
          className="text-2xl px-12 py-6 font-bold relative z-40"
          disabled={credits < bettingState.amount || bettingState.isPlacingBet}
        >
          {bettingState.isPlacingBet ? 'Placing Bet...' : 'Place Bet'}
        </Button>

        {/* Betting Modal */}
        {bettingState.showBettingOptions && (
          <div
            ref={bettingModalRef}
            className="absolute top-1/2 left-1/2 bg-black/90 backdrop-blur-sm rounded-lg border border-gray-600 shadow-2xl p-6 pt-12 flex flex-col justify-start items-center z-30"
            onMouseEnter={handleModalMouseEnter}
            onMouseLeave={handleModalMouseLeave}
            style={{
              opacity: 0,
              transform: 'translate(-50%, -50%) scale(0.1)',
              transformOrigin: '50% 50%',
              top: '-90px',
              width: '400px',
              height: '400px',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
          >
            {/* Modal Header */}
            <div ref={currentBetRef} className="mb-6 text-center">
              <h3 className="text-xl font-bold text-white mb-4">Place Your Bet</h3>

              <div className="mb-3">
                <Input
                  type="text"
                  placeholder="Enter bet amount"
                  value={bettingState.amount.toString()}
                  onChange={(e) => handleManualBetChange(e.target.value)}
                  className="w-40 h-14 mx-auto text-center font-black bg-gray-800 border-gray-600 text-white placeholder-gray-400 rounded-lg"
                  style={{ fontSize: '2rem' }}
                  maxLength={6}
                />
              </div>
            </div>

            {/* Betting Options */}
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

            {/* Empty space for the button */}
            <div className="h-16 mb-6"></div>

            {/* Status Messages */}
            <div className="text-center">
              {credits < bettingState.amount ? (
                <p className="text-red-400 text-xs">
                  Insufficient credits! Need {bettingState.amount - credits} more.
                </p>
              ) : (
                <p className="text-gray-300 text-xs">
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
