# Project Sitemap

> Generated: 2026-08-07 | Stack: Next.js 16.2.1 + React 19.2.4 + Prisma + MySQL + next-intl | Commit: f042df2
> Scan scope: src, Prisma schema/migrations, public, unit tests, and E2E tests. Dependencies, caches, generated output, and lockfiles are excluded from file metrics.

## Quick Overview

- Project: Next.js Starter
- Purpose: modular SaaS/enterprise starter with authentication, tenant isolation, RBAC/ABAC, billing, i18n, reusable UI, and API routes.
- Entry points: src/app/layout.tsx, src/app/page.tsx, src/proxy.ts, src/app/api/**, prisma/schema.prisma.
- Architecture: App Router pages/layouts, route handlers, feature modules under src/modules, shared libraries under src/lib, React UI under src/components, Prisma data layer, and next-intl locale routing/configuration.
- Runtime target: standalone Next.js output; Dockerfile and docker-compose.yml are present.
- Locales/messages: en, th, ja under messages/ and locales/.

## Directory Map

~~~text
src/
  app/
    (auth)/                         login, register, password reset pages/layout
    (main)/                         protected application pages/layout
    api/                            root and /v1 route handlers
    dev/                            developer-only permissions, API, theme, UI tools
    layout.tsx, page.tsx            root layout and landing page
    loading/error/not-found/...     global runtime states
    globals.css                     CSS variables, themes, global styles
  components/
    ui/                             base UI primitives and barrel export
    layout/                         Sidebar, TopNav, providers, guards, theme
    table/                          DataTable
    form/, feedback/, guard/, chart/ reusable feature-level components
  modules/
    auth, tenant, user, role         identity, tenant, and permission domain logic
    billing, feature, analytics      business/domain services and schemas
    audit, notification              audit and notification logic
    translation, i18n                catalog and translation logic
    health, jobs, admin              operations and background/admin logic
  lib/                              auth, JWT, Prisma, tenant, API, storage, Stripe, queue, logging
  i18n/                             request/config/server locale helpers
  theme/                            design tokens and theme exports
  config/                           runtime, auth, billing, and feature-flag configuration
prisma/
  schema.prisma                     31 models
  migrations/                       3 migration directories
  seed.ts                           baseline admin/role/tenant seed
messages/                            en, th, ja application messages
locales/                             en, th, ja locale resources
public/                              static assets
__tests__/                           Jest and Testing Library tests
e2e/                                 Playwright tests
.github/workflows/ci.yml             lint, typecheck, Prisma, unit, build, E2E
Dockerfile, docker-compose.yml       standalone/container runtime
~~~

## Page Route Map

Observed page file count: 30 page.tsx files.

| Route group | Pages | Source |
|---|---|---|
| Public | / | src/app/page.tsx |
| Auth | /login, /register, /forgot-password, /reset-password | src/app/(auth)/**/page.tsx |
| Dynamic module CRUD | /[module], /[module]/create, /[module]/[id], /[module]/[id]/edit | src/app/(main)/[module]/** |
| Main | /dashboard, /analytics, /billing, /profile, /role, /user | src/app/(main)/*/page.tsx |
| Admin | /admin, /admin/audit-logs, /admin/ops, /admin/translations | src/app/(main)/admin/** |
| Settings | /settings, /settings/team, /settings/billing, /settings/audit, /settings/api-keys | src/app/(main)/settings/** |
| Developer tools | /dev/permissions, /dev/test-api, /dev/theme, /dev/ui | src/app/dev/** |
| Error/permission | /forbidden, /server-error; global error/not-found/loading handlers | src/app/forbidden, server-error, error.tsx, global-error.tsx, not-found.tsx, loading.tsx |

Layouts:

- src/app/layout.tsx — root providers, metadata, next-intl integration
- src/app/(auth)/layout.tsx — auth shell
- src/app/(main)/layout.tsx — protected application shell
- src/app/dev/layout.tsx — development-only tools and production restriction behavior

## API Route Map

Observed API route file count: 76 route.ts files.

| Surface | Route groups | Source |
|---|---|---|
| Auth | /api/auth/login, logout, me, register, refresh, forgot-password, reset-password, verify-email, MFA setup/confirm/disable/verify, dynamic OAuth provider/login/callback | src/app/api/auth/** |
| Admin | /api/admin/audit-logs, features, i18n, i18n/auto-translate, ops, stats, translations, translations/revalidate | src/app/api/admin/** |
| Identity/permissions | /api/user, /api/user/[id], /api/role, /api/role/[id], /api/permission, /api/api-keys | src/app/api/** |
| Tenant | /api/tenant, /api/tenant/invite, /api/tenant/members | src/app/api/tenant/** |
| Billing | /api/billing, /api/checkout, /api/billing/webhook, Stripe webhook facade | src/app/api/billing/** and src/app/api/webhooks/stripe |
| Platform | /api/health, /api/audit, /api/analytics, /api/notification, /api/upload, /api/storage/file | src/app/api/** |
| Jobs/docs/i18n | /api/inngest, /api/internal/jobs/worker, /api/docs/openapi, /api/i18n/config | src/app/api/** |
| Versioned compatibility | /api/v1/auth, admin, audit, billing, checkout, tenant, user, role, permission, notification, storage, upload, api-keys, internal health/jobs | src/app/api/v1/** |

The /api/v1 tree is a compatibility/versioned surface. Several files are thin re-exports of root handlers; treat the route file as the public surface and the root module as the canonical implementation where re-exported.

## Data Models

Prisma source: prisma/schema.prisma.

| Domain | Models |
|---|---|
| Identity/tenant | User, Tenant, TenantMembership, Invitation, Account |
| RBAC | Role, Permission, RolePermission, UserRole, UserPermission |
| Session/security | RefreshToken, Session, ResetPasswordToken, EmailVerificationToken, LoginAttempt, UserMfaSetting, MfaChallenge, MfaRecoveryCode, ImpersonationSession |
| Billing | Subscription |
| Communication/audit | Notification, AuditLog, EmailLog |
| API/platform | ApiKey, IdempotencyKey, WebhookEvent, UploadedFile |
| i18n/features | Translation, Locale, I18nSetting, FeatureFlag |

Migration directories:

- prisma/migrations/20260505000000_enterprise_v3_foundation
- prisma/migrations/20260506000000_i18n_locale_settings
- prisma/migrations/20260508000000_auth_security_foundation

Relations and invariants are defined in schema.prisma; tenant-scoped access helpers live in src/lib/tenant-context.ts and src/lib/tenant-scope.ts, with domain repositories/services under src/modules.

## Authentication, Tenant, and Authorization Flow

~~~mermaid
flowchart LR
  Request[Request] --> Proxy[src/proxy.ts]
  Proxy --> Locale[Locale + request id]
  Proxy --> RateLimit[API/auth rate limit]
  Proxy --> Token[Access/refresh cookie verification]
  Token --> Permission[Admin permission gate]
  Permission --> PageOrApi[Protected page or API route]
  PageOrApi --> AuthModule[src/modules/auth]
  AuthModule --> Prisma[Prisma session/token records]
  PageOrApi --> Tenant[tenant context and scope]
  Tenant --> Domain[domain module service]
~~~

- Access and refresh tokens are stored in HTTP-only cookies through src/lib/auth.ts.
- Access tokens carry session identifiers; refresh-token records are checked for active/revoked sessions.
- src/proxy.ts detects locale, attaches request/trace IDs, rate-limits API/auth requests, redirects unauthenticated pages, returns JSON 401/403 for APIs, and checks admin.access.
- src/modules/auth contains registration, login throttle, password reset, email verification, MFA, session, token, principal, and impersonation logic.
- Tenant boundaries are implemented through src/lib/tenant-context.ts, src/lib/tenant-scope.ts, src/lib/authorize.ts, ABAC/permission helpers, and tenant module services.

## Modules and Services

| Module | Main files / responsibility |
|---|---|
| auth | controller, service, repository, schemas, API guard, MFA/session/password/email verification internals |
| tenant | controller, repository, schema, service, membership and tenant settings |
| user | controller, repository, schema, service |
| role | controller, repository, schema, service |
| billing | controller, schema, service, limits |
| feature | controller, schema, service, feature gates |
| audit | controller, schema, service |
| translation/i18n | controllers/services/schemas plus catalog, registry, normalization, auto-translate internals |
| notification | service |
| analytics | service |
| health | service |
| jobs | welcome email and job handling |
| admin | service |

Key shared libraries include src/lib/prisma.ts, jwt.ts, auth.ts, permissions.ts, authorize.ts, abac.ts, rate-limit.ts, idempotency.ts, storage.ts, stripe.ts, email.ts, queue.ts, inngest.ts, logger.ts, openapi.ts, sanitize.ts, transaction.ts, and error-monitoring.ts.

## External Integrations and Runtime Services

| Integration | Purpose | Configuration names only |
|---|---|---|
| Prisma + MySQL | schema, migrations, repositories, sessions | DATABASE_URL |
| Stripe | billing, checkout, webhook processing | STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_* |
| Resend/Postmark/SMTP | email delivery options | RESEND_API_KEY, POSTMARK_SERVER_TOKEN, SMTP_* |
| Google/GitHub OAuth | provider login/callbacks | GOOGLE_CLIENT_ID/SECRET, GITHUB_CLIENT_ID/SECRET |
| AWS S3-compatible storage | uploaded-file storage | S3_* |
| Upstash Redis/Redis | rate limits and cache | UPSTASH_REDIS_REST_*, REDIS_URL |
| Inngest/worker routes | background jobs | Inngest configuration in src/lib/inngest.ts |
| next-intl | locale requests and messages | messages/, locales/, src/i18n/ |
| Recharts/Lucide/React Query | charts, icons, client data workflows | package.json |

No environment values or credentials are included in this sitemap.

## UI Components

Base UI under src/components/ui:

- Accordion, Avatar, Badge, Button, Can, Checkbox
- DatePicker, Drawer, Dropdown, FileUploadDropzone
- Input, Loader, Modal, Radio, SearchInput
- Select, SelectMenu, Skeleton, Switch, Tabs, Tooltip
- NotificationDropdown, ComponentShowcase, and showcase sections

The barrel file src/components/ui/index.tsx exports the listed primitives, including NotificationDropdown. `/dev/ui` renders ComponentShowcase and its state sections. Other shared component areas:

- src/components/layout: Sidebar, SidebarGroup, TopNav, ThemeToggle, providers, guards, error boundary
- src/components/form: FileUpload and form index
- src/components/table: DataTable
- src/components/chart: BarChart, LineChart, StatCard
- src/components/feedback: feedback exports
- src/components/guard: FeatureGate and guard exports

Developer showcase: /dev/ui -> src/app/dev/ui/page.tsx. Other developer surfaces: /dev/permissions, /dev/test-api, /dev/theme.

## Tests

| Area | Files |
|---|---|
| UI | __tests__/components/ui/Button.test.tsx, ComponentShowcase.test.tsx |
| Capability contract | __tests__/config/starter-capabilities.test.ts |
| Hooks/utils | __tests__/hooks.test.tsx, __tests__/utils/api.test.ts |
| Security/platform libraries | __tests__/lib/job-handlers.test.ts, openapi.test.ts, permissions.test.ts, rate-limit.test.ts, sanitize.test.ts, storage.test.ts, tenant-context.test.ts, tenant-scope.test.ts, totp.test.ts, ulid.test.ts |
| Services | __tests__/services/analytics.test.ts, auth.service.test.ts, notification.test.ts, user.test.ts |
| E2E | e2e/auth.spec.ts, e2e/example.spec.ts, e2e/main-flow.spec.ts |

## CI/CD and Local Commands

Workflow: .github/workflows/ci.yml

~~~text
npm ci
npm run db:generate
npm run db:validate
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
npm run db:push
npm run db:seed
npx playwright install --with-deps chromium
npx playwright test --project=chromium
~~~

Dockerfile uses standalone output; docker-compose.yml provides local container orchestration. Repository convention after schema changes: npx prisma generate.

## Configuration

- Next runtime/security: next.config.ts, src/proxy.ts, src/lib/env.ts.
- Locale setup: src/i18n/request.ts, src/i18n/config.ts, src/i18n/server.ts.
- Theme: src/app/globals.css, src/theme/tokens.ts, src/theme/index.ts.
- Capability catalog: `starterCapabilities` from src/config/feature-flags.config.ts, re-exported by src/config/index.ts.
- Database: prisma/schema.prisma and prisma/seed.ts.
- Environment variable names are documented by .env.example; values are intentionally omitted.
- CI supplies non-secret dummy values only in the workflow environment; no runtime secret values are copied here.

## Capability Catalog

`starterCapabilities` is the machine-readable read path and is exported through `src/config/index.ts`. All baseline keys are enabled. Optional tenant isolation, billing/subscriptions, private attachments, MFA/OAuth, modules/feature flags, and jobs/queues are enabled; support tickets are disabled because no support-ticket route/module exists in the current source.

## File Metrics

Metric scope: files under src, prisma, public, __tests__, and e2e; dependencies, caches, generated output, and lockfiles excluded.

| Metric | Value |
|---|---:|
| Scanned files | 351 |
| Scanned lines | 30,039 |
| Page files | 30 |
| API route files | 76 |
| Layout files | 4 |
| Module files | 54 |
| UI implementation files | 30 |
| Prisma models | 31 |
| Prisma migration directories | 3 |
| Test files | 23 |

Largest scanned files:

1. src/app/(main)/admin/translations/page.tsx — 598 lines
2. prisma/schema.prisma — 533 lines
3. src/app/(main)/settings/page.tsx — 442 lines
4. src/app/(main)/dashboard/page.tsx — 438 lines
5. src/app/(main)/billing/page.tsx — 422 lines

Additional large files: src/app/(main)/billing/page.tsx (400), src/components/table/DataTable.tsx (370), src/app/dev/test-api/page.tsx (366), src/app/globals.css (356), and src/app/(auth)/login/page.tsx (344).

## Limitations

- This is a static code map; external OAuth, Stripe, email, S3, Redis, and monitoring credentials were not used.
- Page/API route lists reflect filesystem route handlers; dynamic runtime behavior and middleware branches were not exercised for every route.
- Browser validation is represented by the existing Playwright specs, not a full visual audit of all 30 pages or 76 API routes.
- node_modules, .next, build/cache output, generated Prisma client, and lockfiles are excluded.
- The /api/v1 surface includes compatibility route files; implementation duplication cannot be inferred from path count alone.
- The sitemap is a snapshot and should be regenerated after significant route, schema, module, or component changes.
