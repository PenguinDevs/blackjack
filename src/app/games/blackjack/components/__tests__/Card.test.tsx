import { render, screen } from '@testing-library/react'
import { Hand } from '../Card'
import { Card as CardType } from '../../types'

describe('Hand Component', () => {
  const mockCards: CardType[] = [
    { suit: 'hearts', rank: 'A', value: 11, isHidden: false },
    { suit: 'spades', rank: 'K', value: 10, isHidden: true },
  ]

  it('displays numeric value correctly', () => {
    render(
      <Hand
        cards={mockCards}
        label="Test Hand"
        value={21}
      />
    )

    expect(screen.getByText('Value: 21')).toBeInTheDocument()
  })

  it('displays string value correctly (like "?")', () => {
    render(
      <Hand
        cards={mockCards}
        label="Dealer"
        value="?"
      />
    )

    expect(screen.getByText('Value: ?')).toBeInTheDocument()
  })

  it('does not display value when undefined', () => {
    render(
      <Hand
        cards={mockCards}
        label="Test Hand"
        value={undefined}
      />
    )

    expect(screen.queryByText(/Value:/)).not.toBeInTheDocument()
  })

  it('displays label correctly', () => {
    render(
      <Hand
        cards={mockCards}
        label="Dealer"
        value="?"
      />
    )

    expect(screen.getByText('Dealer')).toBeInTheDocument()
  })

  it('displays "?" for empty cards (initial game state)', () => {
    render(
      <Hand
        cards={[]}
        label="Dealer"
        value="?"
      />
    )

    expect(screen.getByText('Value: ?')).toBeInTheDocument()
  })
})