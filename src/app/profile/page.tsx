import { AuthGuard } from '@/components/auth/AuthGuard'
import { GameHistory, ProfileStats } from '@/components/profile'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/ui/navbar'
import { Play, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profile | Blackjack',
  description: 'View your game statistics and history',
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/games/blackjack">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Game
                </Link>
              </Button>
            </div>
            <Button asChild>
              <Link href="/games/blackjack">
                <Play className="h-4 w-4 mr-2" />
                Play Blackjack
              </Link>
            </Button>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Profile</h1>
          <p className="text-muted-foreground">View your game statistics and recent game history</p>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ProfileStats />
          </div>
          
          <div className="lg:col-span-2">
            <GameHistory />
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}