const OrderBook = require("../models/OrderBook");

class OrderBookRepository {
  constructor() {
    /**
     * symbol -> OrderBook
     */
    this.orderBooks = new Map();
  }

  getBySymbol(symbol) {
    if (!this.orderBooks.has(symbol)) {
      this.orderBooks.set(symbol, new OrderBook(symbol));
    }

    return this.orderBooks.get(symbol);
  }

  getAll() {
    return [...this.orderBooks.values()];
  }
}

module.exports = OrderBookRepository;
