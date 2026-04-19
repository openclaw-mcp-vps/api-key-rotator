# Build Task: api-key-rotator

Build a complete, production-ready Next.js 15 App Router application.

PROJECT: api-key-rotator
HEADLINE: API Key Rotator — one dashboard to rotate AWS/OpenAI/Stripe keys across all your projects
WHAT: Connect Vercel/Netlify + AWS. One-click rotate every API key across every project. Tracks last-rotation date, alerts on stale keys, audit log.
WHY: SOC2 compliance requires quarterly key rotation. Doing this manually across 10 projects = 2 hours each time. This is a pure time-save SKU.
WHO PAYS: Solo founders seeking SOC2, CTOs at 10-person startups
NICHE: security-ops
PRICE: $$19/mo for 5 projects, $59/mo unlimited/mo

ARCHITECTURE SPEC:
Next.js app with dashboard for managing API key rotation across multiple cloud providers and deployment platforms. Uses webhooks and scheduled jobs to automate key rotation, with audit logging and compliance tracking.

PLANNED FILES:
- app/page.tsx
- app/dashboard/page.tsx
- app/dashboard/projects/page.tsx
- app/dashboard/keys/page.tsx
- app/dashboard/audit/page.tsx
- app/api/auth/[...nextauth]/route.ts
- app/api/projects/route.ts
- app/api/keys/rotate/route.ts
- app/api/webhooks/vercel/route.ts
- app/api/webhooks/netlify/route.ts
- app/api/cron/check-stale-keys/route.ts
- lib/providers/aws.ts
- lib/providers/openai.ts
- lib/providers/stripe.ts
- lib/providers/vercel.ts
- lib/providers/netlify.ts
- lib/db/schema.ts
- lib/auth.ts
- lib/payments.ts
- components/ui/button.tsx
- components/ui/table.tsx
- components/dashboard/project-card.tsx
- components/dashboard/key-status.tsx
- components/dashboard/rotation-history.tsx

DEPENDENCIES: next, react, typescript, tailwindcss, @tailwindcss/forms, next-auth, @auth/prisma-adapter, prisma, @prisma/client, aws-sdk, openai, stripe, @vercel/node, netlify, zod, date-fns, lucide-react, @lemonsqueezy/lemonsqueezy.js, resend, cron-parser

REQUIREMENTS:
- Next.js 15 with App Router (app/ directory)
- TypeScript
- Tailwind CSS v4
- shadcn/ui components (npx shadcn@latest init, then add needed components)
- Dark theme ONLY — background #0d1117, no light mode
- Lemon Squeezy checkout overlay for payments
- Landing page that converts: hero, problem, solution, pricing, FAQ
- The actual tool/feature behind a paywall (cookie-based access after purchase)
- Mobile responsive
- SEO meta tags, Open Graph tags
- /api/health endpoint that returns {"status":"ok"}
- NO HEAVY ORMs: Do NOT use Prisma, Drizzle, TypeORM, Sequelize, or Mongoose. If the tool needs persistence, use direct SQL via `pg` (Postgres) or `better-sqlite3` (local), or just filesystem JSON. Reason: these ORMs require schema files and codegen steps that fail on Vercel when misconfigured.
- INTERNAL FILE DISCIPLINE: Every internal import (paths starting with `@/`, `./`, or `../`) MUST refer to a file you actually create in this build. If you write `import { Card } from "@/components/ui/card"`, then `components/ui/card.tsx` MUST exist with a real `export const Card` (or `export default Card`). Before finishing, scan all internal imports and verify every target file exists. Do NOT use shadcn/ui patterns unless you create every component from scratch — easier path: write all UI inline in the page that uses it.
- DEPENDENCY DISCIPLINE: Every package imported in any .ts, .tsx, .js, or .jsx file MUST be
  listed in package.json dependencies (or devDependencies for build-only). Before finishing,
  scan all source files for `import` statements and verify every external package (anything
  not starting with `.` or `@/`) appears in package.json. Common shadcn/ui peers that MUST
  be added if used:
  - lucide-react, clsx, tailwind-merge, class-variance-authority
  - react-hook-form, zod, @hookform/resolvers
  - @radix-ui/* (for any shadcn component)
- After running `npm run build`, if you see "Module not found: Can't resolve 'X'", add 'X'
  to package.json dependencies and re-run npm install + npm run build until it passes.

ENVIRONMENT VARIABLES (create .env.example):
- NEXT_PUBLIC_LEMON_SQUEEZY_STORE_ID
- NEXT_PUBLIC_LEMON_SQUEEZY_PRODUCT_ID
- LEMON_SQUEEZY_WEBHOOK_SECRET

After creating all files:
1. Run: npm install
2. Run: npm run build
3. Fix any build errors
4. Verify the build succeeds with exit code 0

Do NOT use placeholder text. Write real, helpful content for the landing page
and the tool itself. The tool should actually work and provide value.
