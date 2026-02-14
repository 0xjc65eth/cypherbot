class UltraMode {
    constructor() {
        this.GOAL = 200;
        this.START_CAPITAL = 15;
        this.START_TIME = Date.now();
        this.DURATION = 12 * 60 * 60 * 1000; // 12 hours
    }

    check(balance) {
        // Ultra Mode Active if balance is small but user wants aggressive growth
        // Logic: if balance < GOAL and we are within time window
        const timeLeft = this.START_TIME + this.DURATION - Date.now();

        if (balance < this.GOAL && timeLeft > 0) {
            const progress = ((balance - this.START_CAPITAL) / (this.GOAL - this.START_CAPITAL)) * 100;

            return {
                isActive: true,
                mode: 'ULTRA_AGGRESSIVE_12H',
                target: this.GOAL,
                progress: Math.max(0, progress).toFixed(1),
                timeLeft: Math.floor(timeLeft / 1000), // seconds

                // Strategy Params
                leverage: 20,
                entrySize: balance * 0.95, // 95% of balance (All-in-ish) for max compound or fixed small chunks?
                // Use user spec: $0.75 margin * 20x = $15 position. 
                // If bal $15, 0.75 is 5%. 
                entryMargin: balance * 0.05,

                maxTrades: 3,
                confirmations: 1, // Ultra fast
                scanner: 'ALL_ASSETS', // Scan everything

                tp1: 1.008, // 0.8%
                tp2: 1.015, // 1.5%
                sl: 0.996   // 0.4%
            };
        }
        return { isActive: false };
    }
}

module.exports = new UltraMode();
