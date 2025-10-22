/**
 * Application Configuration
 * Centralized configuration management for environment variables
 */

export const config = {
  // Grid API Configuration
  grid: {
    apiKey: process.env.GRID_API_KEY || '',
    environment: (process.env.GRID_ENVIRONMENT || 'production') as 'sandbox' | 'production',
    baseUrl: process.env.GRID_BASE_URL || 'https://grid.squads.xyz',
  },
  
  // Solana Configuration
  solana: {
    rpcEndpoint: process.env.SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com',
    cluster: (process.env.SOLANA_CLUSTER || 'devnet') as 'mainnet-beta' | 'devnet' | 'testnet',
    commitment: (process.env.SOLANA_COMMITMENT || 'confirmed') as 'processed' | 'confirmed' | 'finalized',
  },

  // Kamino Lend Configuration
  kamino: {
    marketAddress: process.env.KAMINO_MARKET_ADDRESS || '7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF', // Main market (mainnet)
    // For devnet, use a different market address
    devnetMarketAddress: process.env.KAMINO_DEVNET_MARKET_ADDRESS || '',
  },

  // Squads Multi-sig Configuration (Treasury Security)
  squads: {
    multisigAddress: process.env.SQUADS_MULTISIG_ADDRESS || '',
    vaultIndex: parseInt(process.env.SQUADS_VAULT_INDEX || '0', 10),
    // CRITICAL: NO private keys stored here - all transactions require multi-sig approval
  },
  
  // Application Configuration
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },
} as const;

/**
 * Validates that all required environment variables are set
 * @throws Error if required variables are missing
 */
export function validateConfig() {
  const errors: string[] = [];

  if (!config.grid.apiKey) {
    errors.push('GRID_API_KEY is not set');
  }

  // Solana RPC validation
  if (!config.solana.rpcEndpoint) {
    errors.push('SOLANA_RPC_ENDPOINT is not set');
  }

  // Squads multi-sig validation (production only)
  if (config.app.isProduction && !config.squads.multisigAddress) {
    errors.push('SQUADS_MULTISIG_ADDRESS is required for production');
  }

  if (errors.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${errors.map(e => `  - ${e}`).join('\n')}`
    );
  }
}

/**
 * Get the appropriate Kamino market address based on cluster
 */
export function getKaminoMarketAddress(): string {
  if (config.solana.cluster === 'devnet' && config.kamino.devnetMarketAddress) {
    return config.kamino.devnetMarketAddress;
  }
  return config.kamino.marketAddress;
}

