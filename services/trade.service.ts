import { PrismaClient, Side, OrderStatus } from '@prisma/client';
import { eventBus } from './event-bus';

const prisma = new PrismaClient();

export const TREASURY_AI = 'TREASURY_AI';

export async function executeTrade(params: {
  buyerId: string;
  sellerId: string;
  marketId: string;
  side: Side;
  price: number;
  amount: number;
  orderId?: string;
  matchedOrderId?: string;
}) {
  const { buyerId, sellerId, marketId, side, price, amount, orderId, matchedOrderId } = params;
  const totalCost = price * amount;

  let probYesFinal = 0;
  let probNoFinal = 0;

  const trade = await prisma.$transaction(async (tx) => {
    // 1. Create Trade
    const trade = await tx.trade.create({
      data: {
        marketId,
        buyerId,
        sellerId,
        price,
        amount,
        side
      }
    });

    // 2. Update Buyer balance (decrease)
    if (buyerId !== TREASURY_AI) {
      const buyer = await tx.user.findUnique({ where: { id: buyerId } });
      if (!buyer || buyer.balance < totalCost) {
        throw new Error("Insufficient balance for buyer");
      }
      await tx.user.update({
        where: { id: buyerId },
        data: { balance: { decrement: totalCost } }
      });
    }

    // 3. Update Seller balance (increase)
    if (sellerId !== TREASURY_AI) {
      await tx.user.update({
        where: { id: sellerId },
        data: { balance: { increment: totalCost } }
      });
    }

    // 4. Update Positions (yes/no)
    if (buyerId !== TREASURY_AI) {
      await tx.position.upsert({
        where: { userId_marketId: { userId: buyerId, marketId } },
        create: {
          userId: buyerId,
          marketId,
          yesAmount: side === 'YES' ? amount : 0,
          noAmount: side === 'NO' ? amount : 0
        },
        update: {
          yesAmount: side === 'YES' ? { increment: amount } : undefined,
          noAmount: side === 'NO' ? { increment: amount } : undefined
        }
      });
    }

    // 5. Update Order: filled += amount, status update
    if (orderId) {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (order) {
        const newFilled = order.filled + amount;
        const newStatus = newFilled >= order.amount ? OrderStatus.FILLED : OrderStatus.PARTIAL;
        await tx.order.update({
          where: { id: orderId },
          data: { filled: newFilled, status: newStatus }
        });
      }
    }
    
    if (matchedOrderId) {
      const matchedOrder = await tx.order.findUnique({ where: { id: matchedOrderId } });
      if (matchedOrder) {
        const newFilled = matchedOrder.filled + amount;
        const newStatus = newFilled >= matchedOrder.amount ? OrderStatus.FILLED : OrderStatus.PARTIAL;
        await tx.order.update({
          where: { id: matchedOrderId },
          data: { filled: newFilled, status: newStatus }
        });
      }
    }

    // 6. Update Market pools
    const market = await tx.market.findUnique({ where: { id: marketId } });
    if (!market) throw new Error("Market not found");

    const newYesPool = side === 'YES' ? market.yesPool + amount : market.yesPool;
    const newNoPool = side === 'NO' ? market.noPool + amount : market.noPool;
    const totalPool = newYesPool + newNoPool;

    // 7. Recalculate price
    let probYes = market.probYes;
    let probNo = market.probNo;
    
    if (totalPool > 0) {
      probYes = newYesPool / totalPool;
      probNo = newNoPool / totalPool;
    }

    probYesFinal = probYes;
    probNoFinal = probNo;

    await tx.market.update({
      where: { id: marketId },
      data: {
        yesPool: newYesPool,
        noPool: newNoPool,
        probYes,
        probNo
      }
    });

    // 8. Create Transaction logs (2 records)
    if (buyerId !== TREASURY_AI) {
      await tx.transaction.create({
        data: {
          userId: buyerId,
          type: 'TRADE',
          amount: -totalCost,
          marketId
        }
      });
    }
    if (sellerId !== TREASURY_AI) {
      await tx.transaction.create({
        data: {
          userId: sellerId,
          type: 'TRADE',
          amount: totalCost,
          marketId
        }
      });
    }

    return trade;
  });

  // Emit events after successful transaction
  eventBus.emit("trade_executed", {
    marketId,
    price,
    amount,
    side,
    buyerId,
    sellerId
  });

  eventBus.emit("price_updated", {
    marketId,
    probYes: probYesFinal,
    probNo: probNoFinal
  });

  return trade;
}
