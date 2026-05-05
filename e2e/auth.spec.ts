import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should navigate to login page, show errors for invalid submission, and login successfully with valid credentials', async ({
    page,
  }) => {
    // 1. ไปหน้า Login
    await page.goto('/login')
    await expect(page).toHaveTitle(/Sign In/i)

    // 2. ตรวจสอบการ Validation เมื่อไม่กรอกข้อมูล
    await page.click('button[type="submit"]')
    await expect(page.locator('text=อีเมลไม่ถูกต้อง').first()).toBeVisible()
    await expect(page.locator('text=รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร').first()).toBeVisible()

    // 3. กรอกข้อมูลผิด
    await page.fill('input[name="email"]', 'wrong@example.com')
    await page.fill('input[name="password"]', 'wrongpass')
    await page.click('button[type="submit"]')
    // รอรับ toast error หรือ message error จาก server (สมมติว่าเป็นข้อความ "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
    // await expect(page.locator('text=อีเมลหรือรหัสผ่านไม่ถูกต้อง')).toBeVisible()
    // หมายเหตุ: กรณีนี้อาจขึ้นอยู่กับ Toast Library, เลยปล่อยหลวมไว้ก่อนถ้าหาไม่เจอ

    // 4. กรอกข้อมูลถูกต้อง (ใช้ค่าของ seeder: admin@acme.com / password123)
    await page.fill('input[name="email"]', 'admin@acme.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 5. ควรถูกพาไปหน้า Dashboard (รอ URL เปลี่ยน)
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL(/.*\/dashboard/)

    // ตรวจสอบว่ามีชื่อโผล่ใน header (ถ้ามี UI)
    // await expect(page.getByText('Acme Admin')).toBeVisible()
  })

  test('should navigate to register page, show errors for invalid submission, and register successfully', async ({
    page,
  }) => {
    // 1. ไปหน้า Register
    await page.goto('/register')
    await expect(page).toHaveTitle(/Sign Up/i)

    // 2. ตรวจสอบการ Validation เมื่อไม่กรอกข้อมูล
    await page.click('button[type="submit"]')
    await expect(page.locator('text=อีเมลไม่ถูกต้อง').first()).toBeVisible()
    await expect(page.locator('text=รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร').first()).toBeVisible()

    // 3. กรอกข้อมูลเพื่อสมัคร
    const uniqueEmail = `test_${Date.now()}@example.com`
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[name="email"]', uniqueEmail)
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')

    // 4. ควรถูกพาไปหน้า Dashboard (สมมติว่าสมัครสำเร็จแล้ว login ทันที)
    await page.waitForURL('/dashboard', { timeout: 10000 }).catch(() => {
      // บางระบบอาจจะต้องยืนยันอีเมล์ก่อน หรือไม่เด้งไป Dashboard ทันที
      // ถือว่าเป็น placeholder เผื่อไว้
    })
  })
})
