import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthGuard } from '../AuthGuard'
import { AuthProvider } from '../AuthProvider'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signOut: vi.fn()
    }
  }
}))

describe('AuthGuard', () => {
  it('shows loading spinner initially then protected content', async () => {
    const supabaseModule = await import('@/lib/supabase')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabase = supabaseModule.supabase as any
    mockSupabase.auth.getSession.mockResolvedValue({ 
      data: { session: { user: { id: 'test', email: 'test@example.com' } } }, 
      error: null 
    })

    render(
      <AuthProvider>
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      </AuthProvider>
    )
    
    // Should show loading spinner initially
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    
    // Wait for protected content to appear
    await screen.findByText('Protected content')
  })

  it('shows authentication required message when not authenticated', async () => {
    const supabaseModule = await import('@/lib/supabase')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabase = supabaseModule.supabase as any
    mockSupabase.auth.getSession.mockResolvedValue({ 
      data: { session: null }, 
      error: null 
    })

    render(
      <AuthProvider>
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      </AuthProvider>
    )
    
    await screen.findByText('Authentication Required')
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  it('shows custom fallback when provided', async () => {
    const supabaseModule = await import('@/lib/supabase')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabase = supabaseModule.supabase as any
    mockSupabase.auth.getSession.mockResolvedValue({ 
      data: { session: null }, 
      error: null 
    })

    render(
      <AuthProvider>
        <AuthGuard fallback={<div>Custom login message</div>}>
          <div>Protected content</div>
        </AuthGuard>
      </AuthProvider>
    )
    
    await screen.findByText('Custom login message')
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })
})