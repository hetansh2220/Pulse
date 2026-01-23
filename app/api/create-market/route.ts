import { NextRequest } from 'next/server';
import { PublicKey } from '@solana/web3.js';
// import { createWriteClient } from '@/lib/pnp-client'; // Uncomment when Privy is set up
// import { getAuth } from '@privy-io/server-auth'; // Uncomment when Privy is set up

// NOTE: This is a simplified implementation.
// In production, you would need to:
// 1. Set up Privy server-side authentication
// 2. Extract the user's wallet private key from Privy
// 3. Use the PNP SDK to create the market

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
    } = body;

    // Validate inputs
    if (!question || question.length < 10 || question.length > 200) {
      return Response.json(
        { error: 'Question must be between 10 and 200 characters' },
        { status: 400 }
      );
    }

    if (!['general', 'twitter', 'youtube', 'coin'].includes(category)) {
      return Response.json({ error: 'Invalid category' }, { status: 400 });
    }

    if (!['v2', 'p2p'].includes(marketType)) {
      return Response.json({ error: 'Invalid market type' }, { status: 400 });
    }

    const endTimeDate = new Date(endTime);
    if (endTimeDate <= new Date()) {
      return Response.json({ error: 'End time must be in the future' }, { status: 400 });
    }

    if (!initialLiquidity || parseFloat(initialLiquidity) < 100) {
      return Response.json(
        { error: 'Initial liquidity must be at least 100 USDC' },
        { status: 400 }
      );
    }

    // Validate category-specific fields
    if (category === 'twitter' && !tweetUrl) {
      return Response.json({ error: 'Tweet URL is required for Twitter predictions' }, { status: 400 });
    }
    if (category === 'youtube' && !youtubeUrl) {
      return Response.json({ error: 'YouTube URL is required for YouTube predictions' }, { status: 400 });
    }
    if (category === 'coin' && (!protocolName || !tokenAddress)) {
      return Response.json({ error: 'Protocol name and token address are required for coin predictions' }, { status: 400 });
    }

    // TODO: Implement Privy server-side authentication
    // const auth = await getAuth(request);
    // if (!auth.userId) {
    //   return Response.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // TODO: Extract wallet private key from Privy
    // const privateKey = await getPrivateKeyForUser(auth.userId);

    // TODO: Create market using PNP SDK based on category
    // const client = createWriteClient(privateKey);
    // const endTimestamp = BigInt(Math.floor(endTimeDate.getTime() / 1000));
    // const liquidityAmount = BigInt(parseFloat(initialLiquidity) * 1_000_000); // Convert to 6 decimals
    // const collateralMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'); // USDC
    //
    // let result;
    // if (marketType === 'v2') {
    //   // V2 AMM markets
    //   if (category === 'twitter') {
    //     result = await client.createMarketTwitter({
    //       question,
    //       tweetUrl,
    //       initialLiquidity: liquidityAmount,
    //       endTime: endTimestamp,
    //       collateralTokenMint: collateralMint,
    //     });
    //   } else if (category === 'youtube') {
    //     result = await client.createMarketYoutube({
    //       question,
    //       youtubeUrl,
    //       initialLiquidity: liquidityAmount,
    //       endTime: endTimestamp,
    //       collateralTokenMint: collateralMint,
    //     });
    //   } else if (category === 'coin') {
    //     result = await client.createMarketDefiLlama({
    //       question,
    //       protocolName,
    //       metric: tokenAddress, // Use token address as metric
    //       initialLiquidity: liquidityAmount,
    //       endTime: endTimestamp,
    //       collateralTokenMint: collateralMint,
    //     });
    //   } else {
    //     // General market
    //     result = await client.market.createMarketDerived({
    //       question,
    //       initialLiquidity: liquidityAmount,
    //       endTime: endTimestamp,
    //       collateralMint,
    //     });
    //   }
    // } else {
    //   // P2P markets - would need additional parameters (side, creatorSideCap)
    //   return Response.json(
    //     { error: 'P2P market creation not yet implemented' },
    //     { status: 501 }
    //   );
    // }

    // For now, return placeholder response
    return Response.json({
      success: false,
      error: 'Market creation functionality requires Privy server-side SDK setup',
      message: 'This is a placeholder. To enable market creation, set up Privy server-side authentication and uncomment the SDK integration code above.',
    }, { status: 501 }); // 501 Not Implemented

    // When implemented, return:
    // return Response.json({
    //   success: true,
    //   signature: result.signature,
    //   marketPublicKey: result.market,
    //   yesTokenMint: result.yesTokenMint,
    //   noTokenMint: result.noTokenMint,
    // });

  } catch (error) {
    console.error('Error creating market:', error);
    return Response.json(
      {
        error: 'Failed to create market',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
