# Starter Baseline Contract

This contract describes behavior that must remain equivalent across the three starters. Runtime implementations remain stack-native.

## Required baseline capabilities

- authentication and session lifecycle
- user, role, and permission management
- settings and localization
- notifications and audit log
- health/readiness checks
- API validation, errors, pagination, and request correlation
- shared UI primitives and loading/error/empty/disabled/unauthorized states
- deterministic tests and enforced build/quality gates

## Optional capabilities with a common contract

- tenant and membership isolation
- billing, subscription, payment, invoice, entitlement, and webhook idempotency
- support tickets and private attachments
- MFA/OAuth
- modules, feature flags, jobs, queues, and backup operations

## Contract rules

1. Authentication failure is 401; authenticated denial is 403.
2. Every protected resource checks authorization and ownership/tenant scope server-side.
3. Every mutation validates input and protects multi-step writes from partial failure.
4. Collection endpoints are bounded, paginated, and return consistent error details.
5. UI text is localized; shared component changes happen at the component source.
6. Optional capability behavior is documented as enabled/disabled, never silently absent.
