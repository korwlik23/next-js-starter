# 🚀 Ultimate Next.js Starter

A production-ready Next.js Starter Template designed for scalability, SaaS applications, and Enterprise use cases. It includes everything from a fully decoupled modular architecture, RBAC (Role-Based Access Control), Multi-tenancy support, to an advanced UI Design System.

## 🌟 Features

- **Framework:** Next.js 16 (App Router) + React 19
- **Database:** Prisma ORM, XAMPP (MySQL) support
- **Auth & Security:** JWT Auth (HTTP-only), Bcrypt, Jose, Edge-ready Route Protection
- **Multi-tenant SaaS:** Workspace/Tenant data isolation built-in (via Prisma Schema & Service Layer)
- **Role-Based Access (RBAC/ABAC):** Fine-grained permission system baked directly into controllers/UI (`<Can>` component)
- **Design System:** Tailwind CSS v4, Lucide Icons, Fully Reusable Components (`src/components/ui`)
- **Developer Tools:** Built-in UI Explorer (`/dev/ui`)
- **External Integrations:** Stripe Billing, Resend Email, OAuth (Google/Github)
- **Testing:** Unit Tests with Jest & E2E Tests with Playwright

## Project Planning

- Roadmap: [ROADMAP.md](./ROADMAP.md)
- Changelog: [CHANGELOG.md](./CHANGELOG.md)
- Current release: `0.2.0`

---

## 🛠 Prerequisites

1. **Node.js** (v20.9 or higher required for Next.js 16)
2. **XAMPP** (or any MySQL instance). Ensure your local MySQL server is running.
3. Database `nextjs_starter` created (or matching your connection string).

---

## 🔧 Environment Configuration (.env)

Before deploying or utilizing third-party features, make sure your `.env` file is properly configured.

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Update `DATABASE_URL` if you are using a different MySQL setup.
   ```env
   DATABASE_URL="mysql://root:@localhost:3306/nextjs_starter"
   ```
3. Set your secret keys (`JWT_SECRET`, `API_KEY`).
4. Set up third-party keys (Stripe, Resend, Google, Github) if required.

---

## 🚀 Getting Started (Setup & Run)

1. **Install Dependencies:**

   ```bash
   npm run setup
   ```

2. **Database Setup & Seeding:**
   Run the following commands to push the Prisma schema to your MySQL database and generate the initial seed data (Admin user, basic roles, and tenant).

   ```bash
   npm run db:push
   npm run db:generate
   npm run db:seed
   ```

   _(Alternatively, you can run `npm run setup` to install dependencies and initialize the DB in one command)._

3. **Run the Development Server:**

   ```bash
   npm run dev
   ```

   - Main App: `http://localhost:3000`
   - Dashboard: `http://localhost:3000/dashboard`
   - UI Component Library: `http://localhost:3000/dev/ui`

   _Seeded accounts (from `prisma/seed.ts`):_

   | Account | Email | Password | Purpose |
   | --- | --- | --- | --- |
   | Platform owner | `owner@starter.dev` | `password123` | Full permission set, not bound to the demo tenant |
   | Demo tenant admin | `admin@acme.com` | `password123` | Admin inside the seeded "Acme" tenant |
   | Demo tenant editor | `editor@acme.com` | `password123` | Reduced permissions, useful for testing boundaries |

   > Change these before exposing the app beyond local development.

---

## 🧪 Testing

We use **Jest** for Unit/Service tests and **Playwright** for End-to-End (E2E) UI tests.

### Run Unit Tests (Jest)

Tests the Service Layer, utility functions, and hooks.

```bash
npm run test
npm run test:watch      # Watch mode
npm run test:coverage   # View coverage report
```

### Run E2E Tests (Playwright)

Tests the complete user flows (Login, Register, etc.). Playwright will automatically start the dev server locally.

```bash
npm run test:e2e
```

---

## 🏗 Architecture & Modules

This starter strictly follows a **Layered/Modular Architecture** (`Route -> Controller -> Service -> Schema`). We decouple business logic from Next.js route handlers.

### 📂 Project Structure

```text
/src
 ├── app/              # Next.js App Router
 │   ├── (auth)/       # Public auth pages (Login, Register)
 │   ├── (main)/       # Protected pages (Dashboard, Admin, Settings)
 │   ├── api/          # Route handlers (Standardized Responses & Zod Validation)
 │   └── dev/          # Development tools
 │
 ├── components/       # Reusable UI & Layout Components
 │   └── ui/           # Design System (Input, Button, Spinner, etc.)
 │
 ├── modules/          # Core Business Logic (Decoupled from Framework)
 │   ├── user/         # Controller & Service for User Management
 │   ├── tenant/       # Workspace Isolation Logic
 │   ├── auth/         # JWT parsing, Permissions
 │   ├── notification/ # Notification Service
 │   └── analytics/    # Dashboard Analytics Service
 │
 ├── lib/              # Connectors (Prisma, Rate Limit, Auth Utils)
 └── utils/            # Shared string formatting, Standard API Response helpers
```

### How to Create a New Module

To add a new feature (e.g., `Product`):

1. **Update Database (`prisma/schema.prisma`)**

   ```prisma
   model Product {
     id       String @id @default(uuid())
     tenantId String
     name     String
     price    Float
     @@map("products")
   }
   ```

   Then run `npm run db:push` and `npm run db:generate`.

2. **Create the Module Folder:** `src/modules/product/`
   - **`schema.ts`**: Use Zod for input validation.
   - **`service.ts`**: Handles logic and direct interaction with Prisma.
   - **`controller.ts`**: Extracts Request/Params, validates with Zod, checks Permissions, and calls Service.

3. **Wire it to Next.js API Routes (`src/app/api/product/route.ts`)**

   ```ts
   import { ProductController } from '@/modules/product/controller'
   import { withAuth } from '@/lib/authorize'

   export const POST = withAuth(ProductController.createProduct, 'product:create')
   ```

_(By doing this, the Next.js router stays clean, and the Controller/Service are easily unit-testable)._

---

## 🛡️ License

MIT License
