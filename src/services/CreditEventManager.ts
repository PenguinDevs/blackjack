export interface CreditEventListener {
  onCreditsChanged: (newCredits?: number) => void
}

export interface ICreditEventManager {
  subscribe(listener: CreditEventListener): () => void
  emit(newCredits?: number): void
}

export class CreditEventManager implements ICreditEventManager {
  private listeners: CreditEventListener[] = []

  subscribe(listener: CreditEventListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  emit(newCredits?: number): void {
    this.listeners.forEach((listener) => listener.onCreditsChanged(newCredits))
  }
}

// Singleton instance - will be replaced with proper DI container later
export const creditEventManager = new CreditEventManager()
