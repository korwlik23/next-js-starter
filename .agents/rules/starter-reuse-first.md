# Mandatory Starter Reuse-First Rule

This rule applies to every AI task in this repository.

1. Read `AGENTS.md`, `RULES.md`, all applicable `.agents/rules/` files, the README, `node_modules/next/dist/docs/`, and the relevant tests before changing Next.js code.
2. Search existing `src/modules/<context>`, routes, controllers, services, repositories, schemas, Prisma models, UI components, layouts, translations, configuration, and tests before creating anything.
3. Reuse the existing starter implementation first. Do not rewrite an existing feature and do not create a parallel route, page, module, service, or component to avoid fixing the original.
4. If the capability is genuinely missing, record the search evidence and add the smallest bounded module under the existing module structure.
5. Keep one responsibility per file. A route page composes; feature logic belongs in `src/modules/<context>`; shared UI belongs in `src/components/ui`.
6. Every API input must be validated and authorized. Tenant-owned data must be scoped server-side. Multi-step writes must be transactional or idempotent.
7. All UI text must use `next-intl` and be added to `messages/en.json`, `messages/th.json`, and `messages/ja.json` together. Shared UI changes belong in the shared component source, not in individual pages.
8. Add or update behavior tests before implementation when changing behavior. Required checks include `npm run lint`, `npm run typecheck`, `npm run test -- --runInBand`, `npm run build`, and `git diff --check` when applicable.
9. After changing `prisma/schema.prisma`, run `npx prisma generate` and verify migration/data safety. Do not use `db:push` as a substitute for a documented migration strategy in production.
10. Do not add dependencies, alter public contracts, change migrations, delete files, or modify data without documenting the risk and obtaining confirmation where the change is destructive or breaking.
11. Report exact files changed, commands run, observed results, remaining gaps, and rollback concerns. Never claim success from reasoning alone.
