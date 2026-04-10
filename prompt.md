การออกแบบ Starter Template ให้รองรับ **Multiple Roles (ระบบหลายสิทธิ์)** เป็นการตัดสินใจที่ถูกต้องมากครับ เพราะในสเกลการทำงานจริง ระบบ Back-office มักจะต้องมีสิทธิ์ที่ซับซ้อนกว่าแค่ Admin กับ User ทั่วไป (เช่น ตัวอย่างการแบ่งสิทธิ์ในทีมที่มีทั้งคนที่แค่เข้ามาดูรีพอร์ต, คนที่จัดการ License Keys หรือปลดล็อก HWID ให้ลูกค้า ไปจนถึง Super Admin ที่จัดการทุกอย่าง)

หากโปรเจคนี้จะเป็น Base สำหรับงานต่อๆ ไป สิ่งที่คุณต้อง "สร้างรอไว้" ใน Starter Template จะต้องอัปเกรดจากเดิมขึ้นมาดังนี้ครับ:

---

### 1. ระบบจัดการสิทธิ์ (Role-Based Access Control - RBAC)

นี่คือแกนหลักที่ต้องแข็งแรงที่สุดใน Starter ตัวนี้ครับ:

- **Role & Permission Types:** กำหนด Type ของสิทธิ์ให้ชัดเจนในโฟลเดอร์ `types/` เช่น `type Role = 'superadmin' | 'manager' | 'viewer';`
- **Permission Mapping Config:** สร้างไฟล์คอนฟิก (เช่น `src/lib/permissions.ts`) เพื่อแมปว่า Role ไหนเข้าถึงหน้าไหนได้บ้าง หรือทำอะไรได้บ้าง
- **Auth Context / Global Store:** ตัวแปร Global (เช่นใช้ Zustand หรือ React Context) ที่เก็บข้อมูล Profile ของ User ปัจจุบันพร้อมกับ Role ของเขา เพื่อให้ทุก Component ดึงไปเช็คสิทธิ์ได้ทันที

### 2. Dynamic Layout & Navigation (เมนูที่เปลี่ยนตามสิทธิ์)

UI ต้องปรับเปลี่ยนตาม Role ของคนที่ล็อกอินเข้ามา:

- **Role-Aware Sidebar:** เมนู Sidebar ต้องไม่ฮาร์ดโค้ด แต่ควรเรนเดอร์จาก Array of Objects ที่มีการเช็คสิทธิ์ เช่น ถ้า Role เป็นแค่ Viewer เมนูหน้า "ตั้งค่าระบบ" จะไม่แสดงขึ้นมาเลย
- **Redirect Logic สำหรับ Default Route:** เมื่อล็อกอินสำเร็จ ควรมีฟังก์ชันเช็คว่า Role นี้ควรถูกเตะไปหน้าไหนเป็นหน้าแรก (Dashboard ของ Manager กับ Dashboard ของ Viewer อาจจะเป็นคนละหน้ากัน)

### 3. Route Protection (ป้องกันการเข้าถึงผิดสิทธิ์)

ต้องดักการเข้าถึงหน้าเว็บใน 2 ระดับ:

- **Middleware (Server-side):** ตัว `middleware.ts` ต้องฉลาดพอที่จะอ่าน Token, ดึง Role ออกมา และเช็คกับ Path ที่กำลังจะเข้าว่ามีสิทธิ์ไหม ถ้าไม่มีให้ Redirect ไปหน้า `403 Forbidden` หรือหน้า Dashboard ปกติ
- **Client-Side Wrapper:** สร้าง Component พิเศษ เช่น `<Protected role="manager"> ... </Protected>` เอาไว้ครอบเนื้อหาหรือโค้ดทั้งหน้า เพื่อป้องกันจังหวะที่ Middleware อาจจะทำงานไม่ครอบคลุม

### 4. Granular UI Components (การซ่อน/แสดงระดับปุ่ม)

การจัดการสิทธิ์ไม่ได้มีแค่ระดับ "หน้าเว็บ" แต่รวมถึงระดับ "Action" ด้วย:

- **Component `CanAccess` หรือ `PermissionGuard`:** สร้าง Wrapper Component เล็กๆ ไว้ครอบปุ่มต่างๆ เช่น ปุ่ม "ลบข้อมูล" หรือ "แก้ไข" จะถูกเรนเดอร์ออกมาก็ต่อเมื่อ User คนนั้นมี Role ที่ทำได้เท่านั้น
- **Data Table Actions ที่ยืดหยุ่น:** ตัว Component ตารางของคุณ ต้องสามารถรับ Props เพื่อเปิด/ปิด คอลัมน์ Action (Edit/Delete) ตามสิทธิ์ของคนดูได้

### 5. API Client & Error Handling ที่ครอบคลุมขึ้น

ตัว Axios หรือ Fetch Wrapper ต้องรองรับ Status Code ที่เกี่ยวกับสิทธิ์:

- **ดักจับ 403 (Forbidden):** นอกเหนือจาก 401 (Unauthenticated) แล้ว ถ้า Backend ตอบกลับมาเป็น 403 (พยายามยิง API ที่ตัวเองไม่มีสิทธิ์) ฝั่ง Frontend ควรมีระบบ Toast โชว์แจ้งเตือนว่า "คุณไม่มีสิทธิ์ดำเนินการนี้" อย่างสวยงาม และไม่ทำให้หน้าเว็บพัง

---

### โครงสร้างไฟล์ที่ควรเพิ่มเข้าไปใน Starter:

```text
src/
├── components/
│   ├── shared/
│   │   ├── DynamicSidebar.tsx  # Sidebar ที่เปลี่ยนเมนูตาม Role
│   │   └── PermissionGuard.tsx # Component สำหรับครอบปุ่ม/เนื้อหา ตามสิทธิ์
├── config/
│   └── navigation.ts       # ไฟล์เก็บเมนูต่างๆ และกำหนดว่าเมนูไหนใช้ Role อะไร
├── lib/
│   └── rbac.ts             # Helper functions เช่น hasPermission(userRole, action)
└── app/
    ├── (backoffice)/       # กรุ๊ปหน้าเว็บทั้งหมดของระบบหลังบ้าน
    └── unauthorized/       # หน้า UI สำหรับ 403 Forbidden (คุณไม่มีสิทธิ์เข้าถึง)
```

การทำโครงสร้างเผื่อ Multiple Roles ไว้ตั้งแต่ต้น จะช่วยให้คุณประหยัดเวลาในการวางระบบ Security ในโปรเจคต่อๆ ไปได้อย่างมหาศาลครับ

### เพิ่ม `PermissionGuard` (Component สำหรับซ่อน/แสดงปุ่มตามสิทธิ์) และการตั้งค่า `DynamicSidebar`
