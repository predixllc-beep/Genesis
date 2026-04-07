import { Order, Side } from '@prisma/client';

type OrderbookState = {
  [marketId: string]: {
    YES: Order[];
    NO: Order[];
  };
};

// In-memory orderbook
const orderbooks: OrderbookState = {};

export function getMarketOrderbook(marketId: string) {
  if (!orderbooks[marketId]) {
    orderbooks[marketId] = { YES: [], NO: [] };
  }
  return orderbooks[marketId];
}

export function addToOrderbook(order: Order) {
  if (order.type === 'MARKET') return; // MARKET orders are never stored

  const book = getMarketOrderbook(order.marketId);
  const sideBook = book[order.side];
  
  // Check if already exists to prevent duplicates
  if (sideBook.some(o => o.id === order.id)) return;

  sideBook.push(order);
  
  // Sort: 1. Best price first (highest price bidder), 2. Oldest first (FIFO)
  sideBook.sort((a, b) => {
    const priceA = a.price ?? 0;
    const priceB = b.price ?? 0;
    if (priceB !== priceA) {
      return priceB - priceA; // Descending price
    }
    return a.createdAt.getTime() - b.createdAt.getTime(); // Ascending time
  });
}

export function removeFromOrderbook(orderId: string, marketId: string, side: Side) {
  const book = getMarketOrderbook(marketId);
  book[side] = book[side].filter(o => o.id !== orderId);
}

export function getBestMatch(order: Order): Order | null {
  const book = getMarketOrderbook(order.marketId);
  // Determine opposite side
  const oppositeSide = order.side === 'YES' ? 'NO' : 'YES';
  const oppositeOrders = book[oppositeSide];

  for (const matchOrder of oppositeOrders) {
    // Prevent self-trading
    if (matchOrder.userId === order.userId) continue;

    // Calculate implied price
    // If maker wants to buy NO at 0.40, they are effectively selling YES at 0.60
    const takerPrice = order.price ?? 1.0; // MARKET order accepts any price
    const makerPrice = matchOrder.price ?? 0.5;
    const impliedMakerPrice = 1 - makerPrice;

    // Check if prices overlap
    if (takerPrice >= impliedMakerPrice) {
      return matchOrder;
    }
  }
  
  return null;
}
