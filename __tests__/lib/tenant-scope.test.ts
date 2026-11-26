import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  applyTenantScope,
  TENANT_SCOPED_MODELS,
  TenantScopeViolationError,
} from '../../src/lib/tenant-scope'

const TENANT_A = 'tenant-a'
const TENANT_B = 'tenant-b'

describe('applyTenantScope()', () => {
  describe('เมื่อไม่ต้องบังคับ scope', () => {
    it('ไม่แตะ args เมื่อไม่มี tenantId (นอก request context เช่น seed/CLI)', () => {
      const args = { where: { email: 'a@test.com' } }

      expect(
        applyTenantScope({ model: 'User', operation: 'findMany', args, tenantId: null })
      ).toEqual(args)
    })

    it('ไม่แตะ args เมื่อ model ไม่มี tenantId', () => {
      const args = { where: { status: 'pending' } }

      expect(
        applyTenantScope({ model: 'WebhookEvent', operation: 'findMany', args, tenantId: TENANT_A })
      ).toEqual(args)
    })
  })

  describe('operation ที่กรองด้วย where', () => {
    it.each(['findFirst', 'findMany', 'count', 'aggregate', 'groupBy', 'updateMany', 'deleteMany'])(
      'ฉีด tenantId ลงใน where ของ %s',
      (operation) => {
        const scoped = applyTenantScope({
          model: 'User',
          operation,
          args: { where: { deletedAt: null } },
          tenantId: TENANT_A,
        }) as any

        expect(scoped.where).toEqual({ deletedAt: null, tenantId: TENANT_A })
      }
    )

    it('ฉีด tenantId ได้แม้ไม่มี where เดิม', () => {
      const scoped = applyTenantScope({
        model: 'AuditLog',
        operation: 'findMany',
        args: { take: 10 },
        tenantId: TENANT_A,
      }) as any

      expect(scoped.where).toEqual({ tenantId: TENANT_A })
      expect(scoped.take).toBe(10)
    })
  })

  describe('operation ที่ใช้ unique where (IDOR)', () => {
    it.each(['findUnique', 'findUniqueOrThrow', 'update', 'delete'])(
      'ผูก tenantId เข้ากับ unique where ของ %s',
      (operation) => {
        const scoped = applyTenantScope({
          model: 'User',
          operation,
          args: { where: { id: 'user-from-another-tenant' } },
          tenantId: TENANT_A,
        }) as any

        expect(scoped.where).toEqual({ id: 'user-from-another-tenant', tenantId: TENANT_A })
      }
    )
  })

  describe('operation ที่สร้างข้อมูล', () => {
    it('ประทับ tenantId ลงใน data ของ create', () => {
      const scoped = applyTenantScope({
        model: 'User',
        operation: 'create',
        args: { data: { email: 'new@test.com' } },
        tenantId: TENANT_A,
      }) as any

      expect(scoped.data).toEqual({ email: 'new@test.com', tenantId: TENANT_A })
    })

    it('ประทับ tenantId ลงทุกแถวของ createMany', () => {
      const scoped = applyTenantScope({
        model: 'User',
        operation: 'createMany',
        args: { data: [{ email: 'a@test.com' }, { email: 'b@test.com' }] },
        tenantId: TENANT_A,
      }) as any

      expect(scoped.data).toEqual([
        { email: 'a@test.com', tenantId: TENANT_A },
        { email: 'b@test.com', tenantId: TENANT_A },
      ])
    })

    it('ผูกทั้ง where และ create ของ upsert', () => {
      const scoped = applyTenantScope({
        model: 'User',
        operation: 'upsert',
        args: { where: { id: 'user-1' }, create: { email: 'a@test.com' }, update: {} },
        tenantId: TENANT_A,
      }) as any

      expect(scoped.where).toEqual({ id: 'user-1', tenantId: TENANT_A })
      expect(scoped.create).toEqual({ email: 'a@test.com', tenantId: TENANT_A })
    })
  })

  describe('ปฏิเสธการข้าม tenant อย่างชัดเจน', () => {
    it('throw เมื่อ where ระบุ tenant อื่น', () => {
      expect(() =>
        applyTenantScope({
          model: 'User',
          operation: 'findMany',
          args: { where: { tenantId: TENANT_B } },
          tenantId: TENANT_A,
        })
      ).toThrow(TenantScopeViolationError)
    })

    it('throw เมื่อพยายาม create ให้ tenant อื่น', () => {
      expect(() =>
        applyTenantScope({
          model: 'User',
          operation: 'create',
          args: { data: { email: 'a@test.com', tenantId: TENANT_B } },
          tenantId: TENANT_A,
        })
      ).toThrow(TenantScopeViolationError)
    })

    it('throw เมื่อแถวใดแถวหนึ่งใน createMany ชี้ไป tenant อื่น', () => {
      expect(() =>
        applyTenantScope({
          model: 'User',
          operation: 'createMany',
          args: { data: [{ email: 'a@test.com' }, { email: 'b@test.com', tenantId: TENANT_B }] },
          tenantId: TENANT_A,
        })
      ).toThrow(TenantScopeViolationError)
    })

    it('ยอมให้ระบุ tenantId ซ้ำได้ถ้าตรงกับ context', () => {
      expect(() =>
        applyTenantScope({
          model: 'User',
          operation: 'findMany',
          args: { where: { tenantId: TENANT_A } },
          tenantId: TENANT_A,
        })
      ).not.toThrow()
    })
  })

  describe('ไม่กลายพันธุ์ args เดิม', () => {
    it('คืน object ใหม่โดยไม่แก้ args ที่ caller ส่งมา', () => {
      const args = { where: { deletedAt: null } }
      applyTenantScope({ model: 'User', operation: 'findMany', args, tenantId: TENANT_A })

      expect(args).toEqual({ where: { deletedAt: null } })
    })
  })
})

describe('TENANT_SCOPED_MODELS', () => {
  it('ตรงกับ model ที่มีฟิลด์ tenantId ใน schema.prisma จริง', () => {
    const schema = readFileSync(join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8')

    const modelsInSchema = new Set<string>()
    let currentModel: string | null = null

    for (const line of schema.split(/\r?\n/)) {
      const modelMatch = /^model\s+(\w+)\s*\{/.exec(line)
      if (modelMatch) {
        currentModel = modelMatch[1]
        continue
      }
      if (line.startsWith('}')) {
        currentModel = null
        continue
      }
      if (currentModel && /^\s+tenantId\s/.test(line)) {
        modelsInSchema.add(currentModel)
      }
    }

    expect([...TENANT_SCOPED_MODELS].sort()).toEqual([...modelsInSchema].sort())
  })
})
