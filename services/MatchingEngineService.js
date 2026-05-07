const { OrderStatus, OrderType } = require("../models/enums");

class MatchingEngineService {
  constructor({ tradeService, orderBookService, orderRepository }) {
    this.tradeService = tradeService;

    this.orderBookService = orderBookService;

    this.orderRepository = orderRepository;
  }

  match(order) {
    const affectedOrders = [];

    /**
     * FIFO MATCHING
     *
     * BUY  -> SELL BOOK
     * SELL -> BUY BOOK
     */

    const matchingOrders = this.orderBookService.getMatchingOrders(order);

    while (order.remainingQuantity > 0 && matchingOrders.length > 0) {
      /**
       * oldest order first
       */

      const oldestOrder = matchingOrders[0];

      /**
       * skip canceled
       */

      if (oldestOrder.status === OrderStatus.CANCELED) {
        matchingOrders.shift();

        continue;
      }

      const tradeQuantity = Math.min(
        order.remainingQuantity,
        oldestOrder.remainingQuantity,
      );

      /**
       * update quantities
       */

      order.fill(tradeQuantity);

      oldestOrder.fill(tradeQuantity);

      affectedOrders.push(
        oldestOrder,
      );

      /**
       * create trade
       */

      const buyOrder = order.type === OrderType.BUY ? order : oldestOrder;

      const sellOrder = order.type === OrderType.SELL ? order : oldestOrder;

      this.tradeService.createTrade({
        tradeType: order.type,
        buyOrder,
        sellOrder,
        quantity: tradeQuantity,
        price: order.price,
      });

      /**
       * remove completed orders
       */

      if (oldestOrder.isFilled()) {
        matchingOrders.shift();
      }

      /**
       * persist
       */

      this.orderRepository.update(oldestOrder);
    }

    this.orderBookService.cleanupPrice({
      symbol: order.symbol,
      type: order.type === OrderType.BUY ? OrderType.SELL : OrderType.BUY,
      price: order.price,
    });

    /**
     * if incoming order still not filled
     * put into order book
     */

    if (!order.isFilled()) {
      this.orderBookService.addOrder(order);
    }

    this.orderRepository.update(order);

    affectedOrders.push(order);

    return affectedOrders;
  }
}

module.exports = MatchingEngineService;
