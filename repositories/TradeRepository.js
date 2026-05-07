class TradeRepository {
  constructor() {
    this.trades = [];
  }

  create(trade) {
    this.trades.push(trade);

    return trade;
  }

  getAll() {
    return this.trades;
  }

  getBySymbol(symbol) {
    return this.trades.filter((trade) => trade.symbol === symbol);
  }

  getByOrderId(orderId) {
    return this.trades.filter(
      (trade) => trade.buyOrderId === orderId || trade.sellOrderId === orderId,
    );
  }
}

module.exports = TradeRepository;
