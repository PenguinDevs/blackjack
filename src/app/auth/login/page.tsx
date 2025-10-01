'use client'

import { useState } from 'react'
import { AuthForm } from '@/components/auth/AuthForm'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-black mb-4 tracking-tight font-mono">
          blackjack
        </h1>
      </div>
      
      <AuthForm 
        mode={mode} 
        onToggleMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')} 
      />
    </div>
  )
}