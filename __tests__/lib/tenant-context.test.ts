import {
  getEnforcedTenantId,
  getTenantContext,
  runUnscoped,
  runWithTenantContext,
} from '../../src/lib/tenant-context'

describe('tenant context', () => {
  it('ไม่บังคับ scope เมื่ออยู่นอกบริบท (seed / CLI / login lookup)', () => {
    expect(getTenantContext()).toBeUndefined()
    expect(getEnforcedTenantId()).toBeNull()
  })

  it('บังคับ tenantId ภายในบริบท', () => {
    runWithTenantContext({ tenantId: 'tenant-a', userId: 'user-1' }, () => {
      expect(getEnforcedTenantId()).toBe('tenant-a')
      expect(getTenantContext()?.userId).toBe('user-1')
    })
  })

  it('บริบทไม่รั่วออกนอกบล็อก', () => {
    runWithTenantContext({ tenantId: 'tenant-a', userId: 'user-1' }, () => undefined)

    expect(getEnforcedTenantId()).toBeNull()
  })

  it('บริบทคงอยู่ข้าม async boundary', async () => {
    await runWithTenantContext({ tenantId: 'tenant-a', userId: 'user-1' }, async () => {
      await new Promise((resolve) => setTimeout(resolve, 5))

      expect(getEnforcedTenantId()).toBe('tenant-a')
    })
  })

  it('บริบทซ้อนกันไม่ปนกัน', () => {
    runWithTenantContext({ tenantId: 'tenant-a', userId: 'user-1' }, () => {
      runWithTenantContext({ tenantId: 'tenant-b', userId: 'user-2' }, () => {
        expect(getEnforcedTenantId()).toBe('tenant-b')
      })

      expect(getEnforcedTenantId()).toBe('tenant-a')
    })
  })

  describe('runUnscoped()', () => {
    it('ข้าม scope อย่างจงใจและคืนค่าเดิมหลังออกจากบล็อก', () => {
      runWithTenantContext({ tenantId: 'tenant-a', userId: 'user-1' }, () => {
        runUnscoped('platform ops dashboard', () => {
          expect(getEnforcedTenantId()).toBeNull()
          expect(getTenantContext()?.unscoped).toBe(true)
          expect(getTenantContext()?.unscopedReason).toBe('platform ops dashboard')
        })

        expect(getEnforcedTenantId()).toBe('tenant-a')
      })
    })

    it('ยังเก็บ userId ไว้เพื่อการ audit', () => {
      runWithTenantContext({ tenantId: 'tenant-a', userId: 'user-1' }, () => {
        runUnscoped('reconciliation job', () => {
          expect(getTenantContext()?.userId).toBe('user-1')
        })
      })
    })

    it('บังคับให้ระบุเหตุผล เพื่อให้ code review เห็นว่าเป็นความตั้งใจ', () => {
      expect(() => runUnscoped('', () => undefined)).toThrow()
      expect(() => runUnscoped('   ', () => undefined)).toThrow()
    })
  })
})
