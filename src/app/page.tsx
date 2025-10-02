'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/ui/navbar'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 min-h-[calc(100vh-80px)]">
        <div className="text-center space-y-8 sm:space-y-12 max-w-6xl mx-auto w-full">
          <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] xl:text-[12rem] font-black tracking-tight text-foreground font-mono leading-none break-words">
            blackjack
          </h1>
          
          {/* Play Button */}
          <div className="flex justify-center w-full">
            {user ? (
              <Button size="lg" asChild className="uppercase text-2xl sm:text-4xl md:text-5xl lg:text-6xl px-6 sm:px-12 md:px-16 py-3 sm:py-6 md:py-8 h-auto rounded-xl font-bold w-auto min-w-fit">
                <Link href="/game">
                  Play
                </Link>
              </Button>
            ) : (
              <Button size="lg" asChild className="uppercase text-xl sm:text-2xl md:text-3xl lg:text-4xl px-4 sm:px-6 md:px-8 py-3 sm:py-6 md:py-8 h-auto rounded-xl font-bold w-auto min-w-fit">
                <Link href="/auth/login">
                  Get Started
                </Link>
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
