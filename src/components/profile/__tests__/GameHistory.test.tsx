import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GameHistory } from '../GameHistory'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    })),
  },
}))

// Mock auth context
vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
    },
  }),
}))

describe('GameHistory', () => {
  it('renders component without crashing', () => {
    render(<GameHistory />)

    // Should render the component header
    expect(screen.getByText('Game History')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<GameHistory />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})
