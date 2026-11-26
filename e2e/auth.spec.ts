import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('validates login and signs in with seeded admin credentials', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/Sign In/i)
    await expect(
      page.getByRole('heading', { name: /welcome back|ยินดีต้อนรับกลับ/i })
    ).toBeVisible()

    await page.click('button[type="submit"]')
    await expect(page.locator('#email + p')).toBeVisible()
    await expect(page.locator('#password + p')).toBeVisible()

    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpass')
    await page.click('button[type="submit"]')
    await expect(page.locator('[role="status"], [role="alert"]').first()).toBeVisible()

    await page.fill('input[name="email"]', 'admin@acme.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL(/.*\/dashboard/)
    // seed ตั้ง default locale เป็น th จึงต้องรับข้อความไทยด้วย ดู example.spec.ts
    await expect(
      page.getByText(/Platform|Tenant overview|แพลตฟอร์ม|ภาพรวม tenant/).first()
    ).toBeVisible()
  })

  test('validates registration and redirects a new user to dashboard', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /create account|สร้างบัญชี/i })).toBeVisible()

    await page.click('button[type="submit"]')
    await expect(page.locator('#name + p')).toBeVisible()
    await expect(page.locator('#reg-email + p')).toBeVisible()
    await expect(page.locator('#reg-password + p')).toBeVisible()
    await expect(page.locator('#reg-confirm + p')).toBeVisible()

    const uniqueEmail = `test_${Date.now()}@example.com`
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', uniqueEmail)
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.click('button[type="submit"]')

    await page.waitForURL('/dashboard', { timeout: 10000 })
    await expect(page).toHaveURL(/.*\/dashboard/)
  })
})
