# PNP Markets - Complete Project Documentation

A comprehensive guide to the PNP Markets prediction market platform, covering everything from A-Z including architecture, data flow, and PNP SDK integration.

---

## Table of Contents

1. [What is PNP Markets?](#1-what-is-pnp-markets)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [User Journey (A-Z)](#4-user-journey-a-z)
5. [PNP SDK Integration](#5-pnp-sdk-integration)
6. [API Routes](#6-api-routes)
7. [Data Flow](#7-data-flow)
8. [Pages & Components](#8-pages--components)
9. [Authentication with Privy](#9-authentication-with-privy)
10. [Trading Logic](#10-trading-logic)
11. [Current Status](#11-current-status)
12. [Development Guide](#12-development-guide)

---

## 1. What is PNP Markets?

PNP Markets is a **decentralized prediction market platform** built on **Solana blockchain** using the **PNP Protocol SDK**.

### What Users Can Do:
- **Trade YES/NO outcome tokens** on real-world events
- **Categories supported:**
  - Twitter/X engagement (likes, retweets, followers)
  - YouTube metrics (views, subscribers)
  - Cryptocurrency prices
  - General predictions (sports, politics, etc.)

### How It Works:
1. Markets have a question like "Will Bitcoin reach $100,000 by Dec 2025?"
2. Users buy **YES tokens** if they think it will happen
3. Users buy **NO tokens** if they think it won't happen
4. Prices reflect market consensus (65¢ YES = 65% probability)
5. When the event resolves, winning tokens are worth $1, losing tokens worth $0

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router with Turbopack) |
| **Language** | TypeScript 5 |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS v4 with CSS variables |
| **Components** | shadcn/ui (Radix UI primitives) |
| **Authentication** | Privy (embedded Solana wallets, email login) |
| **Blockchain** | Solana (mainnet-beta) |
| **SDK** | PNP SDK v0.2.6 |
| **State Management** | TanStack React Query v5 |
| **Forms** | React Hook Form + Zod validation |
| **Notifications** | Sonner (toast) |
| **Icons** | Lucide React |

---

## 3. Project Structure

```
pnp/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page (public)
│   ├── layout.tsx                # Root layout with providers
│   ├── globals.css               # Global styles
│   ├── (auth)/                   # Protected routes
│   │   ├── layout.tsx            # Auth layout with sidebar
│   │   ├── markets/
│   │   │   ├── page.tsx          # Market listing
│   │   │   └── [id]/page.tsx     # Market detail
│   │   ├── portfolio/page.tsx    # User positions
│   │   └── create/page.tsx       # Create market
│   └── api/                      # API Routes
│       ├── markets/route.ts      # GET all markets
│       ├── markets/[id]/route.ts # GET single market
│       ├── trading/buy/route.ts  # POST buy tokens
│       ├── trading/sell/route.ts # POST sell tokens
│       ├── positions/route.ts    # GET user positions
│       └── redeem/route.ts       # POST redeem winnings
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # Navbar, Sidebar
│   ├── markets/                  # MarketCard, MarketGrid
│   ├── trading/                  # TradingPanel, PriceDisplay
│   └── portfolio/                # PositionCard, PositionList
├── lib/
│   ├── pnp-client.ts             # PNP SDK wrapper (SERVER-ONLY)
│   ├── market-utils.ts           # Price calculations (CLIENT-SAFE)
│   ├── privy-signer.ts           # Custom signer for Privy
│   ├── constants.ts              # App constants
│   ├── format.ts                 # Formatting utilities
│   └── utils.ts                  # General utilities
├── hooks/
│   ├── use-markets.ts            # Fetch markets list
│   ├── use-market.ts             # Fetch single market
│   ├── use-positions.ts          # Fetch user positions
│   └── use-trading.ts            # Trading mutations
├── types/
│   ├── market.ts                 # Market type definitions
│   └── position.ts               # Position type definitions
└── providers.tsx                 # React Query + Privy setup
```

---

## 4. User Journey (A-Z)

### Step A: Landing Page
User visits the app and sees:
- Hero section with "Trade the Future" messaging
- Live market ticker with featured markets
- Market categories showcase
- "How it works" explanation
- Login/Get Started buttons

### Step B: Authentication
1. User clicks "Login" or "Get Started"
2. Privy modal opens with email login
3. User enters email → receives OTP → verifies
4. Privy automatically creates embedded Solana wallet
5. User redirected to `/markets` dashboard

### Step C: Browse Markets
On `/markets` page, user can:
- View all markets in a grid layout
- **Filter by category**: General, Twitter, YouTube, Crypto
- **Filter by status**: Active, Ended, Resolved, Upcoming
- **Search** by question text
- **Filter by date**: Markets ending before specific date
- See real-time prices from blockchain

### Step D: View Market Details
Clicking a market card opens `/markets/[id]`:
- Full market question and description
- Current YES/NO prices with probability percentages
- Price distribution bar (visual)
- Volume, liquidity, and reserve stats
- End date and creation date
- Link to view on Solscan (blockchain explorer)

### Step E: Trade
On the market detail page (right panel):
1. Select **Buy** or **Sell** tab
2. Choose **YES** or **NO** token
3. Enter amount (USDC for buy, tokens for sell)
4. See estimation: tokens received, effective price, potential return
5. Click trade button
6. Transaction signed and submitted to Solana

### Step F: Portfolio Management
On `/portfolio` page:
- See total portfolio value
- View all positions with P&L
- Track claimable winnings from resolved markets

### Step G: Redeem Winnings
When a market resolves:
- Winning tokens can be redeemed for $1 each
- Losing tokens become worthless
- User clicks "Redeem" to claim winnings

---

## 5. PNP SDK Integration

This is the core of the application. The PNP SDK connects to Solana blockchain to interact with prediction markets.

### 5.1 SDK Setup

**File:** `lib/pnp-client.ts`

```typescript
import { PNPClient } from 'pnp-sdk';

// Read-only client (no signing capability)
export function createReadClient(): PNPClient {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL;
  return new PNPClient(rpcUrl);
}

// Write client (can sign transactions)
export function createWriteClient(privateKey: string): PNPClient {
  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_URL;
  return new PNPClient(rpcUrl, privateKey);
}
```

### 5.2 Read Operations (Currently Working)

#### Fetching All Markets
```typescript
const client = createReadClient();
const response = await client.fetchMarkets();
// Returns: { data: Array<{ publicKey, account }> }
```

**Used in:** `GET /api/markets`

#### Fetching Single Market
```typescript
const client = createReadClient();
const market = await client.fetchMarket(publicKey);
// Returns: { account: MarketAccountData }
```

**Used in:** `GET /api/markets/[id]`

#### Getting Real-Time Prices
```typescript
const prices = await client.trading.getPrices(marketPublicKey);
// Returns: { yesPrice, noPrice }
```

#### Getting Market Multipliers
```typescript
const info = await client.getV2MarketInfo(marketPublicKey);
// Returns: { yesMultiplier, noMultiplier }
```

### 5.3 Data Transformation

The SDK returns data in **snake_case** with **hex values**. The `transformMarketData()` function converts this to our app format.

**SDK Response (raw):**
```typescript
{
  yes_token_supply_minted: "124f80",     // Hex string
  no_token_supply_minted: "0f4240",      // Hex string
  end_time: "68be513c",                  // Unix timestamp in hex
  creation_time: "6888cba2",             // Unix timestamp in hex
  yes_token_mint: "...",                 // Solana PublicKey
  no_token_mint: "...",
  collateral_token: "...",
  market_reserves: "...",
  initial_liquidity: "...",
  resolved: false,
  winning_token_id: null
}
```

**After Transformation:**
```typescript
{
  publicKey: "HSjmXS8uxBu68Xc1UxpZ4Rz7Kj84T8nW5EUFdie4yh7k",
  id: "HSjmXS8uxBu68Xc1UxpZ4Rz7Kj84T8nW5EUFdie4yh7k",
  question: "Will Bitcoin reach $100,000?",
  category: "coin",
  yesTokenSupply: "1200000",             // Decimal string
  noTokenSupply: "1000000",              // Decimal string
  currentYesPrice: 0.545,                // Calculated
  currentNoPrice: 0.455,                 // Calculated
  endTime: "2025-09-08T03:45:00.000Z",   // ISO string
  creationTime: "2025-07-29T13:24:50.000Z",
  resolved: false,
  resolvable: false,
  winningToken: undefined,
  bufferPeriodActive: false
}
```

### 5.4 Price Calculation

Prices are calculated from token supplies using the AMM formula:

```typescript
// lib/market-utils.ts
export function calculatePrices(yesSupply: string, noSupply: string) {
  const yes = BigInt(yesSupply);
  const no = BigInt(noSupply);
  const total = yes + no;

  if (total === 0n) {
    return { yesPrice: 0.5, noPrice: 0.5 };
  }

  return {
    yesPrice: Number(yes) / Number(total),
    noPrice: Number(no) / Number(total),
  };
}
```

**Example:**
- YES supply: 6,500,000
- NO supply: 3,500,000
- Total: 10,000,000
- YES price: 6,500,000 / 10,000,000 = **0.65 ($0.65)**
- NO price: 3,500,000 / 10,000,000 = **0.35 ($0.35)**

### 5.5 Write Operations (Placeholder - Needs Privy Server Setup)

#### Buying Tokens
```typescript
const client = createWriteClient(userPrivateKey);
const result = await client.trading.buyTokensUsdc({
  market: marketPublicKey,
  buyYesToken: true,  // or false for NO
  amountUsdc: 50_000_000,  // 50 USDC (6 decimals)
  slippage: 1,  // 1%
});
// Returns: { signature, tokensReceived }
```

#### Selling Tokens
```typescript
const result = await client.trading.sellTokensUsdc({
  market: marketPublicKey,
  sellYesToken: true,
  tokenAmount: 100_000_000,
  slippage: 1,
});
// Returns: { signature, usdcReceived }
```

#### Creating Markets

**Twitter Market:**
```typescript
await client.createMarketTwitter({
  question: "Will this tweet get 10K likes?",
  tweetUrl: "https://x.com/user/status/123",
  initialLiquidity: 100_000_000,  // 100 USDC
  endTime: new Date("2025-12-31"),
  collateralTokenMint: USDC_MINT,
});
```

**YouTube Market:**
```typescript
await client.createMarketYoutube({
  question: "Will this video reach 1M views?",
  youtubeUrl: "https://youtube.com/watch?v=...",
  initialLiquidity: 100_000_000,
  endTime: new Date("2025-12-31"),
  collateralTokenMint: USDC_MINT,
});
```

**Crypto/DeFi Market:**
```typescript
await client.createMarketDefiLlama({
  question: "Will Jupiter TVL exceed $2B?",
  protocolName: "Jupiter",
  metric: "tvl",
  initialLiquidity: 100_000_000,
  endTime: new Date("2025-12-31"),
  collateralTokenMint: USDC_MINT,
});
```

**General Market:**
```typescript
await client.market.createMarketDerived({
  question: "Will Team X win the championship?",
  initialLiquidity: 100_000_000,
  endTime: new Date("2025-12-31"),
  collateralMint: USDC_MINT,
});
```

---

## 6. API Routes

### GET /api/markets

Fetches all markets with optional filtering.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter: general, twitter, youtube, coin |
| `status` | string | Filter: active, ended, resolved, upcoming |
| `search` | string | Search by question text |
| `limit` | number | Pagination limit (default: 50) |
| `offset` | number | Pagination offset (default: 0) |

**Response:**
```json
{
  "markets": [
    {
      "publicKey": "HSjmXS8uxBu68Xc1UxpZ4Rz7Kj84T8nW5EUFdie4yh7k",
      "question": "Will Bitcoin reach $100,000?",
      "category": "coin",
      "currentYesPrice": 0.65,
      "currentNoPrice": 0.35,
      ...
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

**Implementation Flow:**
1. Create read-only PNP client
2. Call `client.fetchMarkets()`
3. Transform each market via `transformMarketData()`
4. Apply filters (category, status, search)
5. Apply pagination (limit, offset)
6. Return JSON response

---

### GET /api/markets/[id]

Fetches a single market by PublicKey.

**Response:**
```json
{
  "market": {
    "publicKey": "HSjmXS8uxBu68Xc1UxpZ4Rz7Kj84T8nW5EUFdie4yh7k",
    "question": "Will Bitcoin reach $100,000?",
    "currentYesPrice": 0.65,
    "currentNoPrice": 0.35,
    "yesMultiplier": 1.54,
    "noMultiplier": 2.86,
    ...
  }
}
```

**Implementation Flow:**
1. Create read-only PNP client
2. Convert ID string to Solana PublicKey
3. Call `client.fetchMarket(publicKey)`
4. Optionally fetch real prices via `client.trading.getPrices()`
5. Optionally fetch multipliers via `client.getV2MarketInfo()`
6. Transform and return market data

---

### POST /api/trading/buy (Placeholder)

Executes a buy order for YES/NO tokens.

**Request Body:**
```json
{
  "marketId": "HSjmXS8uxBu68Xc1UxpZ4Rz7Kj84T8nW5EUFdie4yh7k",
  "tokenType": "yes",
  "amount": 50.5,
  "slippage": 1
}
```

**Response (when implemented):**
```json
{
  "success": true,
  "signature": "5wHu1qwD7...",
  "tokensReceived": "77.31",
  "effectivePrice": 0.653
}
```

**Implementation (TODO):**
1. Authenticate via Privy server-side SDK
2. Extract user's wallet private key
3. Create write client with private key
4. Call `client.trading.buyTokensUsdc()`
5. Return transaction signature and result

---

### POST /api/trading/sell (Placeholder)

Executes a sell order.

**Request Body:**
```json
{
  "marketId": "HSjmXS8uxBu68Xc1UxpZ4Rz7Kj84T8nW5EUFdie4yh7k",
  "tokenType": "yes",
  "amount": 100,
  "slippage": 1
}
```

---

### GET /api/positions (Placeholder)

Fetches user's market positions.

**Response (when implemented):**
```json
{
  "positions": [
    {
      "marketId": "...",
      "marketQuestion": "Will BTC hit 100K?",
      "yesTokenBalance": "150.5",
      "noTokenBalance": "0",
      "totalInvested": "100",
      "currentValue": "120.4",
      "unrealizedPnL": "20.4"
    }
  ],
  "summary": {
    "totalValue": "1250.50",
    "totalInvested": "1000.00",
    "totalPnL": "250.50"
  }
}
```

---

### POST /api/redeem (Placeholder)

Redeems winnings from resolved markets.

**Request Body:**
```json
{
  "marketId": "HSjmXS8uxBu68Xc1UxpZ4Rz7Kj84T8nW5EUFdie4yh7k"
}
```

---

## 7. Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           READING MARKETS                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   User       │     │   React      │     │   API        │     │   PNP SDK    │
│   Browser    │     │   Component  │     │   Route      │     │   → Solana   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │  Opens /markets    │                    │                    │
       │───────────────────>│                    │                    │
       │                    │                    │                    │
       │                    │  useMarkets()      │                    │
       │                    │  fetch('/api/markets')                  │
       │                    │───────────────────>│                    │
       │                    │                    │                    │
       │                    │                    │  createReadClient()│
       │                    │                    │  client.fetchMarkets()
       │                    │                    │───────────────────>│
       │                    │                    │                    │
       │                    │                    │    Raw market data │
       │                    │                    │<───────────────────│
       │                    │                    │                    │
       │                    │                    │  transformMarketData()
       │                    │                    │  (snake_case → camelCase)
       │                    │                    │  (hex → decimal)
       │                    │                    │  (calculate prices)
       │                    │                    │                    │
       │                    │   JSON Response    │                    │
       │                    │<───────────────────│                    │
       │                    │                    │                    │
       │                    │  React Query cache │                    │
       │                    │  (staleTime: 30s)  │                    │
       │                    │                    │                    │
       │  Render MarketCards│                    │                    │
       │<───────────────────│                    │                    │
       │                    │                    │                    │

┌─────────────────────────────────────────────────────────────────────────────┐
│                           TRADING (Future)                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   User       │     │   Trading    │     │   API + Privy│     │   PNP SDK    │
│   Action     │     │   Panel      │     │   Server     │     │   → Solana   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │                    │
       │  Click "Buy YES"   │                    │                    │
       │───────────────────>│                    │                    │
       │                    │                    │                    │
       │                    │  useTradingMutation()                   │
       │                    │  POST /api/trading/buy                  │
       │                    │───────────────────>│                    │
       │                    │                    │                    │
       │                    │                    │  Get wallet from Privy
       │                    │                    │  createWriteClient(key)
       │                    │                    │  client.trading.buyTokensUsdc()
       │                    │                    │───────────────────>│
       │                    │                    │                    │
       │                    │                    │    Transaction sig │
       │                    │                    │<───────────────────│
       │                    │                    │                    │
       │                    │   Success response │                    │
       │                    │<───────────────────│                    │
       │                    │                    │                    │
       │                    │  Invalidate queries│                    │
       │                    │  Show toast        │                    │
       │                    │                    │                    │
       │  Updated prices    │                    │                    │
       │<───────────────────│                    │                    │
```

---

## 8. Pages & Components

### Landing Page (`/`)

**Features:**
- Hero section: "Trade the Future" with animated gradient text
- Feature cards: Sub-second trades, No wallet required, On-chain, Real-time prices
- Live market ticker: 4 featured markets from API
- Category showcase: Twitter, YouTube, Crypto, General
- How it works: Connect → Fund → Trade → Win
- CTA buttons for login and exploration

---

### Markets Page (`/markets`)

**Features:**
- Grid of market cards (3 columns on desktop)
- Filters:
  - Search box (debounced 300ms)
  - Category dropdown
  - Status dropdown
  - Date picker for end date
  - Clear filters button
- Result count and refresh button
- Loading skeletons while fetching

**Component:** `MarketCard`
- Status badge (Active/Ended/Resolved/Upcoming)
- Market question (truncated)
- YES/NO prices with colors (green/red)
- Volume and end date
- Bookmark button (UI only)

---

### Market Detail Page (`/markets/[id]`)

**Left Section (2/3 width):**
- Price history chart (placeholder)
- Stats row: Volume, Liquidity, Reserves
- Price distribution bar
- Current prices with probability %
- Market details (dates, description)
- Solscan link

**Right Section (1/3 width) - Trading Panel:**
- Buy/Sell tabs
- YES/NO toggle
- Amount input
- Estimation display:
  - Est. tokens received (buy)
  - Est. USDC received (sell)
  - Effective price
  - Potential return
- Trade button with loading state
- Warning messages for restrictions

---

### Portfolio Page (`/portfolio`)

**Summary Cards:**
- Total Value
- Total Invested
- Total P&L (with color)

**Stats Bar:**
- Active positions count
- Settled positions count
- Claimable wins count

**Position List:**
- Each position shows market question, token balances, P&L
- Redeem button for resolved winning positions

---

### Create Market Page (`/create`)

**Section 1 - Question & Category:**
- Text area for question (10-200 chars)
- Category selection
- Category-specific fields:
  - Twitter: Tweet URL input
  - YouTube: Video URL input
  - Coin: Protocol name + token address

**Section 2 - Parameters:**
- Market type: V2 AMM vs P2P
- For P2P: Your position (YES/NO), max exposure
- End date/time picker
- Initial liquidity input (min 100 USDC)

---

## 9. Authentication with Privy

### Configuration (`providers.tsx`)

```typescript
<PrivyProvider
  appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
  config={{
    loginMethods: ['email'],
    embeddedWallets: {
      solana: {
        createOnLogin: 'users-without-wallets'
      }
    }
  }}
>
```

### Login Flow

1. User clicks "Login"
2. Privy modal appears with email input
3. User enters email
4. OTP sent to email
5. User enters OTP
6. Privy verifies and creates session
7. If new user: Embedded Solana wallet created automatically
8. User redirected to `/markets`

### Accessing Wallet

```typescript
// In authenticated layout
const { user } = usePrivy();

const solanaWallet = user?.linkedAccounts?.find(
  (account) => account.type === 'wallet' && account.walletClientType === 'privy'
);

const walletAddress = solanaWallet?.address;
```

### Protected Routes

The `(auth)` folder in `app/` uses a layout that:
1. Checks `authenticated` state from Privy
2. Shows loading spinner while checking
3. Redirects to `/` if not authenticated
4. Renders children if authenticated

---

## 10. Trading Logic

### Price Calculation (AMM)

The AMM (Automated Market Maker) uses constant product formula:

```
yesPrice = yesSupply / totalSupply
noPrice = noSupply / totalSupply
```

**Key property:** Prices always sum to 1 (100%)

### Buffer Period

After market creation, there's a **15-minute buffer period** where trading is disabled. This prevents front-running the initial liquidity.

```typescript
// lib/market-utils.ts
export const BUFFER_PERIOD_MS = 15 * 60 * 1000; // 15 minutes

export function isInBufferPeriod(creationTime: string): boolean {
  const created = new Date(creationTime).getTime();
  const now = Date.now();
  return now - created < BUFFER_PERIOD_MS;
}
```

### Trade Estimation

Before trading, users see estimated results:

**Buy Estimation:**
```typescript
function estimateTokensReceived(usdcAmount, tokenType, yesSupply, noSupply) {
  const { yesPrice, noPrice } = calculatePrices(yesSupply, noSupply);
  const price = tokenType === 'yes' ? yesPrice : noPrice;
  return usdcAmount / price;
}
```

**Sell Estimation:**
```typescript
function estimateUsdcReceived(tokenAmount, tokenType, yesSupply, noSupply) {
  const { yesPrice, noPrice } = calculatePrices(yesSupply, noSupply);
  const price = tokenType === 'yes' ? yesPrice : noPrice;
  return tokenAmount * price;
}
```

### Trading Restrictions

Trading is **disabled** when:
1. **Buffer period active** - First 15 minutes after creation
2. **Market ended** - Past end time, awaiting resolution
3. **Market resolved** - Can only redeem, not trade

---

## 11. Current Status

### Working Features

| Feature | Status | Notes |
|---------|--------|-------|
| Landing page | ✅ Working | With live market preview |
| Market listing | ✅ Working | Filters, search, pagination |
| Market detail | ✅ Working | Real prices from blockchain |
| Privy authentication | ✅ Working | Email login, embedded wallet |
| Responsive UI | ✅ Working | Mobile/tablet support |
| Dark mode | ✅ Working | Neon terminal aesthetic |

### Placeholder Features (Need Privy Server Setup)

| Feature | Status | Blocker |
|---------|--------|---------|
| Trading | ⏳ Placeholder | Need Privy server SDK to extract wallet key |
| Portfolio | ⏳ Placeholder | Need wallet address for balance queries |
| Redeem winnings | ⏳ Placeholder | Need signing capability |
| Create markets | ⏳ Placeholder | Need signing capability |

### What's Needed to Enable Trading

1. Set up Privy server-side SDK
2. Implement wallet key extraction on server
3. Create custom signer (`lib/privy-signer.ts` is ready)
4. Connect signer to PNP SDK write operations

---

## 12. Development Guide

### Environment Variables

```env
# Required
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com

# Optional
RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

### Commands

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

### Common Issues

**IdlError: Type not found "TokenSide"**
- Solution: Use `@coral-xyz/anchor@0.30.1` (not 0.29.0 or 0.32.1)

**Lock file error on dev server**
```bash
pkill -f "next dev"
rm -rf .next/dev/lock
pnpm dev
```

**Market ID vs PublicKey**
- Market IDs from SDK are numeric
- We use Solana PublicKey strings for routing
- `transformMarketData` uses `publicKey` field for both

---

## Summary

PNP Markets is a well-architected prediction market platform with:

1. **Clear separation** between read operations (working) and write operations (placeholder)
2. **Proper SDK abstraction** via `pnp-client.ts` wrapper
3. **Efficient data fetching** through React Query with caching
4. **Clean data transformation** from blockchain format to app format
5. **Modern authentication** via Privy with embedded wallets
6. **Polished UI** with dark theme and responsive design

The main remaining work is connecting Privy's server-side SDK to enable actual trading, market creation, and portfolio tracking.
