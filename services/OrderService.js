const Order = require("../models/Order");

const { OrderStatus, OrderType } = require("../models/enums");

class OrderService {
  constructor({
    userService,
    orderRepository,
    matchingEngineService,
    orderBookService,
    mutexService,
    orderExpiryMs = 2000,
  }) {
    this.userService = userService;

    this.orderRepository = orderRepository;

    this.matchingEngineService = matchingEngineService;

    this.orderBookService = orderBookService;

    this.mutexService = mutexService;

    this.orderExpiryMs = orderExpiryMs;

    this.expiryTimers = new Map();
  }

  async placeOrder(payload) {
    const { userId, symbol } = payload;

    const order = new Order({
      id: `ORDER-${Date.now()}-${Math.random()}`,

      ...payload,
    });

    const rejectionReason = this.getOrderRejectionReason(payload);

    if (rejectionReason) {
      order.reject(rejectionReason);

      this.orderRepository.create(order);

      return order;
    }

    /**
     * symbol-level lock
     */

    const lock = this.mutexService.getLock(symbol);

    const unlock = await lock.lock();

    try {
      this.orderRepository.create(order);

      /**
       * matching
       */

      const affectedOrders =
        this.matchingEngineService.match(
          order,
        );

      this.clearFilledOrderExpiries(
        affectedOrders,
      );

      this.scheduleOrderExpiry(order);

      // console.log("\nORDER PLACED:");
      // console.log(order);

      return order;
    } finally {
      unlock();
    }
  }

  async cancelOrder(orderId, userId) {
    const order = this.orderRepository.getById(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    if (
      order.status === OrderStatus.FILLED ||
      order.status === OrderStatus.CANCELED ||
      order.status === OrderStatus.REJECTED
    ) {
      throw new Error("Cannot cancel order");
    }

    if (userId && order.userId !== userId) {
      throw new Error("User cannot cancel another user's order");
    }

    const lock = this.mutexService.getLock(order.symbol);

    const unlock = await lock.lock();

    try {
      this.clearOrderExpiry(order.id);

      order.cancel();

      this.orderBookService.removeOrder(order);

      this.orderRepository.update(order);

      // console.log("\nORDER CANCELED:");
      // console.log(order);
    } finally {
      unlock();
    }
  }

  async modifyOrder(orderId, updates, userId) {
    const existingOrder = this.orderRepository.getById(orderId);

    if (!existingOrder) {
      throw new Error("Order not found");
    }

    if (userId && existingOrder.userId !== userId) {
      throw new Error("User cannot modify another user's order");
    }

    if (existingOrder.status !== OrderStatus.ACCEPTED) {
      throw new Error("Only accepted unexecuted orders can be modified");
    }

    const updatedPayload = {
      userId: existingOrder.userId,
      type: updates.type || existingOrder.type,
      symbol: updates.symbol || existingOrder.symbol,
      quantity:
        updates.quantity !== undefined
          ? updates.quantity
          : existingOrder.quantity,
      price: updates.price !== undefined ? updates.price : existingOrder.price,
    };

    const rejectionReason = this.getOrderRejectionReason(updatedPayload);

    if (rejectionReason) {
      throw new Error(rejectionReason);
    }

    const unlock = await this.acquireLocks([
      existingOrder.symbol,
      updatedPayload.symbol,
    ]);

    try {
      this.clearOrderExpiry(existingOrder.id);

      this.orderBookService.removeOrder(existingOrder);

      existingOrder.modify(updatedPayload);

      const affectedOrders =
        this.matchingEngineService.match(
          existingOrder,
        );

      this.clearFilledOrderExpiries(
        affectedOrders,
      );

      this.scheduleOrderExpiry(existingOrder);

      this.orderRepository.update(existingOrder);

      // console.log("\nORDER MODIFIED:");
      // console.log(existingOrder);

      return existingOrder;
    } finally {
      unlock();
    }
  }

  getOrder(orderId, userId) {
    const order = this.orderRepository.getById(orderId);

    if (order && userId && order.userId !== userId) {
      throw new Error("User cannot query another user's order");
    }

    return order;
  }

  getAllOrders() {
    return this.orderRepository.getAll();
  }

  getOrderRejectionReason({ userId, type, symbol, quantity, price }) {
    if (!this.userService.userExists(userId)) {
      return "Invalid user";
    }

    if (type !== OrderType.BUY && type !== OrderType.SELL) {
      return "Invalid order type";
    }

    if (!symbol || typeof symbol !== "string") {
      return "Invalid stock symbol";
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return "Invalid quantity";
    }

    if (!Number.isFinite(price) || price <= 0) {
      return "Invalid price";
    }

    return null;
  }

  scheduleOrderExpiry(order) {
    this.clearOrderExpiry(order.id);

    if (!this.isOpenOrder(order)) {
      return;
    }

    const timerId = setTimeout(
      () => this.expireOrder(order.id),
      this.orderExpiryMs,
    );

    this.expiryTimers.set(
      order.id,
      timerId,
    );
  }

  clearOrderExpiry(orderId) {
    const timerId =
      this.expiryTimers.get(orderId);

    if (!timerId) {
      return;
    }

    clearTimeout(timerId);

    this.expiryTimers.delete(orderId);
  }

  clearFilledOrderExpiries(orders) {
    for (const order of orders) {
      if (
        order.status ===
        OrderStatus.FILLED
      ) {
        this.clearOrderExpiry(
          order.id,
        );
      }
    }
  }

  async expireOrder(orderId) {
    this.expiryTimers.delete(orderId);

    const order =
      this.orderRepository.getById(
        orderId,
      );

    if (!order || !this.isOpenOrder(order)) {
      return;
    }

    const lock =
      this.mutexService.getLock(
        order.symbol,
      );

    const unlock = await lock.lock();

    try {
      const latestOrder =
        this.orderRepository.getById(
          orderId,
        );

      if (
        !latestOrder ||
        !this.isOpenOrder(latestOrder)
      ) {
        return;
      }

      latestOrder.cancel();

      this.orderBookService.removeOrder(
        latestOrder,
      );

      this.orderRepository.update(
        latestOrder,
      );
    } finally {
      unlock();
    }
  }

  isOpenOrder(order) {
    return (
      order.remainingQuantity > 0 &&
      (order.status ===
        OrderStatus.ACCEPTED ||
        order.status ===
          OrderStatus.PARTIALLY_FILLED)
    );
  }

  async acquireLocks(symbols) {
    const uniqueSymbols = [...new Set(symbols)].sort();

    const unlocks = [];

    for (const symbol of uniqueSymbols) {
      const lock = this.mutexService.getLock(symbol);

      unlocks.push(await lock.lock());
    }

    return () => {
      while (unlocks.length > 0) {
        const unlock = unlocks.pop();

        unlock();
      }
    };
  }
}

module.exports = OrderService;
