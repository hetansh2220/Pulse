export interface Position {
  // Market information
  marketId: string;
  marketPublicKey: string;
  marketQuestion: string;

  // Token balances
  yesTokenBalance: string;
  noTokenBalance: string;

  // Financial metrics
  totalInvested: string; // Total USDC invested
  currentValue: string; // Current value in USDC
  unrealizedPnL: string; // Profit/Loss in USDC
  unrealizedPnLPercent: number; // P&L as percentage

  // Market state
  marketResolved: boolean;
  marketEndTime: string;
  winningToken?: 'yes' | 'no' | 'none';

  // Redemption
  claimable: boolean; // Can redeem winnings
  claimableAmount?: string; // Amount that can be claimed
}

export interface PositionsSummary {
  totalValue: string; // Total portfolio value in USDC
  totalInvested: string; // Total amount invested
  totalPnL: string; // Total profit/loss
  totalPnLPercent: number; // Total P&L percentage
  activePositions: number; // Count of active positions
  settledPositions: number; // Count of settled positions
}

export interface PositionsResponse {
  positions: Position[];
  summary: PositionsSummary;
}

export interface RedeemParams {
  marketId: string;
}

export interface RedeemResponse {
  success: boolean;
  signature: string;
  amountRedeemed: string;
}
