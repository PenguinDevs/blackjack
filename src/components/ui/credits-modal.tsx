'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface CreditsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPurchase: (amount: number) => void
}

export function CreditsModal({ open, onOpenChange, onPurchase }: CreditsModalProps) {
  const creditOptions = [
    { amount: 500, label: '500 Credits' },
    { amount: 1000, label: '1,000 Credits' },
    { amount: 2500, label: '2,500 Credits' },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Purchase Credits</DialogTitle>
          <DialogDescription>
            Add more credits to your account to continue playing.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            {creditOptions.map(({ amount, label }) => (
              <div
                key={amount}
                className="flex justify-between items-center p-3 border rounded-lg"
              >
                <p className="font-medium">{label}</p>
                <Button onClick={() => onPurchase(amount)}>Buy</Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}