#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

// ─────────────────────────────────────────
// PRISMA MIGRATION BASELINE
// ─────────────────────────────────────────
// ฐานข้อมูลที่สร้างด้วย `prisma db push` จะมีตารางครบแต่ไม่มีประวัติใน
// _prisma_migrations ทำให้ `prisma migrate deploy` คิดว่ายังไม่เคยรัน migration ใด
// แล้วล้มเหลวเพราะตารางมีอยู่แล้ว
//
// สคริปต์นี้ทำ baseline: บอก Prisma ว่า migration ที่มีอยู่ถือว่าถูกใช้ไปแล้ว
// โดยไม่แตะ schema จริง ใช้กับฐานข้อมูลที่ schema ตรงกับ schema.prisma แล้วเท่านั้น
//
// ตรวจก่อนเสมอด้วย `npx prisma migrate status`

const MIGRATIONS_DIR = join(process.cwd(), 'prisma', 'migrations')

function listMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((entry) => statSync(join(MIGRATIONS_DIR, entry)).isDirectory())
    .sort()
}

function resolveAsApplied(migration) {
  // เรียก npx.cmd ตรง ๆ บน Windows แทนการใช้ shell:true
  // เพื่อไม่ให้อาร์กิวเมนต์ถูกต่อเป็นสตริงโดยไม่ escape
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'

  execFileSync(command, ['prisma', 'migrate', 'resolve', '--applied', migration], {
    stdio: 'inherit',
  })
}

const migrations = listMigrations()

if (migrations.length === 0) {
  console.error('ไม่พบ migration ใน prisma/migrations')
  process.exit(1)
}

console.log(`กำลัง baseline ${migrations.length} migration:`)

for (const migration of migrations) {
  console.log(`  - ${migration}`)
  try {
    resolveAsApplied(migration)
  } catch {
    // migration ที่ถูกบันทึกไว้แล้วจะ error ซึ่งไม่ใช่ปัญหา ข้ามไปตัวถัดไป
    console.log(`    (บันทึกไว้อยู่แล้ว ข้าม)`)
  }
}

console.log('\nเสร็จแล้ว ตรวจผลด้วย: npx prisma migrate status')
