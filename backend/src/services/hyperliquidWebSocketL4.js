const WebSocket = require('ws');
const hyperliquidService = require('./hyperliquidService');

class HyperliquidWebSocketL4 {
    constructor() {
        this.wsUrl = 'wss://api.hyperliquid.xyz/ws';
        this.ws = null;
        this.pingInterval = null;
        this.subscriptions = new Set();
        this.callbacks = {}; // event -> [functions]
    }

    connect() {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.on('open', () => {
            console.log('✅ Hyperliquid WebSocket Connected');
            this.startPing();
            this.resubscribe();
        });

        this.ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                this.handleMessage(message);
            } catch (error) {
                console.error('Error parsing WS message:', error);
            }
        });

        this.ws.on('close', () => {
            console.log('❌ Hyperliquid WebSocket Disconnected. Reconnecting...');
            this.stopPing();
            setTimeout(() => this.connect(), 5000); // 5s backoff
        });

        this.ws.on('error', (error) => {
            console.error('Hyperliquid WebSocket Error:', error);
        });
    }

    startPing() {
        this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ method: 'ping' }));
            }
        }, 50 * 1000); // Send ping every 50s
    }

    stopPing() {
        if (this.pingInterval) clearInterval(this.pingInterval);
    }

    subscribeToTiers(symbols) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('WS not open, queueing subscription');
            this.subscriptions.add({ type: 'l2Book', coin: symbols[0] }); // Just mocking structure
            return;
        }

        // Simplified: Subscribe to l2Book for key assets
        // In production, split large lists into chunks
        const msg = {
            "method": "subscribe",
            "subscription": { "type": "l2Book", "coin": "BTC" }
        };
        this.ws.send(JSON.stringify(msg));

        // Also subscribe to trades for volume analysis
        // this.ws.send(JSON.stringify({ "method": "subscribe", "subscription": { "type": "trades", "coin": "BTC" } }));

        console.log(`Subscribed to ${symbols.length} assets`);
    }

    resubscribe() {
        // Logic to resend subscriptions on reconnect
    }

    on(event, callback) {
        if (!this.callbacks[event]) this.callbacks[event] = [];
        this.callbacks[event].push(callback);
    }

    handleMessage(message) {
        if (message.channel === 'l2Book') {
            this.emit('orderBookUpdate', message.data);
        } else if (message.channel === 'trades') {
            this.emit('tradeUpdate', message.data);
        }
    }

    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(cb => cb(data));
        }
    }
}

module.exports = new HyperliquidWebSocketL4();
