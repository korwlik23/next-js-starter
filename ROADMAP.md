# Roadmap

This roadmap tracks the path from the current starter foundation to a production-ready SaaS starter release.

## Release Train

| Version | Target     | Status   | Theme                                         |
| ------- | ---------- | -------- | --------------------------------------------- |
| 0.2.0   | 2026-05-11 | Prepared | Security and operations foundation            |
| 0.3.0   | Next       | Planned  | Auth UX hardening and release-safe migrations |
| 0.4.0   | Next       | Planned  | Testing, QA, and API confidence               |
| 0.5.0   | Next       | Planned  | Observability and production operations       |
| 0.6.0   | Next       | Planned  | Developer experience and documentation polish |
| 1.0.0   | Later      | Planned  | Stable starter contract                       |

## v0.2.0 - Security and Operations Foundation

Status: prepared.

Included:

- Request tracing with `x-request-id`.
- Security headers and baseline CSP.
- Admin operations snapshot page and API.
- OpenAPI JSON endpoint.
- CI quality gates for lint, typecheck, tests, Prisma validation, build, and E2E smoke.
- Email verification token model, email template, verification endpoint, and resend endpoint.
- Login attempt tracking and lockout.
- Optional `REQUIRE_EMAIL_VERIFICATION` login gate.
- TOTP MFA setup, confirmation, challenge verification, disable flow, and recovery codes.
- Login UI support for MFA challenges.
- Settings security controls for email verification and MFA.

Operational notes:

- Development databases created before the migration history may need `npm run db:push` or a proper Prisma baseline before `migrate deploy`.
- The seed owner account is `owner@starter.dev / password123`.

## v0.3.0 - Auth UX and Migration Safety

Priority: must fix.

Scope:

- Add a documented Prisma migration baseline flow for existing local databases.
- Update setup docs so a fresh developer can run install, schema sync, seed, and login without hidden steps.
- Set dev seed owner email verification intentionally, or document the verification path.
- Add QR code rendering for MFA setup.
- Add copy buttons for MFA secret, OTP auth URI, and recovery codes.
- Add recovery code regeneration.
- Add login status handling for `?verified=1` and `?error=verification`.
- Improve user-facing auth errors for lockout, invalid credentials, email verification, and MFA failures.

Exit criteria:

- Fresh setup succeeds from README commands.
- Owner login works after setup.
- MFA setup is usable without manually copying an OTP URI unless the user chooses to.

## v0.4.0 - Testing and API Confidence

Priority: should fix.

Scope:

- Add route handler tests for email verification resend and MFA endpoints.
- Add E2E smoke tests for login, register, email verification, MFA setup, MFA login challenge, and settings security.
- Add OpenAPI schema details for auth request and response payloads.
- Add CI artifacts for failed Playwright traces/screenshots.
- Add regression tests for database schema fields used by auth.

Exit criteria:

- Auth critical paths are covered by automated tests.
- CI failure output is actionable without rerunning locally first.

## v0.5.0 - Observability and Production Operations

Priority: should fix.

Scope:

- Add structured request logging for auth and admin operations.
- Add audit events for MFA enable, MFA disable, verification resend, and account lockout.
- Add rate limiting for `/api/auth/mfa/verify`, `/api/auth/verify-email/resend`, forgot password, and reset password.
- Add database, queue, and migration status to the admin ops dashboard.
- Add backup, restore, rollback, and incident runbooks.
- Add uptime and queue alert recommendations.

Exit criteria:

- Operators can detect auth abuse, failed background work, and database issues from standard surfaces.
- Production rollout has rollback and recovery instructions.

## v0.6.0 - Developer Experience and Documentation

Priority: consider fixing.

Scope:

- Split security settings into `/settings/security` if the settings page continues to grow.
- Add session and device management with revoke capability.
- Add password strength feedback and clearer password policy UI.
- Localize new auth and settings copy.
- Add friendly API docs page on top of the OpenAPI JSON endpoint.
- Refresh README, environment reference, and project architecture docs.

Exit criteria:

- New contributors can understand the project shape and ship a safe module quickly.
- User-facing security flows feel polished on desktop and mobile.

## v1.0.0 - Stable Starter Contract

Priority: future.

Scope:

- Freeze the public starter conventions for module structure, auth contracts, permissions, tenant boundaries, and deployment flow.
- Complete production checklist for security, migrations, monitoring, backups, CI/CD, and documentation.
- Verify upgrade path from the last pre-1.0 release.
- Confirm default seed data and environment templates are safe and intentional.

Exit criteria:

- The starter can be used as a stable base for production SaaS projects.
- Breaking changes require a major version after this point.
