import type { Metadata } from 'next'

// ────────────────────────────────────────
// API Keys Management Page
// สร้าง, ดู, และ revoke API keys
// ────────────────────────────────────────

export const metadata: Metadata = {
  title: 'API Keys',
}

export default function ApiKeysPage() {
  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
            API Keys
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            จัดการ API Keys สำหรับเข้าถึงระบบจากภายนอก
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-opacity hover:opacity-90"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
          }}
        >
          <span className="material-symbols-outlined text-base">add</span>
          สร้าง API Key
        </button>
      </div>

      {/* Warning Banner */}
      <div
        className="flex items-start gap-3 p-4 rounded-lg mb-8"
        style={{
          backgroundColor: 'rgba(230, 126, 34, 0.08)',
          border: '1px solid rgba(230, 126, 34, 0.2)',
        }}
      >
        <span className="material-symbols-outlined text-lg mt-0.5" style={{ color: 'var(--color-warning, #e67e22)' }}>
          warning
        </span>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            ข้อควรระวัง
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            API Key จะแสดงเพียงครั้งเดียวเมื่อสร้าง กรุณาเก็บรักษาให้ดี
            หากสูญหายจะต้องสร้างใหม่
          </p>
        </div>
      </div>

      {/* API Keys Table */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-mid)' }}>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>ชื่อ</th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Key (Prefix)</th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>สถานะ</th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>ใช้งานล่าสุด</th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>สร้างเมื่อ</th>
              <th className="text-left p-4 font-semibold" style={{ color: 'var(--color-text-muted)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Demo row */}
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td className="p-4 font-medium" style={{ color: 'var(--color-text)' }}>
                Production Key
              </td>
              <td className="p-4 font-mono text-xs" style={{ color: 'var(--color-text-faint)' }}>
                nsk_a1b2c3d4...
              </td>
              <td className="p-4">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(39, 174, 96, 0.1)', color: 'var(--color-success, #27ae60)' }}
                >
                  Active
                </span>
              </td>
              <td className="p-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                2 ชั่วโมงที่แล้ว
              </td>
              <td className="p-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                9 เม.ย. 2569
              </td>
              <td className="p-4">
                <button
                  className="text-xs font-medium px-3 py-1 rounded transition-opacity hover:opacity-70"
                  style={{
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    color: 'var(--color-error, #e74c3c)',
                  }}
                >
                  Revoke
                </button>
              </td>
            </tr>

            {/* Empty state */}
            <tr>
              <td colSpan={6} className="text-center p-8" style={{ color: 'var(--color-text-faint)' }}>
                ยังไม่มี API Key — สร้างหนึ่งรายการเพื่อเริ่มต้น
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Usage guide */}
      <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'var(--color-surface-mid)', border: '1px solid var(--color-border)' }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
          วิธีใช้งาน API Key
        </h3>
        <pre
          className="text-xs p-4 rounded overflow-x-auto font-mono"
          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
        >{`curl -H "Authorization: Bearer nsk_your_api_key_here" \\
     ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/your-endpoint`}</pre>
      </div>
    </div>
  )
}
