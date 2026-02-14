import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Shield, Activity, Wallet, BarChart3, Settings } from 'lucide-react';
import DashboardHelper from './components/DashboardHelper';

function App() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="min-h-screen bg-background text-white font-sans selection:bg-neon selection:text-black overflow-hidden relative">
            {/* Background Gradients */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]"></div>
            </div>

            {/* Navbar */}
            <nav className="fixed top-0 w-full h-16 border-b border-white/10 bg-black/50 backdrop-blur-md z-50 px-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="text-neon w-6 h-6" />
                    <span className="font-bold text-xl tracking-tighter">CYPHER<span className="text-neon">ORDI</span></span>
                </div>

                <div className="flex items-center gap-4">
                    {isConnected ? (
                        <div className="flex items-center gap-2 bg-glass px-4 py-2 rounded-full border border-white/10">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-mono text-gray-300">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                            <button onClick={() => disconnect()} className="ml-2 text-xs text-red-400 hover:text-red-300">Disconnect</button>
                        </div>
                    ) : (
                        <button
                            onClick={() => connect({ connector: connectors[0] })}
                            className="bg-neon text-black px-5 py-2 rounded-lg font-bold hover:shadow-[0_0_15px_rgba(0,245,255,0.4)] transition-all"
                        >
                            Connect Wallet
                        </button>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="pt-24 px-6 pb-12 max-w-7xl mx-auto">
                {!isConnected ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                        <Shield className="w-24 h-24 text-neon mb-6 opacity-80" />
                        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                            Next Gen SMC Trading
                        </h1>
                        <p className="text-gray-400 max-w-lg text-lg mb-8">
                            Non-custodial, 24/7 automated trading bot powered by Hyperliquid L4 orderbooks.
                        </p>
                        <button
                            onClick={() => connect({ connector: connectors[0] })}
                            className="bg-neon text-black px-8 py-3 rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(0,245,255,0.5)] transition-all"
                        >
                            Launch App
                        </button>
                    </div>
                ) : (
                    <DashboardHelper />
                )}
            </main>
        </div>
    );
}

export default App;
