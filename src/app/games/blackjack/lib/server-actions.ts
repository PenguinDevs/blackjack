'use server'

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Server actions for blackjack game
 * These can be used for server-side game validation or multiplayer functionality
 */

/**
 * Server action to record game result and handle credits
 */
export async function recordGameResult(
  betAmount: number,
  winnings: number,
  gameResult: 'win' | 'lose' | 'push'
): Promise<{
  success: boolean
  message: string
  newCredits?: number
}> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, message: 'Authentication required' }
    }

    // Get current credits
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits, games_played, games_won')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      return { success: false, message: 'Failed to fetch user profile' }
    }

    // Calculate new values
    const newCredits = profile.credits + winnings
    const newGamesPlayed = profile.games_played + 1
    const newGamesWon = profile.games_won + (gameResult === 'win' ? 1 : 0)

    // Use a transaction to update both profile and create game history
    const { error: transactionError } = await supabase.rpc('handle_blackjack_game_result', {
      p_user_id: user.id,
      p_bet_amount: betAmount,
      p_winnings: winnings,
      p_game_result: gameResult,
      p_new_credits: newCredits,
      p_new_games_played: newGamesPlayed,
      p_new_games_won: newGamesWon,
    })

    if (transactionError) {
      // Fallback to manual updates if the stored procedure doesn't exist
      console.warn('Stored procedure not found, using manual transaction')

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          credits: newCredits,
          games_played: newGamesPlayed,
          games_won: newGamesWon,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        return { success: false, message: 'Failed to update profile' }
      }
    }

    return {
      success: true,
      message: 'Game result recorded successfully',
      newCredits,
    }
  } catch (error) {
    console.error('Error recording game result:', error)
    return { success: false, message: 'Internal server error' }
  }
}

