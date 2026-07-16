# IFTA Consulting Client Portal

Secure consulting client portal and workflow management system for IFTA Consulting (K) Ltd.

This repository implements the foundation for a professional-services workflow platform:

- Next.js App Router with public, auth, client, staff and admin route groups.
- Real public pages for Home, About, Services, Pricing, Client Portal, AI Research, Contact, Privacy, Terms and Cookies.
- Protected dashboard routes for `/client`, `/staff` and `/admin`.
- Responsive portal navigation with desktop sidebars and a collapsing mobile drawer.
- First-party email/password authentication with httpOnly session cookies.
- MongoDB-backed RBAC for application roles, permissions and access scope.
- Next.js Server Actions for login, signup, logout, contact submission and protected mutations.
- MongoDB/Mongoose connection caching for Vercel-compatible serverless use.
- Immutable audit-log model and audit service.
- Central engagement request and engagement transition service.
- Reusable UI components for buttons, cards, inputs, labels, selects, textareas, tables and empty states.
- Foundation seed script for roles, permissions and example staff users.
- Unit tests for authorization and workflow transitions.

## Route Structure

```text
app/
  (public)/
    page.tsx
    about/page.tsx
    services/page.tsx
    pricing/page.tsx
    client-portal/page.tsx
    ai-research/page.tsx
    contact/page.tsx
    privacy/page.tsx
    terms/page.tsx
    cookies/page.tsx
  (auth)/
    sign-in/page.tsx
    sign-up/page.tsx
    verify-email/sent/page.tsx
  api/
    auth/verify-email/route.ts
  (dashboard)/
    client/
      layout.tsx
      page.tsx
      engagements/page.tsx
      cart/page.tsx
      kyc/page.tsx
      documents/page.tsx
      messages/page.tsx
      invoices/page.tsx
      payments/page.tsx
      ai/page.tsx
      archive/page.tsx
    staff/
      layout.tsx
      page.tsx
      engagements/page.tsx
      tasks/page.tsx
      clients/page.tsx
      documents/page.tsx
      reviews/page.tsx
      messages/page.tsx
      notes/page.tsx
      ai/page.tsx
      calendar/page.tsx
    admin/
      layout.tsx
      page.tsx
      clients/page.tsx
      staff/page.tsx
      permissions/page.tsx
      services/page.tsx
      requests/page.tsx
      workflows/page.tsx
      kyc/page.tsx
      invoices/page.tsx
      reports/page.tsx
      audit/page.tsx
      settings/page.tsx
```

Route group names do not change URLs. The public homepage remains `/`, auth pages are `/sign-in` and `/sign-up`, and the protected portals remain `/client`, `/staff` and `/admin`.
Dashboard sidebar links resolve to concrete module pages, not dynamic section placeholders.

## Typography

The app uses Geist through `next/font/google`:

- Headings: Geist SemiBold/Bold, `600-700`
- Body: Geist Regular/Medium, `400-500`
- Buttons: Geist Medium/SemiBold, `500-600`
- Tables and forms: Geist
- Invoice numbers, IDs and workflow codes: Geist Mono

## Backend Pattern

Internal mutations should use Server Actions where appropriate. Current examples:

- `src/features/auth/actions.ts`
- `src/features/authorization/actions.ts`
- `src/features/public/actions.ts`

Core auth and authorization files:

- `src/features/auth/password.ts`
- `src/features/auth/password-policy.ts`
- `src/features/auth/session.ts`
- `src/features/auth/server.ts`
- `src/features/authorization/access-control.ts`
- `src/repositories/user-repository.ts`

Dashboard module support files:

- `src/constants/dashboard-modules.ts`
- `src/lib/dashboard/module-page-utils.ts`
- `src/components/dashboard/admin/*.tsx`
- `src/components/dashboard/client/*.tsx`
- `src/components/dashboard/staff/*.tsx`

Each dashboard sidebar route has its own page component. The low-level UI primitives are shared,
but `/admin/clients`, `/staff/tasks`, `/client/kyc` and the other modules no longer render through
one generic section component.

Auth UX support files:

- `src/components/auth/sign-in-form.tsx`
- `src/components/auth/sign-up-form.tsx`
- `src/components/auth/resend-verification-form.tsx`
- `src/components/ui/password-input.tsx`
- `src/components/ui/submit-button.tsx`
- `src/models/email-verification-token.ts`
- `src/features/auth/email-verification.ts`

## Local Setup

Create `.env.local` from `.env.example` and fill the required values:

```bash
cp .env.example .env.local
```

Required for the foundation to run:

- `MONGODB_URI`
- `AUTH_SESSION_DAYS`
- `EMAIL_VERIFICATION_TOKEN_HOURS`
- `PASSWORD_PEPPER`

Email verification uses Resend when these are configured:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

When Resend is not configured in local development, the verification screen shows a development
verification link instead of leaving the user stuck.

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Seed foundation data:

```bash
npm run seed
```

Seeded portal users share `SEED_USER_PASSWORD` when set, otherwise `ChangeMe!12345`:

- Admin: `admin@ifta.test`
- Staff: `staff@ifta.test`
- Client: `client@ifta.test`

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Workflow Foundation

The workflow from the PDF is represented as an explicit state machine in:

```text
src/features/engagements/transition-service.ts
```

Direct status updates should not be added elsewhere. Every future workflow mutation should route through this service or a feature-specific application service that calls it.

## Next Phases

Phase 2 should connect the service catalogue, pricing snapshots and admin service management to MongoDB models.

Phase 3 should add engagement cart, checkout, organization creation, client representatives, engagement request creation and admin review screens.

Phase 4 should add configurable KYC templates, document upload session handling, R2 integration and document review.
