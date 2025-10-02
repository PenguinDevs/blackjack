'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'system') {
      // If currently using system, switch to opposite of system preference
      setTheme(systemTheme === 'dark' ? 'light' : 'dark')
    } else {
      // If currently using a specific theme, go back to system
      setTheme('system')
    }
  }

  return (
    <Button variant="ghost" size="sm" className="h-9 w-9 px-0" onClick={toggleTheme}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
