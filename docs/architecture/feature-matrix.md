# Three Starter Feature Matrix

สถานะด้านล่างเป็นสถานะจาก source/config/tests ปัจจุบันของทั้งสาม starter และเป็น contract เดียวกันสำหรับ baseline กับ optional capability catalog

- `enabled` = capability/read path พร้อมใช้งานตาม contract และมีการตรวจด้วย test
- `partial` = มี implementation บางส่วน แต่ยังไม่ควรถือว่าเทียบเท่าเต็มรูปแบบ
- `disabled` = starter นี้ประกาศปิดอย่างชัดเจน ไม่ใช่การหายไปโดยเงียบ ๆ

## Baseline capabilities

Baseline keys เหมือนกันและเปิดใช้งานในทั้งสาม starter: `auth_session`, `rbac_permissions`, `settings`, `localization`, `notifications`, `audit_log`, `health_operations`, `ui_components`, `api_contract`, `ci_test_gates`.

## Capability status

| Capability | Class | Catalog key | Core | SaaS | Next | Equal-baseline contract |
|---|---|---|---|---|---|---|
| Auth/session | baseline | `auth_session` | enabled | enabled | enabled | Same lifecycle and failure semantics |
| RBAC/permissions | baseline | `rbac_permissions` | enabled | enabled | enabled | Same permission vocabulary and 401/403 rules |
| Settings | baseline | `settings` | enabled | enabled | enabled | Same validation and audit expectations |
| Localization | baseline | `localization` | enabled | enabled | enabled | Catalog parity and no hardcoded UI text |
| Notifications | baseline | `notifications` | enabled | enabled | enabled | Same read/unread and authorization semantics |
| Audit log | baseline | `audit_log` | enabled | enabled | enabled | Same critical event coverage |
| Health/operations | baseline | `health_operations` | enabled | enabled | enabled | Health, readiness, logging, and request correlation |
| UI components | baseline | `ui_components` | enabled | enabled | enabled | Same primitive/state matrix and showcase contract |
| API contract | baseline | `api_contract` | enabled | enabled | enabled | Versioned response, errors, pagination, and request correlation |
| CI/test gates | baseline | `ci_test_gates` | enabled | enabled | enabled | Required validation commands are documented and observable |
| Tenant isolation | optional | `tenant_isolation` | disabled | enabled | enabled | Same server-side scope and authorization contract when enabled |
| Billing/subscriptions | optional | `billing_subscriptions` | disabled | enabled | enabled | Same state/idempotency contract when enabled |
| Support tickets | optional | `support` | disabled | enabled | disabled | Explicitly unavailable until the capability is implemented |
| Private attachments | optional | `attachments` | enabled | enabled | enabled | Private storage and ownership/scope checks |
| MFA/OAuth | optional | `mfa_oauth` | disabled | disabled | enabled | Auth capability is declared by actual routes/config |
| Modules/feature flags | optional | `modules_feature_flags` | disabled | enabled | enabled | Existing module/flag pattern is the read path |
| Jobs/queues | optional | `jobs_queues` | partial | enabled | enabled | Retryable and observable asynchronous work |

## Catalog read paths

| Starter | Machine-readable source | Contract test |
|---|---|---|
| Core | `config('starter_capabilities')` from `config/starter_capabilities.php` | `tests/Feature/StarterCapabilitiesContractTest.php` |
| SaaS | `config('starter_capabilities')` from `config/starter_capabilities.php`; module toggles remain in `config/modules.php` | `tests/Feature/StarterCapabilitiesContractTest.php` |
| Next | `starterCapabilities` exported through `src/config/index.ts` from `src/config/feature-flags.config.ts` | `__tests__/config/starter-capabilities.test.ts` |

Any capability change must update its source catalog, contract test, this matrix, and the matching `PROJECT_SITEMAP.md` in the same change.

หมายเหตุ: SaaS มี CI command ครบ, workflow บังคับ Pint แล้ว และ local validation ผ่าน; baseline catalog จึงมี contract gate ระดับเดียวกับ starter อื่น ๆ.
