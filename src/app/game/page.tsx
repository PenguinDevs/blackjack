'use client'

import { useState } from 'react'
import { Navbar, CreditsDisplay } from '@/components/ui/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Coins, Plus } from 'lucide-react'

export default function GamePage() {
  const [credits, setCredits] = useState(1000)
  const [gameStarted, setGameStarted] = useState(false)
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const [showGameOptions, setShowGameOptions] = useState(false)

  const handleAddCredits = () => {
    // This would typically involve payment processing
    setCredits(credits + 500)
  }

  const handleStartGame = () => {
    setGameStarted(true)
    setShowGameOptions(true)
    // Game logic will be implemented here
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar 
          leftContent={
            <CreditsDisplay 
              credits={credits} 
              onAddCredits={() => setShowCreditsModal(true)} 
            />
          } 
        />

        <main className="container mx-auto px-4 py-8">
        {/* Game Canvas */}
        <div className="w-full">
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

                {/* Center Play Button (when game not started) */}
                {!gameStarted && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button 
                      onClick={handleStartGame}
                      size="lg"
                      className="text-2xl px-12 py-8 bg-white text-black hover:bg-gray-100 font-bold"
                      disabled={credits < 10}
                    >
                      Play Blackjack
                    </Button>
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

                {/* Betting Area */}
                <div className="absolute bottom-8 left-8">
                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm font-medium text-black mb-2">Current Bet</p>
                    <p className="text-xl font-bold text-black">10 Credits</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Credits Modal */}
        <Dialog open={showCreditsModal} onOpenChange={setShowCreditsModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Purchase Credits</DialogTitle>
              <DialogDescription>
                Add more credits to your account to continue playing.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <p className="font-medium">500 Credits</p>
                  <Button onClick={handleAddCredits}>Buy</Button>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <p className="font-medium">1,000 Credits</p>
                  <Button onClick={handleAddCredits}>Buy</Button>
                </div>
                <div className="flex justify-between items-center p-3 border rounded-lg">
                  <p className="font-medium">2,500 Credits</p>
                  <Button onClick={handleAddCredits}>Buy</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
    </AuthGuard>
  )
}