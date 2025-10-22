/**
 * Feature Flags
 * Centralized feature toggles for the application
 */

export const featureFlags = {
  compliance: {
    enforceKycKyb: process.env.COMPLIANCE_ENFORCE_KYC_KYB === 'true',
  },
  kamino: {
    enabled: process.env.KAMINO_ENABLED !== 'false', // enabled by default
    apiBase: process.env.KAMINO_API_BASE || 'https://api.kamino.finance',
  },
  privacy: {
    useArcium: process.env.PRIVACY_USE_ARCIUM === 'true',
  },
} as const;

export default featureFlags;

