export function calculateDonutPercentage(stock: string, stock_reduc: string): number {
    const stockNumber = parseInt(stock);
    const stockReducNumber = parseInt(stock_reduc);

    if (isNaN(stockNumber) || isNaN(stockReducNumber)) {
        return 0;
    }

    const percentage = ((stockNumber - stockReducNumber) / stockNumber) * 100;
    return parseFloat(percentage.toFixed(2));
}