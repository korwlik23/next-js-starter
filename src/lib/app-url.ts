import { appConfig } from '@/config/app.config'

/**
 * สร้าง URL สำหรับ redirect ภายในแอป
 *
 * ใน production แอปรันใน container หลัง reverse proxy โดยฟังที่ 0.0.0.0:3000 —
 * `req.url` จึงเป็น host ภายใน (https://0.0.0.0:3000/...) ไม่ใช่โดเมนจริง
 * redirect ที่สร้างจาก `req.url` จะพาเบราว์เซอร์ไปที่ที่เปิดไม่ได้
 * จึงใช้ `NEXT_PUBLIC_APP_URL` (ค่าเดียวกับที่ OAuth callback ใช้) และไม่เชื่อ Host header
 *
 * นอก production ใช้ origin ของ request เพื่อให้เปิดผ่าน IP ในวง LAN แล้ว cookie ยังตามมา
 *
 * @param path path ภายในแอป ต้องขึ้นต้นด้วย `/` (และไม่ใช่ `//`) — ค่าอื่นถูกแทนด้วย `/`
 *             กัน open redirect ไปโดเมนภายนอก
 * @param request_url `req.url` ของ request ปัจจุบัน
 */
export function BuildAppRedirectUrl(path: string, request_url: string): URL {
  const safe_path = path.startsWith('/') && !path.startsWith('//') ? path : '/'
  const base = process.env.NODE_ENV === 'production' ? appConfig.url : request_url
  return new URL(safe_path, base)
}
