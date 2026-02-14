const { pool } = require('../config/db');
const hyperliquidService = require('../services/hyperliquidService');

exports.connectWallet = async (req, res) => {
    const { wallet_address, agent_wallet } = req.body;

    if (!wallet_address) {
        return res.status(400).json({ error: 'Wallet address is required' });
    }

    try {
        // Check if user exists
        const userResult = await pool.query(
            'SELECT * FROM users WHERE wallet_address = $1',
            [wallet_address]
        );

        let user;
        if (userResult.rows.length === 0) {
            // Create new user
            const newUserResult = await pool.query(
                'INSERT INTO users (wallet_address, agent_wallet) VALUES ($1, $2) RETURNING *',
                [wallet_address, agent_wallet]
            );
            user = newUserResult.rows[0];
        } else {
            user = userResult.rows[0];
            // Update agent wallet if changed
            if (agent_wallet && user.agent_wallet !== agent_wallet) {
                await pool.query(
                    'UPDATE users SET agent_wallet = $1 WHERE id = $2',
                    [agent_wallet, user.id]
                );
                user.agent_wallet = agent_wallet;
            }
        }

        res.json({
            message: 'Wallet connected successfully',
            user: {
                id: user.id,
                wallet_address: user.wallet_address,
                agent_wallet: user.agent_wallet,
                status: user.status
            }
        });

    } catch (error) {
        console.error('Error connecting wallet:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getPortfolio = async (req, res) => {
    const { id } = req.params;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];

        // Fetch portfolio from Hyperliquid
        let portfolio = {
            assetPositions: [],
            marginSummary: { accountValue: 0 }
        };

        if (user.agent_wallet || user.wallet_address) {
            // Use agent wallet if available, otherwise main wallet (though main wallet might not work for all endpoints without signature)
            const addressToCheck = user.agent_wallet || user.wallet_address;
            try {
                const userState = await hyperliquidService.getUserState(addressToCheck);
                portfolio = userState;
            } catch (hlError) {
                console.error('Error fetching Hyperliquid state:', hlError);
                // Don't fail the request, just return empty/error state
            }
        }

        // Check Mode
        const ultraMode = require('../services/ultraMode');
        const lowBalanceMode = require('../services/lowBalanceMode');

        const accountValue = parseFloat(portfolio?.marginSummary?.accountValue || 0);

        let modeCheck = ultraMode.check(accountValue);
        if (!modeCheck.isActive) {
            modeCheck = lowBalanceMode.check(accountValue);
        }

        res.json({
            user_id: id,
            portfolio: portfolio,
            mode: modeCheck
        });

    } catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
