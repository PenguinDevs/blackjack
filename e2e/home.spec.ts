import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should load home page successfully', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('main').getByRole('heading', { name: 'blackjack' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible()
  })

  test('should show loading state', async ({ page }) => {
    await page.goto('/')

    // The page should have the main title
    await expect(page.getByRole('main').getByRole('heading', { name: 'blackjack' })).toBeVisible()

    // Should show either Play button (if authenticated) or Get Started button (if not)
    const playButton = page.getByRole('button', { name: 'Play' })
    const getStartedButton = page.getByRole('link', { name: 'Get Started' })

    await expect(playButton.or(getStartedButton)).toBeVisible()
  })

  test('should have navigation menu', async ({ page }) => {
    await page.goto('/')

    // Check navigation
    const navbar = page.getByRole('navigation')
    await expect(navbar).toBeVisible()
    await expect(navbar.getByRole('link', { name: 'blackjack' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible()
  })

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/')

    // Click sign in link in navigation and wait for navigation
    await Promise.all([
      page.waitForURL('/auth/login'),
      page.getByRole('link', { name: 'Sign In' }).click(),
    ])

    await expect(page.getByText('Sign In to Blackjack')).toBeVisible()
  })

  test('should navigate to login via get started button', async ({ page }) => {
    await page.goto('/')

    // Click get started button and wait for navigation
    await Promise.all([
      page.waitForURL('/auth/login'),
      page.getByRole('link', { name: 'Get Started' }).click(),
    ])

    await expect(page.getByText('Sign In to Blackjack')).toBeVisible()
  })

  test('should be responsive', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.goto('/')

    // Main content should be visible on desktop
    await expect(page.getByRole('main').getByRole('heading', { name: 'blackjack' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible()

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Content should still be visible on mobile
    await expect(page.getByRole('main').getByRole('heading', { name: 'blackjack' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Get Started' })).toBeVisible()
  })
})
