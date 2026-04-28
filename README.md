# 🚀 Ultimate Next.js Starter

A production-ready Next.js Starter Template designed for scalability, SaaS applications, and Enterprise use cases. It includes everything from a fully decoupled modular architecture, RBAC (Role-Based Access Control), Multi-tenancy support, to an advanced UI Design System.

## 🌟 Features

- **Framework:** Next.js (App Router) + React 19
- **Database:** Prisma ORM, XAMPP (MySQL) support
- **Auth & Security:** JWT Auth (HTTP-only), Bcrypt, Jose, Edge-ready Route Protection
- **Multi-tenant SaaS:** Workspace/Tenant data isolation built-in (via Prisma Schema)
- **Role-Based Access (RBAC/ABAC):** Fine-grained permission system baked directly into controllers/UI (`<Can>` component)
- **Design System:** Tailwind CSS, Lucide Icons, Fully Reusable Components (`src/components/ui`)
- **Developer Tools:** Built-in UI Explorer (`/dev/ui`)
- **External Integrations:** Stripe Billing, Resend Email, OAuth (Google/Github)

---

## 🛠 Prerequisites

1. **Node.js** (v20.9 or higher required for Next.js 16)
2. **XAMPP** (or any MySQL instance). Ensure your local MySQL server is running.
3. Database `nextjs_starter` created (or matching your connection string).

---

## 🚀 Getting Started

1. **Clone & Install Dependencies:**

   Run the setup script which will automatically install packages and initialize your database (push DB schema and run seeds):

   ```bash
   npm run setup
   ```

2. **Run the Development Server:**

   ```bash
   npm run dev
   ```

   - Open `http://localhost:3000` to view the app.
   - Open `http://localhost:3000/dev/ui` to see the UI Component Library.

---

## 🔧 Environment Configuration (.env)

Before deploying or utilizing third-party features, make sure your `.env` file is properly configured. Rename `.env.example` to `.env` if you haven't already.

### Core Database

```env
DATABASE_URL="mysql://root:@localhost:3306/nextjs_starter"
```

### Authentication Services (OAuth)

To enable "Login with Google" or Github:

1. Go to Google Cloud Console / GitHub Developer Settings.
2. Create an OAuth App and set callback URL to `[your-domain]/api/auth/callback/[provider]`.

```env
GOOGLE_CLIENT_ID="your_google_id"
GOOGLE_CLIENT_SECRET="your_google_secret"
GITHUB_CLIENT_ID="your_github_id"
GITHUB_CLIENT_SECRET="your_github_secret"
```

### Stripe Billing (SaaS Subscriptions)

```env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_PRO="price_..."
STRIPE_PRICE_ID_ENT="price_..."
```

_Note: Make sure to map your `STRIPE_WEBHOOK_SECRET` correctly after setting up webhooks in your Stripe Dashboard pointing to `/api/billing/webhook`._

### Resend Email Integration

```env
RESEND_API_KEY="re_..."
NEXT_PUBLIC_FROM_EMAIL="noreply@yourdomain.com"
```

---

## 🏗 How to Create a New Module

This starter strictly follows a **Modular Architecture** (`Controller-Service-Schema` pattern) instead of putting all business logic inside Next.js Routes.

To add a new feature (e.g., `Product`):

1. **Add to Database (`prisma/schema.prisma`)**

   ```prisma
   model Product {
     id       String @id
     tenantId String
     name     String
     price    Float
     @@map("products")
   }
   ```

   Then run `npx prisma db push` (and generate).

2. **Create the Module Folder:** `src/modules/product/`
   Inside this folder, create 3 files:
   - **`schema.ts`**: Use Zod for input validation.
   - **`service.ts`**: Direct interaction with Prisma DB.
   - **`controller.ts`**: Extracts Request/Params, auth validation, calls service, returns JSON.

   **Example `controller.ts` for Product:**

   ```ts
   import { NextRequest } from 'next/server'
   import { getAuthUser } from '@/lib/auth'
   import { ProductService } from './service'
   import { success, unauthorized } from '@/utils/api'

   export class ProductController {
     static async CreateProduct(req: NextRequest) {
       const user = await getAuthUser()
       if (!user) return unauthorized()

       const body = await req.json()
       const product = await ProductService.create(body, user.tenantId)
       return success(product, 'Product created')
     }
   }
   ```

3. **Wire it to standard Next.js Router (`src/app/api/product/route.ts`)**

   ```ts
   import { ProductController } from '@/modules/product/controller'

   export const POST = ProductController.CreateProduct
   ```

_(By doing this, you keep Next.js router clean and easily unit-test the Controller and Service)._

---

## 📂 Project Structure

```text
/src
 ├── app/              # Next.js App Router (Pages, API Routes, Layouts)
 │   ├── (auth)/       # Public auth pages (Login, Register)
 │   ├── (main)/       # Protected pages (Dashboard, Admin)
 │   ├── api/          # Web accessible endpoints linking to Controllers
 │   └── dev/          # Development visualization pages (e.g., /dev/ui)
 │
 ├── components/
 │   └── ui/           # Reusable UI Design System (Buttons, Modals, Forms)
 │
 ├── modules/          # Core Business Logic (Decoupled from Next.js routes)
 │   ├── auth/         # Login, JWT parsing, Permissions guard
 │   ├── billing/      # Stripe, Plan Limits
 │   ├── user/         # User management
 │   └── tenant/       # SaaS workspace management
 │
 ├── lib/              # Connectors (Prisma, Logger, Auth Utils)
 └── utils/            # Shared string/date formatting, API response helpers
```

---

## 🛡️ License

MIT License
