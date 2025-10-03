'use server'

import { BlackjackGameState } from '../types'

export interface AIRecommendation {
  action: 'hit' | 'stand'
  reasoning: string
  confidence: number // 0-1 scale
}

/**
 * Formats the game state into a human-readable format for Gemini AI
 */
function formatGameStateForAI(gameState: BlackjackGameState): string {
  const { playerHand, dealerHand } = gameState

  // Get visible dealer cards (exclude hidden cards)
  const visibleDealerCards = dealerHand.cards.filter((card) => !card.isHidden)
  const dealerVisibleValue = visibleDealerCards.reduce((sum, card) => sum + card.value, 0)

  const playerCards = playerHand.cards
    .map((card) => `${card.rank}${card.suit.charAt(0).toUpperCase()}`)
    .join(', ')
  const dealerVisibleCardsStr = visibleDealerCards
    .map((card) => `${card.rank}${card.suit.charAt(0).toUpperCase()}`)
    .join(', ')

  // Determine if player has soft hand (ace as 11)
  const hasUsableAce =
    playerHand.cards.some((card) => card.rank === 'A') &&
    playerHand.cards.reduce((sum, card) => sum + (card.rank === 'A' ? 1 : card.value), 0) + 10 ===
      playerHand.value

  // Get dealer's upcard for strategy analysis
  const dealerUpcard =
    dealerVisibleCardsStr.length > 0 ? dealerVisibleCardsStr.split(', ')[0] : 'Unknown'

  return `
BLACKJACK STRATEGY ANALYSIS REQUEST

Current Game State:
═══════════════════
Player Hand: ${playerCards}
Player Total: ${playerHand.value}${hasUsableAce ? ' (soft)' : ' (hard)'}
Player Status: ${playerHand.isBusted ? 'BUSTED' : playerHand.isBlackjack ? 'BLACKJACK' : 'Active'}

Dealer Showing: ${dealerUpcard}
Dealer Visible Total: ${dealerVisibleValue}
Hidden Cards: ${dealerHand.cards.length - visibleDealerCards.length}

ANALYSIS REQUIRED:
═══════════════════
Using optimal basic blackjack strategy, should the player HIT or STAND?
Consider:
- Basic strategy charts
- Dealer's upcard strength (2-6 weak, 7-A strong)
- Player's hand type (hard vs soft)
- Bust probability
- Expected value calculations

RESPONSE FORMAT (JSON only):
{
  "action": "hit" or "stand",
  "reasoning": "Concise explanation referencing basic strategy principles",
  "confidence": decimal between 0.0 and 1.0
}
`.trim()
}

/**
 * Calls Google Gemini AI to get a recommendation for the current blackjack game state
 */
export async function getAIRecommendation(
  gameState: BlackjackGameState
): Promise<AIRecommendation> {
  try {
    // Format the game state for AI analysis
    const prompt = formatGameStateForAI(gameState)

    // Check if Gemini API key is available
    const geminiApiKey = process.env.GEMINI_API_KEY

    if (!geminiApiKey) {
      console.warn('Gemini API key not found, falling back to basic strategy')
      return getBasicStrategyRecommendation(gameState)
    }

    // Call Gemini AI API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': geminiApiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert blackjack strategy advisor with deep knowledge of optimal play. ${prompt}\n\nRespond with ONLY a valid JSON object in this exact format:\n{\n  "action": "hit" or "stand",\n  "reasoning": "Brief explanation of why this is the optimal play",\n  "confidence": decimal between 0.0 and 1.0\n}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 200,
            topP: 0.8,
            topK: 10,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error')
      console.error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Gemini AI')
    }

    const aiResponse = data.candidates[0].content.parts[0].text

    try {
      // Clean up the response - remove markdown code blocks if present
      const cleanedResponse = aiResponse.replace(/```json\n?|```\n?/g, '').trim()
      const recommendation = JSON.parse(cleanedResponse) as AIRecommendation

      // Validate the response structure
      if (
        !recommendation.action ||
        !recommendation.reasoning ||
        typeof recommendation.confidence !== 'number'
      ) {
        throw new Error('Invalid recommendation structure from Gemini AI')
      }

      // Ensure action is valid
      if (recommendation.action !== 'hit' && recommendation.action !== 'stand') {
        throw new Error(`Invalid action recommendation: ${recommendation.action}`)
      }

      // Ensure confidence is within valid range
      if (recommendation.confidence < 0 || recommendation.confidence > 1) {
        recommendation.confidence = Math.max(0, Math.min(1, recommendation.confidence))
      }

      console.log(
        `✅ Gemini AI recommendation: ${recommendation.action.toUpperCase()} (${Math.round(recommendation.confidence * 100)}%)`
      )
      return recommendation
    } catch (parseError) {
      console.warn(
        'Failed to parse Gemini AI response, falling back to basic strategy:',
        parseError
      )
      console.warn('Raw response:', aiResponse)
      return getBasicStrategyRecommendation(gameState)
    }
  } catch (error) {
    console.error('Error getting AI recommendation:', error)

    // Provide more specific error handling
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error calling Gemini AI, using offline strategy')
    } else if (error instanceof SyntaxError) {
      console.warn('Invalid JSON response from Gemini AI')
    } else {
      console.warn('Gemini AI service unavailable, using basic strategy fallback')
    }

    // Always fallback to basic strategy if AI call fails
    return getBasicStrategyRecommendation(gameState)
  }
}

/**
 * Implements basic blackjack strategy as a fallback
 */
function getBasicStrategyRecommendation(gameState: BlackjackGameState): AIRecommendation {
  const { playerHand, dealerHand } = gameState
  const playerValue = playerHand.value

  // Get dealer's upcard (first visible card)
  const dealerUpcard = dealerHand.cards.find((card) => !card.isHidden)
  const dealerUpcardValue = dealerUpcard?.value || 10

  // Basic blackjack strategy logic
  let action: 'hit' | 'stand' = 'stand'
  let reasoning = ''
  let confidence = 0.9

  if (playerValue >= 17) {
    action = 'stand'
    reasoning = 'Player has 17 or higher - basic strategy says to stand'
    confidence = 0.95
  } else if (playerValue <= 11) {
    action = 'hit'
    reasoning = 'Player has 11 or lower - impossible to bust, always hit'
    confidence = 1.0
  } else if (playerValue >= 12 && playerValue <= 16) {
    // Dealer's upcard determines strategy for 12-16
    if (dealerUpcardValue >= 2 && dealerUpcardValue <= 6) {
      action = 'stand'
      reasoning = `Dealer shows weak upcard (${dealerUpcard?.rank}), likely to bust - stand on ${playerValue}`
      confidence = 0.85
    } else {
      action = 'hit'
      reasoning = `Dealer shows strong upcard (${dealerUpcard?.rank}), must improve hand value of ${playerValue}`
      confidence = 0.8
    }
  }

  // Special case for soft hands (hands with Ace counted as 11)
  const hasAce = playerHand.cards.some((card) => card.rank === 'A')
  if (hasAce && playerValue <= 18 && playerValue >= 13) {
    // Calculate if this is truly a soft hand
    let hardValue = 0
    playerHand.cards.forEach((card) => {
      if (card.rank === 'A') {
        hardValue += 1
      } else {
        hardValue += card.value
      }
    })

    // If we can count an ace as 11 without busting
    if (hardValue + 10 === playerValue) {
      action = 'hit'
      reasoning = `Soft ${playerValue} - can't bust by taking another card`
      confidence = 0.9
    }
  }

  return { action, reasoning, confidence }
}
