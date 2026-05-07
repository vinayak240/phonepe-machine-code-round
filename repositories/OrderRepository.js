class OrderRepository {
  constructor() {
    this.orders = new Map();
  }

  create(order) {
    this.orders.set(order.id, order);

    return order;
  }

  update(order) {
    this.orders.set(order.id, order);

    return order;
  }

  getById(orderId) {
    return this.orders.get(orderId);
  }

  getAll() {
    return [...this.orders.values()];
  }

  delete(orderId) {
    return this.orders.delete(orderId);
  }
}

module.exports = OrderRepository;
