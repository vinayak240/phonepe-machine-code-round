class OrderBookService {
  constructor(orderBookRepository) {
    this.orderBookRepository = orderBookRepository;
  }

  addOrder(order) {
    const orderBook = this.orderBookRepository.getBySymbol(order.symbol);

    orderBook.addOrder(order);
  }

  removeOrder(order) {
    const orderBook = this.orderBookRepository.getBySymbol(order.symbol);

    orderBook.removeOrder(order);
  }

  getMatchingOrders(order) {
    const orderBook = this.orderBookRepository.getBySymbol(order.symbol);

    return orderBook.getMatchingOrders(order);
  }

  cleanupPrice({ symbol, type, price }) {
    const orderBook = this.orderBookRepository.getBySymbol(symbol);

    orderBook.cleanupPrice(type, price);
  }

  getOrderBook(symbol) {
    return this.orderBookRepository.getBySymbol(symbol);
  }
}

module.exports = OrderBookService;
