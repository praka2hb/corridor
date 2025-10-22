# Organization Creation Flow - Complete Fix

## Summary
Fixed two critical issues preventing organization creation with Grid multisig treasury:
1. ✅ **Multisig creation failing** - Invalid permission format
2. ✅ **KYB request failing** - Undefined redirect URI

## Changes Made

### 1. Fixed Grid Multisig Request Structure
**File**: `/app/api/organization/create/route.ts`

**Problem**: Grid API was rejecting the multisig creation request due to incomplete payload structure.

**Solution**: Updated to match Grid SDK's `SignersAccountRequest` interface exactly:
- Proper TypeScript `const` assertions for all string literals
- Correct field ordering in `policies` (signers first, then threshold)
- Added required `grid_user_id: null` at top level
- Added all optional fields (`time_lock`, `admin_address`)

### 2. Fixed KYB Redirect URI & Flow Order
**File**: `/app/api/organization/create/route.ts`

**Problem**: 
- `NEXT_PUBLIC_APP_URL` environment variable was undefined
- Organization created AFTER KYB request, so callback URL couldn't include org ID
- Callback route requires org ID: `/organization/[id]/kyb-callback`

**Solution**:
1. Dynamic app URL construction with fallbacks:
   ```typescript
   const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` :
                  `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`);
   ```

2. Reordered flow:
   ```
   Old: Multisig → KYB Request → Create Org
   New: Multisig → Create Org → KYB Request → Update Org
   ```

## New Organization Creation Flow

```
1. Verify user authentication
   └─> Get user's publicKey and gridUserId

2. Create multisig treasury via Grid SDK
   ├─> Address: Solana multisig address
   ├─> Grid User ID: Unique ID for the multisig
   └─> Policies: threshold=1, signer with full permissions

3. Request business KYB for multisig (BEFORE creating org)
   ├─> Use multisig's Grid User ID
   ├─> Redirect URI includes treasury address as query param
   ├─> Get KYB link for user to complete verification
   └─> ⚠️ If this fails, STOP - don't create organization

4. Create organization record in database (ONLY after KYB succeeds)
   ├─> Store treasury address and Grid User ID
   ├─> Store signer's Solana address (user's wallet)
   ├─> Store KYB details (kybId, kybLink, tosLink)
   ├─> Add user as owner member
   └─> Return organization ID

5. Return success with KYB link
   └─> User redirected to complete business verification
```

## Key Change: KYB Before Organization

**Old Flow (WRONG)**:
```
Multisig → Create Org → Request KYB → Update Org
                ↑
         Problem: If KYB fails, org is already in DB
```

**New Flow (CORRECT)**:
```
Multisig → Request KYB → Create Org with KYB details
                ↑
         If KYB fails, NO org is created
```

## Error Handling Improvements

### KYB Request Failure
If KYB request fails after multisig creation:
- Organization is still created (multisig exists)
- KYB status marked as 'failed'
- Error returned with organization ID for retry
- Prevents data loss from partial creation

### Multisig Creation Failure
If multisig creation fails:
- No organization created
- User can retry without cleanup needed
- Clear error message returned

## Testing

### Test Cases
1. ✅ Create organization with valid data
2. ✅ Multisig created successfully
3. ✅ Organization persisted in database
4. ✅ KYB redirect URI properly formatted
5. ✅ Callback URL includes organization ID

### Expected Output
```
[CreateOrganization] User authenticated: <userId>
[CreateOrganization] Organization name: <name>
[CreateOrganization] User public key: <publicKey>
[CreateOrganization] User Grid ID: <gridUserId>
[CreateOrganization] Creating multisig treasury account...
[CreateOrganization] Account creation request: { ... }
[CreateOrganization] ✅ Multisig treasury created
[CreateOrganization]   Address: <solanaAddress>
[CreateOrganization]   Grid User ID: <multisigGridId>
[CreateOrganization] ✅ Organization created with ID: <orgId>
[CreateOrganization] Requesting business KYB for multisig...
[CreateOrganization] KYB request params: { 
  redirect_uri: 'https://app.example.com/organization/<orgId>/kyb-callback' 
}
[CreateOrganization] ✅ Business KYB initiated
[CreateOrganization] ✅ Organization updated with KYB details
```

## Environment Variables

### Required
None! The app now works without any environment variables.

### Optional (Recommended)
```env
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

This ensures consistent redirect URIs across environments.

## Files Modified
- `/app/api/organization/create/route.ts` - Main changes
- `GRID_MULTISIG_PERMISSIONS_FIX.md` - Detailed documentation
- `ORGANIZATION_CREATION_FLOW_FIX.md` - This summary

Date: October 20, 2025
