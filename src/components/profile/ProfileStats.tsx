'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCredits } from '@/hooks/useCredits'
import { supabase } from '@/lib/supabase'
import { Coins, TrendingUp, Trophy, Target } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ProfileData {
  credits: number
  games_played: number
  games_won: number
  full_name: string | null
  email: string | null
}

export function ProfileStats() {
  const { user } = useAuth()
  const { credits } = useCredits()
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('credits, games_played, games_won, full_name, email')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setProfileData(data)
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!profileData || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">No profile data found</div>
        </CardContent>
      </Card>
    )
  }

  const winRate =
    profileData.games_played > 0
      ? ((profileData.games_won / profileData.games_played) * 100).toFixed(1)
      : '0.0'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Stats</CardTitle>
        <CardDescription>
          {profileData.full_name || profileData.email || 'Anonymous Player'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 p-3 bg-secondary/20 rounded-lg">
            <Coins className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold">{credits.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Credits</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-secondary/20 rounded-lg">
            <Target className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-2xl font-bold">{profileData.games_played}</div>
              <div className="text-sm text-muted-foreground">Games Played</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-secondary/20 rounded-lg">
            <Trophy className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-2xl font-bold">{profileData.games_won}</div>
              <div className="text-sm text-muted-foreground">Games Won</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-secondary/20 rounded-lg">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <div>
              <div className="text-2xl font-bold">{winRate}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
