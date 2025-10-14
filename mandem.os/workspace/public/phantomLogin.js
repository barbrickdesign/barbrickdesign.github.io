/**
 * Phantom Wallet Authentication & Integration
 * Unified wallet connection system with NFT/balance fetching
 */

(function() {
  'use strict';

  // Solana connection
  const RPC_ENDPOINTS = [
    'https://api.mainnet-beta.solana.com',
    'https://rpc.ankr.com/solana',
    'https://solana-api.projectserum.com'
  ];
  
  let connection = null;
  let currentEndpointIndex = 0;

  function getConnection() {
    if (!connection) {
      connection = new solanaWeb3.Connection(RPC_ENDPOINTS[currentEndpointIndex], 'confirmed');
    }
    return connection;
  }

  // Wallet state
  let walletState = {
    connected: false,
    publicKey: null,
    balance: 0,
    tokens: [],
    nfts: []
  };

  // Debug logging
  function logDebug(context, message, data) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${context}: ${message}`, data || '');
    
    // Store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('wallet_debug_logs') || '[]');
      logs.push({ timestamp, context, message, data: data ? JSON.stringify(data) : null });
      if (logs.length > 50) logs.shift();
      localStorage.setItem('wallet_debug_logs', JSON.stringify(logs));
    } catch (e) {
      console.warn('Failed to store debug log', e);
    }
  }

  // Provider detection
  function getProvider() {
    if (window.solana && window.solana.isPhantom) {
      return window.solana;
    }
    return null;
  }

  async function waitForProvider(timeoutMs = 3000, intervalMs = 150) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const provider = getProvider();
      if (provider) return provider;
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    return null;
  }

  // Mobile deep link
  function buildPhantomDeepLink() {
    const appUrl = encodeURIComponent(window.location.origin);
    const redirect = encodeURIComponent(
      window.location.href.replace(window.location.search || '', '') + '?from_phantom=1'
    );
    return `https://phantom.app/ul/v1/connect?app_url=${appUrl}&redirect_url=${redirect}`;
  }

  function openWalletApp() {
    try {
      localStorage.setItem('awaiting_wallet', '1');
    } catch (e) {
      logDebug('localStorage', 'Failed to set awaiting_wallet', e);
    }
    
    const link = buildPhantomDeepLink();
    logDebug('mobile', 'Opening deep link', link);
    
    try {
      window.location.href = link;
    } catch (e) {
      window.open(link, '_blank');
    }
  }

  // Fetch SOL balance
  async function fetchSolBalance(publicKey) {
    try {
      const conn = getConnection();
      const balance = await conn.getBalance(publicKey);
      return balance / solanaWeb3.LAMPORTS_PER_SOL;
    } catch (e) {
      logDebug('balance', 'Failed to fetch SOL balance', e);
      return 0;
    }
  }

  // Fetch token accounts and balances
  async function fetchTokens(publicKey) {
    try {
      const conn = getConnection();
      const tokenAccounts = await conn.getParsedTokenAccountsByOwner(publicKey, {
        programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      });

      const tokens = [];
      for (const account of tokenAccounts.value) {
        const info = account.account.data.parsed.info;
        const balance = info.tokenAmount.uiAmount;
        if (balance > 0) {
          tokens.push({
            mint: info.mint,
            balance: balance,
            decimals: info.tokenAmount.decimals
          });
        }
      }

      return tokens;
    } catch (e) {
      logDebug('tokens', 'Failed to fetch tokens', e);
      return [];
    }
  }

  // Fetch NFTs (tokens with 0 decimals and balance 1)
  async function fetchNFTs(publicKey) {
    try {
      const tokens = await fetchTokens(publicKey);
      const nfts = tokens.filter(token => 
        token.decimals === 0 && token.balance === 1
      );

      // Fetch metadata for each NFT
      for (const nft of nfts) {
        try {
          // Fetch metadata account (simplified - you may want to use Metaplex SDK)
          const metadataAccount = await findMetadataAccount(nft.mint);
          if (metadataAccount) {
            nft.metadata = metadataAccount;
          }
        } catch (e) {
          logDebug('nft', `Failed to fetch metadata for ${nft.mint}`, e);
        }
      }

      return nfts;
    } catch (e) {
      logDebug('nfts', 'Failed to fetch NFTs', e);
      return [];
    }
  }

  // Helper to find metadata account
  async function findMetadataAccount(mintAddress) {
    try {
      // This is a simplified version - in production use @metaplex-foundation/js
      const METADATA_PROGRAM_ID = new solanaWeb3.PublicKey(
        'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
      );
      
      const mint = new solanaWeb3.PublicKey(mintAddress);
      const [metadataPDA] = await solanaWeb3.PublicKey.findProgramAddress(
        [
          Buffer.from('metadata'),
          METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer()
        ],
        METADATA_PROGRAM_ID
      );

      const conn = getConnection();
      const accountInfo = await conn.getAccountInfo(metadataPDA);
      
      if (accountInfo) {
        return {
          address: metadataPDA.toBase58(),
          exists: true
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Main connect function
  async function connectPhantomWallet(isSignup = false) {
    logDebug('connect', 'Starting wallet connection', { isSignup });

    // Check for mobile
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (isMobile) {
      const provider = getProvider();
      if (!provider) {
        openWalletApp();
        return;
      }
    }

    const provider = await waitForProvider(1500, 120) || getProvider();
    
    if (!provider) {
      if (isMobile) {
        openWalletApp();
        return;
      }
      alert('Phantom wallet not detected. Please install Phantom wallet extension.');
      logDebug('connect', 'No provider detected', null);
      return;
    }

    try {
      logDebug('connect', 'Requesting connection', null);
      const response = await provider.connect({ onlyIfTrusted: false });
      const publicKey = response.publicKey || provider.publicKey;

      if (!publicKey) {
        throw new Error('No public key returned from wallet');
      }

      logDebug('connect', 'Connected successfully', publicKey.toBase58());

      // Verify with signature
      const nonce = Math.floor(Math.random() * 1e9).toString();
      const timestamp = Date.now();
      const message = `BarbrickDesign authentication\nnonce:${nonce}\nts:${timestamp}\naddress:${publicKey.toBase58()}`;
      const encodedMessage = new TextEncoder().encode(message);

      logDebug('connect', 'Requesting signature', null);
      let signed;
      if (typeof provider.signMessage === 'function') {
        signed = await provider.signMessage(encodedMessage, 'utf8');
      } else if (typeof provider.request === 'function') {
        signed = await provider.request({
          method: 'signMessage',
          params: { message: Array.from(encodedMessage) }
        });
      } else {
        throw new Error('Wallet does not support signMessage');
      }

      // Verify signature
      const signatureBytes = signed.signature || signed;
      const publicKeyBytes = publicKey.toBytes();
      const verified = nacl.sign.detached.verify(encodedMessage, signatureBytes, publicKeyBytes);

      if (!verified) {
        throw new Error('Signature verification failed');
      }

      logDebug('connect', 'Signature verified', null);

      // Fetch wallet data
      const solBalance = await fetchSolBalance(publicKey);
      const tokens = await fetchTokens(publicKey);
      const nfts = await fetchNFTs(publicKey);

      // Update state
      walletState = {
        connected: true,
        publicKey: publicKey.toBase58(),
        balance: solBalance,
        tokens: tokens,
        nfts: nfts
      };

      // Store in localStorage
      localStorage.setItem('currentUser', JSON.stringify({
        walletAddress: publicKey.toBase58(),
        username: `User_${publicKey.toBase58().slice(0, 8)}`
      }));

      localStorage.setItem('userProfile', JSON.stringify({
        walletAddress: publicKey.toBase58(),
        solBalance: solBalance,
        tokens: tokens,
        nfts: nfts,
        inGameMGC: tokens.find(t => t.mint === 'MGC_MINT_ADDRESS')?.balance || 0
      }));

      localStorage.setItem('lastWalletAuth', new Date().toISOString());
      localStorage.setItem('userLoggedIn', 'true');

      logDebug('connect', 'Wallet data stored', {
        balance: solBalance,
        tokenCount: tokens.length,
        nftCount: nfts.length
      });

      // Redirect based on signup or login
      if (isSignup) {
        window.location.href = 'profile.html';
      } else {
        window.location.href = 'index.html';
      }

    } catch (error) {
      logDebug('connect', 'Connection failed', error.message || error);
      alert('Wallet connection failed. Please try again.');
      console.error('Phantom connection error:', error);
    }
  }

  // Auto-reconnect after return from mobile
  async function autoReconnectAfterReturn() {
    try {
      const params = new URLSearchParams(window.location.search);
      const awaiting = localStorage.getItem('awaiting_wallet');

      if (params.get('from_phantom') === '1' || awaiting === '1') {
        logDebug('auto-reconnect', 'Returned from wallet app', null);
        
        const provider = await waitForProvider(6000, 200);
        if (provider) {
          try {
            localStorage.removeItem('awaiting_wallet');
          } catch (e) {
            logDebug('auto-reconnect', 'Failed to remove awaiting_wallet', e);
          }

          await connectPhantomWallet();

          if (params.get('from_phantom') === '1') {
            const cleanUrl = window.location.href.replace(/[?&]from_phantom=1/, '');
            history.replaceState(null, '', cleanUrl);
          }
        } else {
          logDebug('auto-reconnect', 'Provider not injected after return', null);
        }
      }
    } catch (error) {
      logDebug('auto-reconnect', 'Error during auto-reconnect', error.message || error);
    }
  }

  // Check if user is authenticated
  function isUserAuthenticated() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    const lastAuth = localStorage.getItem('lastWalletAuth');
    
    if (!user || !user.walletAddress || !lastAuth) {
      return false;
    }

    const lastAuthTime = new Date(lastAuth).getTime();
    const now = Date.now();
    const dayInMs = 86400000;

    return (now - lastAuthTime) < dayInMs;
  }

  // Get current wallet state
  function getWalletState() {
    return walletState;
  }

  // Disconnect wallet
  function disconnectWallet() {
    const provider = getProvider();
    if (provider && typeof provider.disconnect === 'function') {
      provider.disconnect();
    }

    walletState = {
      connected: false,
      publicKey: null,
      balance: 0,
      tokens: [],
      nfts: []
    };

    localStorage.removeItem('currentUser');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('lastWalletAuth');
    localStorage.removeItem('userLoggedIn');

    logDebug('disconnect', 'Wallet disconnected', null);
  }

  // Initialize on page load
  window.addEventListener('load', autoReconnectAfterReturn);

  // Export to window
  window.connectPhantomWallet = connectPhantomWallet;
  window.disconnectWallet = disconnectWallet;
  window.isUserAuthenticated = isUserAuthenticated;
  window.getWalletState = getWalletState;
  window.refreshWalletData = async function() {
    if (walletState.publicKey) {
      const publicKey = new solanaWeb3.PublicKey(walletState.publicKey);
      walletState.balance = await fetchSolBalance(publicKey);
      walletState.tokens = await fetchTokens(publicKey);
      walletState.nfts = await fetchNFTs(publicKey);
      return walletState;
    }
    return null;
  };

  logDebug('init', 'PhantomLogin.js loaded successfully', null);

})();
