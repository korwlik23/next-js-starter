# 🚀 Ultimate Next.js SaaS Starter (Enterprise Ready)

นี่คือฐานโปรเจกต์ (Core System Foundation) ที่ถูกออกแบบมารองรับการสร้างแอปพลิเคชันตั้งแต่ระดับพื้นฐานไปจนถึงระดับ Enterprise (SaaS) อย่างสมบูรณ์ มีระบบสิทธิ์ (RBAC), การจัดการหลายองค์กร (Multi-tenant), การยืนยันตัวตน, Theme, i18n, Rate Limiting, Testing ตลอดจนโครงสร้างรองรับ Payment และ Email ที่ถูกออกแบบตามมาตรฐานสากล

---

## 🛠️ โครงสร้างเทคโนโลยีหลัก (Tech Stack)

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript แบบ Strict Mode
- **Styling**: Tailwind CSS v4 + ระบบ Design System (UI Template)
- **Database ORM**: Prisma
- **Database Engine**: MySQL / PostgreSQL 
- **Authentication**: Custom JWT (Access + Refresh Token) & SSO (OAuth)
- **Authorization**: RBAC (Role-Based Access Control) & ABAC พร้อม Feature Gating
- **i18n**: ถอดคำแปลผ่าน Database หรือ Local fallback (next-intl)
- **State Management**: Zustand + React Query (Tanstack)
- **ID Generator**: ULID (เรียงลำดับได้ดีกว่า CUID/UUID)
- **Performance & Security**: Upstash Redis (Rate Limiting), Zod (Validation)
- **Testing**: Jest (Unit Test) + Playwright (E2E Test)
- **CI/CD & DevOps**: GitHub Actions + Docker Support

---

## 🌟 ฟีเจอร์เด่น (Key Features)

- **Multi-Tenant Architecture**: รองรับการทำ SaaS เต็มรูปแบบ แยกข้อมูลของแต่ละองค์กร (Tenant) ออกจากกันชัดเจน
- **Advanced Auth/Authorization**: ควบคุมสิทธิ์การใช้งานระดับลึก ไม่ว่าจะเป็น Role-based หรือ Field-level
- **Stripe Integration**: โครงสร้างรองรับระบบ Subscription, Webhook สำหรับการตัดบัตรและอัปเดตแพ็กเกจ
- **Email Service**: เชื่อมต่อผ่าน Resend/Nodemailer พร้อมเทมเพลตอีเมลสวยงาม
- **Testing Ready**: จัดเซตอัป Jest และ Playwright ให้คุณเขียนเทสต์อัปเดตระบบได้อย่างมั่นใจ
- **Enterprise-Grade Logging**: ระบบ Audit Log ติดตามทุกกิจกรรม (Activity) และระบบจัดการ Error Boundary อย่างเป็นระบบ
- **SEO & Performance**: วางโครงสร้าง sitemap.ts, robots.txt และใช้การ Caching ได้อย่างชาญฉลาด

---

## ⚠️ สิ่งที่คุณต้องทำต่อไป (Next Steps)

ระบบโครงสร้างนั้นถูกจัดเตรียมไว้อย่างสมบูรณ์เกือบ 100% แต่สิ่งเหล่านี้ **"ต้องการข้อมูลจริงของคุณ"** ก่อนใช้งานหรือนำขึ้น Production:

### 1. 🔥 เตรียม Environment Variables (`.env`)
คัดลอกไฟล์ `.env.example` เป็น `.env` และกรอกข้อมูลให้ครบถ้วน:

```bash
cp .env.example .env
```

คุณต้องหา Service ควบคู่มาใส่ในช่องว่างเช่น:
- **DATABASE_URL**: ฐานข้อมูลที่คุณใช้งาน (เช่น MySQL ใน XAMPP `mysql://root:@localhost:3306/nextjs_starter`)
- **JWT_SECRET**: สร้างด้วยคำสั่ง `openssl rand -base64 32`
- **RESEND_API_KEY**: จาก Resend สำหรับส่งอีเมล
- **STRIPE_SECRET_KEY** / Webhook Secret: สำหรับระบบ Payment ทางฝั่ง Stripe
- **UPSTASH_REDIS_REST_URL**: สำหรับการใช้ Redis ทำ Rate Limit เพื่อป้องกันสแปม (ถ้ามี)

### 2. 📧 ระบบ Email (Email Service)
ปัจจุบันระบบถูกตั้งโครงสำหรับ Resend/Nodemailer คุณสามารถเข้าไปดัดแปลงเทมเพลตและเปิดใช้งานการส่งอีเมลจริงได้ที่ `src/services/email.service.ts`

### 3. 💳 ระบบจ่ายเงิน (Stripe Subscription)
ไฟล์ Webhook เตรียมสแตนด์บายรับค่า `checkout.session.completed` ไว้แล้วที่ `src/app/api/billing/webhook/route.ts` เพียงปลด Comment โค้ดออกมาก็จะตัดรอบบิลได้ทันที

### 4. 🪪 ระบบ SSO (OAuth)
เพิ่ม Client ID และ Secret ของ Google/GitHub และเมื่อผู้ใช้งาน Sign-in ระบบจะจัดการเชื่อมโยงบัญชีในตาราง `User` อย่างอัตโนมัติ

### 5. 🛡️ ตรวจเช็กข้อมูลผู้ทำระบบ (Database Seeding)
เข้าไปดูที่ `prisma/seed.ts` เช็ก Email เบื้องต้นของ Admin (เช่น `owner@starter.dev` รหัสผ่าน `password123`) นี่คือ Owner ที่จะเข้าใช้ระบบทั้งหมด! สามารถเปลี่ยนข้อมูลได้ก่อน Seed ครับ

---

## 🚀 วิธีการใช้งาน (Getting Started)

1. **ติดตั้งโมดูลและ Dependencies ทั้งหมด**
   ```bash
   npm install
   ```

2. **จัดการฐานข้อมูลและโครงสร้าง Prisma**
   ```bash
   npm run db:generate
   npm run db:push
   ```

3. **กำหนดผู้ดูแลระบบเริ่มต้นและข้อมูลตั้งต้น**
   ```bash
   npm run db:seed
   ```

4. **เปิดเซิร์ฟเวอร์โหมด Development**
   ```bash
   npm run dev
   ```
   พุ่งทะยานสู่ [`http://localhost:3000`](http://localhost:3000) ถือเป็นอันเสร็จสิ้น!

---

## 🧪 การใช้งานระบบ Testing

เพื่อป้องกัน Bug ตอนแก้ไขระบบใหญ่ เราเซตอัปทูลไว้ให้แล้ว:
- **Unit Testing (Jest)**: ขับเคลื่อนตรรกะเบื้องหลัง
  ```bash
  npm run test
  ```
- **E2E Testing (Playwright)**: พฤติกรรมเสมือนใช้เบราว์เซอร์จริง
  ```bash
  npx playwright install # โหลด browser (เฉพาะครั้งแรก)
  npm run test:e2e
  ```

---

## 📦 Deployment & Containerization

โปรเจกต์นี้เปิดมาให้รันด้วย Docker ได้เลย ทำให้ง่ายเวลาขึ้น Server:
```bash
docker build -t nextjs-starter .
docker run -p 3000:3000 -d nextjs-starter
```
นอกจากนี้เรายังมีไฟล์ `.github/workflows/ci.yml` สำหรับการทำ CI/CD อัตโนมัติ (Linting & Testing) ทุกรูปบบที่ Push ขึ้น GitHub

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
📁 src/
 ├── 📁 app/          # Next.js App Router (Layout / Pages / API Routes)
 │    ├── 📁 (auth)/  # หน้า Authentication (Login / Register) แยก Layout
 │    ├── 📁 (main)/  # ลบส่วน Dashboard ทำงานผ่าน Middleware
 │    ├── 📁 api/     # Serverless APIs แบบแยก Directory
 ├── 📁 components/   # UI Library แยกหมวด (ui, form, layout, table, feedback)
 ├── 📁 hooks/        # Custom React Hooks
 ├── 📁 lib/          # แกนหลัก Core Utils (Auth, JWT, Prisma, Stripe, Rate Limit)
 ├── 📁 modules/      # Business Logic (User, Tenant, Auth) ใช้ Clean Architecture แยก Layer ชัดเจน
 ├── 📁 services/     # Third-party Services
 ├── 📁 i18n/         # ศูนย์กลางภาษา (next-intl)
 ├── 📁 store/        # ระบบจัดการแบบ Global (Zustand)
 ├── 📁 utils/        # Helpers และ Formatters ทั่วไป
```

> **"STARTER ชุดนี้ จะเป็นหัวใจและแกนกลางให้คุณลดเวลา Dev ประหยัดค่าแรงไปได้เป็นพันชั่วโมง!"**
