// utils/calculateStockPercentage.ts
export function calculateStockRemainingPercentage(totalStock: number, stockPurchased: number): number {
    if (totalStock <= 0) return 0;
    return Math.round(((totalStock - stockPurchased) / totalStock) * 100);
  }
  