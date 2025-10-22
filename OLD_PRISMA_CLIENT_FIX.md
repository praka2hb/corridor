# Old Generated Prisma Client Fix

## Issue

The `/api/set-username` endpoint was still throwing the error:
```
Value 'not_started' not found in enum 'ComplianceStatus'
```

Even after regenerating the Prisma Client in `node_modules/@prisma/client`, because it was importing from a **different location**.

## Root Cause

The `set-username` route was using an **old, stale generated Prisma client** from a custom location:

```typescript
// ❌ OLD - Using stale generated client
import { PrismaClient } from '@/lib/generated/prisma';
```

This custom client was generated from an **old schema file** located at:
- `lib/generated/prisma/schema.prisma`

That old schema contained:
- `ComplianceStatus` enum with values `PENDING`, `SUBMITTED`, `APPROVED`, `REJECTED`
- Many other outdated enums and models

Meanwhile, the current schema at `prisma/schema.prisma` had:
- No `ComplianceStatus` enum (converted to plain TEXT)
- Updated fields: `kycId`, `kycType`, `kycStatus`

## The Fix

### 1. Updated Import Statement
Changed `set-username` route to use the standard Prisma client:

```typescript
// ✅ NEW - Using current Prisma client
import { db } from '@/lib/db';
```

### 2. Updated All Database Calls
Replaced all `prisma` references with `db`:

```typescript
// Before
const existingUser = await prisma.user.findUnique({...});
const updatedUser = await prisma.user.update({...});
await prisma.$disconnect();

// After  
const existingUser = await db.user.findUnique({...});
const updatedUser = await db.user.update({...});
// No need for $disconnect() - db is a singleton
```

### 3. Cleaned Up Old Files
Deleted the old generated client directory:
```bash
Remove-Item -Recurse -Force "lib\generated"
```

### 4. Cleared Next.js Cache
Cleared the webpack cache to remove cached old code:
```bash
Remove-Item -Recurse -Force ".next"
```

### 5. Restarted Dev Server
```bash
npm run dev
```

## Why This Happened

There were **two separate Prisma schema files**:

1. **Current Schema** (`prisma/schema.prisma`)
   - Used by most of the application
   - Generates to: `node_modules/@prisma/client`
   - Up-to-date with latest migrations
   - No enums, uses plain TEXT fields

2. **Old Schema** (`lib/generated/prisma/schema.prisma`)
   - Had custom output path: `output = "../lib/generated/prisma"`
   - Only used by `set-username` route
   - Outdated with old enums
   - Not updated with migrations

The `set-username` route was the only file importing from the old location.

## Verification

### Files Checked
All other files in the codebase use the correct import:
- ✅ `lib/services/auth-service.ts` - Uses `@prisma/client`
- ✅ `lib/db.ts` - Uses `@prisma/client`
- ✅ `prisma/seed.ts` - Uses `@prisma/client`
- ✅ `app/api/kyc/request-link/route.ts` - Uses `@/lib/db`
- ✅ `app/api/kyc/status/route.ts` - Uses `@/lib/db`
- ❌ `app/api/set-username/route.ts` - **FIXED** - Now uses `@/lib/db`

### No More Stale Clients
```bash
# Search confirmed no files use old path
grep -r "@/lib/generated/prisma" .
# Result: No matches
```

## Best Practices

### Always Use the Shared Database Client

Instead of creating new `PrismaClient` instances, use the singleton:

```typescript
// ❌ DON'T - Creates new instance
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ✅ DO - Use singleton
import { db } from '@/lib/db';
```

**Why?**
- Prevents connection pool exhaustion
- Ensures all code uses same schema version
- No need to manually disconnect
- Better for serverless/edge environments

### When to Clear Cache

Clear Next.js cache when:
- Changing Prisma imports
- After major schema changes
- When seeing stale type errors
- When webpack is caching old code

```bash
# Full cleanup
Remove-Item -Recurse -Force .next
Remove-Item -Recurse -Force node_modules/.prisma
Remove-Item -Recurse -Force node_modules/@prisma/client
npm install
npx prisma generate
npm run dev
```

## Current State

### ✅ Fixed
- Removed old generated Prisma client
- Updated `set-username` route to use current client
- Cleared Next.js cache
- No more `ComplianceStatus` enum errors

### ✅ Working
- Set username endpoint
- KYC type selection
- All API routes using consistent Prisma client
- All migrations applied

### Schema Status
- **Location**: `prisma/schema.prisma`
- **Output**: `node_modules/@prisma/client` (default)
- **Fields**: `kycId`, `kycType`, `kycStatus` (all TEXT)
- **No Enums**: All converted to TEXT for flexibility

## Summary

The issue was caused by a legacy generated Prisma client in a custom location that had outdated schema definitions. By switching to the shared database singleton and cleaning caches, the application now consistently uses the current schema across all endpoints.

**Key Takeaway**: Always use a single, shared Prisma Client instance (`db` from `@/lib/db`) to ensure consistency across your application.
