# 🚀 ULTIMATE NEXT.JS STARTER TEMPLATE — SENIOR / ENTERPRISE VERSION 3.0

> Project: `next-js-starter`  
> Goal: ใช้ครั้งเดียว → ใช้ได้หลายโปรเจกต์ → scale → SaaS → Enterprise  
> Stack หลัก: Next.js App Router + TypeScript + Prisma + MySQL  
> Development DB: XAMPP MySQL database name: `nextjs_starter`  
> Design: Clean / Minimal / Premium / Black-White-Gray / Responsive / Dark-Light

---

## 0. PRINCIPLE / MINDSET

Starter นี้ไม่ใช่แค่ template หน้าบ้าน แต่คือ **Core Platform Foundation** สำหรับสร้างโปรเจกต์ใหม่ได้เร็ว ปลอดภัย และไม่ต้อง rewrite บ่อยในอนาคต

### เป้าหมายหลัก

- Fullstack Next.js App Router
- TypeScript strict แบบ production-grade
- Reusable 100%
- Production Ready
- รองรับ project ธรรมดา → SaaS → Enterprise
- รองรับ multi-tenant ตั้งแต่แรก
- รองรับ role / permission แบบ dynamic
- รองรับ UI template ของผู้ใช้
- รองรับ mobile และ desktop
- รองรับการ scale เป็น 100k users+ โดยไม่พังง่าย
- มี security, audit, testing, CI/CD, observability, deployment strategy ครบ

### กฎสำคัญ

- ห้ามเขียน logic แบบใช้ได้แค่ project เดียว
- ห้าม hardcode role เช่น `if (user.role === 'admin')`
- ห้ามเรียก database ตรงจาก React component
- ห้ามให้ frontend guard เป็น security หลัก
- ทุก mutation ต้อง validate ด้วย Zod
- ทุก protected action ต้องตรวจ auth + permission ฝั่ง server เสมอ
- ทุก tenant query ต้อง filter `tenantId` เสมอ
- ทุก feature ใหม่ต้องรองรับ dark/light และ responsive
- ทุก API ต้อง return format เดียวกัน
- ทุก error ต้องมี standard error handling
- ทุก critical flow ต้องคิดเรื่อง transaction, duplicate request, race condition และ audit log

---

# 1. CORE SYSTEM

## 1.1 Required Stack

- Next.js App Router
- React
- TypeScript strict
- Tailwind CSS
- Prisma ORM
- MySQL
- Zod
- React Hook Form
- TanStack Query / React Query
- Zustand
- ESLint
- Prettier
- Absolute import `@/`
- Environment config `.env.*`

## 1.2 Optional Production Stack

- Redis สำหรับ cache / queue / rate limit
- BullMQ / Inngest / Trigger.dev / QStash สำหรับ background jobs
- Sentry สำหรับ error tracking
- Pino / Winston สำหรับ structured logging
- Stripe สำหรับ payment / subscription
- Resend / Postmark / SMTP สำหรับ email
- S3-compatible storage สำหรับ file upload
- Docker สำหรับ development และ deployment
- GitHub Actions สำหรับ CI/CD

## 1.3 Runtime Boundary

ต้องแยกให้ชัดว่าอะไรทำงานฝั่งไหน

- Server Components: fetch server data, render secured page
- Client Components: interaction, local state, form UI
- Server Actions: mutation ที่ผูกกับ form หรือ action ภายใน app
- API Routes: public API, webhook, mobile API, third-party integration
- Middleware: auth/session/locale redirect เบื้องต้นเท่านั้น
- Service Layer: business logic หลัก
- Repository Layer: database access ผ่าน Prisma

---

# 2. PROJECT STRUCTURE

```txt
/src
 ├── app/
 │   ├── (auth)/
 │   │   ├── login/
 │   │   ├── register/
 │   │   ├── forgot-password/
 │   │   └── reset-password/
 │   │
 │   ├── (main)/
 │   │   ├── dashboard/
 │   │   ├── profile/
 │   │   ├── settings/
 │   │   ├── billing/
 │   │   ├── tenant/
 │   │   └── [module]/
 │   │
 │   ├── (admin)/
 │   │   ├── admin/
 │   │   │   ├── tenants/
 │   │   │   ├── users/
 │   │   │   ├── plans/
 │   │   │   ├── audit-logs/
 │   │   │   └── system-settings/
 │   │
 │   ├── api/
 │   │   ├── v1/
 │   │   │   ├── auth/
 │   │   │   ├── user/
 │   │   │   ├── tenant/
 │   │   │   ├── billing/
 │   │   │   ├── upload/
 │   │   │   └── internal/
 │   │   └── webhooks/
 │   │       └── stripe/
 │   │
 │   ├── layout.tsx
 │   ├── error.tsx
 │   ├── loading.tsx
 │   ├── not-found.tsx
 │   ├── forbidden.tsx
 │   └── global-error.tsx
 │
 ├── actions/                 # Server Actions
 │   ├── auth.actions.ts
 │   ├── user.actions.ts
 │   ├── tenant.actions.ts
 │   └── billing.actions.ts
 │
 ├── components/
 │   ├── ui/                  # integrate ui-template here
 │   ├── form/
 │   ├── table/
 │   ├── layout/
 │   ├── feedback/
 │   ├── navigation/
 │   ├── data-display/
 │   └── charts/
 │
 ├── modules/
 │   ├── auth/
 │   │   ├── auth.service.ts
 │   │   ├── auth.repository.ts
 │   │   ├── auth.schema.ts
 │   │   ├── auth.types.ts
 │   │   ├── auth.policy.ts
 │   │   └── auth.test.ts
 │   │
 │   ├── user/
 │   ├── tenant/
 │   ├── billing/
 │   ├── upload/
 │   ├── audit/
 │   ├── notification/
 │   └── permission/
 │
 ├── lib/
 │   ├── prisma.ts
 │   ├── auth.ts
 │   ├── session.ts
 │   ├── permission.ts
 │   ├── response.ts
 │   ├── error.ts
 │   ├── logger.ts
 │   ├── rate-limit.ts
 │   ├── idempotency.ts
 │   ├── transaction.ts
 │   ├── queue.ts
 │   ├── storage.ts
 │   ├── email.ts
 │   └── security.ts
 │
 ├── hooks/
 │   ├── use-auth.ts
 │   ├── use-permission.ts
 │   ├── use-fetch.ts
 │   ├── use-debounce.ts
 │   ├── use-pagination.ts
 │   ├── use-theme.ts
 │   └── use-locale.ts
 │
 ├── store/
 │   ├── auth.store.ts
 │   ├── permission.store.ts
 │   ├── theme.store.ts
 │   └── ui.store.ts
 │
 ├── config/
 │   ├── app.config.ts
 │   ├── auth.config.ts
 │   ├── billing.config.ts
 │   ├── feature-flags.config.ts
 │   ├── permission.config.ts
 │   └── seo.config.ts
 │
 ├── constants/
 │   ├── roles.ts
 │   ├── permissions.ts
 │   ├── statuses.ts
 │   ├── routes.ts
 │   └── enums.ts
 │
 ├── locales/
 │   ├── en.json
 │   └── th.json
 │
 ├── theme/
 │   ├── tokens.ts
 │   ├── colors.ts
 │   ├── spacing.ts
 │   └── typography.ts
 │
 ├── types/
 ├── utils/
 ├── styles/
 └── middleware.ts

/prisma
 ├── schema.prisma
 ├── migrations/
 └── seed.ts

/tests
 ├── unit/
 ├── integration/
 └── e2e/

/docs
 ├── architecture.md
 ├── api.md
 ├── deployment.md
 ├── security.md
 └── ai-rules.md
```

---

# 3. UI TEMPLATE INTEGRATION

## 3.1 Goal

- ย้าย `ui-template` → `/src/components/ui`
- Refactor ให้เป็น reusable component
- ห้ามผูกกับ page เฉพาะโดยตรง
- ใช้ design token แทน hardcode style
- รองรับ dark/light
- รองรับ responsive ทุก component
- รองรับ accessibility

## 3.2 UI Components Required

### Basic Components

- Button
- Input
- Textarea
- Select
- Checkbox
- Radio
- Switch
- Label
- Badge
- Avatar
- Card
- Divider
- Icon

### Feedback Components

- Toast
- Alert
- Dialog
- Modal
- Drawer
- Spinner
- Skeleton
- Empty State
- Error State
- Loading State

### Navigation Components

- Sidebar
- Navbar
- Breadcrumb
- Tabs
- Dropdown
- Command Menu
- Pagination

### Data Components

- Table
- DataGrid
- Stat Card
- Chart Card
- Timeline
- Audit Log Viewer
- Activity Feed

### Form Components

- Form Field
- Form Group
- Form Error
- Date Picker
- File Upload
- Image Upload
- Search Input
- Filter Bar

## 3.3 UI System Rules

- ทุกสีต้องมาจาก design token
- ทุก spacing ต้องมาจาก token
- ทุก component ต้องรับ `className`
- ทุก component ต้องรองรับ disabled, loading, error state
- ทุก interactive component ต้องมี focus state
- ห้ามใช้ inline style ถ้าไม่จำเป็น
- ห้ามใช้สี hardcode เช่น `#000`, `#fff` ตรง ๆ ใน component
- ต้องรองรับ mobile-first

## 3.4 Design Direction

- Clean + minimal
- White / black / gray tone
- Premium SaaS dashboard feel
- Readability first
- Low visual noise
- Clear hierarchy
- Consistent spacing
- Modern but not over-designed
- Font: Inter สำหรับ EN, Sarabun สำหรับ TH

---

# 4. UI PAGES

## 4.1 Auth Pages

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`

Required states:

- default
- loading
- validation error
- server error
- success message
- expired link
- invalid token

## 4.2 Main Pages

- `/dashboard`
- `/profile`
- `/settings`
- `/billing`
- `/tenant/settings`
- `/tenant/team`

## 4.3 CRUD Template Pages

- `/[module]`
- `/[module]/create`
- `/[module]/[id]`
- `/[module]/[id]/edit`

Required CRUD features:

- list
- create
- read/detail
- update
- soft delete
- restore
- permanent delete optional
- search
- filter
- sorting
- pagination
- bulk action optional
- export optional

## 4.4 System Pages

- `/404`
- `/403`
- `/500`
- `/loading`
- `/maintenance`
- `/offline`

## 4.5 Dev Pages

- `/dev/ui` แสดง UI component ทั้งหมด
- `/dev/test-api` ทดสอบ API response
- `/dev/permissions` ทดสอบ permission matrix
- `/dev/theme` ทดสอบ design tokens

Dev pages ต้องเปิดเฉพาะ development หรือ super admin เท่านั้น

---

# 5. THEME SYSTEM

## 5.1 Required

- Light mode
- Dark mode
- Theme Provider
- `useTheme()` hook
- Persist theme in localStorage / cookie
- Tailwind dark mode
- System preference detection

## 5.2 Token Structure

```ts
export const tokens = {
  colors: {
    background: '',
    foreground: '',
    muted: '',
    border: '',
    primary: '',
    danger: '',
    success: '',
    warning: '',
  },
  spacing: {},
  radius: {},
  shadow: {},
  typography: {},
}
```

## 5.3 Theme Rules

- Theme ต้องไม่ทำให้ layout shift
- สีต้องผ่าน contrast เบื้องต้น
- Component ต้องแสดงผลดีทั้ง light/dark
- Form error และ focus state ต้องเห็นชัด

---

# 6. MULTI LANGUAGE / I18N

## 6.1 Required

- `/locales/en.json`
- `/locales/th.json`
- Translation hook `t()`
- Language switcher
- Middleware detect locale
- Persist locale
- Fallback locale

## 6.2 Route Strategy

รองรับได้ 2 แบบ เลือกอย่างใดอย่างหนึ่งตาม project

### Option A: Prefix Locale

```txt
/en/dashboard
/th/dashboard
```

### Option B: Locale in Cookie

```txt
/dashboard
```

ใช้ cookie/localStorage เก็บภาษา

## 6.3 Rules

- ห้าม hardcode text ใน page สำคัญ
- Validation message ต้อง translate ได้
- Sidebar/menu ต้อง translate ได้
- Email template ควรรองรับ EN/TH

---

# 7. AUTH SYSTEM

## 7.1 Required Features

- Register
- Login
- Logout
- Forgot password
- Reset password
- Verify email optional
- Session persistence
- Middleware protect route
- Refresh token rotation
- HttpOnly cookie
- Secure cookie in production

## 7.2 Token Strategy

- Access Token อายุสั้น
- Refresh Token อายุยาวกว่า
- Store token in httpOnly cookie
- ห้ามเก็บ access token ใน localStorage สำหรับ production auth
- Refresh token ต้อง rotate ได้
- Logout ต้อง revoke session ได้

## 7.3 Session Table

```txt
sessions
- id ULID
- userId
- tokenHash
- refreshTokenHash
- ipAddress
- userAgent
- expiresAt
- revokedAt nullable
- createdAt
- updatedAt
```

## 7.4 Auth Security Rules

- Password hash ด้วย Argon2 หรือ bcrypt
- Rate limit login
- Lockout หรือ delay เมื่อ login fail ถี่เกิน
- Reset token ต้อง hash ใน DB
- Reset token ต้อง expire
- Session revoke เมื่อเปลี่ยน password
- Log security event เช่น login failed, password reset, email changed

---

# 8. ROLE / PERMISSION SYSTEM

## 8.1 Goal

รองรับตั้งแต่ project ธรรมดา → SaaS → Enterprise

- Single role
- Multi role
- Granular permission
- RBAC
- ABAC
- Tenant-aware permission
- Field-level permission optional
- Permission versioning optional

## 8.2 Core Entities

- User
- Role
- Permission
- RolePermission
- UserRole
- UserPermission Override optional
- Tenant
- TenantMembership

## 8.3 Database Design

### User

```txt
users
- id ULID
- name
- email unique
- password
- emailVerifiedAt nullable
- status
- createdAt
- updatedAt
- deletedAt nullable
```

### Tenant

```txt
tenants
- id ULID
- name
- slug unique
- status
- planId nullable
- ownerId
- createdAt
- updatedAt
- deletedAt nullable
```

### TenantMembership

```txt
tenant_memberships
- id ULID
- tenantId
- userId
- status
- joinedAt
- createdAt
- updatedAt

unique: tenantId + userId
```

### Role

```txt
roles
- id ULID
- tenantId nullable
- name
- key
- description nullable
- isSystem boolean
- createdAt
- updatedAt

unique: tenantId + key
```

### Permission

```txt
permissions
- id ULID
- key
- module
- action
- description nullable
- createdAt
- updatedAt

unique: key
```

### RolePermission

```txt
role_permissions
- roleId
- permissionId

unique: roleId + permissionId
```

### UserRole

```txt
user_roles
- userId
- roleId
- tenantId nullable

unique: userId + roleId + tenantId
```

### UserPermission Override Optional

```txt
user_permissions
- userId
- permissionId
- tenantId nullable
- effect allow | deny

unique: userId + permissionId + tenantId
```

## 8.4 Permission Naming Standard

ใช้ dot format เป็นหลัก

```txt
{module}.{action}
```

Example:

```txt
user.view
user.create
user.update
user.delete
billing.view
billing.manage
tenant.member.invite
tenant.member.remove
admin.tenant.manage
```

Wildcard optional:

```txt
user.*
billing.*
admin.*
```

## 8.5 Default Roles

### Platform Level

- super_admin
- support_admin

### Tenant Level

- owner
- admin
- manager
- member
- viewer

## 8.6 Permission Logic

```ts
function can(user, permission, context) {
  // 1. check user exists and active
  // 2. check tenant membership if tenant context exists
  // 3. check explicit deny override
  // 4. check explicit allow override
  // 5. check role permissions
  // 6. check ABAC policy if required
  // 7. return boolean
}
```

## 8.7 RBAC + ABAC

RBAC ใช้ role/permission เป็นหลัก  
ABAC ใช้ attribute/context เพิ่ม เช่น owner ของ resource

Example:

```ts
can(user, 'post.update', {
  tenantId: post.tenantId,
  resourceOwnerId: post.userId,
})
```

Rules:

- Permission check ต้องทำที่ server เสมอ
- Frontend guard ใช้เพื่อ UX เท่านั้น
- ห้ามเชื่อข้อมูล permission ที่ส่งมาจาก client

## 8.8 Frontend Guard

```tsx
<Can permission="user.create">
  <Button>Create User</Button>
</Can>
```

Hook:

```ts
const { can } = usePermission()
```

Rules:

- ใช้ hide/disable UI ได้
- ห้ามใช้แทน API protection

## 8.9 Permission Caching

- Load roles + permissions ตอน login
- Cache in memory / Zustand
- Permission cache ต้อง tenant-aware
- Clear cache เมื่อ logout
- Refresh cache เมื่อ role/permission เปลี่ยน

## 8.10 Permission Seed

Default seed:

```txt
super_admin → all platform permissions
owner → all tenant permissions
admin → manage tenant users + data
manager → manage module data
member → read/write own scope
viewer → read only
```

---

# 9. ROUTE PROTECTION LEVELS

## 9.1 Public Routes

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/verify-email`

## 9.2 Authenticated Routes

- `/dashboard`
- `/profile`
- `/settings`

## 9.3 Tenant Routes

- `/tenant/*`
- `/billing/*`
- `/[module]/*`

Require:

- logged in
- active tenant membership
- tenant status active

## 9.4 Permission Routes

- `/admin/*`
- `/billing/manage`
- `/tenant/team`
- `/tenant/settings`

Require:

- logged in
- required permission
- server-side permission check

## 9.5 System / Dev Routes

- `/dev/*`
- `/api/v1/internal/*`

Require:

- development environment OR super admin permission

## 9.6 Rules

- Middleware ตรวจ auth/session/locale เบื้องต้น
- Permission check ต้องทำซ้ำใน service/server action/API route
- API ต้องไม่พึ่ง frontend guard
- Unauthorized = 401
- Forbidden = 403

---

# 10. API SYSTEM

## 10.1 API Pattern

```txt
/api/v1/{module}
/api/v1/{module}/{id}
/api/webhooks/{provider}
```

## 10.2 Standard Response

### Success

```json
{
  "success": true,
  "data": {},
  "message": "Success",
  "meta": {}
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {}
  },
  "requestId": "req_xxx"
}
```

## 10.3 API Rules

- ทุก request ต้องมี validation
- ทุก response ต้อง format เดียวกัน
- ทุก error ต้องมี error code
- ทุก protected API ต้องตรวจ auth
- ทุก mutation ต้องตรวจ permission
- ทุก tenant API ต้องตรวจ tenant access
- ต้องมี request id / trace id

## 10.4 API Versioning

- เริ่มที่ `/api/v1`
- Breaking change ใช้ `/api/v2`
- ห้ามแก้ response format แบบ breaking ใน v1 โดยไม่จำเป็น

---

# 11. SERVER ACTIONS STRATEGY

## 11.1 Use Server Actions For

- Form submit ภายใน app
- CRUD mutation ภายใน dashboard
- Profile update
- Settings update
- Tenant member invite
- Simple authenticated actions

## 11.2 Use API Routes For

- Public API
- Mobile app API
- Third-party integration
- Stripe webhook
- File upload endpoint
- API key based access
- External client consumption

## 11.3 Server Action Rules

- Validate input ด้วย Zod
- Check session
- Check permission
- Call service layer
- Return typed result
- ห้ามเขียน business logic ยาวใน action
- ห้ามเรียก Prisma ตรงถ้าไม่ผ่าน service/repository

Example flow:

```txt
Form → Server Action → Schema Validate → Auth Check → Permission Check → Service → Repository → Prisma
```

---

# 12. DATA ACCESS LAYER / ARCHITECTURE

## 12.1 Required Flow

```txt
Page / Component
→ Server Action or API Route
→ Service
→ Repository
→ Prisma
→ MySQL
```

## 12.2 Service Layer

ใช้สำหรับ business logic

```txt
/modules/user/user.service.ts
```

Responsibilities:

- Validate business rule
- Check permission policy
- Manage transaction
- Call repository
- Create audit log
- Trigger event/job

## 12.3 Repository Layer

ใช้สำหรับ database query

```txt
/modules/user/user.repository.ts
```

Responsibilities:

- Prisma query
- tenant filter
- selected fields
- pagination
- sorting
- transaction client support

## 12.4 Rules

- ห้าม Prisma query ตรงใน React component
- ห้าม Prisma query กระจายหลายที่โดยไม่มี pattern
- ทุก query ของ tenant data ต้องมี `tenantId`
- ทุก list query ต้อง paginate
- ห้าม `select *` mindset ให้เลือก field ที่ต้องใช้
- Sensitive field เช่น password/token ห้าม return ออกไป

---

# 13. DATABASE DESIGN

## 13.1 Required

- MySQL database: `nextjs_starter`
- Prisma ORM
- ULID เป็น primary id
- `createdAt`
- `updatedAt`
- `deletedAt` nullable สำหรับ soft delete
- `tenantId` สำหรับ table ที่เป็น tenant-owned
- Index สำคัญต้องมีตั้งแต่แรก

## 13.2 Base Columns

```txt
id ULID primary key
createdAt DateTime
updatedAt DateTime
deletedAt DateTime nullable
```

Tenant-owned table:

```txt
tenantId ULID index
```

## 13.3 Core Tables

- users
- sessions
- tenants
- tenant_memberships
- roles
- permissions
- role_permissions
- user_roles
- user_permissions optional
- audit_logs
- plans
- subscriptions
- invoices
- payments
- api_keys
- files
- notifications
- idempotency_keys
- webhook_events
- feature_flags

---

# 14. DATABASE INDEX STRATEGY

## 14.1 Required Indexes

```txt
users.email unique
sessions.userId
sessions.tokenHash unique
tenants.slug unique
tenants.ownerId
tenant_memberships.tenantId
tenant_memberships.userId
tenant_memberships.tenantId + tenant_memberships.userId unique
roles.tenantId
roles.tenantId + roles.key unique
permissions.key unique
role_permissions.roleId
role_permissions.permissionId
user_roles.userId
user_roles.roleId
user_roles.tenantId
audit_logs.userId
audit_logs.tenantId
audit_logs.createdAt
subscriptions.tenantId
subscriptions.status
api_keys.keyHash unique
api_keys.tenantId
webhook_events.provider + webhook_events.eventId unique
idempotency_keys.key unique
files.tenantId
files.ownerId
notifications.userId
notifications.readAt
```

## 14.2 Composite Indexes

```txt
tenantId + createdAt
tenantId + status
tenantId + deletedAt
tenantId + userId
tenantId + module
tenantId + resourceType + resourceId
```

## 14.3 Rules

- Field ที่ใช้ `where` บ่อยควรมี index
- Foreign key ควรมี index
- Query ที่ filter ด้วย tenantId + status/date ควรมี composite index
- ไม่ควร index ทุก field โดยไม่คิด เพราะทำให้ write ช้าลง
- ต้องตรวจ slow query เมื่อระบบโต

---

# 15. VALIDATION SYSTEM

## 15.1 Required

- ใช้ Zod ทุก request
- ใช้ React Hook Form + Zod resolver ใน form
- Validation schema อยู่ใน module

Example:

```txt
/modules/user/user.schema.ts
```

## 15.2 Rules

- Validate client เพื่อ UX
- Validate server เพื่อ security
- Server validation คือ source of truth
- Error message ต้อง translate ได้
- ห้าม trust input จาก client

---

# 16. FORM SYSTEM

## 16.1 Required

- React Hook Form
- Zod
- Reusable form component
- Field component
- Error display
- Loading state
- Disabled state
- Dirty state detection

## 16.2 Form Rules

- Submit ต้องป้องกัน double click
- Critical form ใช้ idempotency key optional
- Form error ต้องชัดเจน
- Field error ต้องอยู่ใกล้ field
- Form ต้องใช้งานได้บน mobile

---

# 17. TABLE SYSTEM

## 17.1 Required

- Reusable table
- Pagination
- Search
- Filter
- Sorting
- Empty state
- Loading skeleton
- Error state
- Row action
- Bulk action optional

## 17.2 Query Param Sync

Table state ควร sync กับ URL query

```txt
?page=1&limit=20&search=test&status=active&sort=createdAt:desc
```

## 17.3 Server-side Table Rule

- Pagination ต้องทำฝั่ง server สำหรับข้อมูลจริง
- Search/filter/sort ต้อง validate
- Limit max เช่น 100 ต่อ request

---

# 18. SEARCH SYSTEM

## 18.1 Required

- Debounce
- Query param sync
- Server-side search
- Filter validation

## 18.2 Rules

- Search query ต้อง trim
- Limit length
- Escape special characters
- Index field ที่ search บ่อย
- Full-text search optional สำหรับระบบใหญ่

---

# 19. API CLIENT

## 19.1 Required

- Fetch wrapper
- Auto credential include
- Standard error handling
- Retry เฉพาะ safe request
- Request timeout
- Request id optional

## 19.2 Rules

- ห้าม call fetch กระจายแบบไม่มี wrapper
- API client ต้อง handle 401/403/500 ชัดเจน
- Mutation error ต้องแสดง toast หรือ form error

---

# 20. STATE MANAGEMENT

## 20.1 Zustand

ใช้กับ state ที่เป็น client UI/global state เช่น

- auth snapshot
- permission snapshot
- theme
- sidebar
- modal
- local UI preference

## 20.2 React Query

ใช้กับ server state เช่น

- user list
- tenant data
- billing status
- notification list

## 20.3 Rules

- อย่าเอา server state ไปยัด Zustand ถ้า React Query เหมาะกว่า
- Cache key ต้องชัดเจนและ tenant-aware
- Invalidate cache หลัง mutation

---

# 21. CACHE STRATEGY

## 21.1 Cache Layers

- Browser cache
- React Query cache
- Server memory cache optional
- Redis cache optional
- CDN cache optional

## 21.2 Cache Key Naming

```txt
tenant:{tenantId}:user:{userId}:permissions
tenant:{tenantId}:settings
tenant:{tenantId}:dashboard:{dateRange}
```

## 21.3 Invalidation Rules

- Update user → invalidate user detail + user list
- Update role/permission → invalidate permission cache
- Update tenant settings → invalidate tenant settings cache
- Payment/subscription webhook → invalidate billing cache

## 21.4 Rules

- Cache ต้อง tenant-aware
- ห้าม cache sensitive data ผิดที่
- ต้องมี TTL สำหรับ cache ที่อาจ stale

---

# 22. FILE UPLOAD SYSTEM

## 22.1 Required

- Upload API
- Preview image
- File validation
- File storage abstraction
- Signed URL support
- File metadata table

## 22.2 File Table

```txt
files
- id ULID
- tenantId nullable
- ownerId
- disk
- path
- originalName
- mimeType
- size
- visibility private | public
- createdAt
- updatedAt
- deletedAt nullable
```

## 22.3 Security Rules

- Validate MIME type
- Validate extension
- Validate file size
- Rename file
- Prevent executable upload
- Store private file outside public path or use signed URL
- Image optimization optional
- Virus scan optional
- Per-user/per-tenant quota
- Audit log for sensitive upload/delete

---

# 23. CONFIG SYSTEM

## 23.1 Required Files

- `app.config.ts`
- `auth.config.ts`
- `billing.config.ts`
- `feature-flags.config.ts`
- `permission.config.ts`
- `seo.config.ts`

## 23.2 Rules

- ห้ามกระจาย config magic string ในหลายไฟล์
- Config ต้อง type-safe
- Env ต้อง validate ตอน app start

---

# 24. CONSTANTS / ENUMS

## 24.1 Required

- roles
- permissions
- statuses
- routes
- plans
- feature keys
- error codes

## 24.2 Rules

- ห้ามใช้ string ซ้ำ ๆ ในหลายที่
- Permission key ต้อง centralized
- Error code ต้อง centralized

---

# 25. SECURITY SYSTEM

## 25.1 Core Security

- Input validation
- Output escaping
- Rate limiting
- CSRF protection สำหรับ cookie-based mutation ที่เสี่ยง
- XSS protection
- SQL injection protection ผ่าน Prisma + validation
- Secure headers
- Content Security Policy optional
- Brute force protection
- Bot/spam protection
- DDoS mitigation ผ่าน infra/CDN
- Sensitive data redaction in logs

## 25.2 Authentication Security

- HttpOnly cookie
- Secure cookie in production
- SameSite strategy
- Refresh token rotation
- Session revoke
- Login rate limit
- Password reset token hash
- Password strength rule

## 25.3 Authorization Security

- Server-side permission check
- Tenant isolation
- Resource ownership check
- ABAC for owner-only resources
- API key scope check

## 25.4 Data Security

- ห้าม return password/token
- ห้าม log secret
- ห้าม expose stack trace ใน production
- Soft delete policy
- Backup strategy
- Audit log for sensitive action

## 25.5 Security Headers

ควรตั้งค่า headers:

```txt
X-Frame-Options
X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Content-Security-Policy optional
Strict-Transport-Security production HTTPS only
```

---

# 26. RATE LIMITING

## 26.1 Required Limits

- Login per IP
- Login per email
- Register per IP
- Forgot password per email
- API key per key
- Upload per user/tenant
- Webhook endpoint signature protected

## 26.2 Storage

- Development: memory store
- Production: Redis recommended

## 26.3 Rules

- Response ต้องไม่ leak ว่า email มีอยู่จริงหรือไม่ใน forgot password
- Rate limit error ต้อง format เดียวกับ API error

---

# 27. IDEMPOTENCY SYSTEM

## 27.1 Purpose

ป้องกัน duplicate request ใน critical flow เช่น

- Payment
- Subscription
- Order
- Invite
- Webhook processing
- File upload metadata creation

## 27.2 Table

```txt
idempotency_keys
- id ULID
- key unique
- userId nullable
- tenantId nullable
- requestHash
- responseJson
- status processing | completed | failed
- expiresAt
- createdAt
- updatedAt
```

## 27.3 Rules

- Client ส่ง `Idempotency-Key` สำหรับ critical mutation
- Server ตรวจ key ก่อนทำงาน
- ถ้า request เดิมสำเร็จแล้ว return response เดิม
- ถ้า requestHash ไม่ตรงกับ key เดิม ให้ reject
- ต้องมี TTL cleanup job

---

# 28. TRANSACTION STRATEGY

## 28.1 Prisma Transaction

ใช้ Prisma transaction แทน Laravel-style `DB::transaction()`

```ts
await prisma.$transaction(async (tx) => {
  // critical operations
})
```

## 28.2 Use Transaction For

- Create tenant + owner membership + default roles
- Payment success + subscription update + invoice update
- Invite accept + membership create
- Role update + permission sync
- Critical multi-table mutation

## 28.3 Rules

- Transaction ต้องสั้น ไม่ทำ external API call ข้างในถ้าเลี่ยงได้
- External API call ควรทำก่อนหรือหลัง transaction อย่างระวัง
- ถ้าต้องทำ side effect ให้ใช้ outbox/job pattern optional

---

# 29. CONCURRENCY CONTROL

## 29.1 Problems to Prevent

- Double submit
- Race condition
- Duplicate payment handling
- Usage limit overrun
- Concurrent role update
- Same invite accepted twice

## 29.2 Strategies

- Unique constraint
- Idempotency key
- Prisma transaction
- Optimistic locking with `version` column
- Database row lock where supported
- Queue serialized job for sensitive operations

## 29.3 Optimistic Locking Example

```txt
version Int default 1
```

Update with condition:

```txt
where id = xxx AND version = currentVersion
```

Then increment version

## 29.4 Rules

- อย่าพึ่ง frontend disable button อย่างเดียว
- Critical flow ต้องมี database-level protection
- Unique constraints คือ safety net สำคัญ

---

# 30. BACKGROUND JOB / QUEUE SYSTEM

## 30.1 Next.js Queue Options

เลือกตาม hosting

### Option A: BullMQ + Redis

เหมาะกับ VPS / Docker / Coolify

### Option B: Inngest

เหมาะกับ serverless / event-driven

### Option C: Trigger.dev

เหมาะกับ workflow/job ที่ต้อง monitor ง่าย

### Option D: QStash

เหมาะกับ serverless scheduled job

## 30.2 Job Use Cases

- Email sending
- Billing sync
- Usage calculation
- Cleanup expired sessions
- Cleanup idempotency keys
- Reconciliation
- Report generation
- Notification fan-out
- File processing

## 30.3 Job Rules

- Job ต้อง retry ได้
- Job ต้อง idempotent
- Failed job ต้อง log
- Critical job ต้อง alert
- Queue delay ต้อง monitor

---

# 31. WEBHOOK SYSTEM

## 31.1 Required For SaaS

- Stripe webhook endpoint
- Signature verification
- Event idempotency
- Webhook event log
- Retry-safe processing

## 31.2 Webhook Events Table

```txt
webhook_events
- id ULID
- provider
- eventId
- eventType
- payloadJson
- processedAt nullable
- status pending | processed | failed
- errorMessage nullable
- createdAt
- updatedAt

unique: provider + eventId
```

## 31.3 Stripe Events

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

## 31.4 Rules

- ต้อง verify signature ก่อน parse trust
- ห้าม process event ซ้ำ
- Webhook ต้อง return 2xx เมื่อ process หรือ queue สำเร็จ
- Heavy work ควรโยนเข้า queue
- Billing state ต้องถือ webhook เป็น source of truth หลัก

---

# 32. SAAS SYSTEM

## 32.1 Core Features

- Tenant / Organization
- Team member
- Invite user
- Role per tenant
- Subscription
- Plan
- Billing
- Payment
- Invoice
- Usage limit
- Feature gating
- Trial system
- Custom domain optional
- API key
- Audit log
- Analytics
- Admin panel

## 32.2 Tenant

Tenant คือ organization/company/workspace

Required:

- name
- slug
- owner
- status
- plan
- settings

## 32.3 Team

Features:

- invite by email
- accept invite
- remove member
- change role
- transfer ownership optional

## 32.4 Subscription

Features:

- plan
- billing period
- status
- trial
- cancel
- upgrade
- downgrade
- invoice page

## 32.5 Feature Gating

Example:

```txt
plan.free.maxUsers = 3
plan.pro.maxUsers = 20
plan.enterprise.maxUsers = unlimited
```

Rules:

- Feature gate ต้องตรวจฝั่ง server
- Frontend ใช้เพื่อแสดง/ซ่อน UX เท่านั้น

## 32.6 Usage Limit

Track:

- users count
- storage used
- API calls
- projects/modules count
- monthly usage

---

# 33. BILLING / PAYMENT SYSTEM

## 33.1 Provider

- Stripe เป็น default
- PromptPay/Card optional ผ่าน Stripe ถ้ารองรับใน region/account
- Manual payment optional สำหรับบาง project

## 33.2 Billing Pages

- current plan
- usage
- invoice list
- payment method
- upgrade/downgrade
- cancel subscription
- trial status

## 33.3 Billing Rules

- Payment success ต้องมาจาก webhook เป็นหลัก
- ห้าม activate subscription จาก client callback อย่างเดียว
- Webhook ต้อง idempotent
- Invoice/payment ต้อง audit log
- Failed payment ต้อง notify user

---

# 34. EMAIL SYSTEM

## 34.1 Providers

- Resend
- Postmark
- SMTP

## 34.2 Templates

- Verify email
- Reset password
- Invite user
- Billing success
- Payment failed
- Trial ending
- Security alert
- Welcome email

## 34.3 Email Table Optional

```txt
email_logs
- id ULID
- to
- subject
- template
- status queued | sent | failed
- providerMessageId nullable
- errorMessage nullable
- createdAt
- updatedAt
```

## 34.4 Rules

- Email ควรส่งผ่าน queue
- Retry เมื่อส่งไม่สำเร็จ
- ห้าม log sensitive token แบบ plain
- Template ต้องรองรับ TH/EN ถ้า project ใช้ i18n

---

# 35. NOTIFICATION SYSTEM

## 35.1 Types

- Toast
- In-app notification
- Email notification
- System alert

## 35.2 Notification Table

```txt
notifications
- id ULID
- userId
- tenantId nullable
- type
- title
- message
- dataJson nullable
- readAt nullable
- createdAt
```

## 35.3 Rules

- Notification ต้องมี read/unread
- Sensitive notification ต้องไม่ expose ให้ผิด tenant
- Bulk notification ใช้ queue

---

# 36. AUDIT LOG SYSTEM

## 36.1 Required Fields

```txt
audit_logs
- id ULID
- tenantId nullable
- userId nullable
- action
- resourceType
- resourceId nullable
- beforeJson nullable
- afterJson nullable
- ipAddress nullable
- userAgent nullable
- requestId nullable
- traceId nullable
- createdAt
```

## 36.2 Track Actions

- login/logout
- failed login
- password reset
- user create/update/delete
- role/permission changes
- tenant setting changes
- billing changes
- API key create/revoke
- impersonation start/stop
- file upload/delete

## 36.3 Rules

- Audit log ต้องไม่เก็บ password/token
- Sensitive field ต้อง redact
- Audit log ควร append-only
- Super admin action ต้อง audit เสมอ

---

# 37. OBSERVABILITY

## 37.1 Logging

Recommended:

- Pino
- Winston

Log types:

- application log
- error log
- security log
- business log
- audit log

## 37.2 Metrics

Track:

- response time
- request count
- error rate
- slow query
- queue delay
- failed jobs
- webhook failures
- login failures

## 37.3 Error Tracking

Recommended:

- Sentry

Rules:

- Capture production error
- Attach request id
- Attach user id when safe
- Attach tenant id when safe
- Redact sensitive data

## 37.4 Trace Context

ทุก request ควรมี:

- requestId
- traceId optional
- userId optional
- tenantId optional

---

# 38. ERROR HANDLING

## 38.1 Required

- Global error handler
- Error boundary
- API error formatter
- Form error mapping
- Not found handling
- Forbidden handling

## 38.2 Error Codes

Example:

```txt
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
INTERNAL_ERROR
TENANT_NOT_FOUND
PAYMENT_REQUIRED
FEATURE_LIMIT_REACHED
```

## 38.3 Rules

- Production ห้าม show stack trace
- Error message ต้องเป็นมิตรกับ user
- Log ต้องมี technical detail สำหรับ dev
- API response ต้อง consistent

---

# 39. FEATURE TOGGLE / FEATURE FLAGS

## 39.1 Required

- Enable/disable feature
- Per environment
- Per tenant optional
- Per plan optional

## 39.2 Examples

```txt
feature.billing.enabled
feature.upload.enabled
feature.apiKey.enabled
feature.customDomain.enabled
feature.betaDashboard.enabled
```

## 39.3 Rules

- Feature flag ต้องตรวจฝั่ง server ถ้าเกี่ยวกับ permission/plan
- Frontend flag ใช้เพื่อ UX เท่านั้น

---

# 40. API KEY SYSTEM

## 40.1 Required

- Generate key
- Show plain key only once
- Store hashed key only
- Prefix key เช่น `sk_live_`, `sk_test_`
- Scope permission
- Expiration optional
- Last used at
- Revoke key
- Rate limit by key

## 40.2 Table

```txt
api_keys
- id ULID
- tenantId
- name
- keyHash unique
- keyPrefix
- scopesJson
- lastUsedAt nullable
- expiresAt nullable
- revokedAt nullable
- createdById
- createdAt
- updatedAt
```

## 40.3 Rules

- Plain key แสดงครั้งเดียว
- Hash key ก่อนบันทึก
- API key ต้องผูก tenant
- API key ต้องมี scope
- API key request ต้อง audit เมื่อ sensitive

---

# 41. ADMIN LEVELS

## 41.1 Super Admin

Platform owner/admin

Can:

- manage all tenants
- manage platform users
- manage plans
- view platform analytics
- manage system settings
- view audit logs
- support impersonation

## 41.2 Tenant Owner

Owner ของ tenant

Can:

- manage tenant settings
- manage team
- manage subscription
- manage billing
- manage tenant roles

## 41.3 Tenant Admin

Can:

- manage users/data inside tenant
- cannot access platform admin
- cannot see other tenants

## 41.4 Member / Viewer

- limited access by permission
- viewer read-only

---

# 42. IMPERSONATION SYSTEM

## 42.1 Goal

ให้ super admin support user ได้โดยไม่ต้องรู้ password

## 42.2 Rules

- Require permission `admin.impersonate`
- Record audit log start/stop
- Show impersonation banner
- Allow stop impersonation
- Sensitive actions disabled while impersonating optional
- ห้ามเปิดเผย password/token
- Impersonation session ต้อง expire

---

# 43. ENTERPRISE FEATURES

## 43.1 Required / Future Ready

- Advanced permission
- RBAC + ABAC
- Audit log full
- Multi-role per tenant
- SSO future
- Advanced analytics
- Custom domain
- API key
- Data export
- Security review checklist

## 43.2 SSO Future

Support later:

- SAML
- OIDC
- Google Workspace
- Microsoft Entra ID

Prepare:

- users table should support external identity
- tenant setting should support SSO config

---

# 44. ACCESSIBILITY

## 44.1 Required

- Keyboard navigation
- Focus state
- ARIA labels
- Color contrast
- Form error linked with input
- Modal focus trap
- Toast readable by screen reader
- Button has accessible label
- Icon-only button must have label

## 44.2 Rules

- ห้ามเอา outline ออกโดยไม่มี focus style ทดแทน
- Modal/Drawer ต้อง trap focus
- Dropdown ต้องใช้ keyboard ได้
- Form error ต้องอ่านง่าย

---

# 45. SEO / METADATA SYSTEM

## 45.1 Required

- Metadata config
- Dynamic title per page
- Description
- OpenGraph
- Twitter card
- sitemap.xml
- robots.txt
- canonical URL
- JSON-LD optional

## 45.2 Usage

เหมาะกับ starter ที่เอาไปทำ landing page, SaaS homepage, documentation, marketing page

## 45.3 Rules

- Dashboard/private pages ไม่จำเป็นต้อง index
- Public pages ควรมี metadata ครบ
- Tenant custom domain ต้องระวัง canonical

---

# 46. PERFORMANCE

## 46.1 Frontend Performance

- Lazy load
- Dynamic import
- Image optimization
- Avoid unnecessary client component
- Use Server Components where possible
- Bundle analyze optional

## 46.2 Backend Performance

- Pagination
- Index important columns
- Avoid overfetching
- Avoid N+1 query
- Select only needed fields
- Cache frequently used data
- Use queue for heavy jobs

## 46.3 Rules

- อย่า mark component เป็น `use client` ถ้าไม่จำเป็น
- List page ต้อง paginate
- Dashboard query ต้อง optimize
- Slow query ต้อง log/monitor

---

# 47. TESTING STRATEGY

## 47.1 Tools

- Vitest
- React Testing Library
- Playwright
- MSW optional

## 47.2 Unit Test

Test:

- utils
- services
- permission logic
- validation schema
- formatter

## 47.3 Integration Test

Test:

- API routes
- Server actions
- Prisma repository
- auth flow
- tenant isolation
- billing webhook

## 47.4 E2E Test

Test:

- login
- register
- forgot/reset password
- dashboard access
- CRUD flow
- role/permission guard
- tenant switch
- billing flow

## 47.5 Security Test Cases

- user cannot access other tenant data
- member cannot access admin route
- expired session rejected
- revoked API key rejected
- rate limit works
- webhook duplicate ignored

## 47.6 Rules

- Critical business logic ต้องมี test
- Permission logic ต้องมี test เสมอ
- Billing webhook ต้องมี test
- Tenant isolation ต้องมี test

---

# 48. SEED / DEMO DATA SYSTEM

## 48.1 Required Seed

- Super Admin
- Demo Tenant
- Demo Owner
- Demo Admin
- Demo Member
- Default Roles
- Default Permissions
- Sample Module Data
- Demo Plans
- Demo Subscription

## 48.2 Commands

```bash
npm run db:seed
npm run db:reset
npm run db:migrate
npm run db:studio
```

## 48.3 Rules

- Seed ต้อง idempotent
- ห้าม seed ทับ production โดยไม่ตั้งใจ
- Production seed ต้องแยกจาก demo seed

---

# 49. MIGRATION STRATEGY

## 49.1 Development

- Prisma migration
- Reset database ได้
- Seed demo data ได้

## 49.2 Production

- Zero downtime mindset
- Backward compatible changes
- หลีกเลี่ยงการ rename/drop column ทันที
- เพิ่ม column nullable ก่อน
- backfill data
- deploy code ใหม่
- ค่อย enforce required constraint

## 49.3 Rules

- Migration ต้อง review ก่อน production
- Backup ก่อน migration สำคัญ
- Large table migration ต้องระวัง lock

---

# 50. DEPLOYMENT TARGETS

## 50.1 Supported Targets

- VPS
- Docker
- Coolify
- Vercel
- Railway
- Render
- Cloudflare Pages สำหรับ frontend/static บางกรณี

## 50.2 VPS Deployment

Recommended:

- Node.js LTS
- PM2 หรือ Docker
- Nginx reverse proxy
- MySQL production server
- Redis optional
- HTTPS with Certbot/Cloudflare

## 50.3 Docker Deployment

Services:

- app
- mysql
- redis
- worker
- nginx optional

## 50.4 Production Requirements

- HTTPS
- secure env secrets
- production database
- backup strategy
- log strategy
- monitoring
- CI/CD

---

# 51. DOCKER SUPPORT

## 51.1 Required Files

```txt
Dockerfile
docker-compose.yml
docker-compose.dev.yml
.dockerignore
```

## 51.2 Dev Services

- app
- mysql
- redis
- mailpit

## 51.3 Commands

```bash
npm run docker:up
npm run docker:down
npm run docker:logs
```

## 51.4 Rules

- Docker dev ต้องไม่ทำลาย XAMPP flow เดิมถ้าผู้ใช้ยังใช้ XAMPP
- Production Docker ต้องแยก worker process ถ้ามี queue

---

# 52. ENV / SECRET MANAGEMENT

## 52.1 Env Files

```txt
.env.local
.env.development
.env.production
.env.example
```

## 52.2 Required Env Validation

ใช้ Zod validate env ตอน start app

Required examples:

```txt
DATABASE_URL
APP_URL
JWT_SECRET
REFRESH_TOKEN_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
EMAIL_PROVIDER
S3_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY
REDIS_URL
```

## 52.3 Rules

- `.env.example` ต้องมี key ครบแต่ไม่มี secret จริง
- ห้าม commit secret
- Production ใช้ secret manager หรือ platform env
- Log ห้ามพิมพ์ secret

---

# 53. CI/CD

## 53.1 GitHub Actions Pipeline

Required steps:

- install dependencies
- type check
- lint
- format check optional
- unit test
- integration test optional
- build
- migration check optional
- deploy

## 53.2 Rules

- ห้าม deploy ถ้า test/build fail
- Production deploy ต้องใช้ env แยก
- Migration ต้อง run แบบ controlled
- ควรมี rollback plan

---

# 54. BACKUP / RECOVERY

## 54.1 Required

- Database backup
- File storage backup
- Env/secret recovery process
- Restore test

## 54.2 Backup Strategy

- Daily database backup
- Retention policy
- Backup encryption optional
- Offsite backup optional

## 54.3 Rules

- Backup ที่ restore ไม่ได้ถือว่าไม่มี backup
- ต้องทดสอบ restore เป็นระยะ

---

# 55. SOFT DELETE POLICY

## 55.1 Required

- `deletedAt` สำหรับ table สำคัญ
- Restore support optional
- Permanent delete optional เฉพาะ permission สูง

## 55.2 Rules

- List ปกติไม่แสดง deleted data
- Admin อาจมี trash view
- Cascade soft delete ต้องกำหนดชัด
- Sensitive delete ต้อง audit log

---

# 56. ANALYTICS

## 56.1 Product Analytics

Track:

- active users
- tenant count
- feature usage
- subscription conversion
- churn
- usage limit hit

## 56.2 Technical Analytics

Track:

- API latency
- error rate
- slow query
- job failures

## 56.3 Rules

- ห้ามเก็บข้อมูลส่วนตัวเกินจำเป็น
- Analytics ต้อง tenant-aware ถ้าแสดงใน tenant dashboard

---

# 57. MODULE STRUCTURE STANDARD

ทุก module ควรมี structure แบบนี้

```txt
/modules/{module}
 ├── {module}.service.ts
 ├── {module}.repository.ts
 ├── {module}.schema.ts
 ├── {module}.types.ts
 ├── {module}.policy.ts
 ├── {module}.constants.ts
 ├── {module}.events.ts optional
 ├── {module}.jobs.ts optional
 └── {module}.test.ts
```

## 57.1 Module Rules

- Schema เก็บ validation
- Service เก็บ business logic
- Repository เก็บ query
- Policy เก็บ permission/ABAC rule
- Types เก็บ type ที่ใช้ร่วมกัน
- Test เก็บ test สำคัญ

---

# 58. CRUD MODULE TEMPLATE

ทุก CRUD module ต้องมี

## 58.1 API / Action

- list
- get by id
- create
- update
- soft delete
- restore optional
- permanent delete optional

## 58.2 UI

- list page
- create page
- detail page
- edit page
- delete confirmation
- empty state
- loading state
- error state

## 58.3 Security

- permission per action
- tenant isolation
- validation
- audit log for create/update/delete

## 58.4 Performance

- pagination
- filter
- sorting
- index support

---

# 59. DEVELOPMENT WORKFLOW

## 59.1 Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run db:migrate
npm run db:seed
npm run db:studio
```

## 59.2 Rules

- ก่อน commit ควรผ่าน lint/typecheck/test
- Feature ใหม่ควรมี docs หรือ comment ในจุดสำคัญ
- ห้าม commit generated secret
- ห้าม commit debug log จำนวนมาก

---

# 60. AI DEVELOPMENT RULES FOR CODEX / WINDSURF / CLAUDE

## 60.1 Global Rules

- ห้ามลบ feature เดิมโดยไม่จำเป็น
- ห้ามเปลี่ยน architecture หลักโดยไม่อธิบาย
- ห้าม hardcode role/admin logic
- ห้ามเรียก database ตรงจาก UI component
- ห้ามข้าม validation
- ห้ามทำ UI ที่ไม่ responsive
- ห้ามทำ dark mode พัง
- ห้ามเขียน business logic ใน route handler ยาว ๆ
- ห้าม expose secret/token/password
- ห้าม return data ข้าม tenant

## 60.2 Required For Every Feature

ทุก feature ใหม่ต้องมี:

- route/page ที่ชัดเจน
- schema validation
- service layer
- repository layer ถ้ามี DB
- permission check
- tenant isolation ถ้าเป็น tenant data
- loading state
- error state
- empty state ถ้ามี list
- responsive UI
- dark/light support
- basic test หรือ test plan

## 60.3 Refactor Rules

- Refactor ต้องไม่ทำให้ behavior เดิมเสีย
- ถ้าเปลี่ยน response format ต้อง update consumer ทั้งหมด
- ถ้าแก้ permission ต้อง update seed และ test
- ถ้าเพิ่ม table ต้องเพิ่ม migration, index, seed ถ้าจำเป็น

## 60.4 Output Rules For AI Agent

เมื่อ AI ทำงาน ต้องสรุป:

- files changed
- features added
- security checks added
- migration needed or not
- test status
- manual test steps
- known limitations

---

# 61. SECURITY CHECKLIST BEFORE PRODUCTION

- [ ] `.env.production` ไม่รั่ว
- [ ] DATABASE_URL เป็น production DB
- [ ] HTTPS enabled
- [ ] Secure cookie enabled
- [ ] JWT secrets strong
- [ ] Login rate limit enabled
- [ ] Forgot password rate limit enabled
- [ ] API rate limit enabled
- [ ] Webhook signature verified
- [ ] Tenant isolation tested
- [ ] Permission tested
- [ ] Sensitive logs redacted
- [ ] Error stack hidden in production
- [ ] File upload validation enabled
- [ ] Backup configured
- [ ] Sentry/logging configured
- [ ] CI/CD build passing

---

# 62. PRODUCTION READINESS CHECKLIST

- [ ] Build success
- [ ] Typecheck success
- [ ] Lint success
- [ ] Unit tests pass
- [ ] E2E critical flow pass
- [ ] DB migration reviewed
- [ ] Seed production-safe
- [ ] Env validated
- [ ] Monitoring enabled
- [ ] Error tracking enabled
- [ ] Backup ready
- [ ] Rollback plan ready
- [ ] Queue worker running if needed
- [ ] Cron jobs configured if needed
- [ ] Stripe webhook configured if billing enabled
- [ ] Email provider configured

---

# 63. LEVEL SUMMARY

## Level 1 — Basic Starter

- Next.js App Router
- TypeScript
- UI template
- Auth
- Basic CRUD

## Level 2 — Advanced Starter

- Role/permission
- Theme
- i18n
- Reusable table/form
- API client
- Service layer

## Level 3 — Production Starter

- Repository layer
- Validation
- Error handling
- Logging
- Security
- Testing
- CI/CD

## Level 4 — SaaS Starter

- Multi-tenant
- Team
- Subscription
- Billing
- Usage limit
- Feature gating
- API key
- Audit log

## Level 5 — Enterprise Starter

- RBAC + ABAC
- Advanced audit
- SSO ready
- Impersonation
- Observability
- Webhook reliability
- Queue/jobs
- Deployment/backup/recovery

---

# 64. FINAL SUMMARY

Starter นี้ควรเป็น **Core System ของทุกโปรเจกต์ในอนาคต** โดยมี foundation ครบทั้ง:

- Architecture
- UI System
- Auth
- Role/Permission
- Multi-Tenant
- SaaS/Billing
- Security
- Testing
- Observability
- Deployment
- AI Agent Rules

เป้าหมายไม่ใช่แค่ “เริ่มโปรเจกต์ได้เร็ว” แต่ต้องทำให้โปรเจกต์ใหม่ทุกตัวมีมาตรฐานระดับ Sr.dev หรือสูงกว่า ตั้งแต่วันแรก

---

# 🏁 DONE — SENIOR / ENTERPRISE VERSION 3.0
