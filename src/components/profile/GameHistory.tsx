'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { History, TrendingDown, TrendingUp, Minus, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

interface GameHistoryItem {
  id: string
  result: 'win' | 'lose' | 'push'
  chips_won: number
  chips_lost: number
  created_at: string
  game: {
    name: string
  }
}

export function GameHistory() {
  const { user } = useAuth()
  const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchGameHistory = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    if (!user) return

    try {
      const { data, error } = await supabase
        .from('game_history')
        .select(`
          id,
          result,
          chips_won,
          chips_lost,
          created_at,
          games (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      
      // Transform the data to match our interface
      const transformedData = data?.map(item => ({
        ...item,
        game: {
          name: Array.isArray(item.games) 
            ? (item.games[0] as any)?.name || 'Blackjack'
            : (item.games as any)?.name || 'Blackjack'
        }
      })) || []
      
      setGameHistory(transformedData)
    } catch (error) {
      console.error('Error fetching game history:', error)
    } finally {
      if (isRefresh) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchGameHistory()
  }, [user])

  const handleRefresh = () => {
    fetchGameHistory(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Game History</span>
              </CardTitle>
              <CardDescription>Your recent games</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (gameHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Game History</span>
              </CardTitle>
              <CardDescription>Your recent games</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading || refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No games played yet</p>
            <p className="text-sm">Start playing to see your game history here!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'win':
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <TrendingUp className="h-3 w-3 mr-1" />
            Win
          </Badge>
        )
      case 'lose':
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <TrendingDown className="h-3 w-3 mr-1" />
            Lose
          </Badge>
        )
      case 'push':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <Minus className="h-3 w-3 mr-1" />
            Push
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            {result}
          </Badge>
        )
    }
  }

  const getNetChange = (item: GameHistoryItem) => {
    return item.chips_won - item.chips_lost
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Game History</span>
            </CardTitle>
            <CardDescription>Your recent games (last 20)</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {gameHistory.map((game) => {
            const netChange = getNetChange(game)
            return (
              <div key={game.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {getResultBadge(game.result)}
                  <div>
                    <div className="font-medium">{game.game.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(game.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-medium ${
                    netChange > 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : netChange < 0 
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-muted-foreground'
                  }`}>
                    {netChange > 0 ? '+' : ''}{netChange.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">credits</div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}