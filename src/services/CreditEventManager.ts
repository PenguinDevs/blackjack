export interface CreditEventListener {
  onCreditsChanged: () => void
}

export interface ICreditEventManager {
  subscribe(listener: CreditEventListener): () => void
  emit(): void
}

export class CreditEventManager implements ICreditEventManager {
  private listeners: CreditEventListener[] = []

  subscribe(listener: CreditEventListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  emit(): void {
    this.listeners.forEach(listener => listener.onCreditsChanged())
  }
}

// Singleton instance - will be replaced with proper DI container later
export const creditEventManager = new CreditEventManager()