class TradeController {
  constructor(tradeService) {
    this.tradeService = tradeService;
  }

  getTrades() {
    try {
      return {
        es: 0,
        data: this.tradeService.getTrades(),
      };
    } catch (error) {
      return {
        es: 1,
        error: error.message,
      };
    }
  }
}

module.exports = TradeController;
