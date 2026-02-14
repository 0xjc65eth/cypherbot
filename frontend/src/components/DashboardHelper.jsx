import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, DollarSign, Clock } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAccount } from 'wagmi';
import axios from 'axios';

// Mock Webhook URL - In prod use env
const API_URL = 'http://localhost:3000/api';

const DashboardHelper = () => {
    const { address } = useAccount();
    const [portfolio, setPortfolio] = useState(null);
    const [trades, setTrades] = useState([]);
    const [mode, setMode] = useState(null);

    // Initial Data Fetch
    useEffect(() => {
        if (!address) return;

        // 1. Login/Connect to Backend
        axios.post(`${API_URL}/users/connect-wallet`, {
            wallet_address: address,
            agent_wallet: address // For now same, in real app user generates agent wallet
        }).then(res => {
            const userId = res.data.user.id;

            // 2. Get Portfolio
            axios.get(`${API_URL}/users/${userId}/portfolio`).then(p => {
                setPortfolio(p.data.portfolio);
                setMode(p.data.mode);
            });
        }).catch(err => console.error(err));

    }, [address]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MODE ALERT: ULTRA vs LOW BALANCE */}
            {mode?.mode === 'ULTRA_AGGRESSIVE_12H' ? (
                <div className="col-span-3 bg-purple-600/10 border border-purple-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full"></div>

                    <div className="flex items-center gap-4 z-10">
                        <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center animate-pulse shadow-[0_0_15px_rgba(147,51,234,0.5)]">
                            <span className="text-2xl">🔥</span>
                        </div>
                        <div>
                            <h4 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-lg">
                                ULTRA MODE: ${mode.target} CHALLENGE
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-purple-200">
                                <span className="bg-purple-500/20 px-2 py-0.5 rounded text-purple-300 border border-purple-500/30">20x LEVERAGE</span>
                                <span className="bg-pink-500/20 px-2 py-0.5 rounded text-pink-300 border border-pink-500/30">HF SCALPING</span>
                                <span>Time Left: {Math.floor(mode.timeLeft / 3600)}h {Math.floor((mode.timeLeft % 3600) / 60)}m</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full md:w-auto px-4 z-10">
                        <div className="flex justify-between text-xs mb-1 text-gray-300">
                            <span>Progress</span>
                            <span className="font-mono text-pink-400">{mode.progress}% (${portfolio?.marginSummary?.accountValue || 0} / ${mode.target})</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-2.5 rounded-full transition-all duration-1000 relative" style={{ width: `${mode.progress}%` }}>
                                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : mode?.isActive && (
                <div className="col-span-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_red]"></div>
                        <div>
                            <h4 className="font-bold text-red-500 tracking-wider">🔴 LIVE HYPERLIQUID ${mode.entrySize} MIN</h4>
                            <p className="text-xs text-gray-400">Mainnet • Gemini AI Analysis • 1x Leverage (Safe)</p>
                        </div>
                    </div>
                    <div className="text-right text-xs font-mono text-gray-300">
                        <div>Pairs: {mode.symbols.join(', ')}</div>
                        <div>Size: ${mode.entrySize} ({mode.leverage}x)</div>
                    </div>
                </div>
            )}

            {/* Overview Cards */}
            <div className="glass-panel p-6 col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Account Value</span>
                    </div>
                    <div className="text-3xl font-bold font-mono">
                        ${portfolio?.marginSummary?.accountValue || '0.00'}
                    </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <span>PnL (24h)</span>
                    </div>
                    <div className="text-3xl font-bold font-mono text-green-400">
                        +$0.00
                    </div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                        <Activity className="w-4 h-4 text-neon" />
                        <span>Active Trades</span>
                    </div>
                    <div className="text-3xl font-bold font-mono text-neon">
                        0
                    </div>
                </div>
            </div>

            {/* Chart Area (Placeholder) */}
            <div className="glass-panel col-span-2 h-[400px] p-6 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-neon/5 to-transparent opacity-20"></div>
                <span className="text-gray-500 font-mono">Trading View Chart Integration</span>
            </div>

            {/* Active Trades List */}
            <div className="glass-panel p-6 h-[400px] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neon" />
                    Live Activity
                </h3>
                <div className="space-y-3">
                    {/* Empty State */}
                    <div className="text-center text-gray-500 py-10">
                        No active trades.
                        <br />
                        <span className="text-xs">Waiting for SMC signals...</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHelper;
