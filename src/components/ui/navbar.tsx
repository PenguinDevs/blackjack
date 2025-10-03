'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { UserMenu } from '@/components/auth/UserMenu'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useCredits } from '@/hooks/useCredits'
import { Coins, Plus } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useState } from 'react'
import { CreditsModal } from './credits-modal'

interface NavbarProps {
  leftContent?: ReactNode
}

export function CreditsDisplay() {
  const [showCreditsModal, setShowCreditsModal] = useState(false)
  const { credits, loading } = useCredits()

  return (
    <>
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Full display for larger screens */}
        <div className="hidden sm:flex items-center space-x-2 text-lg font-bold">
          <Coins className="h-5 w-5 text-yellow-500" />
          <span>{loading ? '...' : credits.toLocaleString()} Credits</span>
        </div>
        
        {/* Compact display for mobile screens */}
        <div className="flex sm:hidden items-center space-x-1 text-sm font-semibold">
          <Coins className="h-4 w-4 text-yellow-500" />
          <span className="max-w-[80px] truncate">
            {loading ? '...' : credits >= 1000000 
              ? `${(credits / 1000000).toFixed(1)}M`
              : credits >= 1000 
                ? `${(credits / 1000).toFixed(1)}K`
                : credits.toLocaleString()
            }
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCreditsModal(true)}
          className="h-6 w-6 sm:h-8 sm:w-8 p-0"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>

      <CreditsModal open={showCreditsModal} onOpenChange={setShowCreditsModal} />
    </>
  )
}

export function Navbar({ leftContent }: NavbarProps) {
  const { user } = useAuth()

  return (
    <nav className="border-b">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-black tracking-tight font-mono">blackjack</h1>
            </Link>
            {leftContent}
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              <UserMenu />
            ) : (
              <Button asChild>
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
