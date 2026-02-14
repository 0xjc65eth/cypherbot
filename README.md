# Cypher Ordi Future

Professional non-custodial trading bot for Hyperliquid.

## Features
- **SMC Strategy Engine**: 10x Entry System with Tiered Confirmations.
- **24/7 Automation**: Node.js backend with Redis queue and Hyperliquid WS L4.
- **Non-Custodial**: Users connect wallets; funds stay in their Agent Wallet.
- **AI Integration**: OpenAI/Claude support for signal validation.
- **Dashboard**: Dark Glassmorphism UI (React 19 + Vite).

## Quick Start (Docker)

The easiest way to run the entire stack is with Docker Compose.

```bash
docker-compose up -d --build
```

## Quick Start (Local npm)

If you prefer running locally without Docker:

1.  **Install Dependencies**:
    ```bash
    npm install
    npm run install:all
    ```

2.  **Start Services**:
    ```bash
    npm run dev
    ```

    *Note: You must have a local PostgreSQL and Redis instance running if not using Docker.*
    - Postgres: `postgres://user:password@localhost:5432/cypher_db`
    - Redis: `redis://localhost:6379`

Access the application:
- **Frontend Dashboard**: `http://localhost:5173`
- **Backend API**: `http://localhost:3000/api`

## Configuration

Environment variables are set in `docker-compose.yml`. 
To use AI features, uncomment and set `AI_API_KEY` in `docker-compose.yml`.

## Architecture

- **Frontend**: React + Vite + Tailwind + Wagmi (Port 80 via Nginx)
- **Backend**: Node.js + Express + Socket.io (Port 3000)
- **Database**: PostgreSQL 15 (Port 5432)
- **Queue**: Redis 7 (Port 6379)

## Strategy

The bot uses the `SMC10xEngine` which analyzes assets based on volume and tier:
- **Tier 1 (BTC/ETH/SOL)**: 2 confirmations.
- **Tier 2 (High Vol)**: 3 confirmations.
- **Tier 3 (Others)**: 5 confirmations + Volume check.
