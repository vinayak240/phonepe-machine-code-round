class OrderController {
  constructor(orderService) {
    this.orderService = orderService;
  }

  async placeOrder(req) {
    try {
      const order = await this.orderService.placeOrder(req);

      return {
        es: 0,
        data: order,
      };
    } catch (error) {
      return {
        es: 1,
        error: error.message,
      };
    }
  }

  async cancelOrder(req) {
    try {
      await this.orderService.cancelOrder(req.orderId, req.userId);

      return {
        es: 0,
      };
    } catch (error) {
      return {
        es: 1,
        error: error.message,
      };
    }
  }

  async modifyOrder(req) {
    try {
      const order = await this.orderService.modifyOrder(
        req.orderId,
        req.updates,
        req.userId,
      );

      return {
        es: 0,
        data: order,
      };
    } catch (error) {
      return {
        es: 1,
        error: error.message,
      };
    }
  }

  getOrder(req) {
    try {
      const order = this.orderService.getOrder(req.orderId, req.userId);

      return {
        es: 0,
        data: order,
      };
    } catch (error) {
      return {
        es: 1,
        error: error.message,
      };
    }
  }

  getAllOrders() {
    try {
      return {
        es: 0,
        data: this.orderService.getAllOrders(),
      };
    } catch (error) {
      return {
        es: 1,
        error: error.message,
      };
    }
  }
}

module.exports = OrderController;
