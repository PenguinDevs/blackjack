'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { UserMenu } from '@/components/auth/UserMenu'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Navbar() {
  const { user } = useAuth()

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
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