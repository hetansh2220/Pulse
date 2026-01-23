# PNP Markets - Prediction Market Platform

## Project Overview

PNP Markets is a decentralized prediction market platform built on Solana blockchain using the PNP Protocol SDK. Users can trade YES/NO outcome tokens on real-world events including Twitter/X engagement, YouTube metrics, cryptocurrency prices, and general predictions.

## Tech Stack

- **Framework**: Next.js 16 (App Router with Turbopack)
- **Language**: TypeScript 5
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4 with CSS variables
- **Components**: shadcn/ui (Radix UI primitives)
- **Authentication**: Privy (embedded Solana wallets, email login)
- **Blockchain**: Solana (mainnet-beta)
- **SDK**: PNP SDK v0.2.6
- **State Management**: TanStack React Query v5
- **Forms**: React Hook Form with Zod validation
- **Notifications**: Sonner (toast notifications)
- **Icons**: Lucide React

## Project Structure

```
/Users/hetansh/pnp/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page (public)
│   ├── layout.tsx                # Root layout with providers
│   ├── globals.css               # Global styles & CSS variables
│   ├── (auth)/                   # Authenticated routes (protected)
│   │   ├── layout.tsx            # Auth layout with sidebar
│   │   ├── markets/
│   │   │   ├── page.tsx          # Market listing page
│   │   │   └── [id]/page.tsx     # Individual market detail
│   │   ├── portfolio/page.tsx    # User positions & P&L
│   │   └── create/page.tsx       # Create new market
│   └── api/                      # API Routes
│       ├── markets/
│       │   ├── route.ts          # GET /api/markets - List all markets
│       │   └── [id]/route.ts     # GET /api/markets/:id - Single market
│       ├── trading/buy/route.ts  # POST - Execute trades (placeholder)
│       ├── positions/route.ts    # GET - User positions (placeholder)
│       ├── redeem/route.ts       # POST - Redeem winnings (placeholder)
│       └── create-market/route.ts # POST - Create market (placeholder)
├── components/
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── tabs.tsx
│   │   ├── skeleton.tsx
│   │   └── label.tsx
│   ├── layout/
│   │   ├── Navbar.tsx            # Top navigation bar
│   │   └── Sidebar.tsx           # Side navigation
│   ├── markets/
│   │   ├── MarketCard.tsx        # Market preview card
│   │   ├── MarketGrid.tsx        # Market listing with filters
│   │   └── MarketStats.tsx       # Market statistics display
│   ├── trading/
│   │   ├── TradingPanel.tsx      # Buy YES/NO interface
│   │   └── PriceDisplay.tsx      # Price visualization
│   ├── portfolio/
│   │   ├── PositionCard.tsx      # Single position display
│   │   └── PositionList.tsx      # List of user positions
│   └── create/
│       └── MarketForm.tsx        # Market creation form
├── lib/
│   ├── pnp-client.ts             # PNP SDK wrapper (SERVER-ONLY)
│   ├── market-utils.ts           # Client-safe market utilities
│   ├── constants.ts              # App constants & categories
│   ├── format.ts                 # Formatting utilities
│   └── utils.ts                  # General utilities (cn function)
├── hooks/
│   ├── use-markets.ts            # React Query hook for markets list
│   ├── use-market.ts             # React Query hook for single market
│   ├── use-positions.ts          # React Query hook for positions
│   └── use-trading.ts            # Trading mutations
├── types/
│   ├── market.ts                 # Market type definitions
│   └── position.ts               # Position type definitions
├── providers.tsx                 # React Query & Privy providers
├── .env                          # Environment variables
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
└── package.json                  # Dependencies
```

## Environment Variables

```env
# Privy Authentication
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id

# Solana RPC
RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

## API Routes

### GET /api/markets
Fetches all markets from PNP SDK with filtering support.

**Query Parameters:**
- `category` - Filter by category (general, twitter, youtube, coin)
- `status` - Filter by status (active, resolved, upcoming)
- `search` - Search by question text
- `limit` - Pagination limit (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "markets": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### GET /api/markets/:id
Fetches a single market by PublicKey.

**Response:**
```json
{
  "market": {
    "publicKey": "HSjmXS8uxBu68Xc1UxpZ4Rz7Kj84T8nW5EUFdie4yh7k",
    "id": "HSjmXS8uxBu68Xc1UxpZ4Rz7Kj84T8nW5EUFdie4yh7k",
    "question": "Will Bitcoin reach $100,000?",
    "category": "coin",
    "currentYesPrice": 0.65,
    "currentNoPrice": 0.35,
    ...
  }
}
```

### POST /api/create-market
Creates a new prediction market (requires Privy server-side SDK setup).

**Request Body:**
```json
{
  "question": "Will X happen?",
  "category": "general|twitter|youtube|coin",
  "marketType": "v2|p2p",
  "endTime": "2025-12-31T23:59:59Z",
  "initialLiquidity": "100",
  "tweetUrl": "https://x.com/...",      // For Twitter category
  "youtubeUrl": "https://youtube.com/...", // For YouTube category
  "protocolName": "Jupiter",            // For Coin category
  "tokenAddress": "..."                 // For Coin category
}
```

## PNP SDK Integration

### Read Operations (Working)
```typescript
import { createReadClient, transformMarketData } from '@/lib/pnp-client';

const client = createReadClient();
const response = await client.fetchMarkets();
const markets = response.data.map(item => transformMarketData({
  ...item.account,
  publicKey: item.publicKey,
}));
```

### Write Operations (Requires Privy Setup)
```typescript
// V2 AMM Markets
client.createMarketTwitter({ question, tweetUrl, initialLiquidity, endTime, collateralTokenMint });
client.createMarketYoutube({ question, youtubeUrl, initialLiquidity, endTime, collateralTokenMint });
client.createMarketDefiLlama({ question, protocolName, metric, initialLiquidity, endTime, collateralTokenMint });
client.market.createMarketDerived({ question, initialLiquidity, endTime, collateralMint });

// P2P Markets
client.createP2PMarketTwitter({ question, tweetUrl, side, initialAmount, creatorSideCap, endTime, ... });
client.createP2PMarketYoutube({ question, youtubeUrl, side, initialAmount, creatorSideCap, endTime, ... });
client.createP2PMarketGeneral({ question, side, initialAmount, creatorSideCap, endTime, ... });
```

## Market Categories

| Category | Required Fields | SDK Method |
|----------|----------------|------------|
| General | question, endTime, liquidity | `createMarketDerived` |
| Twitter | + tweetUrl | `createMarketTwitter` |
| YouTube | + youtubeUrl | `createMarketYoutube` |
| Coin | + protocolName, tokenAddress | `createMarketDefiLlama` |

## Data Transformation

The PNP SDK returns data with snake_case field names. The `transformMarketData` function converts:

```typescript
// SDK Response (snake_case)
{
  yes_token_supply_minted: "124f80",  // Hex string
  no_token_supply_minted: "0f4240",
  end_time: "68be513c",               // Unix timestamp in hex
  creation_time: "6888cba2",
  yes_token_mint: "...",
  no_token_mint: "...",
  collateral_token: "...",
  market_reserves: "...",
  initial_liquidity: "...",
}

// Transformed (camelCase)
{
  yesTokenSupply: "1200000",          // Decimal string
  noTokenSupply: "1000000",
  currentYesPrice: 0.545,             // Calculated from supplies
  currentNoPrice: 0.455,
  endTime: "2025-09-08T03:45:00.000Z",
  creationTime: "2025-07-29T13:24:50.000Z",
  ...
}
```

## Price Calculation

Prices are calculated from token supplies using AMM formula:

```typescript
function calculatePrices(yesSupply: string, noSupply: string) {
  const yes = BigInt(yesSupply);
  const no = BigInt(noSupply);
  const total = yes + no;

  if (total === 0n) return { yesPrice: 0.5, noPrice: 0.5 };

  return {
    yesPrice: Number(yes) / Number(total),
    noPrice: Number(no) / Number(total),
  };
}
```

## Key Constants

```typescript
// lib/constants.ts
export const MARKET_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'coin', label: 'Crypto/DeFi' },
];

export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
export const BUFFER_PERIOD_MS = 15 * 60 * 1000; // 15 minutes
export const MIN_MARKET_LIQUIDITY = 100_000_000; // 100 USDC (6 decimals)
```

## Authentication Flow

1. User clicks "Login" or "Get Started"
2. Privy modal opens with email login option
3. User enters email and OTP
4. Privy creates embedded Solana wallet automatically
5. User redirected to /markets dashboard
6. Wallet address shown in navbar

## Current Status

### Working Features
- Landing page with live market preview
- Market listing with filters and search
- Individual market detail pages
- Real prices from Solana blockchain
- Privy authentication with embedded wallets
- Responsive UI with dark mode support

### Placeholder Features (Need Privy Server SDK)
- Trading (buy YES/NO tokens)
- Portfolio positions
- Redeem winnings
- Create new markets

## Dependencies

### Core
- `next`: ^16.1.4
- `react`: ^19.2.3
- `typescript`: ^5.9.3

### Blockchain
- `pnp-sdk`: ^0.2.6
- `@coral-xyz/anchor`: ^0.30.1
- `@solana/web3.js`: ^1.98.4

### Auth & State
- `@privy-io/react-auth`: ^3.11.0
- `@tanstack/react-query`: ^5.90.19

### UI
- `tailwindcss`: ^4.1.18
- `lucide-react`: ^0.562.0
- `sonner`: ^2.0.7
- `class-variance-authority`: ^0.7.1

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Type check
pnpm typecheck

# Lint
pnpm lint
```

## Common Issues & Solutions

### IdlError: Type not found "TokenSide"
**Solution**: Use `@coral-xyz/anchor@0.30.1` (not 0.29.0 or 0.32.1)

### Lock file error on dev server
**Solution**: Kill existing process and remove lock file:
```bash
pkill -f "next dev"
rm -rf .next/dev/lock
pnpm dev
```

### Market ID vs PublicKey
Market IDs from SDK are numeric, but we need Solana PublicKey strings for routing. The `transformMarketData` function uses `publicKey` field for both `id` and `publicKey` properties.

## Future Enhancements

1. Set up Privy server-side SDK for wallet key extraction
2. Implement trading functionality
3. Add portfolio tracking with P&L calculations
4. Enable market creation for users
5. Add real-time price updates via WebSocket
6. Implement market resolution notifications
7. Add social sharing for markets
8. Mobile app with React Native
