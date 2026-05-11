# Changelog

All notable changes to this project will be documented in this file.

Format follows the spirit of Keep a Changelog, and versions follow Semantic Versioning.

## [Unreleased]

### Planned

- Auth UX hardening, including MFA QR code rendering and recovery code regeneration.
- Migration baseline documentation for existing development databases.
- Route and E2E tests for auth-critical flows.

## [0.2.0] - 2026-05-11

### Added

- Request tracing through `x-request-id`.
- Security response headers and baseline CSP.
- Admin operations API and dashboard page.
- OpenAPI JSON endpoint for core API routes.
- CI quality gates for lint, typecheck, tests, Prisma validation, build, and E2E smoke.
- Email verification tokens, verification endpoint, resend endpoint, and email template.
- Login attempt tracking with lockout.
- Optional `REQUIRE_EMAIL_VERIFICATION` login gate.
- TOTP MFA setup, confirmation, challenge verification, disable flow, and recovery codes.
- MFA-aware login UI.
- Settings security controls for email verification and MFA.

### Changed

- Auth `/me` response now includes `emailVerifiedAt` and `mfaEnabled`.
- App and package version are aligned at `0.2.0`.
- OpenAPI metadata now reports the aligned app version.

### Fixed

- Local login failure caused by database schema drift after adding auth security fields, resolved by syncing the development database schema.

### Operational Notes

- Existing local databases that were created before Prisma migration history may need a baseline strategy before using `prisma migrate deploy`.
- For local development, `npm run db:push` syncs the schema safely for the current starter workflow.
