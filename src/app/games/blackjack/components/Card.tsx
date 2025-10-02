import React from 'react'
import { Card as CardType } from '../types'

interface CardProps {
  card: CardType
  className?: string
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({ card, className = '', onClick }) => {
  const getSuitSymbol = (suit: CardType['suit']): string => {
    switch (suit) {
      case 'hearts':
        return '♥'
      case 'diamonds':
        return '♦'
      case 'clubs':
        return '♣'
      case 'spades':
        return '♠'
      default:
        return ''
    }
  }

  const getSuitColor = (suit: CardType['suit']): string => {
    return suit === 'hearts' || suit === 'diamonds' ? 'text-red-500' : 'text-black'
  }

  const getDisplayRank = (rank: CardType['rank']): string => {
    return rank
  }

  if (card.isHidden) {
    return (
      <div
        className={`w-16 h-24 bg-blue-600 border-2 border-blue-700 rounded-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-105 ${className}`}
        onClick={onClick}
      >
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-md flex items-center justify-center">
          <div className="text-white text-xs font-bold">🂠</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`w-16 h-24 bg-white border-2 border-gray-300 rounded-lg flex flex-col items-center justify-between p-1 cursor-pointer transition-transform hover:scale-105 shadow-md ${className}`}
      onClick={onClick}
    >
      <div className={`text-xs font-bold ${getSuitColor(card.suit)}`}>
        {getDisplayRank(card.rank)}
      </div>
      <div className={`text-2xl ${getSuitColor(card.suit)}`}>{getSuitSymbol(card.suit)}</div>
      <div className={`text-xs font-bold transform rotate-180 ${getSuitColor(card.suit)}`}>
        {getDisplayRank(card.rank)}
      </div>
    </div>
  )
}

interface HandProps {
  cards: CardType[]
  label: string
  value?: number
  className?: string
  onCardClick?: (cardIndex: number) => void
}

export const Hand: React.FC<HandProps> = ({ cards, label, value, className = '', onCardClick }) => {
  return (
    <div className={`text-center ${className}`}>
      <h3 className="text-xl font-bold text-white mb-2">{label}</h3>
      {value !== undefined && (
        <div className="text-lg font-semibold text-white mb-3">Value: {value}</div>
      )}
      <div className="flex justify-center space-x-2">
        {cards.map((card, index) => (
          <Card
            key={`${card.suit}-${card.rank}-${index}`}
            card={card}
            onClick={() => onCardClick?.(index)}
          />
        ))}
        {cards.length === 0 && (
          <div className="w-16 h-24 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center">
            <span className="text-xs text-gray-400">Empty</span>
          </div>
        )}
      </div>
    </div>
  )
}
