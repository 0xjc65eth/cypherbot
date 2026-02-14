const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'user',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'cypher_db',
    password: process.env.POSTGRES_PASSWORD || 'password',
    port: process.env.POSTGRES_PORT || 5432,
});

const connectDB = async () => {
    try {
        await pool.connect();
        console.log('✅ PostgreSQL connected');
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error);
        // Retry logic could be added here
    }
};

module.exports = { pool, connectDB };
