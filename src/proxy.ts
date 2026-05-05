import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { authConfig } from '@/config'
import { getAuthUserFromRequest } from '@/lib/auth'
import { HTTP_STATUS } from '@/constants'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. ตรวจสอบว่าเป็น Public Route หรือไม่
  const isPublic = authConfig.publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  )

  if (isPublic) {
    return NextResponse.next()
  }

  // 2. ถ้าไม่ใช่ Public Route ต้องตรวจสอบ Auth Token
  const user = await getAuthUserFromRequest(request)

  // 3. ถ้าไม่มี Token หรือ Token ไม่ถูกต้อง (หมดอายุ)
  if (!user) {
    // กรณีที่เป็น API ให้ส่ง 401 Unauthorized กลับไปเป็น JSON
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // กรณีที่เป็น Web Page ปกติ ให้ Redirect กลับไปหน้า /login
    const loginUrl = new URL('/login', request.url)
    // แนบ callback URL เผื่อล็อกอินเสร็จแล้วให้กลับมาหน้าเดิม
    loginUrl.searchParams.set('callbackUrl', encodeURIComponent(pathname))
    return NextResponse.redirect(loginUrl)
  }

  // 4. ถ้าผ่านการตรวจสอบ ให้ไปต่อ
  return NextResponse.next()
}

// กำหนด Matcher ว่าจะให้ Middleware นี้ทำงานกับ Path ไหนบ้าง
export const config = {
  matcher: [
    // ดักจับทุก Request ยกเว้น _next, ไฟล์ Static และ รูปภาพ
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
