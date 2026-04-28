import { test, expect } from '@playwright/test'

test('has title and redirects to login when not authenticated', async ({ page }) => {
  await page.goto('/dashboard')

  // Expect a title "to contain" a substring.
  // The default unauthenticated user should be redirected to Login
  await expect(page).toHaveURL(/.*login/)

  // Check if login form is visible
  await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible()
})
