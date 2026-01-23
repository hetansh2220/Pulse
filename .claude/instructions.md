# Claude Instructions for PNP Markets

## Project Context
This is a Solana prediction market platform using PNP SDK v0.2.6. Users can browse markets, trade YES/NO tokens, and create new prediction markets.

## Tech Stack
- Next.js 16 with App Router
- React 19, TypeScript 5
- Tailwind CSS v4
- Privy for auth (embedded Solana wallets)
- TanStack React Query for state
- shadcn/ui components

## Critical Rules

### Dependencies
- MUST use `@coral-xyz/anchor@0.30.1` - other versions cause IdlError
- Use `pnpm` for package management

### PNP SDK Usage
- Server-only: `lib/pnp-client.ts` imports PNP SDK
- Client components cannot import PNP SDK directly
- Use API routes for all SDK operations
- Market IDs use Solana PublicKey strings (base58), not numeric IDs

### Data Transformation
- SDK returns snake_case fields
- `transformMarketData()` converts to camelCase
- Hex values need conversion: `parseInt(hexValue, 16)`
- Timestamps are hex unix timestamps

### Price Calculation
```typescript
yesPrice = yesSupply / (yesSupply + noSupply)
noPrice = 1 - yesPrice
```

### Market Categories
| Category | Required Fields |
|----------|----------------|
| General | question, endTime, liquidity |
| Twitter | + tweetUrl |
| YouTube | + youtubeUrl |
| Coin | + protocolName, tokenAddress |

### Buffer Period
Markets have 15-minute buffer after creation before trading is allowed.

## Code Style
- Functional components only
- Use React Query hooks for data fetching
- Prefer server components when possible
- Use shadcn/ui components from `components/ui/`
- Follow existing patterns in codebase
