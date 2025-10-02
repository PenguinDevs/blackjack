'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'

// Global event emitter for credits updates
class CreditsEventEmitter {
  private listeners: (() => void)[] = []

  subscribe(callback: () => void) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  emit() {
    this.listeners.forEach(callback => callback())
  }
}

const creditsEmitter = new CreditsEventEmitter()

export interface UserProfile {
  id: string
  email?: string
  full_name?: string
  avatar_url?: string
  credits: number
  games_played: number
  games_won: number
  created_at: string
  updated_at: string
}

export function useCredits() {
  const { user } = useAuth()
  const [credits, setCredits] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create profile if it doesn't exist
  const createProfile = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || '',
          credits: 500, // Default starting credits
        })
        .select('credits')
        .single()

      if (error) throw error
      setCredits(data.credits)
    } catch (err) {
      console.error('Error creating profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to create profile')
    }
  }, [user])

  // Fetch user's current credits
  const fetchCredits = useCallback(async () => {
    if (!user) {
      setCredits(0)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create it
          await createProfile()
          return
        }
        throw error
      }

      setCredits(data.credits)
    } catch (err) {
      console.error('Error fetching credits:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch credits')
    } finally {
      setLoading(false)
    }
  }, [user, createProfile])

  // Add credits to user's account (free purchase)
  const addCredits = async (amount: number) => {
    if (!user) return false

    try {
      setError(null)
      const newCredits = credits + amount

      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      setCredits(newCredits)
      // Notify all other components that credits have changed
      creditsEmitter.emit()
      return true
    } catch (err) {
      console.error('Error adding credits:', err)
      setError(err instanceof Error ? err.message : 'Failed to add credits')
      return false
    }
  }

  // Subtract credits (for betting, etc.)
  const subtractCredits = async (amount: number) => {
    if (!user || credits < amount) return false

    try {
      setError(null)
      const newCredits = credits - amount

      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error

      setCredits(newCredits)
      // Notify all other components that credits have changed
      creditsEmitter.emit()
      return true
    } catch (err) {
      console.error('Error subtracting credits:', err)
      setError(err instanceof Error ? err.message : 'Failed to subtract credits')
      return false
    }
  }

  // Fetch credits when user changes
  useEffect(() => {
    fetchCredits()
  }, [user?.id, fetchCredits])

  // Subscribe to credits updates from other components
  useEffect(() => {
    const unsubscribe = creditsEmitter.subscribe(() => {
      // Refresh credits when other components update them
      fetchCredits()
    })

    return unsubscribe
  }, [fetchCredits])

  return {
    credits,
    loading,
    error,
    addCredits,
    subtractCredits,
    refreshCredits: fetchCredits,
  }
}