import { PrismaClient, Side } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Executes the settlement of a trade between a buyer and a seller.
 * Ensures ACID compliance using Prisma $transaction.
 */
export async function executeTradeSettlement(
  tradeId: string,
  marketId: string,
  buyerId: string,
  sellerId: string,
  side: Side,
  price: number,
  amount: number
) {
  const totalCost = price * amount;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch users to validate balances 
    const buyer = await tx.user.findUniqueOrThrow({ where: { id: buyerId } });
    const seller = await tx.user.findUniqueOrThrow({ where: { id: sellerId } });

    // Prevent negative balance for buyer
    if (buyer.balance < totalCost) {
      throw new Error("Insufficient balance for buyer");
    }

    // 2. Balance Update Logic
    // Decrease buyer balance
    await tx.user.update({
      where: { id: buyerId },
      data: { balance: { decrement: totalCost } }
    });

    // Increase seller balance
    await tx.user.update({
      where: { id: sellerId },
      data: { balance: { increment: totalCost } }
    });

    // 3. Position Update Logic
    // Update Buyer Position (Increase)
    await tx.position.upsert({
      where: { userId_marketId: { userId: buyerId, marketId } },
      create: {
        userId: buyerId,
        marketId,
        yesAmount: side === 'YES' ? amount : 0,
        noAmount: side === 'NO' ? amount : 0,
      },
      update: {
        yesAmount: side === 'YES' ? { increment: amount } : undefined,
        noAmount: side === 'NO' ? { increment: amount } : undefined,
      }
    });

    // Update Seller Position (Decrease)
    const sellerPosition = await tx.position.findUnique({
      where: { userId_marketId: { userId: sellerId, marketId } }
    });

    if (
      !sellerPosition || 
      (side === 'YES' && sellerPosition.yesAmount < amount) || 
      (side === 'NO' && sellerPosition.noAmount < amount)
    ) {
      throw new Error("Insufficient position for seller");
    }

    await tx.position.update({
      where: { userId_marketId: { userId: sellerId, marketId } },
      data: {
        yesAmount: side === 'YES' ? { decrement: amount } : undefined,
        noAmount: side === 'NO' ? { decrement: amount } : undefined,
      }
    });

    // 4. Transaction Logging
    await tx.transaction.createMany({
      data: [
        {
          userId: buyerId,
          type: 'TRADE',
          amount: -totalCost,
          marketId: marketId
        },
        {
          userId: sellerId,
          type: 'TRADE',
          amount: totalCost,
          marketId: marketId
        }
      ]
    });

    return { success: true, totalCost };
  });
}
