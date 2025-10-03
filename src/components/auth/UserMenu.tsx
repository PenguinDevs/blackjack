'use client'

import { useAuth } from './AuthProvider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useCredits } from '@/hooks/useCredits'
import { LogOut, User, Coins } from 'lucide-react'
import Link from 'next/link'

export function UserMenu() {
  const { user, signOut } = useAuth()
  const { credits, loading: creditsLoading } = useCredits()

  if (!user) return null

  const displayName = user.user_metadata?.full_name || user.email
  const initials =
    displayName
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'U'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={displayName || 'User avatar'} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            {user.user_metadata?.provider && (
              <Badge variant="secondary" className="w-fit text-xs capitalize">
                via {user.user_metadata.provider}
              </Badge>
            )}
            <div className="flex items-center space-x-1 mt-2">
              <Coins className="h-3 w-3 text-yellow-500" />
              <span className="text-xs font-medium">
                {creditsLoading ? '...' : credits.toLocaleString()} Credits
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
