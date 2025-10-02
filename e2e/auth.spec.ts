import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login')
    
    await expect(page.getByRole('heading', { name: 'blackjack' })).toBeVisible()
    await expect(page.getByText('Sign In to Blackjack')).toBeVisible()
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()
  })

  test('should toggle between sign in and sign up', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Initially should show sign in
    await expect(page.getByText('Sign In to Blackjack')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    
    // Click toggle to sign up
    await page.getByText("Don't have an account? Sign up").click()
    
    // Should now show sign up
    await expect(page.getByText('Sign Up to Blackjack')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible()
    
    // Click toggle back to sign in
    await page.getByText('Already have an account? Sign in').click()
    
    // Should be back to sign in
    await expect(page.getByText('Sign In to Blackjack')).toBeVisible()
  })

  test('should show validation for empty form', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Browser validation should prevent submission
    const emailInput = page.getByPlaceholder('your@email.com')
    await expect(emailInput).toHaveAttribute('required')
  })

  test('should show OAuth buttons', async ({ page }) => {
    await page.goto('/auth/login')
    
    await expect(page.getByText('Or continue with')).toBeVisible()
    
    // Should have 3 OAuth buttons (Google, Discord, GitHub) - they show as icon buttons
    const oauthButtons = page.locator('button').filter({ has: page.locator('svg') })
    await expect(oauthButtons).toHaveCount(3)
  })

  test('should navigate to home when not authenticated', async ({ page }) => {
    await page.goto('/')
    
    // Should show unauthenticated state
    await expect(page.getByRole('main').getByRole('heading', { name: 'blackjack' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible()
  })

  test('should have proper form accessibility', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Check form labels
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Password')).toBeVisible()
    
    // Check button accessibility
    const signInButton = page.getByRole('button', { name: 'Sign In' })
    await expect(signInButton).toBeVisible()
    await expect(signInButton).toBeEnabled()
  })
})