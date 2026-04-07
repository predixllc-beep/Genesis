import { PrismaClient, OrderStatus } from '@prisma/client';
import { getBestMatch, removeFromOrderbook, addToOrderbook } from './orderbook';
import { executeTrade, TREASURY_AI } from '../services/trade.service';

const prisma = new PrismaClient();

export async function matchOrder(orderId: string) {
  // 1. Load order
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.status === OrderStatus.FILLED || order.status === OrderStatus.CANCELLED) {
    return;
  }

  let remainingAmount = order.amount - order.filled;
  if (remainingAmount <= 0) return;

  // 2 & 3. Match with best orders
  while (remainingAmount > 0) {
    const match = getBestMatch(order);
    if (!match) break; // No more liquidity on the orderbook

    // 4. Allow partial fills
    const matchRemaining = match.amount - match.filled;
    const tradeAmount = Math.min(remainingAmount, matchRemaining);
    
    // Execution price is the implied price from the maker's order
    const makerPrice = match.price ?? 0.5;
    const executionPrice = 1 - makerPrice;

    try {
      // Execute trade
      await executeTrade({
        buyerId: order.userId,
        sellerId: match.userId,
        marketId: order.marketId,
        side: order.side,
        price: executionPrice,
        amount: tradeAmount,
        orderId: order.id,
        matchedOrderId: match.id
      });

      remainingAmount -= tradeAmount;
      
      // Update in-memory orderbook for the maker
      if (matchRemaining - tradeAmount <= 0) {
        removeFromOrderbook(match.id, match.marketId, match.side);
      } else {
        match.filled += tradeAmount; // Update local memory for partial fill
      }
    } catch (error) {
      console.error(`Trade execution failed between ${order.id} and ${match.id}:`, error);
      // If it fails (e.g., negative balance), remove the invalid maker order from the book
      removeFromOrderbook(match.id, match.marketId, match.side);
    }
  }

  // AMM FALLBACK
  if (remainingAmount > 0) {
    try {
      const market = await prisma.market.findUnique({ where: { id: order.marketId } });
      if (market) {
        // Use market pool price
        const poolPrice = order.side === 'YES' ? market.probYes : market.probNo;
        
        if (order.price === null || order.price >= poolPrice) {
          // Execute trade against system
          await executeTrade({
            buyerId: order.userId,
            sellerId: TREASURY_AI,
            marketId: order.marketId,
            side: order.side,
            price: poolPrice,
            amount: remainingAmount,
            orderId: order.id
          });
          remainingAmount = 0;
        }
      }
    } catch (error) {
      console.error(`AMM execution failed for order ${order.id}:`, error);
    }
  }

  // Finalize Order
  if (remainingAmount > 0) {
    if (order.type === 'LIMIT') {
      // Refresh order from DB to get latest filled amount and add to book
      const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
      if (updatedOrder && updatedOrder.status !== OrderStatus.FILLED) {
        addToOrderbook(updatedOrder);
      }
    } else if (order.type === 'MARKET') {
      // Market orders never stored, cancel the rest
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED }
      });
    }
  }
}
