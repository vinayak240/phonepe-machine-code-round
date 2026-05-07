class OrderBook {
  constructor(symbol) {
    this.symbol = symbol;

    /**
     * price -> queue of orders
     *
     * FIFO REQUIRED
     */

    this.buyOrders = new Map();

    this.sellOrders = new Map();
  }

  getBuyQueue(price) {
    if (!this.buyOrders.has(price)) {
      this.buyOrders.set(price, []);
    }

    return this.buyOrders.get(price);
  }

  getSellQueue(price) {
    if (!this.sellOrders.has(price)) {
      this.sellOrders.set(price, []);
    }

    return this.sellOrders.get(price);
  }

  addOrder(order) {
    const targetQueue =
      order.type === "BUY"
        ? this.getBuyQueue(order.price)
        : this.getSellQueue(order.price);

    targetQueue.push(order);
  }

  removeOrder(order) {
    const targetMap = order.type === "BUY" ? this.buyOrders : this.sellOrders;

    const queue = targetMap.get(order.price);

    if (!queue) {
      return;
    }

    const filteredQueue = queue.filter((o) => o.id !== order.id);

    if (filteredQueue.length === 0) {
      targetMap.delete(order.price);
    } else {
      targetMap.set(order.price, filteredQueue);
    }
  }

  getMatchingOrders(order) {
    const oppositeMap = order.type === "BUY" ? this.sellOrders : this.buyOrders;

    return oppositeMap.get(order.price) || [];
  }

  cleanupPrice(type, price) {
    const targetMap = type === "BUY" ? this.buyOrders : this.sellOrders;

    const queue = targetMap.get(price);

    if (queue && queue.length === 0) {
      targetMap.delete(price);
    }
  }

  print() {
    console.log("\n========== ORDER BOOK ==========");

    console.log("\nBUY SIDE");

    for (const [price, orders] of this.buyOrders) {
      console.log(price, orders);
    }

    console.log("\nSELL SIDE");

    for (const [price, orders] of this.sellOrders) {
      console.log(price, orders);
    }

    console.log("\n===============================\n");
  }
}

module.exports = OrderBook;
