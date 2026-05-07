class Trade {
  constructor({
    id,
    tradeType,
    buyOrderId,
    sellOrderId,
    symbol,
    quantity,
    price,
  }) {
    this.id = id;

    this.tradeType = tradeType;

    this.buyOrderId = buyOrderId;

    this.sellOrderId = sellOrderId;

    this.symbol = symbol;

    this.quantity = quantity;

    this.price = price;

    this.timestamp = Date.now();
  }
}

module.exports = Trade;
