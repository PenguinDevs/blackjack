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
        <div className="text-center space-y-12 max-w-6xl mx-auto">
          <h1 className="text-8xl md:text-9xl lg:text-[12rem] xl:text-[14rem] font-black tracking-tight text-foreground font-mono leading-none">
            blackjack
          </h1>
          
          {/* Play Button */}
          <div className="flex justify-center">
            {user ? (
              <Button size="lg" className="uppercase text-6xl px-8 py-8 h-auto rounded-xl font-bold">
                Play
              </Button>
            ) : (
              <Button size="lg" asChild className="uppercase text-4xl px-8 py-8 h-auto rounded-xl font-bold">
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
