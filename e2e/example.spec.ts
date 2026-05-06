import { test, expect } from '@playwright/test'

test('has title and redirects to login when not authenticated', async ({ page }) => {
  await page.goto('/dashboard')

  await expect(page).toHaveURL(/.*login/)
  await expect(page.getByRole('heading', { name: /welcome back|ยินดีต้อนรับกลับ/i })).toBeVisible()
})
