class LowBalanceMode {
    constructor() {
        this.THRESHOLD = 20; // Active if balance <= $20 (Safe buffer for $15 min)
        this.MIN_ORDER = parseFloat(process.env.MIN_ORDER_VALUE) || 15;
    }

    check(balance) {
        if (balance <= this.THRESHOLD) {
            return {
                isActive: true,
                mode: 'LIVE_HYPERLIQUID_MIN_15',
                maxTrades: 1,      // 1 active trade max due to balance constraints
                entrySize: this.MIN_ORDER, // Force $15
                symbols: ['BTC'],  // BTC Only for max liquidity
                leverage: 1,       // 1x Leverage (Safe Mode)
                auto10x: false,
                riskConfirms: 2,
                tp1: 1.015,        // +1.5%
                sl: 0.99           // -1.0%
            };
        }
        return { isActive: false };
    }
}

module.exports = new LowBalanceMode();
