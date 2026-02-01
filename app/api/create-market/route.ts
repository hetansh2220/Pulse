import { NextRequest } from 'next/server';
import { PrivyClient } from '@privy-io/server-auth';
import { USDC_MINT } from '@/lib/constants';

const privyClient = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      question,
      category,
      marketType,
      endTime,
      initialLiquidity,
      tweetUrl,
      youtubeUrl,
      protocolName,
      tokenAddress,
      side,
      creatorSideCap,
    } = body;

    // ==========================================================================
    // INPUT VALIDATION
    // ==========================================================================

    if (!question || question.length < 10 || question.length > 200) {
      return Response.json(
        { success: false, error: 'Question must be between 10 and 200 characters' },
        { status: 400 }
      );
    }

    if (!['general', 'twitter', 'youtube', 'coin'].includes(category)) {
      return Response.json({ success: false, error: 'Invalid category' }, { status: 400 });
    }

    if (!['v2', 'p2p'].includes(marketType)) {
      return Response.json({ success: false, error: 'Invalid market type' }, { status: 400 });
    }

    const endTimeDate = new Date(endTime);
    if (endTimeDate <= new Date()) {
      return Response.json({ success: false, error: 'End time must be in the future' }, { status: 400 });
    }

    const liquidityNum = parseFloat(initialLiquidity);
    if (!initialLiquidity || isNaN(liquidityNum) || liquidityNum < 100) {
      return Response.json(
        { success: false, error: 'Initial liquidity must be at least 100 USDC' },
        { status: 400 }
      );
    }

    // Category-specific validation
    if (category === 'twitter' && !tweetUrl) {
      return Response.json({ success: false, error: 'Tweet URL is required for Twitter markets' }, { status: 400 });
    }
    if (category === 'youtube' && !youtubeUrl) {
      return Response.json({ success: false, error: 'YouTube URL is required for YouTube markets' }, { status: 400 });
    }
    if (category === 'coin' && !protocolName) {
      return Response.json({ success: false, error: 'Protocol name is required for Coin markets' }, { status: 400 });
    }

    // P2P-specific validation
    if (marketType === 'p2p' && !['yes', 'no'].includes(side)) {
      return Response.json({ success: false, error: 'Side (yes/no) is required for P2P markets' }, { status: 400 });
    }

    // ==========================================================================
    // AUTHENTICATION
    // ==========================================================================

    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ success: false, error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const accessToken = authHeader.replace('Bearer ', '');

    // ==========================================================================
    // PRIVY USER VERIFICATION
    // ==========================================================================

    let walletAddress: string;

    try {
      // Verify the access token
      const verifiedClaims = await privyClient.verifyAuthToken(accessToken);
      const userId = verifiedClaims.userId;

      // Get user's embedded wallet
      const user = await privyClient.getUserById(userId);
      const embeddedWallet = user.linkedAccounts.find(
        (account) => account.type === 'wallet' && account.walletClientType === 'privy'
      );

      if (!embeddedWallet || !('address' in embeddedWallet)) {
        return Response.json({ success: false, error: 'No embedded wallet found' }, { status: 400 });
      }

      walletAddress = embeddedWallet.address;

    } catch (authError) {
      console.error('Auth error:', authError);
      return Response.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
    }

    // ==========================================================================
    // MARKET CREATION
    // ==========================================================================

    // Build validated market parameters
    const collateralMint = USDC_MINT;
    const endTimestamp = BigInt(Math.floor(endTimeDate.getTime() / 1000));
    const liquidityAmount = BigInt(Math.floor(liquidityNum * 1_000_000));

    const marketParams = {
      question,
      category,
      marketType,
      endTime: endTimestamp.toString(),
      initialLiquidity: liquidityAmount.toString(),
      collateralMint,
      tweetUrl,
      youtubeUrl,
      protocolName,
      metric: tokenAddress || 'tvl',
      side,
      creatorSideCap: creatorSideCap
        ? BigInt(Math.floor(creatorSideCap * 1_000_000)).toString()
        : BigInt(Math.floor(liquidityNum * 5 * 1_000_000)).toString(),
      walletAddress,
    };

    // ==========================================================================
    // ARCHITECTURE NOTE
    // ==========================================================================
    //
    // The PNP SDK requires a Keypair for transaction signing. Privy's server SDK
    // doesn't expose private keys for security reasons (only signing via wallet API).
    //
    // To enable full market creation, you have two options:
    //
    // OPTION 1: Server-side Operator Wallet
    // - Set up a server-controlled wallet (env: OPERATOR_PRIVATE_KEY)
    // - Users deposit USDC to the server wallet
    // - Server creates markets on users' behalf
    // - More centralized but simpler to implement
    //
    // OPTION 2: Client-side Transaction Signing
    // - Build transaction on server, return unsigned
    // - Client signs using Privy React SDK's useSolanaWallets hook
    // - More decentralized but requires PNP SDK to expose instruction builders
    //
    // For now, returning validated parameters with instructions.
    // ==========================================================================

    return Response.json({
      success: true,
      message: 'Market parameters validated successfully',
      note: 'Full market creation requires additional setup. See options below.',
      validatedParams: marketParams,
      walletAddress,
      options: {
        serverWallet: 'Set OPERATOR_PRIVATE_KEY in .env for server-side market creation',
        clientSigning: 'Implement client-side signing using Privy React SDK',
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Error creating market:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to process market creation request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
