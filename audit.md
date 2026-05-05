# TASK: AUDIT EXISTING NEXT.JS STARTER PROJECT AGAINST PROJECT SPEC

You are a Senior+ Fullstack Engineer, Software Architect, Security Reviewer, and QA Lead.

Your task is to audit this existing Next.js project against the project specification file:

- Spec file: `ULTIMATE_NEXT_JS_STARTER_SENIOR_V3.md`
- Project type: Next.js Starter Template
- Goal: reusable, production-ready, SaaS-ready, enterprise-ready starter
- Tech target: Next.js App Router, TypeScript, Prisma, MySQL, Tailwind, reusable UI, auth, RBAC/ABAC, multi-tenant ready

Important:

- DO NOT rewrite the whole project immediately.
- DO NOT delete existing features.
- DO NOT make random UI changes.
- First, inspect the current project carefully.
- Compare actual implementation with the spec.
- Find missing, incomplete, incorrect, duplicated, risky, or low-quality parts.
- Then produce a detailed audit report and implementation roadmap.

---

# 1. READ FIRST

Before making any change, read and understand:

- `ULTIMATE_NEXT_JS_STARTER_SENIOR_V3.md`
- `package.json`
- `next.config.*`
- `tsconfig.json`
- `.env.example` if exists
- `prisma/schema.prisma` if exists
- `/src/app`
- `/src/components`
- `/src/modules`
- `/src/lib`
- `/src/services`
- `/src/hooks`
- `/src/store`
- `/src/config`
- `/src/types`
- `/src/middleware.ts`
- auth implementation
- API routes
- Server Actions
- database access patterns
- UI components
- route protection
- role/permission logic
- tenant-related logic
- security-related files
- tests if any

---

# 2. AUDIT GOAL

Compare the current project against the spec and classify every important item into:

- ✅ Implemented correctly
- 🟡 Partially implemented
- 🔴 Missing
- ⚠️ Implemented but risky / wrong pattern
- ♻️ Duplicate / should be refactored
- 🚀 Good but can be upgraded

---

# 3. AUDIT AREAS

Audit the project in these areas:

## A. Project Foundation

Check:

- Next.js App Router usage
- TypeScript strictness
- ESLint / Prettier
- path alias `@/`
- environment config
- project folder structure
- naming consistency
- file organization
- modular architecture

Output:

- what exists
- what is missing
- what should be refactored

---

## B. Architecture Pattern

Check if the project follows this intended flow:

```txt
UI / Page
→ Server Action or API Route
→ Controller / Action Layer
→ Service Layer
→ Repository Layer
→ Prisma
→ Database
```

Rules:

- UI components must not call Prisma directly
- route handlers must not contain large business logic
- services must contain business rules
- repositories must contain database queries
- tenant filtering must happen consistently
- validation must happen before mutation

Find violations and list exact files.

---

## C. Next.js App Router / Server Actions

Check:

- which features use API Routes
- which features use Server Actions
- whether usage is consistent
- whether mutations are protected
- whether revalidation/cache invalidation exists
- whether client/server boundaries are correct
- whether unnecessary `"use client"` exists

Classify:

- should stay API Route
- should become Server Action
- should stay Client Component
- should become Server Component

---

## D. UI System

Compare against spec:

- reusable UI components
- Button
- Input
- Select
- Checkbox / Radio
- Modal / Drawer
- Dropdown
- Tooltip
- Tabs / Accordion
- Badge / Avatar
- Spinner / Skeleton
- layout components
- form components
- table components
- feedback components

Check:

- dark/light support
- design tokens
- no hardcoded random colors
- responsive PC/mobile
- consistent spacing
- accessibility
- loading states
- empty states
- error states

List missing UI components and weak components.

---

## E. Auth System

Audit:

- login
- register
- forgot password
- password reset
- session persistence
- JWT / cookie strategy
- httpOnly cookie
- refresh token
- logout
- middleware route protection
- auth API security
- password hashing
- brute-force protection
- rate limit

Find security gaps.

---

## F. Role / Permission System

Audit against spec:

- User
- Role
- Permission
- UserRole
- RolePermission
- optional UserPermission override
- `can(user, permission)`
- permission naming format
- frontend `<Can />` component
- `usePermission()`
- server-side permission guard
- API protection
- multi-role support
- tenant-aware permissions
- RBAC + ABAC readiness

Important rule:

Frontend permission guard is UX only.
Server-side permission check is mandatory.

Find any place that relies only on frontend hiding.

---

## G. Multi-Tenant Readiness

Check:

- tenant table/model
- tenantId in required tables
- tenant isolation
- tenant-aware queries
- tenant-aware roles
- tenant-aware permissions
- tenant switching
- organization/team model
- invite flow
- tenant settings

Find any query that may leak data across tenants.

---

## H. Database / Prisma

Audit:

- Prisma schema quality
- naming consistency
- relation design
- indexes
- unique constraints
- composite indexes
- soft delete fields
- createdAt / updatedAt
- ULID/UUID strategy
- migration readiness
- seed file
- database reset command
- demo data

Check if important indexes exist:

- users.email
- users.tenantId
- roles.tenantId
- user_roles.userId
- user_roles.roleId
- role_permissions.roleId
- role_permissions.permissionId
- audit_logs.userId
- audit_logs.tenantId
- audit_logs.createdAt
- tenantId + createdAt
- tenantId + status
- tenantId + deletedAt

---

## I. API System

Audit:

- API route naming
- `/api/{module}` structure
- `/api/v1` readiness
- standard response format
- standard error format
- validation with Zod
- rate limiting
- authentication
- authorization
- idempotency
- request logging
- trace id
- pagination
- search/filter/sort query format

Expected response format:

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

Expected error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

---

## J. Forms / Tables / CRUD

Audit:

- reusable CRUD template
- create page
- edit page
- detail page
- list page
- delete flow
- confirmation modal
- optimistic UI if any
- pagination
- sorting
- filtering
- search debounce
- query params sync
- form validation
- field errors
- loading state
- empty state
- permission-aware actions

---

## K. Security

Perform security audit for:

- XSS
- CSRF
- SQL injection risk
- auth bypass
- permission bypass
- tenant data leak
- exposed secrets
- unsafe file upload
- unsafe API route
- missing rate limit
- brute force protection
- session fixation
- insecure cookies
- sensitive data in logs
- unsafe CORS
- missing security headers
- missing CSP
- unsafe redirects
- missing input validation
- duplicate request problem
- idempotency for critical flows

Do not exploit anything.
Only report issues and safe fixes.

---

## L. File Upload / Storage

Audit:

- upload API
- file type validation
- file size validation
- filename sanitization
- image preview
- signed URL support
- public/private storage
- executable upload prevention
- per-user/per-tenant quota
- cleanup unused files

---

## M. SaaS / Billing / Stripe Readiness

Audit:

- plans
- subscriptions
- payment status
- trial system
- usage limits
- feature gating
- billing page
- invoice page
- Stripe integration readiness
- webhook endpoint
- webhook signature verification
- processed webhook event log
- idempotency for payment/webhook
- subscription state sync
- reconciliation job

---

## N. Notification / Email

Audit:

- toast notification
- in-app notification
- email provider readiness
- email templates
- invite email
- reset password email
- billing email
- failed payment email
- email queue
- email log
- retry strategy

---

## O. Logging / Audit Log / Observability

Audit:

- app logger
- error logger
- business event logger
- audit log
- before_data / after_data
- user_id
- tenant_id
- trace_id
- request_id
- error tracking readiness
- metrics readiness
- slow query logging
- failed job logging

---

## P. Performance

Audit:

- unnecessary client components
- heavy bundle
- lazy loading
- dynamic import
- image optimization
- query optimization
- N+1 query risk
- pagination
- caching
- React Query usage
- server cache
- cache invalidation
- database indexes
- avoid `select *`
- avoid loading too much data

---

## Q. Testing

Audit existing tests:

- unit tests
- integration tests
- E2E tests
- auth tests
- permission tests
- tenant isolation tests
- API tests
- form tests
- billing tests
- webhook tests
- security regression tests

Recommend test files to add.

Preferred tools:

- Vitest
- React Testing Library
- Playwright
- MSW

---

## R. Deployment / DevOps

Audit:

- production build
- environment variables
- `.env.example`
- Dockerfile
- docker-compose
- MySQL service
- Redis service
- PM2 readiness
- VPS deployment readiness
- Vercel readiness
- CI/CD
- GitHub Actions
- migration strategy
- zero-downtime migration notes
- secret management
- backup strategy

---

## S. Documentation

Audit:

- README
- setup guide
- env guide
- database guide
- auth guide
- role/permission guide
- module creation guide
- deployment guide
- troubleshooting guide
- AI agent rules
- contribution rules

---

# 4. OUTPUT FORMAT

Create a new file:

```txt
audit_project_vs_spec.md
```

The report must include:

## 1. Executive Summary

- project current maturity level
- strongest parts
- weakest parts
- biggest risks
- estimated completion percentage against spec

Use percentage by area:

```txt
Foundation: xx%
UI System: xx%
Auth: xx%
RBAC: xx%
Multi-Tenant: xx%
Database: xx%
Security: xx%
Testing: xx%
SaaS/Billing: xx%
DevOps: xx%
Overall: xx%
```

---

## 2. Spec Compliance Matrix

Create a table:

| Area | Spec Requirement | Current Status | Evidence/File | Gap | Priority |
| ---- | ---------------- | -------------- | ------------- | --- | -------- |

Priority:

- P0 = critical/security/data leak/build broken
- P1 = required for production
- P2 = important improvement
- P3 = nice to have

---

## 3. File-Level Findings

For each issue:

```md
### Finding ID: AUDIT-001

Severity: P0 / P1 / P2 / P3  
Area: Auth / Security / UI / DB / Architecture / etc.  
File(s):

- path/to/file.ts

Current Problem:
...

Why It Matters:
...

Expected by Spec:
...

Recommended Fix:
...

Risk if Not Fixed:
...
```

---

## 4. Missing Features

Group missing features by area:

- Auth
- RBAC
- Multi-Tenant
- UI
- API
- Database
- Security
- SaaS
- Testing
- DevOps

---

## 5. Refactor Recommendations

List:

- duplicated code
- bad architecture
- wrong folder placement
- direct DB access from wrong layer
- hardcoded values
- repeated UI patterns
- inconsistent API responses

---

## 6. Security Risk Report

Separate section for:

- critical vulnerabilities
- high risk
- medium risk
- low risk

Do not provide exploit steps.
Only provide safe remediation.

---

## 7. Implementation Roadmap

Create roadmap:

### Phase 0: Stabilize

Fix build errors, broken imports, env, TypeScript errors.

### Phase 1: Architecture Alignment

Service/repository, module structure, standard response, validation.

### Phase 2: Auth + RBAC Hardening

Auth, permission guard, middleware, server-side authorization.

### Phase 3: Multi-Tenant Safety

tenantId, query isolation, tenant-aware roles.

### Phase 4: UI System Completion

Reusable components, forms, tables, layout, responsive, dark/light.

### Phase 5: Security + Observability

rate limit, audit log, logger, trace id, security headers.

### Phase 6: SaaS Readiness

billing, webhook, plan, subscription, usage limit.

### Phase 7: Testing + CI/CD

unit, integration, E2E, GitHub Actions, deployment.

---

## 8. Recommended Next AI Prompts

At the end, create 5 follow-up prompts:

1. Prompt to fix architecture
2. Prompt to fix auth/RBAC
3. Prompt to fix UI system
4. Prompt to fix security
5. Prompt to add tests

---

# 5. IMPORTANT RULES

- Do not modify code in this audit step unless there is a build-breaking issue and the fix is trivial.
- Prefer reporting first.
- Be specific with file paths.
- Do not give generic advice.
- Every finding must include evidence.
- Do not remove existing features.
- Do not change the design theme.
- Do not introduce new libraries unless clearly justified.
- Keep compatibility with local XAMPP MySQL database named `nextjs_starter`.
- Assume this starter will be reused for many future projects.

```

```
