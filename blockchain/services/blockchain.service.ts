/**
 * Blockchain Service Abstraction Layer
 * Supports seamless switching between MockBlockchainService (Demo Mode) and RealBlockchainService (EVM / ethers.js).
 */

import { BatchEvent, BatchVerificationStatus, HoneyBatch } from '../../shared/types';

export interface BlockchainTransactionReceipt {
  txHash: string;
  blockNumber: number;
  blockHash: string;
  contractAddress: string;
  timestamp: string;
  gasUsed: number;
  status: 'SUCCESS' | 'REVERTED';
}

export interface IBlockchainService {
  registerBatchOnChain(batch: Partial<HoneyBatch>): Promise<BlockchainTransactionReceipt>;
  recordBatchEventOnChain(
    batchNumber: string,
    event: Omit<BatchEvent, 'id' | 'txHash' | 'verified'>
  ): Promise<BatchEvent>;
  verifyBatchProvenance(batchNumber: string): Promise<{
    verified: boolean;
    status: BatchVerificationStatus;
    blockNumber: number;
    txHash: string;
    eventsCount: number;
    auditLog: string;
  }>;
  getContractAddress(): string;
}

/**
 * MockBlockchainService
 * Deterministically simulates EVM blockchain ledger state, transaction hashing, and immutability verification.
 */
export class MockBlockchainService implements IBlockchainService {
  private readonly defaultContract = '0x71C0d21a282496291C2D34091AfeE0b1A7d9BfC4';
  private currentBlock = 18492040;

  // Simple deterministic pseudo-hash generator based on inputs
  private generateTxHash(seed: string): string {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `0x${hex}a94f1c9370b3b4de0914a821e25785002447990176cdb2c912${hex}`;
  }

  async registerBatchOnChain(batch: Partial<HoneyBatch>): Promise<BlockchainTransactionReceipt> {
    this.currentBlock += Math.floor(Math.random() * 3) + 1;
    const txHash = this.generateTxHash(`BATCH_${batch.id}_${Date.now()}`);

    return {
      txHash,
      blockNumber: this.currentBlock,
      blockHash: `0xblock${Math.floor(Math.random() * 900000 + 100000)}b9d`,
      contractAddress: this.defaultContract,
      timestamp: new Date().toISOString(),
      gasUsed: 142850,
      status: 'SUCCESS',
    };
  }

  async recordBatchEventOnChain(
    batchNumber: string,
    event: Omit<BatchEvent, 'id' | 'txHash' | 'verified'>
  ): Promise<BatchEvent> {
    this.currentBlock += 1;
    const txHash = this.generateTxHash(`EVENT_${batchNumber}_${event.eventType}_${Date.now()}`);

    return {
      ...event,
      id: `EVT-${Date.now().toString().slice(-6)}`,
      txHash,
      verified: true,
    };
  }

  async verifyBatchProvenance(batchNumber: string): Promise<{
    verified: boolean;
    status: BatchVerificationStatus;
    blockNumber: number;
    txHash: string;
    eventsCount: number;
    auditLog: string;
  }> {
    // Check known mock batches
    if (batchNumber === 'HC-INVALID-000' || batchNumber.includes('INVALID') || batchNumber.includes('FAKE')) {
      return {
        verified: false,
        status: 'INVALID',
        blockNumber: 0,
        txHash: '0x0000000000000000000000000000000000000000',
        eventsCount: 0,
        auditLog: 'CRITICAL: No genesis record or cryptographic signature found on Honey Chain EVM ledger.',
      };
    }

    if (batchNumber.includes('SUSPICIOUS')) {
      return {
        verified: false,
        status: 'SUSPICIOUS',
        blockNumber: this.currentBlock - 200,
        txHash: this.generateTxHash(batchNumber),
        eventsCount: 2,
        auditLog: 'WARNING: Anomalous scan velocity detected across divergent geographic IP coordinates.',
      };
    }

    const txHash = this.generateTxHash(batchNumber);
    return {
      verified: true,
      status: 'VERIFIED',
      blockNumber: this.currentBlock - 84,
      txHash,
      eventsCount: 7,
      auditLog: 'VALID: Cryptographic merkle root verified against contract bytecode at block confirmation.',
    };
  }

  getContractAddress(): string {
    return this.defaultContract;
  }
}

/**
 * RealBlockchainService
 * Placeholder for future integration with ethers.js / Polygon / Avalanche / Ethereum testnet.
 */
export class RealBlockchainService implements IBlockchainService {
  private rpcUrl: string;
  private contractAddress: string;

  constructor(rpcUrl = process.env.BLOCKCHAIN_RPC_URL || '', contractAddress = process.env.CONTRACT_ADDRESS || '') {
    this.rpcUrl = rpcUrl;
    this.contractAddress = contractAddress;
  }

  async registerBatchOnChain(_batch: Partial<HoneyBatch>): Promise<BlockchainTransactionReceipt> {
    // TODO: Connect with ethers.Contract instance:
    // const provider = new ethers.JsonRpcProvider(this.rpcUrl);
    // const wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY!, provider);
    // const contract = new ethers.Contract(this.contractAddress, HoneyTraceabilityABI, wallet);
    // const tx = await contract.registerBatch(...);
    // const receipt = await tx.wait();
    throw new Error('RealBlockchainService not configured. Please set DEMO_MODE=true or provide RPC credentials.');
  }

  async recordBatchEventOnChain(
    _batchNumber: string,
    _event: Omit<BatchEvent, 'id' | 'txHash' | 'verified'>
  ): Promise<BatchEvent> {
    // TODO: Call contract.addBatchEvent(...)
    throw new Error('RealBlockchainService not configured. Please set DEMO_MODE=true.');
  }

  async verifyBatchProvenance(_batchNumber: string): Promise<any> {
    // TODO: Call contract.verifyBatch(...)
    throw new Error('RealBlockchainService not configured.');
  }

  getContractAddress(): string {
    return this.contractAddress;
  }
}

// Default export uses Mock for prototype DEMO_MODE
export const blockchainService: IBlockchainService = new MockBlockchainService();
