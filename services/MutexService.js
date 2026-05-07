const Mutex = require("../utils/Mutex");

class MutexService {
  constructor() {
    /**
     * symbol -> mutex
     */

    this.locks = new Map();
  }

  getLock(symbol) {
    if (!this.locks.has(symbol)) {
      this.locks.set(symbol, new Mutex());
    }

    return this.locks.get(symbol);
  }
}

module.exports = MutexService;
