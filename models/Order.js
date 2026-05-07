const { OrderStatus } = require("./enums");

class Order {
  constructor({ id, userId, type, symbol, quantity, price }) {
    this.id = id;
    this.userId = userId;
    this.type = type;
    this.symbol = symbol;

    this.quantity = quantity;

    // IMPORTANT FOR PARTIAL FILLS
    this.remainingQuantity = quantity;

    this.price = price;

    this.timestamp = Date.now();

    this.status = OrderStatus.ACCEPTED;

    this.rejectionReason = null;
  }

  isFilled() {
    return this.remainingQuantity === 0;
  }

  fill(quantity) {
    this.remainingQuantity -= quantity;

    if (this.remainingQuantity < 0) {
      throw new Error("Overfill detected");
    }

    if (this.remainingQuantity === 0) {
      this.status = OrderStatus.FILLED;
    } else {
      this.status = OrderStatus.PARTIALLY_FILLED;
    }
  }

  cancel() {
    this.status = OrderStatus.CANCELED;
  }

  reject(reason) {
    this.status = OrderStatus.REJECTED;
    this.rejectionReason = reason;
  }

  modify({ type, symbol, quantity, price }) {
    this.type = type || this.type;
    this.symbol = symbol || this.symbol;

    if (quantity !== undefined) {
      this.quantity = quantity;
      this.remainingQuantity = quantity;
    }

    if (price !== undefined) {
      this.price = price;
    }

    this.timestamp = Date.now();
    this.status = OrderStatus.ACCEPTED;
  }
}

module.exports = Order;
