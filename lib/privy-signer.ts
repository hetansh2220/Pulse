import { PublicKey, Transaction, VersionedTransaction, Connection } from '@solana/web3.js';
import type { PrivyClient } from '@privy-io/server-auth';

/**
 * SignerLike interface expected by PNP SDK
 */
export interface SignerLike {
  publicKey: PublicKey;
  signTransaction(tx: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction>;
  signAllTransactions?(txs: (Transaction | VersionedTransaction)[]): Promise<(Transaction | VersionedTransaction)[]>;
}

/**
 * Custom signer that uses Privy's wallet API to sign transactions.
 * This allows server-side signing using the user's embedded wallet.
 */
export class PrivySigner implements SignerLike {
  public readonly publicKey: PublicKey;
  private readonly privyClient: PrivyClient;
  private readonly walletAddress: string;
  private readonly connection: Connection;

  constructor(privyClient: PrivyClient, walletAddress: string, connection: Connection) {
    this.privyClient = privyClient;
    this.walletAddress = walletAddress;
    this.publicKey = new PublicKey(walletAddress);
    this.connection = connection;
  }

  /**
   * Sign a transaction using Privy's wallet API
   */
  async signTransaction(tx: Transaction | VersionedTransaction): Promise<Transaction | VersionedTransaction> {
    // Ensure the transaction has a recent blockhash for legacy transactions
    if (tx instanceof Transaction) {
      if (!tx.recentBlockhash) {
        const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
      }
      tx.feePayer = this.publicKey;
    }

    // Use Privy's wallet API to sign the transaction
    // The API accepts Transaction objects directly and returns signed Transaction objects
    const result = await this.privyClient.walletApi.solana.signTransaction({
      address: this.walletAddress,
      chainType: 'solana',
      transaction: tx,
    });

    return result.signedTransaction;
  }

  /**
   * Sign multiple transactions using Privy's wallet API
   */
  async signAllTransactions(txs: (Transaction | VersionedTransaction)[]): Promise<(Transaction | VersionedTransaction)[]> {
    const signedTxs: (Transaction | VersionedTransaction)[] = [];
    for (const tx of txs) {
      const signedTx = await this.signTransaction(tx);
      signedTxs.push(signedTx);
    }
    return signedTxs;
  }

  /**
   * Create a fake Keypair-like object that has the correct public key
   * but delegates signing to Privy. This is needed because some parts
   * of the PNP SDK expect a Keypair structure.
   *
   * WARNING: The secretKey is a placeholder and signing operations
   * will fail if used directly. Always use signTransaction instead.
   */
  toKeypairLike(): { publicKey: PublicKey; secretKey: Uint8Array } {
    // Create a placeholder secret key (64 bytes of zeros followed by public key bytes)
    // This is NOT a valid secret key and should never be used for actual signing
    const placeholderSecretKey = new Uint8Array(64);
    // The first 32 bytes are normally the private key, we leave them as zeros
    // The last 32 bytes should match the public key for Keypair validation
    placeholderSecretKey.set(this.publicKey.toBytes(), 32);

    return {
      publicKey: this.publicKey,
      secretKey: placeholderSecretKey,
    };
  }
}

/**
 * Sign and send a transaction using Privy's wallet API.
 * This is useful when you have a pre-built transaction and want to sign+submit it.
 */
export async function signAndSendWithPrivy(
  privyClient: PrivyClient,
  walletAddress: string,
  transaction: Transaction | VersionedTransaction,
  connection: Connection
): Promise<string> {
  // Ensure the transaction has a recent blockhash for legacy transactions
  if (transaction instanceof Transaction) {
    if (!transaction.recentBlockhash) {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.lastValidBlockHeight = lastValidBlockHeight;
    }
    transaction.feePayer = new PublicKey(walletAddress);
  }

  // Sign and send using Privy
  // The API accepts Transaction objects directly
  const result = await privyClient.walletApi.solana.signAndSendTransaction({
    address: walletAddress,
    chainType: 'solana',
    caip2: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // Mainnet
    transaction: transaction,
  });

  return result.hash;
}
