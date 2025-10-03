import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthForm } from '../AuthForm'

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
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}))

describe('AuthForm', () => {
  const mockToggleMode = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockClear()
  })

  it('renders sign in form by default', () => {
    render(<AuthForm mode="signin" onToggleMode={mockToggleMode} />)

    expect(screen.getByText('Sign In to Blackjack')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByText("Don't have an account? Sign up")).toBeInTheDocument()
  })

  it('renders sign up form when mode is signup', () => {
    render(<AuthForm mode="signup" onToggleMode={mockToggleMode} />)

    expect(screen.getByText('Sign Up to Blackjack')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByText('Already have an account? Sign in')).toBeInTheDocument()
  })

  it('handles email and password input', async () => {
    render(<AuthForm mode="signin" onToggleMode={mockToggleMode} />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('calls onToggleMode when toggle button is clicked', () => {
    render(<AuthForm mode="signin" onToggleMode={mockToggleMode} />)

    const toggleButton = screen.getByText("Don't have an account? Sign up")
    fireEvent.click(toggleButton)

    expect(mockToggleMode).toHaveBeenCalledTimes(1)
  })

  it('shows OAuth buttons', () => {
    render(<AuthForm mode="signin" onToggleMode={mockToggleMode} />)

    // OAuth buttons should be present (we can check by their parent container)
    expect(screen.getByText('Or continue with')).toBeInTheDocument()
  })

  it('disables form during loading state', async () => {
    const { supabase } = await import('@/lib/supabase')

    // Mock a delayed response
    supabase.auth.signInWithPassword = vi
      .fn()
      .mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ data: { user: null, session: null }, error: null }), 100)
          )
      )

    render(<AuthForm mode="signin" onToggleMode={mockToggleMode} />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    // Button should show loading state
    expect(submitButton).toBeDisabled()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    // Check for the loading spinner (Loader2 icon)
    expect(document.querySelector('.lucide-loader-circle')).toBeInTheDocument()

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(document.querySelector('.lucide-loader-circle')).not.toBeInTheDocument()
      },
      { timeout: 200 }
    )
  })

  it('shows account exists error when user already exists during signup (obfuscated response)', async () => {
    const { supabase } = await import('@/lib/supabase')

    // Mock signup response for existing user (obfuscated response)
    supabase.auth.signUp = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'fake-id',
          email: 'test@example.com',
          identities: [], // Empty identities array indicates existing user
        },
        session: null,
      },
      error: null,
    })

    render(<AuthForm mode="signup" onToggleMode={mockToggleMode} />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists.')).toBeInTheDocument()
      expect(screen.getByText('Switch to Sign In')).toBeInTheDocument()
    })
  })

  it('shows account exists error when user already exists during signup (error response)', async () => {
    const { supabase } = await import('@/lib/supabase')

    // Mock signup response for existing user (error response)
    supabase.auth.signUp = vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    })

    render(<AuthForm mode="signup" onToggleMode={mockToggleMode} />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('An account with this email already exists.')).toBeInTheDocument()
      expect(screen.getByText('Switch to Sign In')).toBeInTheDocument()
    })
  })

  it('switches to sign in when Switch to Sign In button is clicked', async () => {
    const { supabase } = await import('@/lib/supabase')

    // Mock signup response for existing user
    supabase.auth.signUp = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'fake-id',
          email: 'test@example.com',
          identities: [],
        },
        session: null,
      },
      error: null,
    })

    render(<AuthForm mode="signup" onToggleMode={mockToggleMode} />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Switch to Sign In')).toBeInTheDocument()
    })

    const switchButton = screen.getByText('Switch to Sign In')
    fireEvent.click(switchButton)

    expect(mockToggleMode).toHaveBeenCalledTimes(1)
  })

  it('redirects to blackjack game after successful sign in', async () => {
    const { supabase } = await import('@/lib/supabase')

    // Mock successful sign in
    supabase.auth.signInWithPassword = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'fake-id', email: 'test@example.com' },
        session: { access_token: 'fake-token' },
      },
      error: null,
    })

    render(<AuthForm mode="signin" onToggleMode={mockToggleMode} />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/games/blackjack')
    })
  })

  it('redirects to blackjack game after successful sign up with immediate session', async () => {
    const { supabase } = await import('@/lib/supabase')

    // Mock successful sign up with immediate session
    supabase.auth.signUp = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'fake-id', email: 'test@example.com' },
        session: { access_token: 'fake-token' },
      },
      error: null,
    })

    render(<AuthForm mode="signup" onToggleMode={mockToggleMode} />)

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/games/blackjack')
    })
  })
})
