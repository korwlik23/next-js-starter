/**
 * ดึงข้อมูล Metadata จาก Request เพื่อใช้ในการบันทึก Audit Log
 */
export function getRequestMetadata(req: Request) {
  const headers = req.headers

  // พยายามดึง IP จาก Header ต่างๆ (รองรับ Cloudflare, Proxy, ฯลฯ)
  const ipAddress =
    headers.get('x-forwarded-for')?.split(',')[0] || headers.get('x-real-ip') || 'unknown'

  const userAgent = headers.get('user-agent') || 'unknown'

  return {
    ipAddress,
    userAgent,
  }
}
