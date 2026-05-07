class Mutex {
  constructor() {
    this.locked = false;

    this.waitingQueue = [];
  }

  async lock() {
    return new Promise((resolve) => {
      const acquireLock = () => {
        this.locked = true;

        resolve(this.unlock.bind(this));
      };

      if (!this.locked) {
        acquireLock();
      } else {
        this.waitingQueue.push(acquireLock);
      }
    });
  }

  unlock() {
    if (this.waitingQueue.length > 0) {
      const next = this.waitingQueue.shift();

      next();
    } else {
      this.locked = false;
    }
  }
}

module.exports = Mutex;
