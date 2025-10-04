import { render, screen } from '@testing-library/react'
import { Hand } from '../Card'
import { Card as CardType } from '../../types'
import { GAME_CONSTANTS } from '../../utils/game-utils'

describe('Hand Component', () => {
  const mockCards: CardType[] = [
    { suit: 'hearts', rank: 'A', value: GAME_CONSTANTS.ACE_HIGH_VALUE, isHidden: false },
    { suit: 'spades', rank: 'K', value: GAME_CONSTANTS.FACE_CARD_VALUE, isHidden: true },
  ]

  it('displays numeric value correctly', () => {
    render(
      <Hand
        cards={mockCards}
        label="Test Hand"
        value={GAME_CONSTANTS.BLACKJACK_VALUE}
        gameState="game-over"
      />
    )

    expect(screen.getByText(`Value: ${GAME_CONSTANTS.BLACKJACK_VALUE}`)).toBeInTheDocument()
  })

  it('displays string value correctly (like "?")', () => {
    render(<Hand cards={mockCards} label="Dealer" value="?" gameState="game-over" />)

    expect(screen.getByText('Value: ?')).toBeInTheDocument()
  })

  it('does not display value when undefined', () => {
    render(<Hand cards={mockCards} label="Test Hand" value={undefined} />)

    expect(screen.queryByText(/Value:/)).not.toBeInTheDocument()
  })

  it('displays label correctly', () => {
    render(<Hand cards={mockCards} label="Dealer" value="?" />)

    expect(screen.getByText('Dealer')).toBeInTheDocument()
  })

  it('displays "?" for empty cards (initial game state)', () => {
    render(<Hand cards={[]} label="Dealer" value="?" gameState="game-over" />)

    expect(screen.getByText('Value: ?')).toBeInTheDocument()
  })
})
