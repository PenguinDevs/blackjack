'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { UserMenu } from '@/components/auth/UserMenu'
import { Button } from '@/components/ui/button'
import { Coins, Plus } from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useState } from 'react'
import { CreditsModal } from './credits-modal'

interface NavbarProps {
  leftContent?: ReactNode
}

interface CreditsDisplayProps {
  credits: number
  onPurchase: (amount: number) => void
}

export function CreditsDisplay({ credits, onPurchase }: CreditsDisplayProps) {
  const [showCreditsModal, setShowCreditsModal] = useState(false)

  const handlePurchase = (amount: number) => {
    onPurchase(amount)
    setShowCreditsModal(false)
  }

  return (
    <>
      <div className="flex items-center space-x-3 text-lg font-bold">
        <div className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          <span>{credits.toLocaleString()} Credits</span>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowCreditsModal(true)}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <CreditsModal
        open={showCreditsModal}
        onOpenChange={setShowCreditsModal}
        onPurchase={handlePurchase}
      />
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
            {leftContent}
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-black tracking-tight font-mono">
                blackjack
              </h1>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <UserMenu />
            ) : (
              <Button asChild>
                <Link href="/auth/login">
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}