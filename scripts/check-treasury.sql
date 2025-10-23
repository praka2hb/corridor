-- SQL to check organizations without treasury accounts
SELECT 
  id,
  name,
  "treasuryAccountId",
  "treasuryGridUserId",
  "treasuryStatus",
  "createdAt"
FROM "Organization"
WHERE "treasuryAccountId" IS NULL;

-- To fix the demo organization, run:
-- DELETE FROM "Organization" WHERE id = 'demo-org';

-- Or to add a treasury account to an existing org (NOT RECOMMENDED - recreate instead):
-- UPDATE "Organization" 
-- SET 
--   "treasuryAccountId" = 'YOUR_MULTISIG_SOLANA_ADDRESS',
--   "treasuryGridUserId" = 'YOUR_GRID_USER_ID',
--   "treasurySignerAddress" = 'YOUR_SIGNER_ADDRESS',
--   "treasuryStatus" = 'active'
-- WHERE id = 'your-org-id';
