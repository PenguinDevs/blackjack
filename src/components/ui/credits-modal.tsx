'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useCredits } from '@/hooks/useCredits'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface CreditsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreditsModal({ open, onOpenChange }: CreditsModalProps) {
  const { loading: creditsLoading, addCredits, error } = useCredits()
  const [purchaseLoading, setPurchaseLoading] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const creditOptions = [
    { amount: 500, label: '500 Credits' },
    { amount: 1000, label: '1,000 Credits' },
    { amount: 2500, label: '2,500 Credits' },
  ]

  const handlePurchase = async (amount: number) => {
    setPurchaseLoading(amount)
    setSuccessMessage(null)

    try {
      const success = await addCredits(amount)
      if (success) {
        setSuccessMessage(`Successfully added ${amount.toLocaleString()} credits!`)
        // Close modal after successful purchase with delay for user to see success
        setTimeout(() => {
          onOpenChange(false)
          setSuccessMessage(null)
        }, 1500)
      }
    } catch (error) {
      console.error('Purchase failed:', error)
    } finally {
      setPurchaseLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Get More Credits</DialogTitle>
          <DialogDescription>
            Add more credits to your account to continue playing. All credits are free!
          </DialogDescription>
        </DialogHeader>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Error: {error}</span>
          </div>
        )}

        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            {creditOptions.map(({ amount, label }) => (
              <div key={amount} className="flex justify-between items-center p-3 border rounded-lg">
                <p className="font-medium">{label}</p>
                <Button
                  onClick={() => handlePurchase(amount)}
                  disabled={purchaseLoading !== null || creditsLoading || !!successMessage}
                  className="min-w-[80px]"
                >
                  {purchaseLoading === amount ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Get Free'
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
