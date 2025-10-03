import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthGuard } from '../AuthGuard'
import { AuthProvider } from '../AuthProvider'

// Mock Next.js navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(),
    },
  },
}))

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
  })

  it('shows loading spinner initially then protected content', async () => {
    const supabaseModule = await import('@/lib/supabase')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabase = supabaseModule.supabase as any
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: 'test', email: 'test@example.com' } } },
      error: null,
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

  it('redirects to login page when not authenticated', async () => {
    const supabaseModule = await import('@/lib/supabase')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabase = supabaseModule.supabase as any
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    })

    render(
      <AuthProvider>
        <AuthGuard>
          <div>Protected content</div>
        </AuthGuard>
      </AuthProvider>
    )

    // Should show redirecting message and call router.push
    await screen.findByText('Redirecting...')
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
    
    // Wait a bit for useEffect to trigger
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(mockPush).toHaveBeenCalledWith('/auth/login')
  })

  it('shows custom fallback when provided', async () => {
    const supabaseModule = await import('@/lib/supabase')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSupabase = supabaseModule.supabase as any
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
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
