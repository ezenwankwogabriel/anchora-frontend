# Anchora Frontend

## Schema reference

The Prisma schema is at `docs/schema.prisma`. Always refer to it for model shapes, field names, enum values, and relationships before building any API call or TypeScript type.

## Key architectural notes

- API responses for `VaultRecord` return `encryptedFields: { institutionName, usernameOrEmail?, notes? }` — not flat fields.
- `Beneficiary.name` is a single string field (not firstName + lastName).
- `BeneficiaryStatus` enum: `INVITED | ACCOUNT_CREATED | ACTIVE | ACCOUNT_DELETED`.
- All API calls go through the service layer in `src/services/`. Never call the API directly from components.
- Shared Axios instance with auth interceptor is at `src/lib/axios.ts`.
