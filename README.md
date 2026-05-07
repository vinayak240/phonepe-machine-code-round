# In-Memory Trading System

Machine-code style implementation of an in-memory stock trading system. The system supports registered users placing, modifying, canceling, querying, matching, and expiring orders.

## How To Run

This project has no external dependencies.

```bash
node index.js
```

The demo completes in under a second. It uses in-memory data only, so every run starts fresh.

## What The Demo Shows

### All Users

Prints the dummy registered users available in the system.

```text
U1 | name=Vinayak phone=9999999999 email=v@test.com
U2 | name=Rahul phone=8888888888 email=r@test.com
```

### Normal Order Flow

Places three concurrent orders for `RELIANCE`:

- `U1` places a `SELL` order for quantity `100` at price `2500`
- `U2` places two `BUY` orders for quantities `40` and `60` at the same price

Because buy and sell prices match exactly, trades are executed. The oldest matching order is used first.

The output then prints:

- placed orders
- executed trades
- order status query for the seller order

### Cancel Order Flow

Places an unmatched `SELL` order for `WIPRO`, then cancels it.

Expected final status:

```text
CANCELED
```

### Modify Order Flow

Places a `SELL` order for `TCS`, modifies its quantity and price, then places a matching `BUY` order.

This demonstrates:

- modifying an accepted open order
- retaining the same order ID after modification
- executing a trade after the modified price matches

### Order Rejected Flow

Places an invalid order with quantity `0`.

Expected final status:

```text
REJECTED
```

The rejection reason is printed in the output.

### Order Expiry Flow

Places an unmatched `SELL` order for `INFY`.

The demo waits slightly longer than the configured expiry time. The order is automatically canceled and removed from the order book.

Expected status transition:

```text
ACCEPTED -> CANCELED
```

## Matching Rules

Trades execute only when:

- orders are for the same stock symbol
- one order is `BUY` and the other is `SELL`
- buy price and sell price are equal

If multiple orders are eligible at the same price, FIFO is used. The oldest order is matched first.

Partial fills are supported. If only part of an order is executed, the remaining quantity stays in the order book until it is matched, canceled, modified, or expired.

## Concurrency Handling

The system uses a symbol-level mutex.

That means operations for the same stock symbol are serialized, while orders for different symbols can proceed independently.

This protects concurrent placement, modification, cancellation, and matching from corrupting the in-memory order book.

## Order Expiry

The assignment mentions trade expiry. In this implementation, expiry is modeled as order expiry because trades are created only after successful matching.

Open orders expire if they remain unexecuted or partially filled after the configured TTL.

In the demo:

```text
orderExpiryMs = 200
```

When an order expires:

- status becomes `CANCELED`
- the order is removed from the order book
- already executed trades remain unchanged

## Project Structure

```text
controllers/    Request-style wrappers around services
models/         Domain objects and enums
repositories/   In-memory storage abstractions
services/       Business logic, matching, order book, users, trades, mutex
utils/          Mutex implementation
index.js        Runnable demo
```

## Important Output Labels

```text
PLACE ORDER <orderId>
```

An order was accepted by the system. Check the details line for status and remaining quantity.

```text
TRADE EXECUTED
```

A buy and sell order matched and a trade was created.

```text
ORDER STATUS
```

Shows the current status of a user-owned order.

```text
FINAL ORDER BOOKS
```

Shows current unexecuted orders per symbol. `No open orders` means all orders for that symbol were filled, canceled, rejected, or expired.

## Supported Requirements

- Registered users can place, modify, and cancel their own orders.
- Users can query their own order status.
- Equal-price buy/sell orders are matched.
- FIFO matching is used for eligible orders at the same price.
- Concurrent operations are protected with symbol-level locks.
- Order book is maintained per symbol.
- In-memory repositories are used behind clear abstractions.
- Order expiry is implemented for unexecuted and partially filled orders.
