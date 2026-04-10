import { can, canAll, canAny, hasRole } from '../../src/lib/permissions'
import type { TokenPayload } from '../../src/types'

describe('Permissions Utility Tests', () => {
  const admin_user: TokenPayload = {
    sub: 'user-1',
    name: 'Admin User',
    email: 'admin@test.com',
    roles: ['admin'],
    permissions: ['user.create', 'user.read', 'settings.*'],
  }

  const owner_user: TokenPayload = {
    sub: 'user-2',
    name: 'Owner User',
    email: 'owner@test.com',
    roles: ['owner'],
    permissions: ['*'],
  }

  const member_user: TokenPayload = {
    sub: 'user-3',
    name: 'Member User',
    email: 'member@test.com',
    roles: ['member'],
    permissions: ['dashboard.view'],
  }

  describe('can()', () => {
    it('ต้องคืนค่า true ถ้ามี permission ตรงตัว', () => {
      expect(can(admin_user, 'user.create')).toBe(true)
    })

    it('ต้องคืนค่า false ถ้าไม่มี permission', () => {
      expect(can(admin_user, 'user.delete')).toBe(false)
    })

    it('ต้องคืนค่า true ถ้าใช้ wildcard permission ระดับ module', () => {
      expect(can(admin_user, 'settings.update')).toBe(true)
      expect(can(admin_user, 'settings.delete')).toBe(true)
    })

    it('ต้องคืนค่า true สำหรับ Owner ที่มี permission เป็น *', () => {
      expect(can(owner_user, 'any_module.any_action')).toBe(true)
    })

    it('ต้องคืนค่า false ถ้าลืมส่งค่า user (null / undefined)', () => {
      expect(can(null, 'dashboard.view')).toBe(false)
      expect(can(undefined, 'dashboard.view')).toBe(false)
    })
  })

  describe('canAll()', () => {
    it('ต้องคืนค่า true ถ้าผู้ใช้มี permission ที่ต้องการทั้งหมด', () => {
      expect(canAll(admin_user, ['user.create', 'user.read'])).toBe(true)
    })

    it('ต้องคืนค่า false ถ้าผู้ใช้ขาด permission บางตัว', () => {
      expect(canAll(admin_user, ['user.create', 'user.delete'])).toBe(false)
    })
  })

  describe('canAny()', () => {
    it('ต้องคืนค่า true ถ้าผู้ใช้มี permission แค่ตัวใดตัวหนึ่งก็พอ', () => {
      expect(canAny(member_user, ['dashboard.view', 'user.create'])).toBe(true)
    })

    it('ต้องคืนค่า false ถ้าผู้ใช้ไม่มี permission ทุกตัว', () => {
      expect(canAny(member_user, ['user.read', 'user.delete'])).toBe(false)
    })
  })

  describe('hasRole()', () => {
    it('ต้องคืนค่า true ถ้าผู้ใช้มี role นี้จริงๆ', () => {
      expect(hasRole(admin_user, 'admin')).toBe(true)
    })

    it('ต้องคืนค่า false ถ้าผู้ใช้ไม่มี role นี้', () => {
      expect(hasRole(member_user, 'admin')).toBe(false)
    })
  })
})
