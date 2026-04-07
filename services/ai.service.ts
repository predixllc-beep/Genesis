export type EdgeSignalType = 'MISPRICING' | 'MOMENTUM' | 'WHALE' | 'LIQUIDITY_GAP' | 'NONE';

export interface EdgeSignal {
  type: EdgeSignalType;
  metadata?: Record<string, any>;
}

export interface MarketData {
  price: number;
  volume: number;
  liquidity: number;
}

export interface TradeData {
  amount: number;
  price: number;
  side: 'YES' | 'NO';
  timestamp: number;
}

export interface AIInsight {
  summary: string;
  reason: string;
  suggestion: string;
}

/**
 * AI Orchestration Layer
 * Converts raw edge signals and market data into human-readable insights.
 * Uses fast, logic-based templates to ensure <10ms execution time.
 */
export function generateInsight(
  signal: EdgeSignal | null,
  market: MarketData,
  recentTrades: TradeData[]
): AIInsight {
  if (!signal || signal.type === 'NONE') {
    return {
      summary: "Market stable",
      reason: "Market stable, no strong edge detected",
      suggestion: "Wait for a clearer signal or trade based on fundamental conviction."
    };
  }

  switch (signal.type) {
    case 'MISPRICING':
      return {
        summary: "Price deviation detected",
        reason: "Current price deviates significantly from expected value based on recent order flow and liquidity depth.",
        suggestion: "Consider entering to capture the spread before the market corrects."
      };
      
    case 'MOMENTUM':
      return {
        summary: "Strong momentum detected",
        reason: "Price is trending rapidly with rising volume and consistent directional trades.",
        suggestion: "Consider entering before further breakout, but watch volatility."
      };
      
    case 'WHALE':
      return {
        summary: "Whale activity detected",
        reason: "A large trade has significantly impacted the market price and absorbed available liquidity.",
        suggestion: "Follow the smart money, but be aware of potential sudden reversals."
      };
      
    case 'LIQUIDITY_GAP':
      return {
        summary: "Liquidity gap risk",
        reason: "Low available liquidity on the orderbook may cause high slippage on large market orders.",
        suggestion: "Use limit orders and avoid market orders to prevent bad execution prices."
      };
      
    default:
      return {
        summary: "Market stable",
        reason: "Market stable, no strong edge detected",
        suggestion: "Wait for a clearer signal or trade based on fundamental conviction."
      };
  }
}
