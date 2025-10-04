'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AuthError } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { GoogleIcon, DiscordIcon, GitHubIcon } from '@/components/icons'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
}

interface AccountExistsError {
  type: 'account-exists'
  message: string
}

export function AuthForm({ mode, onToggleMode }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accountExistsError, setAccountExistsError] = useState<AccountExistsError | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setAccountExistsError(null)
    setMessage(null)

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        // Redirect to blackjack game after successful sign-in
        router.push('/games/blackjack')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        // Check if user already exists based on the response structure
        // When email confirmation is enabled and user exists, Supabase returns
        // data.user but data.session is null, and the user might be obfuscated
        if (
          data.user &&
          !data.session &&
          data.user.identities &&
          data.user.identities.length === 0
        ) {
          // This indicates the user already exists (obfuscated response)
          setAccountExistsError({
            type: 'account-exists',
            message: `An account with this email already exists.`,
          })
        } else if (data.session) {
          // User signed up and was immediately signed in (email confirmation disabled)
          router.push('/games/blackjack')
        } else {
          // User needs to confirm email
          setMessage('Check your email for the confirmation link!')
        }
      }
    } catch (error) {
      const authError = error as AuthError

      // Handle the case where user already exists during sign up (when email confirmation is disabled)
      if (
        mode === 'signup' &&
        (authError.message.toLowerCase().includes('user already registered') ||
          authError.message.toLowerCase().includes('email already registered') ||
          authError.message.toLowerCase().includes('already registered'))
      ) {
        setAccountExistsError({
          type: 'account-exists',
          message: `An account with this email already exists.`,
        })
      } else {
        setError(authError.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchToSignIn = () => {
    setAccountExistsError(null)
    setError(null)
    onToggleMode()
  }

  const handleOAuthSignIn = async (provider: 'google' | 'discord' | 'github') => {
    setLoading(true)
    setError(null)
    setAccountExistsError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/games/blackjack')}`,
        },
      })
      if (error) throw error
    } catch (error) {
      const authError = error as AuthError
      setError(authError.message)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {mode === 'signin' ? 'Sign In' : 'Sign Up'} to Blackjack
          </CardTitle>
          {mode === 'signup' && (
            <CardDescription>Create a new account to start playing.</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {accountExistsError && (
            <Alert variant="destructive">
              <AlertDescription className="flex flex-col space-y-2">
                <span>{accountExistsError.message}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSwitchToSignIn}
                  className="w-fit"
                >
                  Switch to Sign In
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
            >
              <GoogleIcon />
            </Button>

            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('discord')}
              disabled={loading}
            >
              <DiscordIcon />
            </Button>

            <Button
              variant="outline"
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading}
            >
              <GitHubIcon />
            </Button>
          </div>

          <div className="text-center">
            <Button variant="link" onClick={onToggleMode} className="text-sm">
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
