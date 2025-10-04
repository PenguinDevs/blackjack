import { supabase } from '@/lib/supabase'

export interface ICreditService {
  getCredits(userId: string): Promise<number>
  addCredits(userId: string, amount: number): Promise<boolean>
  subtractCredits(userId: string, amount: number): Promise<boolean>
  createProfile(user: {
    id: string
    email?: string
    user_metadata?: Record<string, unknown>
  }): Promise<number>
}

export class CreditService implements ICreditService {
  async getCredits(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error('PROFILE_NOT_FOUND')
      }
      throw new Error(`Failed to fetch credits: ${error.message}`)
    }

    return data.credits
  }

  async addCredits(userId: string, amount: number): Promise<boolean> {
    try {
      const currentCredits = await this.getCredits(userId)
      const newCredits = currentCredits + amount

      const { error } = await supabase
        .from('profiles')
        .update({
          credits: newCredits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw new Error(error.message)
      return true
    } catch (err) {
      console.error('Error adding credits:', err)
      return false
    }
  }

  async subtractCredits(userId: string, amount: number): Promise<boolean> {
    try {
      const currentCredits = await this.getCredits(userId)
      if (currentCredits < amount) {
        return false
      }

      const newCredits = currentCredits - amount

      const { error } = await supabase
        .from('profiles')
        .update({
          credits: newCredits,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) throw new Error(error.message)
      return true
    } catch (err) {
      console.error('Error subtracting credits:', err)
      return false
    }
  }

  async createProfile(user: {
    id: string
    email?: string
    user_metadata?: Record<string, unknown>
  }): Promise<number> {
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

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`)
    }

    return data.credits
  }
}

// Singleton instance for dependency injection
export const creditService = new CreditService()
