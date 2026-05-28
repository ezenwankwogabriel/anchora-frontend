# Anchora Frontend

## Commits

Never add a `Co-Authored-By` trailer for Claude Code to any commit.

## Schema reference

The Prisma schema is at `docs/schema.prisma`. Always refer to it for model shapes, field names, enum values, and relationships before building any API call or TypeScript type.

## Key architectural notes

- API responses for `VaultRecord` return `encryptedFields: { institutionName, usernameOrEmail?, notes? }` — not flat fields.
- `Beneficiary.name` is a single string field (not firstName + lastName).
- `BeneficiaryStatus` enum: `INVITED | ACCOUNT_CREATED | ACTIVE | ACCOUNT_DELETED`.
- All API calls go through the service layer in `src/services/`. Never call the API directly from components.
- Shared Axios instance with auth interceptor is at `src/lib/axios.ts`.
- Admin Axios instance with auth interceptor and envelope unwrapping is at `src/lib/admin-axios.ts`.

## API types (admin)

Frontend types for the admin API are **auto-generated** — do not edit `src/lib/api-schema.ts` by hand.

After any backend response DTO change, regenerate with:

```bash
npm run types:generate
```

This pulls the OpenAPI spec from `http://localhost:3001/api/v1/docs-json` (backend must be running) and overwrites `src/lib/api-schema.ts`.

The manually maintained `src/lib/admin-types.ts` is the source of truth for types not yet covered by the spec. Prefer migrating to generated types over adding new entries there.

## Guardian vs. Beneficiary — UI distinction

**Guardian** (`src/app/settings/client.tsx` → Guardian tab, `src/services/guardian.service.ts`)
- One per user; set and managed in Settings.
- No Anchora account — acceptance is a single email-link click, no signup.
- Status badge on the card: green "Active" (`acceptedAt` set) or amber "Pending" (awaiting response).
- Public invite page at `src/app/guardian/invite/` — handles `?token=&action=accept|decline` from email.
- If `?next=` is present after accepting, redirects there (used by STAGE_3 combined accept+confirm email).

**Beneficiary** (`src/app/beneficiaries/`, `src/services/beneficiary.service.ts`)
- Many per user; managed on the Beneficiaries page.
- Must create or link an Anchora account to accept their invite.
- Can be promoted to guardian via the "Set as guardian" action on their card (pre-fills the guardian form).

## API proxy

All requests go through the Next.js rewrite proxy:

```
/api/:path*  →  ${NEXT_PUBLIC_API_HOST}/api/v1/:path*
```

- `NEXT_PUBLIC_API_HOST` in `.env.local` is the backend host only (e.g. `http://localhost:3001`).
- The `/api/v1` prefix is hardcoded in `next.config.mjs` — do not include it in service call paths.
- `adminHttp` base URL is `/api`; service paths start with `/admin/...`.
