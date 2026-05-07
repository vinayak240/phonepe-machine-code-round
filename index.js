const User = require("./models/User");

const { OrderType } = require("./models/enums");

const UserRepository = require("./repositories/UserRepository");

const OrderRepository = require("./repositories/OrderRepository");

const TradeRepository = require("./repositories/TradeRepository");

const OrderBookRepository = require("./repositories/OrderBookRepository");

const UserService = require("./services/UserService");

const TradeService = require("./services/TradeService");

const OrderBookService = require("./services/OrderBookService");

const MatchingEngineService = require("./services/MatchingEngineService");

const OrderService = require("./services/OrderService");

const MutexService = require("./services/MutexService");

const OrderController = require("./controllers/OrderController");

const TradeController = require("./controllers/TradeController");

function printSection(title) {
  console.log(`\n========== ${title} ==========`);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function printUsers(users) {
  users.forEach((user) => {
    console.log(
      `${user.id} | name=${user.name} phone=${user.phone} email=${user.email}`,
    );
  });
}

function printOrderDetails(order) {
  const reason = order.rejectionReason
    ? ` reason="${order.rejectionReason}"`
    : "";

  console.log(
    `Details: user=${order.userId} type=${order.type} symbol=${order.symbol} quantity=${order.quantity} remaining=${order.remainingQuantity} price=${order.price} status=${order.status}${reason}`,
  );
}

function printPlacedOrder(response) {
  if (response.es !== 0) {
    console.log(`PLACE ORDER FAILED | es=${response.es} error="${response.error}"`);

    return null;
  }

  console.log(`PLACE ORDER ${response.data.id}`);
  printOrderDetails(response.data);

  return response.data;
}

function printOrderStatus(response) {
  if (response.es !== 0) {
    console.log(`ORDER STATUS | es=${response.es} error="${response.error}"`);

    return;
  }

  const order = response.data;

  console.log(
    `ORDER STATUS | order=${order.id} status=${order.status} remaining=${order.remainingQuantity}`,
  );
}

function printTrade(trade) {
  console.log(
    `TRADE EXECUTED | id=${trade.id} type=${trade.tradeType} symbol=${trade.symbol} quantity=${trade.quantity} price=${trade.price} buyerOrder=${trade.buyOrderId} sellerOrder=${trade.sellOrderId}`,
  );
}

function printTrades(trades) {
  console.log(`GET TRADES | count=${trades.length}`);

  if (trades.length === 0) {
    console.log("No trades executed");

    return;
  }

  trades.forEach(printTrade);
}

function printOrderRejected(response) {
  if (response.es !== 0) {
    console.log(`ORDER REJECTED | es=${response.es} error="${response.error}"`);

    return;
  }

  console.log(`ORDER REJECTED ${response.data.id}`);
  printOrderDetails(response.data);
}

function printOrderBook(orderBook) {
  console.log(`${orderBook.symbol}:`);

  let index = 1;

  for (const [price, orders] of orderBook.buyOrders) {
    for (const order of orders) {
      console.log(
        `Order ${index}: ${order.type} price=${price} quantity=${order.remainingQuantity} order=${order.id} user=${order.userId} status=${order.status}`,
      );

      index += 1;
    }
  }

  for (const [price, orders] of orderBook.sellOrders) {
    for (const order of orders) {
      console.log(
        `Order ${index}: ${order.type} price=${price} quantity=${order.remainingQuantity} order=${order.id} user=${order.userId} status=${order.status}`,
      );

      index += 1;
    }
  }

  if (index === 1) {
    console.log("No open orders");
  }
}

async function main() {
  /**
   * repositories
   */

  const userRepository = new UserRepository();

  const orderRepository = new OrderRepository();

  const tradeRepository = new TradeRepository();

  const orderBookRepository = new OrderBookRepository();

  /**
   * services
   */

  const userService = new UserService(userRepository);

  const mutexService = new MutexService();

  const orderBookService = new OrderBookService(orderBookRepository);

  const tradeService = new TradeService(tradeRepository);

  const matchingEngineService = new MatchingEngineService({
    tradeService,
    orderBookService,
    orderRepository,
  });

  const orderService = new OrderService({
    userService,
    orderRepository,
    matchingEngineService,
    orderBookService,
    mutexService,
    orderExpiryMs: 200,
  });

  /**
   * controllers
   */

  const orderController = new OrderController(orderService);

  const tradeController = new TradeController(tradeService);

  /**
   * dummy users
   */

  userService.createUser(
    new User({
      id: "U1",
      name: "Vinayak",
      phone: "9999999999",
      email: "v@test.com",
    }),
  );

  userService.createUser(
    new User({
      id: "U2",
      name: "Rahul",
      phone: "8888888888",
      email: "r@test.com",
    }),
  );

  /**
   * all users
   */

  printSection("All Users");

  printUsers(userService.getAllUsers());

  /**
   * normal order flow
   */

  printSection("Normal Order Flow");

  const results = await Promise.all([
    orderController.placeOrder({
      userId: "U1",

      type: OrderType.SELL,

      symbol: "RELIANCE",

      quantity: 100,

      price: 2500,
    }),

    orderController.placeOrder({
      userId: "U2",

      type: OrderType.BUY,

      symbol: "RELIANCE",

      quantity: 40,

      price: 2500,
    }),

    orderController.placeOrder({
      userId: "U2",

      type: OrderType.BUY,

      symbol: "RELIANCE",

      quantity: 60,

      price: 2500,
    }),
  ]);

  results.forEach((result, index) => {
    console.log(`\nOrder Request ${index + 1}`);
    printPlacedOrder(result);
  });

  console.log("\nGET TRADES");

  const normalTrades = tradeController.getTrades();

  printTrades(normalTrades.data);

  console.log("\nGET ORDER STATUS");

  const firstOrderId = results[0].data.id;

  printOrderStatus(
    orderController.getOrder({
      userId: "U1",
      orderId: firstOrderId,
    }),
  );

  /**
   * cancel order flow
   */

  printSection("Cancel Order Flow");

  const newOrder = await orderController.placeOrder({
    userId: "U1",

    type: OrderType.SELL,

    symbol: "WIPRO",

    quantity: 50,

    price: 1000,
  });

  printPlacedOrder(newOrder);

  const cancelResponse =
    await orderController.cancelOrder({
      userId: "U1",
      orderId: newOrder.data.id,
    });

  console.log(
    `CANCEL ORDER ${newOrder.data.id} | es=${cancelResponse.es}`,
  );

  printOrderStatus(
    orderController.getOrder({
      userId: "U1",
      orderId: newOrder.data.id,
    }),
  );

  /**
   * modify order flow
   */

  printSection("Modify Order Flow");

  const modifyOrder = await orderController.placeOrder({
    userId: "U1",

    type: OrderType.SELL,

    symbol: "TCS",

    quantity: 10,

    price: 3000,
  });

  printPlacedOrder(modifyOrder);

  const tradeCountBeforeModifyMatch =
    tradeController.getTrades().data.length;

  const modified = await orderController.modifyOrder({
    userId: "U1",
    orderId: modifyOrder.data.id,

    updates: {
      quantity: 20,
      price: 3100,
    },
  });

  console.log(`MODIFY ORDER ${modified.data.id}`);
  printOrderDetails(modified.data);

  printPlacedOrder(
    await orderController.placeOrder({
      userId: "U2",

      type: OrderType.BUY,

      symbol: "TCS",

      quantity: 20,

      price: 3100,
    }),
  );

  console.log("\nTRADES EXECUTED");

  const modifyTrades =
    tradeController
      .getTrades()
      .data.slice(
        tradeCountBeforeModifyMatch,
      );

  printTrades(modifyTrades);

  /**
   * rejected order flow
   */

  printSection("Order Rejected Flow");

  printOrderRejected(
    await orderController.placeOrder({
      userId: "U1",

      type: OrderType.BUY,

      symbol: "TCS",

      quantity: 0,

      price: 3100,
    }),
  );

  /**
   * order expiry flow
   */

  printSection("Order Expiry Flow");

  const expiryOrder =
    await orderController.placeOrder({
      userId: "U1",

      type: OrderType.SELL,

      symbol: "INFY",

      quantity: 10,

      price: 1500,
    });

  printPlacedOrder(expiryOrder);

  console.log("\nINITIAL ORDER STATUS");

  printOrderStatus(
    orderController.getOrder({
      userId: "U1",
      orderId: expiryOrder.data.id,
    }),
  );

  console.log("\nWaiting for order expiry...");

  await sleep(250);

  console.log("\nFINAL ORDER STATUS");

  printOrderStatus(
    orderController.getOrder({
      userId: "U1",
      orderId: expiryOrder.data.id,
    }),
  );

  /**
   * final order books
   */

  printSection("FINAL ORDER BOOKS");

  const relianceBook = orderBookService.getOrderBook("RELIANCE");

  printOrderBook(relianceBook);

  const tcsBook = orderBookService.getOrderBook("TCS");

  printOrderBook(tcsBook);

  const wiproBook = orderBookService.getOrderBook("WIPRO");

  printOrderBook(wiproBook);

  const infyBook = orderBookService.getOrderBook("INFY");

  printOrderBook(infyBook);
}

main();
