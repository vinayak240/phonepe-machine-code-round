const Trade = require("../models/Trade");

class TradeService {
  constructor(tradeRepository) {
    this.tradeRepository = tradeRepository;
  }

  createTrade({ tradeType, buyOrder, sellOrder, quantity, price }) {
    const trade = new Trade({
      id: `TRADE-${Date.now()}-${Math.random()}`,

      tradeType,

      buyOrderId: buyOrder.id,

      sellOrderId: sellOrder.id,

      symbol: buyOrder.symbol,

      quantity,

      price,
    });

    this.tradeRepository.create(trade);

    // console.log("\nTRADE EXECUTED:");
    // console.log(trade);

    return trade;
  }

  getTrades() {
    return this.tradeRepository.getAll();
  }
}

module.exports = TradeService;
