const { pool } = require('../config/db');
const smcEngine = require('./smcEngine');
const hyperliquidService = require('./hyperliquidService');
const wsService = require('./hyperliquidWebSocketL4');

class Main24x7Loop {
    constructor() {
        this.isRunning = false;
        this.cycleInterval = 10000; // 10 seconds
        this.activeAssets = []; // To be populated
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('🚀 Cypher Ordi Future: Trading Engine Started');

        // Initial setup
        await this.fetchAndSubscribeAssets();

        // Start Loop
        this.loop();
    }

    stop() {
        this.isRunning = false;
        console.log('🛑 Cypher Ordi Future: Trading Engine Stopped');
    }

    async fetchAndSubscribeAssets() {
        try {
            const mids = await hyperliquidService.getAllMids();
            // Extract symbols, e.g., "BTC", "ETH"
            // Mids format: { "BTC": "65000.0", ... }
            this.activeAssets = Object.keys(mids);
            console.log(`Loaded ${this.activeAssets.length} assets.`);

            // Connect WS and Subscribe
            wsService.connect();
            // Subscribe logic currently in WS service, can be enhanced here
        } catch (e) {
            console.error('Failed to init assets:', e);
        }
    }

    async loop() {
        while (this.isRunning) {
            const startTime = Date.now();

            try {
                await this.runCycle();
            } catch (error) {
                console.error('Error in trading cycle:', error);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;
            const waitTime = Math.max(0, this.cycleInterval - duration);

            if (process.env.NODE_ENV !== 'test') {
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
                break; // Run once for tests
            }
        }
    }

    async runCycle() {
        console.log(`[${new Date().toISOString()}] Starting Trading Cycle...`);

        // 1. Get Active Users
        const usersRes = await pool.query("SELECT * FROM users WHERE status = 'trading'");
        const users = usersRes.rows;

        if (users.length === 0) {
            console.log('No active users.');
            return;
        }

        // 2. Analyze Market
        // Ultra Mode Strategy: Scan all or top volume
        const dummyBal = 15; // TODO: Get from DB user sum
        const ultra = ultraMode.check(dummyBal);

        let assetsToAnalyze = ['BTC', 'ETH', 'SOL'];
        if (ultra.isActive && this.activeAssets.length > 0) {
            // In ultra mode, we might scan top 20 by volume or random subset to be fast
            // For demo, we take top 10 from the active list
            assetsToAnalyze = this.activeAssets.slice(0, 20);
            console.log(`🚀 Ultra Mode: Scanning ${assetsToAnalyze.length} assets`);
        }

        for (const symbol of assetsToAnalyze) {
            // Get price (mock or from cache)
            const priceData = { midPrice: 50000 }; // TODO: Get real price from WS cache

            // Analyze
            const signal = await smcEngine.analyze(symbol, priceData);

            if (signal) {
                console.log(`🔥 Signal Found for ${symbol}: ${signal.action}`);

                // 3. Execute for Users
                for (const user of users) {
                    await this.executeTradeForUser(user, symbol, signal);
                }
            }
        }
    }

    async executeTradeForUser(user, symbol, signal) {
        try {
            // 1. Calculate Size
            // Need user balance first.
            const portfolio = await hyperliquidService.getUserState(user.agent_wallet);
            // Default to 0 if account value not found/empty
            const accountValue = parseFloat(portfolio?.marginSummary?.accountValue || 0);

            const sizeConfig = smcEngine.calculatePositionSize(accountValue);

            // Check Low Balance Restrictions
            if (sizeConfig.isLowBalance) {
                // Filter symbol
                if (!sizeConfig.config.symbols.includes(symbol)) {
                    console.log(`Skipping ${symbol} for Low Balance Mode`);
                    return;
                }
                // Check max trades (Simplified: Assuming 0 active for now, real imp needs DB check)
                // const activeTrades = ... 
            }

            const sizeUsd = sizeConfig.sizeUsd;

            // 2. Place Order
            // Enforce Min Order Size for Hyperliquid ($10)
            if (sizeUsd < 10) {
                console.warn(`Order size $${sizeUsd} too small for Hyperliquid. Skipping.`);
                return;
            }

            const orderRequest = {
                coin: symbol,
                is_buy: signal.action === 'LONG',
                sz: sizeUsd / signal.entryPrice,
                limit_px: signal.entryPrice,
                order_type: { limit: { tif: 'Gtc' } },
                reduce_only: false,
                leverage: sizeConfig.leverage
            };

            const result = await hyperliquidService.placeOrder(user, orderRequest);

            if (result.status === 'mock_order_placed') {
                // Log to DB
                await pool.query(
                    `INSERT INTO trades (user_id, symbol, direction, entry_price, size, tp1, tp2, sl, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open')`,
                    [user.id, symbol, signal.action, signal.entryPrice, sizeUsd, signal.tp1, signal.tp2, signal.sl]
                );
                console.log(`✅ Trade executed for user ${user.id} [${sizeConfig.isLowBalance ? 'LOW_BALANCE' : 'STD'}]`);
            }

        } catch (error) {
            console.error(`Failed to execute trade for user ${user.id}:`, error);
        }
    }
}

module.exports = new Main24x7Loop();
