# Askar Tools JavaScript

This repo contains a collection of tools for interacting with Askar wallets.

## Prerequisites

- Wallet(s) must be of type Askar.

## Installation

To install the dependencies for this project using `pnpm`, run:

```bash
pnpm install
```

## Usage

Perform various operations on wallets using the askar-tools-javascript command.

### Export Wallet

Export a tenant wallet to a JSON file:
```bash
pnpm cli --strategy export \
    --wallet-id <wallet-id> \
    --wallet-key <wallet-key> \
    --storage-type <sqlite|postgres> \
    [--postgres-host <host>] \
    [--postgres-username <username>] \
    [--postgres-password <password>] \
    --tenant-id <tenant-id>
```

### Export Database Per Wallet

Export a tenant wallet from DB per wallet to a JSON file:
```bash
pnpm cli --strategy export \
    --wallet-id <wallet-id> \
    --wallet-key <wallet-key> \
    --storage-type <sqlite|postgres> \
    [--postgres-host <host>] \
    [--postgres-username <username>] \
    [--postgres-password <password>] \
    --tenant-id <tenant-id>
```

### Convert Single Wallet to Multi-Wallet

Convert profiles in a sub-wallet to individual wallets:
```bash
pnpm cli  --strategy mt-convert-to-mw \
    --wallet-id <wallet-id> \
    --wallet-key <wallet-key> \
    --storage-type <sqlite|postgres> \
    [--postgres-host <host>] \
    [--postgres-username <username>] \
    [--postgres-password <password>] \
    --tenant-id <tenant-id>
```

## Command Options

- `--strategy <strategy>`: Choose from `mt-convert-to-mw`, or `export`.
- `--storage-type <type>`: Choose from `sqlite` or `postgres`.
- `--wallet-id <walletName>`: Specify the wallet ID.
- `--wallet-key <walletKey>`: Specify the wallet key.
- `--postgres-host <host>`: Specify the PostgreSQL host (optional).
- `--postgres-username <username>`: Specify the PostgreSQL username (optional).
- `--postgres-password <password>`: Specify the PostgreSQL password (optional).
- `--tenant-id <id>`: Specify the tenant ID.