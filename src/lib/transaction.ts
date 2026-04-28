import prisma from '@/lib/prisma'

/**
 * ────────────────────────────────────────
 * Transaction & Concurrency Control (Senior Level)
 * ────────────────────────────────────────
 * Prisma ขาดคำสั่ง `lockForUpdate()` ในตัว ORM แบบตรงๆ
 * เราจึงสร้าง Wrapper นี้ทำงานในรูปแบบ Pessimistic Locking
 * เพื่อป้องกันปัญหา Race Condition เช่น การตัดเงิน/เครดิตพร้อมกัน
 */
export class TransactionService {
  /**
   * ดำเนินการ Transaction พร้อมกับ Lock แถวของข้อมูลที่เกี่ยวข้อง (Pessimistic Lock)
   * ทำให้ Request อื่นที่แตะข้อมูลแถวนี้ ต้องรอจนกว่า Transaction นี้จะเสร็จสิ้น
   *
   * @param tableName ชื่อตารางในฐานข้อมูล (ตัวพิมพ์เล็ก เช่น 'users')
   * @param id รหัสอ้างอิงข้อมูล (PK) เพื่อทำ SELECT FOR UPDATE
   * @param execute Callback function โดยส่ง Context ของ Transaction (tx) ไปใช้แทน prisma หลัก
   */
  static async ExecuteWithLock<T>(
    tableName: string,
    id: string,
    execute: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(
      async (tx) => {
        // 1. Lock Query: รอจนกว่าจะได้สิทธิ์ หรือ Timeout
        // ต้องระวังชื่อตารางให้ถูกต้องกับในฐานข้อมูล
        await tx.$executeRawUnsafe(`SELECT * FROM ${tableName} WHERE id = ? FOR UPDATE`, id)

        // 2. รัน Business Logic อย่างปลอดภัย
        return execute(tx)
      },
      {
        isolationLevel: 'ReadCommitted', // ป้องกัน Dirty Reads ใน MySQL
        maxWait: 5000, // รอ Lock 5 วิ
        timeout: 10000, // ยกเลิกถ้าทำงานเกิน 10 วิ
      }
    )
  }

  /**
   * ดำเนินการ Transaction ธรรมดา
   * แบบมีการกำหนด Isolation Level สูงสุด เพื่อความเสถียร
   */
  static async ExecuteSerializable<T>(
    execute: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(execute, {
      isolationLevel: 'Serializable', // ป้องกันทั้ง Dirty / Non-repeatable / Phantom reads
      maxWait: 5000,
      timeout: 10000,
    })
  }
}
