/**
 * Wallet Tracker & Scammer Detection Module
 * Tracks transaction flows, identifies exit wallets, and helps recover stolen funds
 */

class WalletTracker {
  constructor(connection) {
    this.connection = connection;
    this.trackedWallets = new Map();
    this.suspiciousPatterns = [];
    this.exitWallets = [];
    this.transactionGraph = new Map();
  }

  /**
   * Track wallet transaction history to find suspicious patterns
   */
  async trackWallet(walletAddress, depth = 3) {
    console.log(`[WalletTracker] Tracking ${walletAddress} at depth ${depth}`);
    
    const tracked = {
      address: walletAddress,
      inflows: [],
      outflows: [],
      connectedWallets: new Set(),
      suspiciousScore: 0,
      flags: []
    };

    try {
      const pubkey = new solanaWeb3.PublicKey(walletAddress);
      const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit: 100 });
      
      for (const sigInfo of signatures) {
        try {
          const tx = await this.connection.getParsedTransaction(sigInfo.signature, 'confirmed');
          if (!tx) continue;

          const analysis = this.analyzeTransaction(tx, walletAddress);
          
          if (analysis.isOutflow) {
            tracked.outflows.push(analysis);
            tracked.connectedWallets.add(analysis.destination);
          } else if (analysis.isInflow) {
            tracked.inflows.push(analysis);
            tracked.connectedWallets.add(analysis.source);
          }

          // Detect suspicious patterns
          if (analysis.isSuspicious) {
            tracked.flags.push(analysis.suspiciousReason);
            tracked.suspiciousScore += analysis.suspiciousWeight;
          }
        } catch (e) {
          console.warn('[WalletTracker] Transaction parse error:', e);
        }
      }

      // Calculate patterns
      tracked.totalOut = tracked.outflows.reduce((sum, t) => sum + t.amount, 0);
      tracked.totalIn = tracked.inflows.reduce((sum, t) => sum + t.amount, 0);
      tracked.netFlow = tracked.totalIn - tracked.totalOut;
      
      // Detect exit wallet pattern (rapid drain)
      if (tracked.totalOut > tracked.totalIn * 0.9 && tracked.outflows.length > 5) {
        tracked.flags.push('POSSIBLE_EXIT_WALLET');
        tracked.suspiciousScore += 50;
      }

      // Detect mixer pattern (many small ins, few large outs)
      if (tracked.inflows.length > 20 && tracked.outflows.length < 5) {
        tracked.flags.push('POSSIBLE_MIXER');
        tracked.suspiciousScore += 40;
      }

      // Detect scam pattern (large sudden deposits followed by drain)
      const largeDeps = tracked.inflows.filter(t => t.amount > 1).length;
      const rapidDrain = tracked.outflows.filter(t => t.amount > 1).length;
      if (largeDeps > 3 && rapidDrain > largeDeps * 0.8) {
        tracked.flags.push('SCAM_PATTERN_DETECTED');
        tracked.suspiciousScore += 80;
      }

      this.trackedWallets.set(walletAddress, tracked);
      
      // Recursively track connected wallets if depth > 0
      if (depth > 0) {
        const topOutflows = tracked.outflows
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5);
        
        for (const outflow of topOutflows) {
          if (!this.trackedWallets.has(outflow.destination)) {
            await this.trackWallet(outflow.destination, depth - 1);
          }
        }
      }

      return tracked;
    } catch (error) {
      console.error('[WalletTracker] Error tracking wallet:', error);
      return null;
    }
  }

  /**
   * Analyze a single transaction
   */
  analyzeTransaction(tx, referenceWallet) {
    const analysis = {
      signature: tx.transaction.signatures[0],
      blockTime: tx.blockTime,
      isInflow: false,
      isOutflow: false,
      amount: 0,
      source: null,
      destination: null,
      isSuspicious: false,
      suspiciousReason: null,
      suspiciousWeight: 0
    };

    try {
      const message = tx.transaction.message;
      const instructions = message.instructions || [];

      for (const inst of instructions) {
        if (inst.parsed && inst.parsed.type === 'transfer') {
          const info = inst.parsed.info;
          const source = info.source;
          const dest = info.destination;
          const lamports = parseInt(info.lamports || 0);
          const sol = lamports / solanaWeb3.LAMPORTS_PER_SOL;

          if (source === referenceWallet) {
            analysis.isOutflow = true;
            analysis.amount = sol;
            analysis.destination = dest;
          } else if (dest === referenceWallet) {
            analysis.isInflow = true;
            analysis.amount = sol;
            analysis.source = source;
          }

          // Suspicious patterns
          // Pattern 1: Large transfers (> 10 SOL)
          if (sol > 10) {
            analysis.isSuspicious = true;
            analysis.suspiciousReason = 'LARGE_TRANSFER';
            analysis.suspiciousWeight = Math.min(sol * 2, 30);
          }

          // Pattern 2: Round number transfers (often scams)
          if (sol > 1 && Number.isInteger(sol)) {
            analysis.suspiciousWeight += 5;
          }

          // Pattern 3: Very rapid transactions (< 10 seconds apart)
          // This would need time comparison with previous tx
        }
      }
    } catch (e) {
      console.warn('[WalletTracker] Transaction analysis error:', e);
    }

    return analysis;
  }

  /**
   * Find exit wallets from a stolen wallet
   */
  async findExitWallets(victimWallet) {
    console.log('[WalletTracker] Finding exit wallets for:', victimWallet);
    
    const tracked = await this.trackWallet(victimWallet, 2);
    if (!tracked) return [];

    const exitWallets = [];

    // Find wallets that received funds and haven't moved them much
    for (const outflow of tracked.outflows) {
      const destination = outflow.destination;
      
      if (this.trackedWallets.has(destination)) {
        const destTracked = this.trackedWallets.get(destination);
        
        // Exit wallet characteristics:
        // - Received funds from victim
        // - Low outflow compared to inflow
        // - Not many transactions
        if (destTracked.netFlow > 0 && destTracked.outflows.length < 10) {
          exitWallets.push({
            address: destination,
            receivedAmount: outflow.amount,
            currentBalance: destTracked.netFlow,
            suspiciousScore: destTracked.suspiciousScore,
            flags: destTracked.flags,
            timestamp: outflow.blockTime
          });
        }
      } else {
        // Track this wallet
        const destTracked = await this.trackWallet(destination, 0);
        if (destTracked && destTracked.netFlow > 0) {
          exitWallets.push({
            address: destination,
            receivedAmount: outflow.amount,
            currentBalance: destTracked.netFlow,
            suspiciousScore: destTracked.suspiciousScore,
            flags: destTracked.flags,
            timestamp: outflow.blockTime
          });
        }
      }
    }

    this.exitWallets = exitWallets.sort((a, b) => b.currentBalance - a.currentBalance);
    return this.exitWallets;
  }

  /**
   * Scan connected wallets from a main wallet
   */
  async scanConnectedWallets(mainWallet) {
    console.log('[WalletTracker] Scanning connected wallets:', mainWallet);
    
    const tracked = await this.trackWallet(mainWallet, 1);
    if (!tracked) return [];

    const connected = [];
    
    for (const wallet of tracked.connectedWallets) {
      try {
        const pubkey = new solanaWeb3.PublicKey(wallet);
        const balance = await this.connection.getBalance(pubkey);
        const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;

        connected.push({
          address: wallet,
          balance: solBalance,
          isDead: solBalance > 0 && solBalance < 0.003, // Dead wallet threshold
          hasRent: solBalance >= 0.002 && solBalance < 0.003
        });
      } catch (e) {
        console.warn('[WalletTracker] Error checking connected wallet:', wallet, e);
      }
    }

    return connected.sort((a, b) => b.balance - a.balance);
  }

  /**
   * Detect dead wallets with small balances (0.002 SOL threshold)
   */
  async findDeadWallets(walletList) {
    console.log('[WalletTracker] Finding dead wallets in list of', walletList.length);
    
    const deadWallets = [];
    
    for (const wallet of walletList) {
      try {
        const pubkey = new solanaWeb3.PublicKey(wallet);
        const balance = await this.connection.getBalance(pubkey);
        const solBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;

        // Dead wallet: has SOL but very small amount
        if (solBalance > 0 && solBalance < 0.003) {
          const signatures = await this.connection.getSignaturesForAddress(pubkey, { limit: 1 });
          const lastActivity = signatures.length > 0 ? signatures[0].blockTime : null;
          
          deadWallets.push({
            address: wallet,
            balance: solBalance,
            lastActivity: lastActivity ? new Date(lastActivity * 1000) : null,
            daysInactive: lastActivity ? Math.floor((Date.now() / 1000 - lastActivity) / 86400) : null,
            isRecoverable: solBalance >= 0.002
          });
        }
      } catch (e) {
        console.warn('[WalletTracker] Error checking wallet:', wallet, e);
      }
    }

    return deadWallets.filter(w => w.isRecoverable);
  }

  /**
   * Calculate total recoverable amount
   */
  calculateRecoverable(wallets) {
    let total = 0;
    let rentRefunds = 0;
    let deadWalletFunds = 0;
    let dustTokens = 0;

    for (const wallet of wallets) {
      if (wallet.emptyAccounts) {
        rentRefunds += wallet.emptyAccounts * 0.00204;
      }
      if (wallet.isDead && wallet.balance) {
        deadWalletFunds += wallet.balance;
      }
      if (wallet.dustValue) {
        dustTokens += wallet.dustValue;
      }
    }

    total = rentRefunds + deadWalletFunds + dustTokens;

    return {
      total,
      rentRefunds,
      deadWalletFunds,
      dustTokens,
      breakdown: {
        rentAccounts: Math.floor(rentRefunds / 0.00204),
        deadWallets: wallets.filter(w => w.isDead).length,
        dustTokenCount: wallets.filter(w => w.dustValue).length
      }
    };
  }

  /**
   * Generate recovery report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalWalletsTracked: this.trackedWallets.size,
      suspiciousWallets: Array.from(this.trackedWallets.values())
        .filter(w => w.suspiciousScore > 50)
        .map(w => ({
          address: w.address,
          score: w.suspiciousScore,
          flags: w.flags,
          netFlow: w.netFlow
        })),
      exitWallets: this.exitWallets,
      transactionGraph: this.buildTransactionGraph()
    };

    return report;
  }

  /**
   * Build transaction graph for visualization
   */
  buildTransactionGraph() {
    const nodes = [];
    const links = [];

    for (const [address, data] of this.trackedWallets) {
      nodes.push({
        id: address,
        score: data.suspiciousScore,
        flags: data.flags,
        balance: data.netFlow
      });

      for (const outflow of data.outflows) {
        links.push({
          source: address,
          target: outflow.destination,
          amount: outflow.amount,
          timestamp: outflow.blockTime
        });
      }
    }

    return { nodes, links };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WalletTracker;
} else {
  window.WalletTracker = WalletTracker;
}
