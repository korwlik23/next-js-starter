# 🚀 Ultimate Next.js SaaS Starter

นี่คือฐานโปรเจกต์ (Core System Foundation) ที่ถูกออกแบบมารองรับการสร้างแอปพลิเคชันตั้งแต่ระดับพื้นฐานไปจนถึงระดับ Enterprise (SaaS) มีระบบสิทธิ์ (RBAC), การจัดการหลายองค์กร (Multi-tenant), การยืนยันตัวตน, Theme, i18n, ตลอดจนโครงสร้างรองรับ Payment และ Email ที่ถูกออกแบบอย่างมีมาตรฐานสากล

---

## 🛠️ โครงสร้างเทคโนโลยีหลัก (Tech Stack)

- **Framework**: Next.js 15 (App Router) + React 19
- **Language**: TypeScript แบบ Strict Mode
- **Styling**: Tailwind CSS + หางแนว Custom CSS Variables
- **Database ORM**: Prisma
- **Database Engine**: MySQL / PostgreSQL 
- **Authentication**: Custom JWT (Access + Refresh Token) & RBAC Guard
- **i18n**: `next-intl`
- **State Management**: Zustand + React Query (Tanstack)
- **ID Generator**: ULID (เรียงลำดับได้ แก้ปัญหา CUID ที่มีขนาดใหญ่และอ่านยาก)
- **Code Quality**: Prettier (กำหนดค่ามาตรฐาน: ไม่ใช้ Semicolon, Single Quotes)

---

## ⚠️ สิ่งที่คุณต้องทำต่อไป (Next Steps)

ระบบโครงสร้างนั้นสมบูรณ์กว่า 90% แต่ระบบเหล่านี้ **"ต้องการข้อมูลจริงของคุณ"** ก่อนนำขึ้น Production เพื่อให้ครบ 100%:

### 1. 🔥 เตรียม Environment Variables (`.env`)
คุณต้องหา Service ควบคู่มาใส่ในช่องว่างเหล่านี้:

```env
# ฐานข้อมูล (สำคัญมาก)
DATABASE_URL="mysql://root:@localhost:3306/nextjs_starter"

# Secret Key (สำหรับเซ็น JWT - สร้างได้จากคำสั่ง `openssl rand -base64 32`)
JWT_SECRET="YOUR_SUPER_SECRET_KEY_HERE"

# URL ของระบบ (ใช้ใน Email Link / Webhook)
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# --- SaaS & Enterprise Integrations ---

# 1. ระบบอีเมล (แนะนำ Resend หรือ Nodemailer)
RESEND_API_KEY="re_123456789"  

# 2. ระบบจ่ายเงิน Stripe
STRIPE_SECRET_KEY="sk_test_123456789"
STRIPE_WEBHOOK_SECRET="whsec_123456789"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_123456789"

# 3. SSO (Single Sign-On ถ้าคุณต้องการ Google/Github Auth)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

---

### 2. 📧 ระบบ Email (Email Service)
- **เปิดไฟล์:** `src/lib/email.ts`
- **สิ่งที่คุณต้องทำ:** ปัจจุบันผมเขียนเป็น *Placeholder (console.log)* เอาไว้ คุณต้องไปสมัคร [Resend](https://resend.com/) หรือ [SendGrid](https://sendgrid.com/) จากนั้น:
  1. `npm install resend`
  2. เอา Comment ในฟังก์ชัน `SendEmail` ออก และนำไลบรารีจริงมาเสียบทำงานแทนที่
  3. ผูกกับ `SendInviteEmail` และ `SendPasswordResetEmail` ได้ทันที

---

### 3. 💳 ระบบจ่ายเงิน (Stripe Subscription)
- **เปิดไฟล์:** `src/lib/stripe.ts` และ `src/app/api/billing/webhook/route.ts`
- **สิ่งที่คุณต้องทำ:**
  1. `npm install stripe`
  2. สมัครใช้งาน Stripe เอา Secret Key มาใส่ให้พร้อม
  3. ในไฟล์ Webhook ระบบเตรียมดักจับ `checkout.session.completed` ไว้แล้ว เพียงแค่ปลด Comment เพื่อใช้ SDK ตรวจหาหน้าการทำรายการจ่ายเงิน และตัดแผนให้ผู้ใช้งานใน DB รัฐ

---

### 4. 🪪 ระบบ SSO (OAuth)
- **เปิดไฟล์:** `src/app/api/auth/[provider]/route.ts`
- **สิ่งที่คุณต้องทำ:**
  - สร้าง Application ใน Google Cloud Console หรือ GitHub Developer
  - เขียน Logic ให้แลก Token กลับมา นำอีเมลมาเช็คใน Database ถ้ายังไม่มีก็บันทึกเข้าตาราง `User` และ `Account` ถ้ามีแล้วก็เข้าผ่านฟังก์ชัน Login เดิมได้เลย

---

### 5. 🛡️ ตรวจเช็คข้อมูลเริ่มต้น (Database Seeding)
- **เปิดไฟล์:** `prisma/seed.ts`
- **สิ่งที่คุณต้องทำ:** เช็ก Email ของ Admin `owner@starter.dev` (รหัสผ่าน: `password123`) นี่คือ Owner ที่จะเข้าใช้ระบบทั้งหมด! สามารถเปลี่ยนข้อมูลได้ตามความเหมาะสม

---

## 🚀 วิธีการใช้งานและการติดเครื่อง (Getting Started)

1. **ติดตั้งโมดูลทั้งหมด**
   ```bash
   npm install
   ```
2. **จัดการฐานข้อมูลและโครงสร้าง Prisma**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
3. **กำหนดผู้ดูแลระบบเริ่มต้น**
   ```bash
   npx prisma db seed
   ```
4. **เปิดเซิฟเวอร์โหมด Development**
   ```bash
   npm run dev
   ```

พุ่งทะยานสู่ `http://localhost:3000` !

---

## 📁 โครงสร้างโปรเจกต์แบบย่อ

```text
📁 src/
 ├── 📁 app/          # Next.js App Router (หน้า Layout / Pages / APIs)
 │    ├── 📁 (auth)/  # หน้า Login / Register / Forgot Password
 │    ├── 📁 (main)/  # หน้า Dashboard / Settings (มีการเช็ค Login ผ่าน Middleware)
 │    ├── 📁 api/     # API Route (หลังบ้านแบบ Serverless)
 ├── 📁 components/   # UI System แยกเป็น (ui, form, layout, table, feedback)
 ├── 📁 hooks/        # Custom Hooks
 ├── 📁 lib/          # Utilities Library แกนหลัก (auth, jwt, prisma, logger, stripe)
 ├── 📁 modules/      # Business Logic (User, Tenant, Auth) — แยก Controller กะ Service ชัดเจน
 ├── 📁 i18n/         # กฎของ Next-intl สำหรับภาษา (EN/TH)
 ├── 📁 store/        # Zustand State Management (authStore, uiStore)
 ├── 📁 utils/        # ตัวช่วยจิปาถะ (api utils, date format)
```

## 🧠 คำแนะนำสุดท้าย

> **"STARTER ชุดนี้ จะเป็นแกนกลางระบบของตลอดช่วงอายุโปรเจกต์ของคุณ!"**

กรุณาศึกษาเนื้อหาไฟล์ `src/lib/` และ `src/modules/` เป็นหลัก เพราะมันบรรจุ Architecture แบบแยก Services ออกจาก Routing ทำให้คุณสามารถเปลี่ยน Framework หรือทำ Testing (Unit Test) ได้อย่างง่ายดายในอนาคต!
