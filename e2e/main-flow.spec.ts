import { test, expect } from '@playwright/test'

test.describe('Main SaaS Flow', () => {
  test('signs in and reaches core workspace pages', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[name="email"]', 'admin@acme.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')

    await expect(page.getByText(/Tenant overview|Platform/).first()).toBeVisible()

    await page.goto('/settings/billing')
    await expect(page).toHaveURL(/.*\/settings\/billing/)

    await page.goto('/settings/team')
    await expect(page).toHaveURL(/.*\/settings\/team/)
  })
})
