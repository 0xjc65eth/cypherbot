import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const API_URL = 'http://localhost:3000/api';

const BrokerDashboard = () => {
    const { address } = useAccount();
    const [portfolio, setPortfolio] = useState(null);
    const [mode, setMode] = useState(null);
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        if (!address) return;

        // Fetch Data
        const fetchData = async () => {
            try {
                const loginRes = await axios.post(`${API_URL}/users/connect-wallet`, {
                    wallet_address: address,
                    agent_wallet: address
                });
                const userId = loginRes.data.user.id;
                const p = await axios.get(`${API_URL}/users/${userId}/portfolio`);

                setPortfolio(p.data.portfolio);
                setMode(p.data.mode);

                // Mock Chart Data for Demo (Real implementation would fetch history from DB)
                // Generating a realistic PnL curve based on "Ultra Mode" vibe
                const labels = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00'];
                const dataPoints = [15, 18, 25, 22, 35, 42, 45]; // Growing from $15 -> $45

                setChartData({
                    labels,
                    datasets: [
                        {
                            fill: true,
                            label: 'Portfolio Value (USDC)',
                            data: dataPoints,
                            borderColor: 'rgb(147, 51, 234)',
                            backgroundColor: 'rgba(147, 51, 234, 0.2)',
                            tension: 0.4,
                        },
                    ],
                });

            } catch (e) {
                console.error(e);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000); // Live updates
        return () => clearInterval(interval);

    }, [address]);

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#9ca3af',
                    callback: (value) => '$' + value
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: '#9ca3af'
                }
            }
        }
    };

    if (!address) return <div className="text-center text-gray-500 mt-10">Wallet not connected</div>;

    const accountValue = parseFloat(portfolio?.marginSummary?.accountValue || 0).toFixed(2);
    const pnl = (parseFloat(accountValue) - 15).toFixed(2); // Assuming $15 start for demo calc
    const pnlPercent = ((pnl / 15) * 100).toFixed(1);
    const isPositive = pnl >= 0;

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* ALERT BANNER */}
            {mode?.mode === 'ULTRA_AGGRESSIVE_12H' ? (
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <span className="animate-pulse">🔥</span>
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">ULTRA MODE ACTIVE</span>
                            </h2>
                            <p className="text-purple-300/80 text-sm mt-1">Target: ${mode.target} | Time Left: {Math.floor(mode.timeLeft / 3600)}h</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-mono text-white font-bold">{mode.progress}%</div>
                            <div className="text-xs text-purple-400 uppercase tracking-wider">Completion</div>
                        </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-800/50 rounded-full h-1 mt-6">
                        <div className="bg-gradient-to-r from-purple-600 to-pink-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${mode.progress}%` }}></div>
                    </div>
                </div>
            ) : (
                <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                    <span className="text-emerald-400 font-mono text-sm">SYSTEM OPTIMAL • {mode?.mode || 'STANDARD'} MODE</span>
                </div>
            )}

            {/* MAIN STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Balance */}
                <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Total Equity</p>
                    <h3 className="text-3xl font-bold text-white">${accountValue}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {isPositive ? '+' : ''}{pnlPercent}%
                        </span>
                        <span className="text-gray-500 text-xs">today</span>
                    </div>
                </div>

                {/* Unrealized PnL */}
                <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Unrealized PnL</p>
                    <h3 className={`text-3xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}${pnl}
                    </h3>
                    <p className="text-gray-500 text-xs mt-2">All positions</p>
                </div>

                {/* Leverage */}
                <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Leverage</p>
                    <h3 className="text-3xl font-bold text-purple-400">{mode?.leverage || mode?.config?.leverage || 1}x</h3>
                    <p className="text-gray-500 text-xs mt-2">Effective: {((mode?.leverage || 1) * 0.95).toFixed(1)}x</p>
                </div>

                {/* Active Trades */}
                <div className="bg-gray-900/60 border border-white/5 rounded-xl p-5 backdrop-blur-sm">
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Active Trades</p>
                    <h3 className="text-3xl font-bold text-blue-400">{mode?.maxTrades || 0}</h3>
                    <p className="text-gray-500 text-xs mt-2">Max allowed: {mode?.maxTrades || 3}</p>
                </div>
            </div>

            {/* CHART & TRADES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-gray-900/60 border border-white/5 rounded-xl p-6 backdrop-blur-sm min-h-[300px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-white font-bold">Performance Analytics</h3>
                        <div className="flex gap-2">
                            {['1H', '1D', '1W'].map(tf => (
                                <button key={tf} className="text-xs px-3 py-1 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10">{tf}</button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[250px]">
                        {chartData && <Line options={chartOptions} data={chartData} />}
                    </div>
                </div>

                {/* Active Positions */}
                <div className="bg-gray-900/60 border border-white/5 rounded-xl p-6 backdrop-blur-sm">
                    <h3 className="text-white font-bold mb-4">Open Positions</h3>
                    <div className="space-y-4">
                        {/* Mock Position for Demo */}
                        <div className="bg-black/40 rounded-lg p-3 border border-white/5 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">S</div>
                                    <span className="text-white font-bold text-sm">SUI-USD</span>
                                    <span className="text-xs text-green-400 bg-green-900/30 px-1 rounded">LONG 20x</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Entry: $1.8520</div>
                            </div>
                            <div className="text-right">
                                <div className="text-green-400 font-bold text-sm">+$2.40</div>
                                <div className="text-xs text-green-600">+12%</div>
                            </div>
                        </div>

                        <div className="bg-black/40 rounded-lg p-3 border border-white/5 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xs font-bold">B</div>
                                    <span className="text-white font-bold text-sm">BTC-USD</span>
                                    <span className="text-xs text-red-400 bg-red-900/30 px-1 rounded">SHORT 20x</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Entry: $52,140</div>
                            </div>
                            <div className="text-right">
                                <div className="text-red-400 font-bold text-sm">-$0.85</div>
                                <div className="text-xs text-red-600">-2.1%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BrokerDashboard;
