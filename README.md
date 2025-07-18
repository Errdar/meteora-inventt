# Meteora Invent

A toolkit consisting of everything you need to invent innovative token launches. Powered by
**Meteora**, the most secure, sustainable and composable liquidity layer on Solana.

## 🏗️ Structure

```
meteora-invent/
├── packages/          # Shared packages
│   └── config/        # Shared configurations
│       ├── eslint/    # ESLint configurations
│       ├── prettier/  # Prettier configuration
│       └── typescript/# TypeScript configurations
├── scaffolds/         # Scaffolds - production-ready frontend application templates
│   └── fun-launch/    # Launchpad scaffold template
└── studio/            # Studio - a collection of scripts for you to innovate and create
    ├── damm-v1/       # Dynamic AMM v1 scripts
    ├── damm-v2/       # Dynamic AMM v2 scripts
    ├── dbc/           # Dynamic Bonding Curve scripts
    └── dlmm/          # Dynamic Liquidity Market Maker scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0

### Installation

```bash
# Install pnpm if you haven't already
npm install -g pnpm

# Install all dependencies
pnpm install

# Build all packages
pnpm build
```

## 📦 Workspaces

### Studio (`@meteora-invent/studio`)

The studio workspace contains all the scripts for interacting with Meteora's protocols.

#### Getting Started

Copy the `.env.example` file to `.env` and configure the environment variables.

```bash
cp studio/.env.example studio/.env
```

#### Install Dependencies

```bash
pnpm install
```

#### Studio Scripts

**DAMM v1 Scripts:**

```bash
pnpm studio damm-v1-create-constant-product-pool
pnpm studio damm-v1-create-memecoin-pool
pnpm studio damm-v1-create-stable-pool
pnpm studio damm-v1-get-configs
pnpm studio damm-v1-create-position
pnpm studio damm-v1-withdraw-liquidity
pnpm studio damm-v1-claim-locked-fees
pnpm studio damm-v1-get-locked-fees
```

**DAMM v2 Scripts:**

```bash
pnpm studio damm-v2-create-pool
pnpm studio damm-v2-get-configs
pnpm studio damm-v2-create-position
pnpm studio damm-v2-get-positions
pnpm studio damm-v2-lock-position
pnpm studio damm-v2-withdraw-liquidity
pnpm studio damm-v2-get-position-fees
pnpm studio damm-v2-claim-position-fees
```

**DLMM Scripts:**

```bash
pnpm studio dlmm-create-balanced-position
pnpm studio dlmm-create-imbalanced-position
pnpm studio dlmm-get-active-bin
pnpm studio dlmm-get-positions-list
pnpm studio dlmm-add-balanced-liquidity
pnpm studio dlmm-add-imbalanced-liquidity
```

**DBC Scripts:**

```bash
pnpm studio dbc-quick-launch
pnpm studio dbc-create-config
pnpm studio dbc-create-partner-metadata
pnpm studio dbc-simulate-curve
pnpm studio dbc-migrate-to-damm-v1
pnpm studio dbc-migrate-to-damm-v2
pnpm studio dbc-swap-buy
pnpm studio dbc-swap-quote
```

### Scaffolds

#### Fun Launch (`@meteora-invent/scaffold-fun-launch`)

A Next.js application template for creating a launchpad.

#### Getting Started

Copy the `.env.example` file to `.env` and configure the environment variables.

```bash
cp scaffolds/fun-launch/.env.example scaffolds/fun-launch/.env
```

#### Install Dependencies

```bash
pnpm install
```

#### Running the Scaffold

```bash
# Run the fun-launch scaffold in development
pnpm --filter @meteora-invent/scaffold/fun-launch dev

# Build the fun-launch scaffold
pnpm --filter @meteora-invent/scaffold/fun-launch build
```

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run `pnpm format` and `pnpm lint`
4. Submit a pull request

## 📄 License

ISC

---
