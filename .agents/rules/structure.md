---
trigger: always_on
---

# Structure Rules (Next.js)

## Structure Before Code — ห้ามเกิด God Module

- ก่อนเขียนโค้ด feature ใหม่ ให้ระบุ **file layout** ก่อนเสมอ: pages / components /
  module (services, actions, types) ที่จะสร้าง (1 ไฟล์ = 1 หน้าที่)
- **1 route = 1 `page.tsx`** และ page ทำหน้าที่แค่ประกอบ (compose) — logic และ UI ย่อย
  อยู่ใน components/hooks ของ module นั้น ห้ามเขียนทั้ง feature ในไฟล์ page เดียว
- **feature ใหม่ = module ใหม่ใน `src/modules/<context>/`** ตาม bounded context
  (แบบเดียวกับ auth / billing / tenant / user ที่มีอยู่) — ห้ามยัด logic หลาย context
  ลง module เดียว และห้ามสร้าง `src/modules/<product>` ก้อนเดียวสำหรับทั้ง product
- **เพดานไฟล์: ~300 บรรทัดสำหรับ .tsx / ~500 บรรทัดสำหรับ .ts** — ไฟล์ที่ถึงเพดาน
  ต้อง split ก่อนเพิ่มของใหม่ ห้ามสร้างไฟล์ใหม่ที่เกินเพดานตั้งแต่เกิด
- ห้ามใช้ component/shell เดียว render ทุก screen โดยสลับ props/label
- **แก้ของเดิม = แก้ที่เดิม** — ห้ามสร้าง page/module ใหม่มา wrap ของที่พัง
  ถ้าไฟล์เดิมใหญ่เกินกว่าจะแก้ปลอดภัย ให้หยุดแล้วเสนอแผน split ก่อน

## Balance — ห้ามกระจายมั่วเช่นกัน

- เพดานคือ "ห้ามเกิน" ไม่ใช่เป้าหมาย — component 250 บรรทัดที่ทำเรื่องเดียว = ถูกต้อง
- ห้าม 1 function = 1 ไฟล์ / ห้ามสร้าง abstraction ที่ยังไม่มีผู้ใช้งานจริงตัวที่สอง
- component ที่ใช้ที่เดียวให้อยู่ใกล้ผู้ใช้ (colocate ใน module) — ย้ายเข้า
  `src/components/` กลางเมื่อมีผู้ใช้ตัวที่สองแล้วเท่านั้น
- แตกไฟล์ตาม "ความรับผิดชอบ" ไม่ใช่ตาม "จำนวนไฟล์"
