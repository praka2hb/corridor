# Kamino SDK Compatibility Issues

## Summary

The Kamino SDK (`@kamino-finance/klend-sdk` v7.1.9) has API differences from what was documented. The implementation needs to be updated to match the actual SDK interface.

## Identified Issues

### 1. `KaminoAction.buildDepositTxns()` - Incorrect Signature
**Error:** `Expected 7-15 arguments, but got 5`

**Current Code:**
```typescript
const depositInstructions = await KaminoAction.buildDepositTxns(
  market,
  amountLamports.toString(),
  assetMint,
  employeeWalletPubkey,
  obligation
);
```

**Issue:** The method signature doesn't match. Need to check actual SDK for correct parameters.

### 2. `KaminoAction.buildWithdrawTxns()` - Similar Issue
**Error:** `Expected 7-15 arguments, but got 5`

Same issue as deposit - incorrect number of parameters.

### 3. `market.getObligationByWallet()` - Returns Possibly Null
**Error:** `'market' is possibly 'null'`

Need to add null check or use different method.

### 4. `obligation.deposits.get()` - Wrong Type
**Error:** `Argument of type 'string' is not assignable to parameter of type 'Address'`

The `deposits.get()` method expects an `Address` type, not a string.

### 5. Position Properties Don't Exist
**Errors:**
- `Property 'toNumber' does not exist on type 'Position'`
- `Property 'availableLiquidity' does not exist on type 'ReserveDataType'`

The SDK types have changed - properties are named differently or accessed differently.

### 6. Instruction Array Handling
**Error:** `Property 'forEach' does not exist on type 'KaminoAction'`

The build methods might return a different type than expected.

## Recommended Fix

Since the Kamino SDK API has changed significantly, we have two options:

### Option 1: Use Mock Implementation (Temporary)
Keep the current mock implementation in `kamino-service.ts` until we can:
1. Review the actual Kamino SDK v7.1.9 documentation
2. Find working examples
3. Update the implementation to match the real API

### Option 2: Downgrade SDK Version
Try an older version of the SDK that matches the documented API.

### Option 3: Use Direct Solana Instructions
Build the Kamino protocol instructions manually without using the SDK helper methods.

## Current Status

**Files with Errors:**
- ✅ `lib/kamino-service.ts` - Fixed unused import (VanillaObligation)
- ✅ `lib/kamino-service.ts` - Fixed commitment type (use 'confirmed' directly)
- ✅ `app/api/investments/confirm/route.ts` - Fixed unused PublicKey import
- ✅ `app/api/investments/confirm/route.ts` - Fixed marketAddress to use getKaminoMarketAddress()
- ❌ `lib/kamino-service.ts` - SDK API mismatches (26 errors)
- ❌ `lib/services/kamino-reserve-service.ts` - SDK type mismatches (8 errors)

## Temporary Solution

For now, the implementation should:
1. Keep the transaction building logic commented out
2. Return mock serialized transactions for testing the UI flow
3. Document that actual Kamino integration requires SDK API research

## Next Steps

1. **Research Kamino SDK v7.1.9:**
   - Check npm package README
   - Look for official examples
   - Review TypeScript definitions

2. **Alternative: Check Kamino GitHub:**
   - https://github.com/hubbleprotocol/kamino-lending-sdk
   - Look for examples in the repo
   - Check if there's updated documentation

3. **Test with Kamino Devnet:**
   - Use devnet market address
   - Test with small amounts
   - Verify transaction structure

## Workaround Code

Until the SDK issues are resolved, use this approach:

```typescript
// In buildAndSendDepositTx and buildAndSendWithdrawTx
// Instead of building real transactions, return mock data:

return {
  serializedTransaction: 'MOCK_TRANSACTION_' + Date.now(),
  obligationAddress: 'MOCK_OBLIGATION_ADDRESS',
  kTokenMint: assetInfo.cTokenMint,
  reserveAddress: 'MOCK_RESERVE_ADDRESS',
  blockhashExpiry: Date.now() + 60000,
};
```

This allows the UI and API flow to be tested while the SDK integration is being fixed.

## Contact

For Kamino SDK support:
- NPM: https://www.npmjs.com/package/@kamino-finance/klend-sdk
- GitHub: https://github.com/hubbleprotocol/kamino-lending-sdk
- Discord: Kamino Finance community
