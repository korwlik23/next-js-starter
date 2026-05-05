# TASK: FIX PROJECT BASED ON AUDIT REPORT

Read:

- `ULTIMATE_NEXT_JS_STARTER_SENIOR_V3.md`
- `audit_project_vs_spec.md`

You are now allowed to modify code.

Goal:
Fix the project according to the audit report, but do it safely in phases.

Rules:

- Do not rewrite the whole project.
- Do not remove existing features.
- Do not change the design direction.
- Do not skip security-related P0/P1 issues.
- Fix one phase at a time.
- After each phase, run typecheck/build/lint if available.
- Update the audit report status after completing each phase.

Execution order:

1. Fix P0 issues first
2. Fix build/type errors
3. Fix architecture violations
4. Fix auth/security/RBAC
5. Fix tenant isolation
6. Fix API response + validation
7. Fix UI reusable components
8. Add missing tests
9. Update documentation

Before editing each phase:

- list files that will be changed
- explain why
- then apply changes

After editing each phase:

- summarize changed files
- list remaining risks
- list next recommended phase

````

ถ้าจะให้เข้มกว่านี้ ใช้ prompt นี้สำหรับ “ห้าม AI มั่ว/ห้ามลบของเดิม”

```md
# STRICT DEVELOPMENT RULES

While working on this project:

- Never delete working code unless replacing it with a better equivalent.
- Never remove routes, pages, components, or modules without explaining why.
- Never bypass TypeScript errors with `any` unless absolutely necessary.
- Never use `// @ts-ignore` unless documented.
- Never hardcode role checks like `user.role === "admin"`.
- Always use permission-based checks.
- Never trust frontend guards for security.
- Always enforce authorization on the server.
- Never query tenant data without tenantId filtering.
- Never expose secrets to client components.
- Never put business logic directly inside UI components.
- Never call Prisma directly from client components.
- Every mutation must validate input with Zod.
- Every API must return standard response format.
- Every critical action should be audit logged.
- Every payment/webhook/order-like action must be idempotent.
- Every new UI must support dark/light mode and mobile.
```
````
