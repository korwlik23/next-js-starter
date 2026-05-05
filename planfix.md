# แผนการแก้ไขโปรเจกต์ให้ตรงตามสเปค (Spec Compliance Plan)

แผนนี้ออกแบบมาเพื่อแก้ไขจุดบกพร่องที่พบจากการตรวจสอบ โดยแบ่งออกเป็นระยะ (Phases) เพื่อความปลอดภัยและเป็นระเบียบ ตามแนวทางใน `FIX PROJECT.md`

## 🚩 สิ่งที่ต้องแก้ไขเร่งด่วน (User Review Required)

> [!IMPORTANT]
> **การขาด Middleware**: ปัจจุบันระบบไม่มี `middleware.ts` ทำให้หน้า Dashboard และ API ไม่มีการป้องกันในระดับ Edge ซึ่งเป็นความเสี่ยงระดับวิกฤต (P0)

> [!WARNING]
> **Naming Convention**: ต้องมีการ Refactor ชื่อตัวแปรและ Props จำนวนมากเพื่อให้เป็น `snake_case` ตามกฎ `user_global` ซึ่งอาจกระทบต่อ Codebase หลายส่วน

---

## 📅 ระยะที่ 1: ความปลอดภัยและโครงสร้างพื้นฐาน (Security & Foundation)

**เป้าหมาย:** ปิดช่องโหว่ P0 และจัดระเบียบ Config ให้ตรงตามสเปค

### 1.1 สร้างระบบ Middleware

- **ไฟล์:** [NEW] `src/middleware.ts`
- **หน้าที่:**
  - ตรวจสอบ JWT จาก Cookie สำหรับเส้นทาง `/dashboard`, `/admin`, `/api/v1` (ยกเว้น public routes)
  - จัดการ Locale Detection และ Redirect ร่วมกับ `next-intl`
  - ป้องกันการเข้าถึง API โดยไม่มี Token

### 1.2 แยกไฟล์ Configuration

- **ไฟล์:**
  - [NEW] `src/config/app.config.ts`
  - [NEW] `src/config/auth.config.ts`
  - [NEW] `src/config/billing.config.ts`
  - [NEW] `src/config/feature-flags.config.ts`
  - [NEW] `src/config/seo.config.ts`
  - [MODIFY] `src/config/index.ts` (เหลือแค่การ Export รวม)
- **หน้าที่:** จัดกลุ่ม Config ให้เป็นสัดส่วนตามที่สเปคระบุไว้ในส่วน 23.1

### 1.3 เปิดใช้งาน Multi-tenant

- **ไฟล์:** `src/config/feature-flags.config.ts`
- **หน้าที่:** ตั้งค่า `multiTenant: true` และตรวจสอบผลกระทบใน UI

---

## 📅 ระยะที่ 2: มาตรฐานการเขียนโค้ด (Coding Standards Alignment)

**เป้าหมาย:** ปรับปรุงชื่อเรียกและรูปแบบโค้ดให้ตรงตาม `user_global`

### 2.1 Refactor UI Components

- **ไฟล์:** ทุกไฟล์ใน `src/components/ui/*` (เช่น `Button.tsx`, `Input.tsx`)
- **การเปลี่ยนแปลง:**
  - เปลี่ยน Props จาก `camelCase` เป็น `snake_case` (เช่น `isLoading` -> `is_loading`)
  - ใช้ `PascalCase` สำหรับ Function และ Component Name

### 2.2 Refactor Services & Repositories

- **ไฟล์:** ทุกไฟล์ใน `src/modules/*/service.ts` และ `repository.ts`
- **การเปลี่ยนแปลง:**
  - เปลี่ยนชื่อฟังก์ชันเป็น `PascalCase`
  - เปลี่ยนตัวแปรภายในและพารามิเตอร์เป็น `snake_case`

---

## 📅 ระยะที่ 3: ฟีเจอร์หลักของ SaaS (Core SaaS Features)

**เป้าหมาย:** เพิ่มฟีเจอร์ที่ยังขาดหายไปเพื่อให้พร้อมสำหรับ Enterprise

### 3.1 ระบบ Impersonation (การปลอมตัวเป็นผู้ใช้)

- **ไฟล์:**
  - [NEW] `src/modules/auth/impersonation.service.ts`
  - [NEW] `src/app/api/v1/admin/impersonate/route.ts`
  - [NEW] `src/components/layout/ImpersonationBanner.tsx`
- **หน้าที่:** ให้ Super Admin สามารถสลับไปใช้งานในนามผู้ใช้อื่นได้ พร้อมบันทึก Audit Log

### 3.2 ระบบ Background Jobs & Queue

- **ไฟล์:**
  - [NEW] `src/lib/queue.ts`
  - [NEW] `src/modules/jobs/*`
- **หน้าที่:** ติดตั้ง Inngest หรือ BullMQ สำหรับงานที่ต้องทำเบื้องหลัง (เช่น ส่งอีเมล, คำนวณ Usage)

---

## 📅 ระยะที่ 4: ประสบการณ์นักพัฒนา (Developer Experience)

**เป้าหมาย:** เพิ่มเครื่องมือช่วยในการพัฒนาตามที่สเปคระบุ

### 4.1 เพิ่ม Dev Pages

- **ไฟล์:**
  - [NEW] `src/app/dev/permissions/page.tsx` (แสดง Permission Matrix)
  - [NEW] `src/app/dev/theme/page.tsx` (แสดง Design Tokens & Colors)

### 4.2 CRUD Templates

- **ไฟล์:** `src/app/(main)/[module]/*`
- **หน้าที่:** สร้าง Template มาตรฐานสำหรับ List/Create/Edit ที่สมบูรณ์แบบเพื่อใช้เป็นต้นแบบ

---

## 📅 ระยะที่ 5: การทดสอบและความสมบูรณ์ (Testing & Hardening)

**เป้าหมาย:** สร้างความมั่นใจว่าระบบทำงานได้ถูกต้องและปลอดภัย

### 5.1 Unit Tests

- เขียน Test สำหรับ `AuthService`, `PermissionLogic`, และ `TenantIsolation`

### 5.2 E2E Tests

- ทดสอบ Flow สำคัญ: Login -> Create Tenant -> Invite Member -> Checkout (Stripe)

---

## 🛠 แผนการตรวจสอบ (Verification Plan)

### การทดสอบอัตโนมัติ (Automated Tests)

- `npm run lint`: ตรวจสอบรูปแบบโค้ด
- `npm run build`: ตรวจสอบว่าบิลด์ผ่านไม่มี Type error
- `npm run test`: รัน Unit test ทั้งหมด

### การตรวจสอบด้วยตนเอง (Manual Verification)

- ลองเข้าหน้า `/dashboard` โดยไม่ Login (ต้องถูก Redirect ไปที่ `/login`)
- ตรวจสอบว่า Metadata และ SEO แสดงผลถูกต้องในหน้า Public
- ตรวจสอบ Dark/Light Mode ในทุกหน้าจอใหม่
