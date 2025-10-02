'use client'

import React from 'react'
import Link from 'next/link'
import { Navbar, CreditsDisplay } from '@/components/ui/navbar'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface GameCard {
  title: string
  description: string
  href: string
  status: 'available' | 'coming-soon' | 'beta'
  minBet?: number
  maxBet?: number
}

const games: GameCard[] = [
  {
    title: 'Blackjack',
    description: 'Classic 21 card game. Get as close to 21 as possible without going over.',
    href: '/games/blackjack',
    status: 'available',
    minBet: 5,
    maxBet: 1000
  },
  {
    title: 'Poker',
    description: 'Texas Hold\'em poker with AI opponents.',
    href: '/games/poker',
    status: 'coming-soon',
    minBet: 10,
    maxBet: 500
  },
  {
    title: 'Roulette',
    description: 'Spin the wheel and place your bets on red, black, or specific numbers.',
    href: '/games/roulette',
    status: 'coming-soon',
    minBet: 1,
    maxBet: 200
  },
  {
    title: 'Slots',
    description: 'Pull the lever and match symbols for big payouts.',
    href: '/games/slots',
    status: 'coming-soon',
    minBet: 1,
    maxBet: 50
  }
]

export default function GamesPage() {
  const getStatusColor = (status: GameCard['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500/20 text-green-400 border-green-500'
      case 'beta': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500'
      case 'coming-soon': return 'bg-gray-500/20 text-gray-400 border-gray-500'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500'
    }
  }

  const getStatusText = (status: GameCard['status']) => {
    switch (status) {
      case 'available': return 'Available'
      case 'beta': return 'Beta'
      case 'coming-soon': return 'Coming Soon'
      default: return 'Unknown'
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar 
          leftContent={<CreditsDisplay />} 
        />

        <main className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Casino Games</h1>
            <p className="text-xl text-muted-foreground">
              Choose your game and test your luck!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {games.map((game) => (
              <Card key={game.title} className="bg-card border-border hover:bg-card/80 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl text-white">{game.title}</CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(game.status)}`}>
                      {getStatusText(game.status)}
                    </span>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    {game.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  {game.minBet && game.maxBet && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">
                        Betting Range: {game.minBet} - {game.maxBet} credits
                      </p>
                    </div>
                  )}
                  
                  {game.status === 'available' ? (
                    <Link href={game.href}>
                      <Button className="w-full bg-primary hover:bg-primary/80 text-primary-foreground">
                        Play Now
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full">
                      {getStatusText(game.status)}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Game Statistics or Recent Activity could go here */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-white mb-8">Game Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Fair Play</h3>
                <p className="text-muted-foreground text-sm">
                  All games use provably fair algorithms to ensure honest gameplay.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Real-time</h3>
                <p className="text-muted-foreground text-sm">
                  Experience smooth, real-time gameplay with instant results.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Achievements</h3>
                <p className="text-muted-foreground text-sm">
                  Unlock achievements and climb leaderboards as you play.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}