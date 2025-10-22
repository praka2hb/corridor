/**
 * Squads Multi-sig Service
 * Handles treasury operations through Squads Protocol multi-signature wallets
 * 
 * SECURITY: This service eliminates single points of failure by requiring
 * multiple approvals for all treasury transactions. No single private key
 * can drain employee funds.
 */

import { Connection, PublicKey, TransactionInstruction, Transaction } from '@solana/web3.js';
import * as multisig from '@sqds/multisig';
import { config } from '../config';

export class SquadsMultisigError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SquadsMultisigError';
  }
}

export interface MultisigProposalMetadata {
  proposalPubkey: PublicKey;
  transactionIndex: bigint;
  status: 'draft' | 'active' | 'approved' | 'rejected' | 'executed' | 'cancelled';
  approvalCount: number;
  requiredApprovals: number;
}

/**
 * Squads Multi-sig Service
 * Manages treasury operations requiring multi-signature approval
 */
export class SquadsMultisigService {
  private connection: Connection;
  private multisigPda: PublicKey;
  private vaultIndex: number;
  private vaultPda: PublicKey | null = null;

  constructor(connection: Connection, multisigAddress?: string, vaultIndex?: number) {
    this.connection = connection;
    this.vaultIndex = vaultIndex ?? config.squads.vaultIndex;
    
    if (!multisigAddress && !config.squads.multisigAddress) {
      throw new SquadsMultisigError(
        'Squads multisig address not configured',
        'MULTISIG_NOT_CONFIGURED'
      );
    }

    this.multisigPda = new PublicKey(multisigAddress || config.squads.multisigAddress);
  }

  /**
   * Initialize and get the vault PDA
   */
  async getVaultPda(): Promise<PublicKey> {
    if (this.vaultPda) {
      return this.vaultPda;
    }

    try {
      const [vaultPda] = multisig.getVaultPda({
        multisigPda: this.multisigPda,
        index: this.vaultIndex,
      });

      this.vaultPda = vaultPda;
      return vaultPda;
    } catch (error) {
      throw new SquadsMultisigError(
        'Failed to derive vault PDA',
        'VAULT_PDA_FAILED',
        error
      );
    }
  }

  /**
   * Get multisig account info
   */
  async getMultisigInfo() {
    try {
      const multisigAccount = await multisig.accounts.Multisig.fromAccountAddress(
        this.connection,
        this.multisigPda
      );

      return {
        threshold: multisigAccount.threshold,
        memberCount: multisigAccount.members.length,
        members: multisigAccount.members.map(m => ({
          key: m.key.toString(),
          permissions: m.permissions,
        })),
        transactionIndex: multisigAccount.transactionIndex.toString(),
      };
    } catch (error) {
      throw new SquadsMultisigError(
        'Failed to fetch multisig info',
        'MULTISIG_INFO_FAILED',
        error
      );
    }
  }

  /**
   * Create a new transaction proposal
   * This does NOT execute the transaction - it creates a proposal that requires approval
   * 
   * @param instructions - The Solana instructions to execute
   * @param creator - The public key of the proposal creator (must be a multisig member)
   * @param memo - Optional description of the transaction
   * @returns Proposal metadata with the proposal public key
   */
  async createProposal(
    instructions: TransactionInstruction[],
    creator: PublicKey,
    memo?: string
  ): Promise<MultisigProposalMetadata> {
    try {
      const multisigInfo = await this.getMultisigInfo();
      const vaultPda = await this.getVaultPda();

      // Get the next transaction index
      const transactionIndex = BigInt(multisigInfo.transactionIndex) + BigInt(1);

      // Derive the transaction PDA
      const [transactionPda] = multisig.getTransactionPda({
        multisigPda: this.multisigPda,
        index: transactionIndex,
      });

      // Create the proposal (this would need to be signed by the creator)
      // Note: In practice, this will be created on the frontend with wallet adapter
      // This service is primarily for checking status and metadata

      return {
        proposalPubkey: transactionPda,
        transactionIndex,
        status: 'draft',
        approvalCount: 0,
        requiredApprovals: multisigInfo.threshold,
      };
    } catch (error) {
      throw new SquadsMultisigError(
        'Failed to create proposal',
        'CREATE_PROPOSAL_FAILED',
        error
      );
    }
  }

  /**
   * Get proposal status
   */
  async getProposalStatus(proposalPubkey: PublicKey): Promise<MultisigProposalMetadata> {
    try {
      const proposal = await multisig.accounts.VaultTransaction.fromAccountAddress(
        this.connection,
        proposalPubkey
      );

      const multisigInfo = await this.getMultisigInfo();

      // Map the status
      let status: MultisigProposalMetadata['status'] = 'draft';
      
      // Count approvals
      const approvalCount = 0; // TODO: Implement approval counting from proposal account

      return {
        proposalPubkey,
        transactionIndex: BigInt(0), // TODO: Get from proposal
        status,
        approvalCount,
        requiredApprovals: multisigInfo.threshold,
      };
    } catch (error) {
      throw new SquadsMultisigError(
        'Failed to get proposal status',
        'PROPOSAL_STATUS_FAILED',
        error
      );
    }
  }

  /**
   * Build instructions for a deposit operation
   * Returns instructions that will be added to a multisig proposal
   */
  async buildDepositInstructions(
    kaminoInstructions: TransactionInstruction[]
  ): Promise<TransactionInstruction[]> {
    // The Kamino deposit instructions will be executed from the vault
    // The vault PDA will be the signer/payer for these instructions
    const vaultPda = await this.getVaultPda();

    // Update the instructions to use vault as the signer
    return kaminoInstructions.map(ix => {
      // Replace any signer keys with the vault PDA
      const keys = ix.keys.map(key => {
        if (key.isSigner) {
          return {
            pubkey: vaultPda,
            isSigner: false, // Vault PDA doesn't sign directly, multisig does
            isWritable: key.isWritable,
          };
        }
        return key;
      });

      return new TransactionInstruction({
        programId: ix.programId,
        keys,
        data: ix.data,
      });
    });
  }

  /**
   * Get the vault public key (treasury address)
   * This is the address that holds the funds
   */
  async getTreasuryAddress(): Promise<PublicKey> {
    return this.getVaultPda();
  }

  /**
   * Get multisig PDA
   */
  getMultisigPda(): PublicKey {
    return this.multisigPda;
  }

  /**
   * Get connection
   */
  getConnection(): Connection {
    return this.connection;
  }
}

// Singleton instance
let squadsService: SquadsMultisigService | null = null;

/**
 * Get or create the Squads multisig service instance
 */
export function getSquadsMultisigService(
  connection?: Connection,
  multisigAddress?: string,
  vaultIndex?: number
): SquadsMultisigService {
  if (!squadsService || connection || multisigAddress !== undefined) {
    const conn = connection || new Connection(config.solana.rpcEndpoint, {
      commitment: config.solana.commitment,
    });
    squadsService = new SquadsMultisigService(conn, multisigAddress, vaultIndex);
  }
  return squadsService;
}

