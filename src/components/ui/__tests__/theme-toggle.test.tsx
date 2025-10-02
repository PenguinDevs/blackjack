import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { ThemeToggle } from '../theme-toggle'

const mockSetTheme = vi.fn()

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    theme: 'system',
    systemTheme: 'light',
  }),
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear()
  })

  it('renders theme toggle button', () => {
    render(<ThemeToggle />)

    const themeToggleButton = screen.getByRole('button')
    expect(themeToggleButton).toBeInTheDocument()
    expect(themeToggleButton).not.toHaveAttribute('aria-haspopup')
  })

  it('has accessible label', () => {
    render(<ThemeToggle />)

    expect(screen.getByText('Toggle theme')).toBeInTheDocument()
  })

  it('toggles from system to opposite of system theme', () => {
    render(<ThemeToggle />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })
})
