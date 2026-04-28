# Checklist สำหรับทดสอบระบบด้วยตัวเอง

ให้รันคำสั่งชุดนี้ก่อน:

```powershell
cd C:\xampp\htdocs\next-js-starter
npm run build
npm test -- --runInBand
npm run lint
npm run dev
```

จากนั้นเปิด `http://localhost:3000`

บัญชีสำหรับทดสอบ:

- `owner@starter.dev` / `password123` ใช้ทดสอบ login/logout และหน้า dashboard ทั่วไป
- `admin@acme.com` / `password123` ใช้ทดสอบหน้า tenant เช่น Team, Billing, API Keys

## 1. ระบบ Login / Logout

- [ ] เปิดหน้า `/login`
- [ ] Login ด้วย user จาก seed เช่น `owner@starter.dev` / `password123`
- [ ] ตรวจว่าระบบพาไปหน้า `/dashboard`
- [ ] กด refresh browser ที่หน้า `/dashboard` แล้วต้องยัง login อยู่
- [ ] กด logout แล้วต้องกลับไปหน้า `/login`
- [ ] หลัง logout ให้เปิด `/dashboard` อีกครั้ง ต้องถูกพากลับไป `/login`

--- ผลการทดสอบ login logout ---
กรอกuser password แล้วไม่พาไปหน้า /dashboard
ไปที่หน้า dasboard โดยตรงได้ปกติ
logout แล้ว
This page isn’t working
If the problem continues, contact the site owner.
HTTP ERROR 405

---

## 2. หน้า Development

- [ ] ตอนรันแบบ local development ให้เปิด `/dev/ui` แล้วต้องเข้าได้
- [ ] ตอนรันแบบ local development ให้เปิด `/dev/test-api` แล้วต้องเข้าได้
- [ ] ตอน `npm run build` ไม่ควรมี warning `STRIPE_SECRET_KEY is missing` โผล่แล้ว
- [ ] ตอนรันแบบ production หน้า `/dev/ui` และ `/dev/test-api` ควรเป็น not found

--- ผลการทดสอบ หน้า development ---
/dev/ui เข้าได้
/dev/test-api เข้าได้ แต่กด อะไรไม่ได้เลย
ไม่มี warning `STRIPE_SECRET_KEY is missing` โผล่แล้ว

---

## 3. Billing ตอนยังไม่ได้ตั้งค่า Stripe

- [ ] เปิดหน้า `/settings/billing`
- [ ] ลองกดปุ่ม upgrade plan
- [ ] ถ้ายังไม่ได้ตั้งค่า Stripe key ระบบควรแจ้ง error แบบควบคุมได้ ไม่ควร crash
- [ ] เมื่อต้องการทดสอบ Stripe จริง ให้ใส่ Stripe test keys และ price ids ใน `.env`
- [ ] ลอง checkout อีกครั้ง แล้วต้อง redirect ไปหน้า Stripe ได้
- [ ] หลังจ่ายเงินสำเร็จ webhook ควรอัปเดต plan ของ tenant ได้ถูกต้อง

-- ผลการทดสอบ billing --

/settings/billing เข้าได้แต่กด อะไรในหน้าไม่ได้เลย

---

## 4. Team Invite ตอนยังไม่ได้ตั้งค่า Resend

- [ ] เปิดหน้า `/settings/team`
- [ ] ลองเชิญ email ที่ถูกต้อง และเลือก role ที่ถูกต้อง
- [ ] ถ้า `RESEND_API_KEY` ยังว่าง ระบบควรสร้าง invitation ได้โดยไม่ crash
- [ ] เมื่อต้องการทดสอบส่งอีเมลจริง ให้ใส่ Resend test key
- [ ] ลองเชิญอีกครั้ง แล้วตรวจว่าอีเมลถูกส่งจริง

-- ผลการทดสอบ team invite --

/settings/team เข้าได้แต่เป็นหน้าขาว ไม่มีอะไรแสดงผล

---

## 5. API Keys

- [ ] เปิดหน้า `/settings/api-keys`
- [ ] สร้าง API key ใหม่
- [ ] ตรวจว่า full key แสดงให้เห็นแค่ครั้งแรกเท่านั้น
- [ ] Refresh หน้า แล้วควรเห็นเฉพาะรายการ key หรือ prefix ไม่ควรเห็น full key อีก
- [ ] Revoke key แล้วรายการควรหายไปหรือเปลี่ยนเป็น inactive

-- ผลการทดสอบ api keys --

/settings/api-keys เข้าได้แต่กด อะไรในหน้าไม่ได้เลย

---

## 6. Upload

- [ ] ลอง upload รูปภาพปกติ เช่น `.png` หรือ `.jpg`
- [ ] ลอง upload ไฟล์ `.svg` แล้วระบบควรปฏิเสธ
- [ ] ลอง upload ไฟล์ใหญ่เกิน limit แล้วระบบควรปฏิเสธ

ถ้าต้องการทดสอบ upload แบบตรง ๆ ให้เปิด `/dev/test-api` แล้วใช้ส่วน `Upload Test`

-- ผลการทดสอบ upload --
หน้า uiผิดปกติ ทดสอบไม่ได้

---

## 7. Environment สำหรับ Production

- [ ] ใช้ `.env.production.example` เป็นตัวอย่างสำหรับตั้งค่า production จริง
- [ ] ตั้งค่า `DATABASE_URL`
- [ ] ตั้งค่า `JWT_SECRET` ให้เป็น secret ที่ยาวและเดายาก
- [ ] ตั้งค่า `NEXT_PUBLIC_APP_URL`
- [ ] ตั้งค่า `NEXT_PUBLIC_ROOT_DOMAIN`
- [ ] ตั้งค่า Stripe keys ก่อนเปิดใช้ billing จริง
- [ ] ตั้งค่า Resend key ก่อนเปิดส่งอีเมลจริง

-- ผลการทดสอบ environment สำหรับ production --

ทดสอบแค่ local เท่านั้น
ยังไม่มี server จริง ยังไม่ได้ใช้งานจริงจัง project ยังพังอยู่

---
