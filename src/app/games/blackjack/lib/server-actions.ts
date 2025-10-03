'use server'

import { BlackjackEngine } from './blackjack-engine'
import { BlackjackGameState, PlayerAction } from '../types'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Server actions for blackjack game
 * These can be used for server-side game validation or multiplayer functionality
 */

export async function initializeBlackjackGame(betAmount: number): Promise<BlackjackGameState> {
  try {
    let gameState = BlackjackEngine.initializeGame(betAmount)
    gameState = BlackjackEngine.dealInitialCards(gameState)
    return gameState
  } catch (error) {
    throw new Error(
      `Failed to initialize game: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export async function executePlayerAction(
  gameState: BlackjackGameState,
  action: PlayerAction
): Promise<BlackjackGameState> {
  try {
    let newGameState = gameState

    switch (action) {
      case 'hit':
        newGameState = BlackjackEngine.playerHit(gameState)
        break
      case 'stand':
        newGameState = BlackjackEngine.playerStand(gameState)

        // If player stands, automatically play dealer turn
        if (newGameState.gameState === 'dealer-turn') {
          newGameState = BlackjackEngine.playDealerTurn(newGameState)
          newGameState = BlackjackEngine.completeGame(newGameState)
        }
        break
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    // If game is over after player action, complete it
    if (newGameState.gameState === 'game-over' && !newGameState.gameResult) {
      newGameState = BlackjackEngine.completeGame(newGameState)
    }

    return newGameState
  } catch (error) {
    throw new Error(
      `Failed to execute action: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

export async function validateGameState(gameState: BlackjackGameState): Promise<{
  isValid: boolean
  errors: string[]
}> {
  const errors: string[] = []

  try {
    // Validate deck integrity
    if (gameState.deck.length < 0 || gameState.deck.length > 52) {
      errors.push('Invalid deck size')
    }

    // Validate hand values
    const playerCalculated = BlackjackEngine.calculateHandValue(gameState.playerHand.cards)
    if (playerCalculated.value !== gameState.playerHand.value) {
      errors.push('Player hand value mismatch')
    }

    const dealerCalculated = BlackjackEngine.calculateHandValue(gameState.dealerHand.cards)
    if (dealerCalculated.value !== gameState.dealerHand.value) {
      errors.push('Dealer hand value mismatch')
    }

    // Validate game state transitions
    switch (gameState.gameState) {
      case 'waiting':
        if (gameState.playerHand.cards.length > 0 || gameState.dealerHand.cards.length > 0) {
          errors.push('Cards present in waiting state')
        }
        break
      case 'dealing':
      case 'player-turn':
        if (gameState.playerHand.cards.length < 2) {
          errors.push('Insufficient player cards for current state')
        }
        break
      case 'game-over':
        if (!gameState.gameResult) {
          errors.push('Game over without result')
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      isValid: false,
      errors,
    }
  }
}

export async function calculateGameStatistics(gameStates: BlackjackGameState[]): Promise<{
  totalGames: number
  totalWins: number
  totalLosses: number
  totalPushes: number
  winRate: number
  totalWinnings: number
  averageBet: number
  blackjackCount: number
}> {
  const completedGames = gameStates.filter(
    (state) => state.gameState === 'game-over' && state.gameResult
  )

  const stats = {
    totalGames: completedGames.length,
    totalWins: 0,
    totalLosses: 0,
    totalPushes: 0,
    winRate: 0,
    totalWinnings: 0,
    averageBet: 0,
    blackjackCount: 0,
  }

  if (completedGames.length === 0) {
    return stats
  }

  let totalBets = 0

  for (const gameState of completedGames) {
    const result = gameState.gameResult!

    if (result.playerWins) {
      stats.totalWins++
    } else if (result.isDraw) {
      stats.totalPushes++
    } else {
      stats.totalLosses++
    }

    stats.totalWinnings += result.winnings - gameState.currentBet
    totalBets += gameState.currentBet

    if (gameState.playerHand.isBlackjack) {
      stats.blackjackCount++
    }
  }

  stats.winRate = (stats.totalWins / completedGames.length) * 100
  stats.averageBet = totalBets / completedGames.length

  return stats
}

/**
 * Server action to place a bet and deduct credits from user's account
 */
export async function placeBet(betAmount: number): Promise<{
  success: boolean
  message: string
  remainingCredits?: number
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

    // Validate bet amount
    if (betAmount <= 0) {
      return { success: false, message: 'Invalid bet amount' }
    }

    // Get current credits
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      return { success: false, message: 'Failed to fetch user credits' }
    }

    // Check sufficient credits
    if (profile.credits < betAmount) {
      return { success: false, message: 'Insufficient credits' }
    }

    // Deduct credits
    const newCredits = profile.credits - betAmount
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return { success: false, message: 'Failed to deduct credits' }
    }

    return {
      success: true,
      message: 'Bet placed successfully',
      remainingCredits: newCredits,
    }
  } catch (error) {
    console.error('Error placing bet:', error)
    return { success: false, message: 'Internal server error' }
  }
}

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

/**
 * Server action to award winnings to user's account (legacy function)
 */
export async function awardWinnings(winnings: number): Promise<{
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

    // Validate winnings amount
    if (winnings < 0) {
      return { success: false, message: 'Invalid winnings amount' }
    }

    // If no winnings, return success without updating
    if (winnings === 0) {
      return { success: true, message: 'No winnings to award' }
    }

    // Get current credits
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (fetchError) {
      return { success: false, message: 'Failed to fetch user credits' }
    }

    // Add winnings
    const newCredits = profile.credits + winnings
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits: newCredits,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      return { success: false, message: 'Failed to award winnings' }
    }

    return {
      success: true,
      message: 'Winnings awarded successfully',
      newCredits,
    }
  } catch (error) {
    console.error('Error awarding winnings:', error)
    return { success: false, message: 'Internal server error' }
  }
}
